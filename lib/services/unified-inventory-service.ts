/**
 * 统一库存数据服务
 * 解决库存管理模块和生产管理模块之间的数据一致性问题
 */

import prisma from '@/lib/db'
import { quantityVarianceDetector } from '@/lib/automation/quantity-variance-detector'

export interface InventoryUpdateParams {
  productId: number
  warehouseId: number
  quantity: number
  operation: 'ADD' | 'SUBTRACT' | 'SET'
  reason: string
  source: 'INVENTORY' | 'PRODUCTION' | 'TRANSFER' | 'ADJUSTMENT'
  operatorId: number
  referenceId?: number
  referenceType?: string
}

export interface TransferParams {
  sourceWarehouseId: number
  targetWarehouseId: number
  productId: number
  quantity: number
  transferType: string
  requestedBy: number
  notes?: string
  expectedDeliveryDate?: Date
}

export interface InventoryStatus {
  productId: number
  warehouseId: number
  availableQuantity: number
  reservedQuantity: number
  inTransitQuantity: number
  totalQuantity: number
  lastUpdated: Date
  status: string
  location: string
}

export interface DataSyncResult {
  success: boolean
  syncedRecords: number
  conflicts: Array<{
    type: string
    description: string
    resolved: boolean
  }>
  errors: string[]
}

export class UnifiedInventoryService {
  private eventBus: any // TODO: 实现事件总线

  constructor() {
    // 初始化事件总线
    this.setupEventListeners()
  }

  /**
   * 统一的库存更新接口
   */
  async updateInventory(params: InventoryUpdateParams): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. 获取当前库存状态
        const currentInventory = await this.getCurrentInventory(tx, params.productId, params.warehouseId)
        
        // 2. 计算新的数量
        const newQuantity = this.calculateNewQuantity(currentInventory.quantity, params.quantity, params.operation)
        
        // 3. 验证操作合法性
        await this.validateInventoryOperation(params, currentInventory, newQuantity)
        
        // 4. 更新基础库存表
        await this.updateBaseInventory(tx, params, newQuantity)
        
        // 5. 同步到相关模块
        await this.syncToRelatedModules(tx, params, newQuantity)
        
        // 6. 记录操作日志
        await this.logInventoryOperation(tx, params, currentInventory.quantity, newQuantity)
        
