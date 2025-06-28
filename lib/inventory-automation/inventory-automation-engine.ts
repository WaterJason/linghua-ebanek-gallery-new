/**
 * 库存自动化管理引擎
 * 负责处理双地点生产流程中的库存自动转移和状态同步
 */

import prisma from '@/lib/db'
import { NotificationSystem } from '@/lib/production/notification-system'

export interface InventoryTransferRequest {
  productionOrderId?: number
  sourceWarehouseId: number
  targetWarehouseId: number
  productId: number
  quantity: number
  transferType: 'MATERIAL_TO_PRODUCTION' | 'SEMI_PRODUCT_RETURN' | 'FINISHED_PRODUCT' | 'QUALITY_TRANSFER' | 'EMERGENCY_TRANSFER'
  requestedBy: number
  notes?: string
  shippingMethod?: string
  expectedDeliveryDate?: Date
}

export interface AutomationRuleConfig {
  name: string
  description?: string
  triggerEvent: 'STAGE_COMPLETED' | 'STATUS_CHANGED' | 'QUALITY_PASSED' | 'QUANTITY_THRESHOLD' | 'TIME_TRIGGER'
  sourceStage?: string
  targetStage?: string
  sourceWarehouseId?: number
  targetWarehouseId?: number
  transferType: 'MATERIAL_TO_PRODUCTION' | 'SEMI_PRODUCT_RETURN' | 'FINISHED_PRODUCT' | 'QUALITY_TRANSFER' | 'EMERGENCY_TRANSFER'
  conditions?: any
  actions?: any
}

export class InventoryAutomationEngine {
  private notificationSystem: NotificationSystem

  constructor() {
    this.notificationSystem = new NotificationSystem()
  }

  /**
   * 创建库存转移请求
   */
  async createTransferRequest(request: InventoryTransferRequest): Promise<any> {
    try {
      // 生成转移单号
      const transferNumber = await this.generateTransferNumber()

      // 验证库存是否充足
      const sourceInventory = await this.checkInventoryAvailability(
        request.sourceWarehouseId,
        request.productId,
        request.quantity
      )

      if (!sourceInventory.available) {
        throw new Error(`库存不足：需要 ${request.quantity}，可用 ${sourceInventory.quantity}`)
      }

      // 创建转移记录
      const transfer = await prisma.inventoryTransfer.create({
        data: {
          transferNumber,
          productionOrderId: request.productionOrderId,
          sourceWarehouseId: request.sourceWarehouseId,
          targetWarehouseId: request.targetWarehouseId,
          productId: request.productId,
          quantity: request.quantity,
          transferType: request.transferType,
          requestedBy: request.requestedBy,
          notes: request.notes,
          shippingMethod: request.shippingMethod,
          status: 'PENDING'
        },
        include: {
          product: true,
          sourceWarehouse: true,
          targetWarehouse: true,
          requester: true
        }
      })

      // 创建转移明细
      await prisma.inventoryTransferItem.create({
        data: {
          transferId: transfer.id,
          productId: request.productId,
          requestedQuantity: request.quantity
        }
      })

      // 记录状态历史
      await this.recordStatusHistory(transfer.id, null, 'PENDING', request.requestedBy, '创建转移请求')

      // 发送通知
      await this.notificationSystem.sendTransferNotification(transfer)

      return transfer
    } catch (error) {
      console.error('创建库存转移请求失败:', error)
      throw error
    }
  }

  /**
   * 自动执行库存转移（基于生产阶段变更）
   */
  async executeAutomaticTransfer(productionOrderId: number, fromStage: string, toStage: string): Promise<void> {
    try {
      // 查找匹配的自动化规则
      const rules = await prisma.inventoryAutomationRule.findMany({
        where: {
          isActive: true,
          triggerEvent: 'STAGE_COMPLETED',
          sourceStage: fromStage,
          targetStage: toStage
        },
        include: {
          sourceWarehouse: true,
          targetWarehouse: true
        }
      })

      for (const rule of rules) {
        await this.executeRule(rule, productionOrderId)
      }
    } catch (error) {
      console.error('自动执行库存转移失败:', error)
      throw error
    }
  }

