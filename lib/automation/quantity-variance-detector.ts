/**
 * 数量差异自动检测引擎
 * 监控库存转移过程中的数量差异，自动检测、记录和报警
 */

import prisma from '@/lib/db'

export interface QuantityVarianceDetection {
  transferId: number
  expectedQuantity: number
  actualQuantity: number
  varianceQuantity: number
  variancePercentage: number
  detectionRules: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  autoActions: string[]
}

export interface VarianceThreshold {
  type: 'PERCENTAGE' | 'ABSOLUTE' | 'CUMULATIVE'
  value: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  autoActions: string[]
}

export class QuantityVarianceDetector {
  private thresholds: VarianceThreshold[] = [
    {
      type: 'PERCENTAGE',
      value: 2.0, // 2%以内
      riskLevel: 'LOW',
      autoActions: ['LOG_VARIANCE', 'NOTIFY_SUPERVISOR']
    },
    {
      type: 'PERCENTAGE', 
      value: 5.0, // 2-5%
      riskLevel: 'MEDIUM',
      autoActions: ['LOG_VARIANCE', 'NOTIFY_SUPERVISOR', 'REQUIRE_EXPLANATION']
    },
    {
      type: 'PERCENTAGE',
      value: 10.0, // 5-10%
      riskLevel: 'HIGH',
      autoActions: ['LOG_VARIANCE', 'NOTIFY_MANAGER', 'REQUIRE_INVESTIGATION', 'HOLD_PAYMENT']
    },
    {
      type: 'PERCENTAGE',
      value: 100.0, // 10%以上
      riskLevel: 'CRITICAL',
      autoActions: ['LOG_VARIANCE', 'NOTIFY_MANAGER', 'REQUIRE_INVESTIGATION', 'HOLD_PAYMENT', 'ESCALATE_TO_DIRECTOR']
    }
  ]

  /**
   * 检测库存转移的数量差异
   */
  async detectVariance(
    transferId: number,
    expectedQuantity: number,
    actualQuantity: number
  ): Promise<QuantityVarianceDetection | null> {
    try {
      const varianceQuantity = actualQuantity - expectedQuantity
      const variancePercentage = expectedQuantity > 0 ? 
        (varianceQuantity / expectedQuantity) * 100 : 0

      // 如果没有差异，不需要处理
      if (varianceQuantity === 0) {
        return null
      }

      // 确定风险级别和自动操作
      const { riskLevel, autoActions } = this.determineRiskLevel(Math.abs(variancePercentage))

      // 应用检测规则
      const detectionRules = this.applyDetectionRules(transferId, varianceQuantity, variancePercentage)

      const detection: QuantityVarianceDetection = {
        transferId,
        expectedQuantity,
        actualQuantity,
        varianceQuantity,
        variancePercentage,
        detectionRules,
        riskLevel,
        autoActions
      }

      // 记录差异到数据库
      await this.recordVariance(detection)

      // 执行自动操作
      await this.executeAutoActions(detection)

      return detection

    } catch (error) {
      console.error('数量差异检测失败:', error)
      throw error
    }
  }

  /**
   * 确定风险级别
   */
  private determineRiskLevel(absVariancePercentage: number): { 
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', 
    autoActions: string[] 
  } {
    for (const threshold of this.thresholds) {
      if (absVariancePercentage <= threshold.value) {
        return {
          riskLevel: threshold.riskLevel,
          autoActions: threshold.autoActions
        }
      }
    }

    // 默认为关键级别
    return {
      riskLevel: 'CRITICAL',
      autoActions: ['LOG_VARIANCE', 'NOTIFY_MANAGER', 'REQUIRE_INVESTIGATION', 'HOLD_PAYMENT', 'ESCALATE_TO_DIRECTOR']
    }
  }

  /**
   * 应用检测规则
   */
  private applyDetectionRules(
    transferId: number,
    varianceQuantity: number,
    variancePercentage: number
  ): string[] {
    const rules: string[] = []

    // 规则1: 负差异检测（实际少于预期）
    if (varianceQuantity < 0) {
      rules.push('NEGATIVE_VARIANCE_DETECTED')
      
      if (Math.abs(variancePercentage) > 10) {
        rules.push('SIGNIFICANT_LOSS_DETECTED')
      }
    }

    // 规则2: 正差异检测（实际多于预期）
    if (varianceQuantity > 0) {
      rules.push('POSITIVE_VARIANCE_DETECTED')
      
      if (variancePercentage > 5) {
        rules.push('UNEXPECTED_SURPLUS_DETECTED')
      }
    }

    // 规则3: 历史模式检测
    // TODO: 实现基于历史数据的模式检测

    // 规则4: 产品特定规则
    // TODO: 实现基于产品类型的特定规则

    return rules
  }