        // 7. 触发事件通知
        this.emitInventoryUpdateEvent(params, newQuantity)
      })
    } catch (error) {
      console.error('库存更新失败:', error)
      throw error
    }
  }

  /**
   * 统一的库存转移接口
   */
  async transferInventory(params: TransferParams): Promise<{ transferId: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. 验证源仓库库存充足
        const sourceInventory = await this.getCurrentInventory(tx, params.productId, params.sourceWarehouseId)
        if (sourceInventory.quantity < params.quantity) {
          throw new Error(`源仓库库存不足: 需要${params.quantity}，可用${sourceInventory.quantity}`)
        }

        // 2. 创建转移记录
        const transfer = await tx.inventoryTransfer.create({
          data: {
            transferNumber: await this.generateTransferNumber(),
            sourceWarehouseId: params.sourceWarehouseId,
            targetWarehouseId: params.targetWarehouseId,
            productId: params.productId,
            quantity: params.quantity,
            transferType: params.transferType,
            status: 'PENDING',
            requestedBy: params.requestedBy,
            notes: params.notes,
            expectedDeliveryDate: params.expectedDeliveryDate,
            createdAt: new Date()
          }
        })

        // 3. 更新源仓库库存（减少）
        await this.updateBaseInventory(tx, {
          productId: params.productId,
          warehouseId: params.sourceWarehouseId,
          quantity: params.quantity,
          operation: 'SUBTRACT',
          reason: `库存转移: ${transfer.transferNumber}`,
          source: 'TRANSFER',
          operatorId: params.requestedBy,
          referenceId: transfer.id,
          referenceType: 'InventoryTransfer'
        }, sourceInventory.quantity - params.quantity)

        // 4. 更新目标仓库库存（预留）
        await this.reserveInventory(tx, params.targetWarehouseId, params.productId, params.quantity, transfer.id)

        // 5. 触发自动化流程
        this.triggerTransferAutomation(transfer)

        return { transferId: transfer.id }
      })

      return result
    } catch (error) {
      console.error('库存转移失败:', error)
      throw error
    }
  }

  /**
   * 获取统一的库存状态
   */
  async getInventoryStatus(productId: number, warehouseId: number): Promise<InventoryStatus> {
    try {
      // 1. 获取基础库存数据
      const baseInventory = await prisma.inventory.findFirst({
        where: { productId, warehouseId },
        include: {
          product: true,
          warehouse: true
        }
      })

      if (!baseInventory) {
        throw new Error(`库存记录不存在: 产品${productId}, 仓库${warehouseId}`)
      }

      // 2. 计算在途数量
      const inTransitQuantity = await this.calculateInTransitQuantity(productId, warehouseId)

      // 3. 计算预留数量
      const reservedQuantity = await this.calculateReservedQuantity(productId, warehouseId)

      // 4. 计算可用数量
      const availableQuantity = Math.max(0, baseInventory.quantity - reservedQuantity)

      return {
        productId,
        warehouseId,
        availableQuantity,
        reservedQuantity,
        inTransitQuantity,
        totalQuantity: baseInventory.quantity,
        lastUpdated: baseInventory.updatedAt,
        status: this.determineInventoryStatus(availableQuantity, reservedQuantity, inTransitQuantity),
        location: baseInventory.warehouse.location || baseInventory.warehouse.name
      }
    } catch (error) {
      console.error('获取库存状态失败:', error)
      throw error
    }
  }

  /**
   * 数据同步和一致性检查
   */
  async syncInventoryData(): Promise<DataSyncResult> {
    const result: DataSyncResult = {
      success: true,
      syncedRecords: 0,
      conflicts: [],
      errors: []
    }

    try {
      // 1. 检查库存数量一致性
      const quantityConflicts = await this.checkQuantityConsistency()
      result.conflicts.push(...quantityConflicts)

      // 2. 检查状态同步一致性
      const statusConflicts = await this.checkStatusConsistency()
      result.conflicts.push(...statusConflicts)

      // 3. 解决冲突
      for (const conflict of result.conflicts) {
        try {
          await this.resolveConflict(conflict)
          conflict.resolved = true
          result.syncedRecords++
        } catch (error) {
          conflict.resolved = false
          result.errors.push(`解决冲突失败: ${conflict.description} - ${error.message}`)
        }
      }

      // 4. 验证同步结果
      const remainingConflicts = result.conflicts.filter(c => !c.resolved)
      if (remainingConflicts.length > 0) {
        result.success = false
      }

    } catch (error) {
      result.success = false
      result.errors.push(`数据同步失败: ${error.message}`)
    }

    return result
  }

  /**
   * 处理数量差异
   */
  async handleQuantityVariance(
    transferId: number,
    expectedQuantity: number,
    actualQuantity: number
  ): Promise<void> {
    try {
      // 1. 检测数量差异
      const variance = await quantityVarianceDetector.detectVariance(
        transferId,
        expectedQuantity,
        actualQuantity
      )

      if (!variance) return

      // 2. 更新转移记录
      await prisma.inventoryTransfer.update({
        where: { id: transferId },
        data: {
          actualQuantity,
          status: variance.riskLevel === 'CRITICAL' ? 'EXCEPTION' : 'COMPLETED'
        }
      })

      // 3. 调整目标仓库库存
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId }
      })

      if (transfer) {
        const quantityDifference = actualQuantity - expectedQuantity
        
        if (quantityDifference !== 0) {
          await this.updateInventory({
            productId: transfer.productId,
            warehouseId: transfer.targetWarehouseId,
            quantity: Math.abs(quantityDifference),
            operation: quantityDifference > 0 ? 'ADD' : 'SUBTRACT',
            reason: `数量差异调整: 转移${transfer.transferNumber}`,
            source: 'ADJUSTMENT',
            operatorId: 1, // 系统自动调整
            referenceId: transferId,
            referenceType: 'QuantityVariance'
          })
        }
      }

    } catch (error) {
      console.error('处理数量差异失败:', error)
      throw error
    }
  }

  /**
   * 私有方法：获取当前库存
   */
  private async getCurrentInventory(tx: any, productId: number, warehouseId: number) {
    const inventory = await tx.inventory.findFirst({
      where: { productId, warehouseId }
    })

    if (!inventory) {
      // 如果库存记录不存在，创建一个
      return await tx.inventory.create({
        data: {
          productId,
          warehouseId,
          quantity: 0,
          minQuantity: 0,
          maxQuantity: 1000,
          status: 'ACTIVE'
        }
      })
    }

    return inventory
  }

  /**
   * 私有方法：计算新数量
   */
  private calculateNewQuantity(currentQuantity: number, operationQuantity: number, operation: string): number {
    switch (operation) {
      case 'ADD':
        return currentQuantity + operationQuantity
      case 'SUBTRACT':
        return Math.max(0, currentQuantity - operationQuantity)
      case 'SET':
        return operationQuantity
      default:
        throw new Error(`不支持的操作类型: ${operation}`)
    }
  }

  /**
   * 私有方法：验证库存操作
   */
  private async validateInventoryOperation(
    params: InventoryUpdateParams,
    currentInventory: any,
    newQuantity: number
  ): Promise<void> {
    // 1. 检查数量不能为负
    if (newQuantity < 0) {
      throw new Error(`操作后库存数量不能为负: ${newQuantity}`)
    }

    // 2. 检查减少操作时库存是否充足
    if (params.operation === 'SUBTRACT' && currentInventory.quantity < params.quantity) {
      throw new Error(`库存不足: 当前${currentInventory.quantity}，需要减少${params.quantity}`)
    }

    // 3. 检查是否超过最大库存限制
    if (currentInventory.maxQuantity && newQuantity > currentInventory.maxQuantity) {
      throw new Error(`超过最大库存限制: ${newQuantity} > ${currentInventory.maxQuantity}`)
    }
  }

  /**
   * 私有方法：更新基础库存
   */
  private async updateBaseInventory(
    tx: any,
    params: InventoryUpdateParams,
    newQuantity: number
  ): Promise<void> {
    await tx.inventory.updateMany({
      where: {
        productId: params.productId,
        warehouseId: params.warehouseId
      },
      data: {
        quantity: newQuantity,
        updatedAt: new Date()
      }
    })
  }

  /**
   * 私有方法：同步到相关模块
   */
  private async syncToRelatedModules(
    tx: any,
    params: InventoryUpdateParams,
    newQuantity: number
  ): Promise<void> {
    // 如果是生产相关的操作，同步到生产模块
    if (params.source === 'PRODUCTION' || params.referenceType === 'ProductionOrder') {
      // TODO: 同步到生产库存表
    }

    // 如果是转移相关的操作，更新转移状态
    if (params.source === 'TRANSFER' || params.referenceType === 'InventoryTransfer') {
      // TODO: 更新转移记录状态
    }
  }

  /**
   * 私有方法：记录操作日志
   */
  private async logInventoryOperation(
    tx: any,
    params: InventoryUpdateParams,
    oldQuantity: number,
    newQuantity: number
  ): Promise<void> {
    await tx.inventoryLog.create({
      data: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        operation: params.operation,
        oldQuantity,
        newQuantity,
        quantityChange: newQuantity - oldQuantity,
        reason: params.reason,
        source: params.source,
        operatorId: params.operatorId,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        timestamp: new Date()
      }
    })
  }

  /**
   * 私有方法：触发事件通知
   */
  private emitInventoryUpdateEvent(params: InventoryUpdateParams, newQuantity: number): void {
    // TODO: 实现事件发送
    console.log(`库存更新事件: 产品${params.productId}, 仓库${params.warehouseId}, 新数量${newQuantity}`)
  }

  /**
   * 私有方法：生成转移单号
   */
  private async generateTransferNumber(): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.inventoryTransfer.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      }
    })
    
    return `TF-${dateStr}-${(count + 1).toString().padStart(3, '0')}`
  }

  /**
   * 私有方法：预留库存
   */
  private async reserveInventory(
    tx: any,
    warehouseId: number,
    productId: number,
    quantity: number,
    transferId: number
  ): Promise<void> {
    await tx.inventoryReservation.create({
      data: {
        warehouseId,
        productId,
        quantity,
        reservationType: 'TRANSFER',
        referenceId: transferId,
        status: 'ACTIVE',
        createdAt: new Date()
      }
    })
  }

  /**
   * 私有方法：计算在途数量
   */
  private async calculateInTransitQuantity(productId: number, warehouseId: number): Promise<number> {
    const result = await prisma.inventoryTransfer.aggregate({
      where: {
        productId,
        targetWarehouseId: warehouseId,
        status: { in: ['PENDING', 'SHIPPED', 'IN_TRANSIT'] }
      },
      _sum: { quantity: true }
    })
    
    return result._sum.quantity || 0
  }

  /**
   * 私有方法：计算预留数量
   */
  private async calculateReservedQuantity(productId: number, warehouseId: number): Promise<number> {
    const result = await prisma.inventoryReservation.aggregate({
      where: {
        productId,
        warehouseId,
        status: 'ACTIVE'
      },
      _sum: { quantity: true }
    })
    
    return result._sum.quantity || 0
  }

  /**
   * 私有方法：确定库存状态
   */
  private determineInventoryStatus(available: number, reserved: number, inTransit: number): string {
    if (available <= 0) return 'OUT_OF_STOCK'
    if (available <= 10) return 'LOW_STOCK'
    if (reserved > 0 || inTransit > 0) return 'PARTIALLY_AVAILABLE'
    return 'AVAILABLE'
  }

  /**
   * 私有方法：检查数量一致性
   */
  private async checkQuantityConsistency(): Promise<Array<any>> {
    // TODO: 实现数量一致性检查
    return []
  }

  /**
   * 私有方法：检查状态一致性
   */
  private async checkStatusConsistency(): Promise<Array<any>> {
    // TODO: 实现状态一致性检查
    return []
  }

  /**
   * 私有方法：解决冲突
   */
  private async resolveConflict(conflict: any): Promise<void> {
    // TODO: 实现冲突解决逻辑
  }

  /**
   * 私有方法：设置事件监听器
   */
  private setupEventListeners(): void {
    // TODO: 实现事件监听器设置
  }

  /**
   * 私有方法：触发转移自动化
   */
  private triggerTransferAutomation(transfer: any): void {
    // TODO: 实现转移自动化触发
  }
}

// 导出单例实例
export const unifiedInventoryService = new UnifiedInventoryService()