  /**
   * 执行自动化规则
   */
  private async executeRule(rule: any, productionOrderId: number): Promise<void> {
    try {
      // 记录执行开始
      const execution = await prisma.automationExecution.create({
        data: {
          ruleId: rule.id,
          productionOrderId,
          status: 'RUNNING',
          triggerData: { productionOrderId, timestamp: new Date() }
        }
      })

      // 获取生产订单信息
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        include: {
          product: true,
          items: true
        }
      })

      if (!productionOrder) {
        throw new Error(`生产订单不存在: ${productionOrderId}`)
      }

      // 根据规则类型执行不同的转移逻辑
      let transferRequest: InventoryTransferRequest

      switch (rule.transferType) {
        case 'MATERIAL_TO_PRODUCTION':
          transferRequest = await this.createMaterialTransferRequest(productionOrder, rule)
          break
        case 'SEMI_PRODUCT_RETURN':
          transferRequest = await this.createSemiProductReturnRequest(productionOrder, rule)
          break
        case 'FINISHED_PRODUCT':
          transferRequest = await this.createFinishedProductTransferRequest(productionOrder, rule)
          break
        default:
          throw new Error(`不支持的转移类型: ${rule.transferType}`)
      }

      // 执行转移
      const transfer = await this.createTransferRequest(transferRequest)