  /**
   * 记录差异到数据库
   */
  private async recordVariance(detection: QuantityVarianceDetection): Promise<void> {
    try {
      // 获取转移信息
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: detection.transferId },
        include: {
          product: true,
          sourceWarehouse: true,
          targetWarehouse: true
        }
      })

      if (!transfer) {
        throw new Error(`转移记录不存在: ${detection.transferId}`)
      }

      // 自动确定差异类型
      const varianceType = this.determineVarianceType(detection)

      // 计算成本影响
      const costImpact = await this.calculateCostImpact(transfer, detection)

      // 创建差异记录
      await prisma.quantityVariance.create({
        data: {
          transferId: detection.transferId,
          expectedQuantity: detection.expectedQuantity,
          actualQuantity: detection.actualQuantity,
          varianceQuantity: detection.varianceQuantity,
          variancePercentage: detection.variancePercentage,
          varianceType,
          riskLevel: detection.riskLevel,
          status: 'DETECTED',
          costImpact,
          detectionRules: detection.detectionRules.join(','),
          autoActions: detection.autoActions.join(','),
          detectedAt: new Date(),
          notes: `自动检测到数量差异: ${detection.varianceQuantity > 0 ? '盈余' : '短缺'} ${Math.abs(detection.varianceQuantity)} 件`
        }
      })

      console.log(`数量差异已记录: 转移${detection.transferId}, 差异${detection.varianceQuantity}件`)

    } catch (error) {
      console.error('记录数量差异失败:', error)
      throw error
    }
  }

  /**
   * 确定差异类型
   */
  private determineVarianceType(detection: QuantityVarianceDetection): string {
    // 基于检测规则和差异特征自动确定类型
    if (detection.detectionRules.includes('SIGNIFICANT_LOSS_DETECTED')) {
      return 'QUALITY_DEFECT' // 可能是质量问题
    }
    
    if (detection.detectionRules.includes('UNEXPECTED_SURPLUS_DETECTED')) {
      return 'COUNTING_ERROR' // 可能是盘点错误
    }
    
    if (Math.abs(detection.variancePercentage) <= 3) {
      return 'PRODUCTION_LOSS' // 小幅差异可能是正常损耗
    }

    return 'UNKNOWN' // 需要人工判断
  }

  /**
   * 计算成本影响
   */
  private async calculateCostImpact(transfer: any, detection: QuantityVarianceDetection): Promise<number> {
    try {
      // 获取产品成本信息
      const product = transfer.product
      const unitCost = product.costPrice || 0

      // 计算直接成本影响
      const directCostImpact = Math.abs(detection.varianceQuantity) * unitCost

      // 考虑额外成本（如运输、处理等）
      let additionalCost = 0
      
      if (detection.riskLevel === 'HIGH' || detection.riskLevel === 'CRITICAL') {
        // 高风险差异可能产生额外调查和处理成本
        additionalCost = directCostImpact * 0.2 // 20%的额外成本
      }

      return directCostImpact + additionalCost

    } catch (error) {
      console.error('计算成本影响失败:', error)
      return 0
    }
  }

  /**
   * 执行自动操作
   */
  private async executeAutoActions(detection: QuantityVarianceDetection): Promise<void> {
    try {
      for (const action of detection.autoActions) {
        await this.executeAction(action, detection)
      }
    } catch (error) {
      console.error('执行自动操作失败:', error)
    }
  }

  /**
   * 执行单个自动操作
   */
  private async executeAction(action: string, detection: QuantityVarianceDetection): Promise<void> {
    try {
      switch (action) {
        case 'LOG_VARIANCE':
          await this.logVariance(detection)
          break
          
        case 'NOTIFY_SUPERVISOR':
          await this.notifySupervisor(detection)
          break
          
        case 'NOTIFY_MANAGER':
          await this.notifyManager(detection)
          break
          
        case 'REQUIRE_EXPLANATION':
          await this.requireExplanation(detection)
          break
          
        case 'REQUIRE_INVESTIGATION':
          await this.requireInvestigation(detection)
          break
          
        case 'HOLD_PAYMENT':
          await this.holdPayment(detection)
          break
          
        case 'ESCALATE_TO_DIRECTOR':
          await this.escalateToDirector(detection)
          break
          
        default:
          console.warn(`未知的自动操作: ${action}`)
      }
    } catch (error) {
      console.error(`执行操作${action}失败:`, error)
    }
  }

  /**
   * 记录差异日志
   */
  private async logVariance(detection: QuantityVarianceDetection): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: 'QUANTITY_VARIANCE_DETECTED',
        entityType: 'InventoryTransfer',
        entityId: detection.transferId.toString(),
        details: JSON.stringify({
          expectedQuantity: detection.expectedQuantity,
          actualQuantity: detection.actualQuantity,
          varianceQuantity: detection.varianceQuantity,
          variancePercentage: detection.variancePercentage,
          riskLevel: detection.riskLevel
        }),
        userId: null, // 系统自动操作
        timestamp: new Date()
      }
    })
  }

  /**
   * 通知主管
   */
  private async notifySupervisor(detection: QuantityVarianceDetection): Promise<void> {
    // TODO: 实现通知逻辑（邮件、短信、系统通知等）
    console.log(`通知主管: 检测到数量差异 - 转移${detection.transferId}, 差异${detection.varianceQuantity}件`)
  }

  /**
   * 通知经理
   */
  private async notifyManager(detection: QuantityVarianceDetection): Promise<void> {
    // TODO: 实现通知逻辑
    console.log(`通知经理: 检测到重大数量差异 - 转移${detection.transferId}, 差异${detection.varianceQuantity}件`)
  }

  /**
   * 要求说明
   */
  private async requireExplanation(detection: QuantityVarianceDetection): Promise<void> {
    // TODO: 创建待办事项或工作流
    console.log(`要求说明: 转移${detection.transferId}的数量差异需要解释`)
  }

  /**
   * 要求调查
   */
  private async requireInvestigation(detection: QuantityVarianceDetection): Promise<void> {
    // TODO: 创建调查任务
    console.log(`要求调查: 转移${detection.transferId}的数量差异需要深入调查`)
  }

  /**
   * 暂停付款
   */
  private async holdPayment(detection: QuantityVarianceDetection): Promise<void> {
    // TODO: 标记相关付款为暂停状态
    console.log(`暂停付款: 转移${detection.transferId}相关的付款已暂停`)
  }

  /**
   * 上报总监
   */
  private async escalateToDirector(detection: QuantityVarianceDetection): Promise<void> {
    // TODO: 创建高级别通知
    console.log(`上报总监: 转移${detection.transferId}的严重数量差异需要总监关注`)
  }

  /**
   * 批量检测多个转移的差异
   */
  async batchDetectVariances(transfers: Array<{
    id: number
    expectedQuantity: number
    actualQuantity: number
  }>): Promise<QuantityVarianceDetection[]> {
    const detections: QuantityVarianceDetection[] = []

    for (const transfer of transfers) {
      try {
        const detection = await this.detectVariance(
          transfer.id,
          transfer.expectedQuantity,
          transfer.actualQuantity
        )
        
        if (detection) {
          detections.push(detection)
        }
      } catch (error) {
        console.error(`批量检测转移${transfer.id}失败:`, error)
      }
    }

    return detections
  }

  /**
   * 获取差异统计
   */
  async getVarianceStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    totalVariances: number
    averageVarianceRate: number
    costImpact: number
    riskDistribution: Record<string, number>
    typeDistribution: Record<string, number>
  }> {
    try {
      const whereClause = dateRange ? {
        detectedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}

      const variances = await prisma.quantityVariance.findMany({
        where: whereClause
      })

      const totalVariances = variances.length
      const averageVarianceRate = totalVariances > 0 ? 
        variances.reduce((sum, v) => sum + Math.abs(v.variancePercentage), 0) / totalVariances : 0
      const costImpact = variances.reduce((sum, v) => sum + v.costImpact, 0)

      const riskDistribution: Record<string, number> = {}
      const typeDistribution: Record<string, number> = {}

      variances.forEach(variance => {
        riskDistribution[variance.riskLevel] = (riskDistribution[variance.riskLevel] || 0) + 1
        typeDistribution[variance.varianceType] = (typeDistribution[variance.varianceType] || 0) + 1
      })

      return {
        totalVariances,
        averageVarianceRate,
        costImpact,
        riskDistribution,
        typeDistribution
      }
    } catch (error) {
      console.error('获取差异统计失败:', error)
      throw error
    }
  }
}

// 全局差异检测器实例
export const quantityVarianceDetector = new QuantityVarianceDetector()

/**
 * 便捷函数：检测单个转移的数量差异
 */
export async function detectTransferVariance(
  transferId: number,
  expectedQuantity: number,
  actualQuantity: number
): Promise<QuantityVarianceDetection | null> {
  return await quantityVarianceDetector.detectVariance(transferId, expectedQuantity, actualQuantity)
}