      // 更新执行记录
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          transferId: transfer.id,
          executionResult: { transferId: transfer.id, success: true }
        }
      })

    } catch (error) {
      console.error('执行自动化规则失败:', error)
      
      // 更新执行记录为失败状态
      await prisma.automationExecution.updateMany({
        where: {
          ruleId: rule.id,
          productionOrderId,
          status: 'RUNNING'
        },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      })

      throw error
    }
  }

  /**
   * 创建原料转移请求（广州→广西）
   */
  private async createMaterialTransferRequest(productionOrder: any, rule: any): Promise<InventoryTransferRequest> {
    return {
      productionOrderId: productionOrder.id,
      sourceWarehouseId: rule.sourceWarehouseId,
      targetWarehouseId: rule.targetWarehouseId,
      productId: productionOrder.productId,
      quantity: productionOrder.quantity,
      transferType: 'MATERIAL_TO_PRODUCTION',
      requestedBy: productionOrder.employeeId,
      notes: `自动转移：${productionOrder.orderNumber} 原料发往生产基地`,
      shippingMethod: '物流快递'
    }
  }

  /**
   * 创建半成品返回请求（广西→广州）
   */
  private async createSemiProductReturnRequest(productionOrder: any, rule: any): Promise<InventoryTransferRequest> {
    return {
      productionOrderId: productionOrder.id,
      sourceWarehouseId: rule.sourceWarehouseId,
      targetWarehouseId: rule.targetWarehouseId,
      productId: productionOrder.productId,
      quantity: productionOrder.quantity,
      transferType: 'SEMI_PRODUCT_RETURN',
      requestedBy: productionOrder.employeeId,
      notes: `自动转移：${productionOrder.orderNumber} 半成品返回广州`,
      shippingMethod: '物流快递'
    }
  }

  /**
   * 创建成品转移请求
   */
  private async createFinishedProductTransferRequest(productionOrder: any, rule: any): Promise<InventoryTransferRequest> {
    return {
      productionOrderId: productionOrder.id,
      sourceWarehouseId: rule.sourceWarehouseId,
      targetWarehouseId: rule.targetWarehouseId,
      productId: productionOrder.productId,
      quantity: productionOrder.quantity,
      transferType: 'FINISHED_PRODUCT',
      requestedBy: productionOrder.employeeId,
      notes: `自动转移：${productionOrder.orderNumber} 成品入库`,
      shippingMethod: '内部转移'
    }
  }

  /**
   * 检查库存可用性
   */
  private async checkInventoryAvailability(warehouseId: number, productId: number, requiredQuantity: number): Promise<{available: boolean, quantity: number}> {
    const inventory = await prisma.inventoryItem.findFirst({
      where: {
        warehouseId,
        productId
      }
    })

    const currentQuantity = inventory?.quantity || 0
    return {
      available: currentQuantity >= requiredQuantity,
      quantity: currentQuantity
    }
  }

  /**
   * 生成转移单号
   */
  private async generateTransferNumber(): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const count = await prisma.inventoryTransfer.count({
      where: {
        transferNumber: {
          startsWith: `TF${dateStr}`
        }
      }
    })

    return `TF${dateStr}${(count + 1).toString().padStart(4, '0')}`
  }

  /**
   * 记录状态历史
   */
  private async recordStatusHistory(transferId: number, fromStatus: string | null, toStatus: string, changedBy: number, reason?: string): Promise<void> {
    await prisma.transferStatusHistory.create({
      data: {
        transferId,
        fromStatus: fromStatus as any,
        toStatus: toStatus as any,
        changedBy,
        changeReason: reason
      }
    })
  }

  /**
   * 更新转移状态
   */
  async updateTransferStatus(transferId: number, newStatus: string, updatedBy: number, notes?: string): Promise<void> {
    try {
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId }
      })

      if (!transfer) {
        throw new Error(`转移记录不存在: ${transferId}`)
      }

      // 更新转移状态
      await prisma.inventoryTransfer.update({
        where: { id: transferId },
        data: {
          status: newStatus as any,
          ...(newStatus === 'SHIPPED' && { shippedDate: new Date() }),
          ...(newStatus === 'DELIVERED' && { deliveredDate: new Date() }),
          ...(newStatus === 'RECEIVED' && { receivedBy: updatedBy }),
          notes: notes || transfer.notes
        }
      })

      // 记录状态历史
      await this.recordStatusHistory(transferId, transfer.status, newStatus, updatedBy, notes)

      // 如果是接收状态，更新库存
      if (newStatus === 'RECEIVED') {
        await this.updateInventoryOnReceive(transferId)
      }

    } catch (error) {
      console.error('更新转移状态失败:', error)
      throw error
    }
  }

  /**
   * 接收时更新库存
   */
  private async updateInventoryOnReceive(transferId: number): Promise<void> {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: true
      }
    })

    if (!transfer) return

    for (const item of transfer.items) {
      const actualQuantity = item.actualQuantity || item.requestedQuantity

      // 减少源仓库库存
      await this.updateWarehouseInventory(
        transfer.sourceWarehouseId,
        item.productId,
        -actualQuantity
      )

      // 增加目标仓库库存
      await this.updateWarehouseInventory(
        transfer.targetWarehouseId,
        item.productId,
        actualQuantity
      )

      // 记录库存事务
      await this.recordInventoryTransaction(transfer, item, actualQuantity)
    }
  }

  /**
   * 更新仓库库存
   */
  private async updateWarehouseInventory(warehouseId: number, productId: number, quantityChange: number): Promise<void> {
    const existingInventory = await prisma.inventoryItem.findFirst({
      where: {
        warehouseId,
        productId
      }
    })

    if (existingInventory) {
      await prisma.inventoryItem.update({
        where: { id: existingInventory.id },
        data: {
          quantity: existingInventory.quantity + quantityChange
        }
      })
    } else if (quantityChange > 0) {
      await prisma.inventoryItem.create({
        data: {
          warehouseId,
          productId,
          quantity: quantityChange
        }
      })
    }
  }

  /**
   * 记录库存事务
   */
  private async recordInventoryTransaction(transfer: any, item: any, quantity: number): Promise<void> {
    await prisma.inventoryTransaction.create({
      data: {
        type: 'transfer',
        sourceWarehouseId: transfer.sourceWarehouseId,
        targetWarehouseId: transfer.targetWarehouseId,
        productId: item.productId,
        quantity,
        notes: `库存转移：${transfer.transferNumber}`,
        referenceId: transfer.id,
        referenceType: 'inventory_transfer',
        productionOrderId: transfer.productionOrderId
      }
    })
  }
}
