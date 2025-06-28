/**
 * 生产阶段智能化自动化引擎
 * 监听生产阶段变更，智能决策并自动触发库存转移和成本记录
 * 包含风险评估、智能决策和人工干预机制
 */

import prisma from '@/lib/db'
import { InventoryAutomationEngine } from '@/lib/inventory-automation/inventory-automation-engine'
import { CostAccountingEngine } from '@/lib/cost-accounting/cost-accounting-engine'
import { quantityVarianceDetector } from './quantity-variance-detector'

interface IntelligentDecision {
  action: string
  confidence: number // 0-1
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  requiresApproval: boolean
  reasoning: string[]
  alternatives: Array<{
    action: string
    confidence: number
    pros: string[]
    cons: string[]
  }>
}

export interface StageChangeEvent {
  productionOrderId: number
  fromStage: string | null
  toStage: string
  changedBy: number
  timestamp: Date
  metadata?: any
}

export class ProductionStageAutomation {
  private inventoryEngine: InventoryAutomationEngine
  private costEngine: CostAccountingEngine
  private intelligenceLevel: 'BASIC' | 'ADVANCED' | 'EXPERT' = 'ADVANCED'
  private riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' = 'MODERATE'

  constructor() {
    this.inventoryEngine = new InventoryAutomationEngine()
    this.costEngine = new CostAccountingEngine()
  }

  /**
   * 智能决策引擎 - 分析情况并做出智能决策
   */
  private async makeIntelligentDecision(
    event: StageChangeEvent,
    context: any
  ): Promise<IntelligentDecision> {
    try {
      // 1. 收集决策所需的数据
      const decisionContext = await this.gatherDecisionContext(event, context)

      // 2. 风险评估
      const riskAssessment = await this.assessRisk(decisionContext)

      // 3. 生成决策选项
      const options = await this.generateDecisionOptions(decisionContext, riskAssessment)

      // 4. 选择最佳决策
      const bestOption = this.selectBestOption(options, riskAssessment)

      // 5. 确定是否需要人工审批
      const requiresApproval = this.shouldRequireApproval(bestOption, riskAssessment)

      return {
        action: bestOption.action,
        confidence: bestOption.confidence,
        riskLevel: riskAssessment.level,
        requiresApproval,
        reasoning: bestOption.reasoning,
        alternatives: options.filter(opt => opt.action !== bestOption.action)
      }
    } catch (error) {
      console.error('智能决策失败:', error)
      // 降级到保守决策
      return {
        action: 'REQUIRE_MANUAL_REVIEW',
        confidence: 0.9,
        riskLevel: 'HIGH',
        requiresApproval: true,
        reasoning: ['智能决策系统异常，建议人工审核'],
        alternatives: []
      }
    }
  }

  /**
   * 收集决策上下文信息
   */
  private async gatherDecisionContext(event: StageChangeEvent, context: any) {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: event.productionOrderId },
      include: {
        product: true,
        employee: true,
        productionBase: true,
        stageHistories: { orderBy: { changedAt: 'desc' }, take: 10 },
        inventoryTransfers: { orderBy: { createdAt: 'desc' }, take: 5 },
        costDetails: { orderBy: { recordedDate: 'desc' }, take: 10 }
      }
    })

    // 获取历史数据用于模式识别
    const historicalData = await this.getHistoricalPatterns(event.toStage, productionOrder?.product.id)

    // 获取当前系统状态
    const systemStatus = await this.getSystemStatus()

    return {
      productionOrder,
      historicalData,
      systemStatus,
      event,
      context
    }
  }

  /**
   * 风险评估
   */
  private async assessRisk(decisionContext: any): Promise<{
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    factors: Array<{ factor: string; impact: number; description: string }>
    score: number
  }> {
    const riskFactors = []
    let totalRiskScore = 0

    // 1. 历史异常率
    const historicalIssueRate = decisionContext.historicalData.issueRate || 0
    if (historicalIssueRate > 0.1) {
      riskFactors.push({
        factor: 'HISTORICAL_ISSUES',
        impact: historicalIssueRate * 30,
        description: `该阶段历史异常率${(historicalIssueRate * 100).toFixed(1)}%`
      })
    }

    // 2. 数量差异风险
    const recentVariances = decisionContext.productionOrder?.inventoryTransfers
      ?.filter((t: any) => t.actualQuantity && t.actualQuantity !== t.quantity) || []
    if (recentVariances.length > 0) {
      riskFactors.push({
        factor: 'QUANTITY_VARIANCE',
        impact: 20,
        description: `最近${recentVariances.length}次转移存在数量差异`
      })
    }

    // 3. 系统负载
    if (decisionContext.systemStatus.load > 0.8) {
      riskFactors.push({
        factor: 'SYSTEM_LOAD',
        impact: 15,
        description: `系统负载过高(${(decisionContext.systemStatus.load * 100).toFixed(1)}%)`
      })
    }

    // 4. 时间压力
    const orderUrgency = this.calculateOrderUrgency(decisionContext.productionOrder)
    if (orderUrgency > 0.7) {
      riskFactors.push({
        factor: 'TIME_PRESSURE',
        impact: orderUrgency * 25,
        description: `订单紧急程度高(${(orderUrgency * 100).toFixed(1)}%)`
      })
    }

    // 5. 成本影响
    const costImpact = this.estimateCostImpact(decisionContext)
    if (costImpact > 1000) {
      riskFactors.push({
        factor: 'HIGH_COST_IMPACT',
        impact: Math.min(costImpact / 100, 30),
        description: `预估成本影响¥${costImpact.toFixed(2)}`
      })
    }

    totalRiskScore = riskFactors.reduce((sum, factor) => sum + factor.impact, 0)

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    if (totalRiskScore <= 20) level = 'LOW'
    else if (totalRiskScore <= 50) level = 'MEDIUM'
    else if (totalRiskScore <= 80) level = 'HIGH'
    else level = 'CRITICAL'

    return {
      level,
      factors: riskFactors,
      score: totalRiskScore
    }
  }

  /**
   * 生成决策选项
   */
  private async generateDecisionOptions(decisionContext: any, riskAssessment: any) {
    const options = []

    // 选项1: 完全自动化执行
    if (riskAssessment.level === 'LOW' && this.intelligenceLevel === 'EXPERT') {
      options.push({
        action: 'AUTO_EXECUTE_ALL',
        confidence: 0.9,
        reasoning: ['风险低', '历史成功率高', '系统状态良好'],
        pros: ['效率最高', '无需人工干预', '成本最低'],
        cons: ['缺乏人工监督', '异常情况响应慢']
      })
    }

    // 选项2: 半自动化执行（推荐）
    if (riskAssessment.level <= 'MEDIUM') {
      options.push({
        action: 'SEMI_AUTO_EXECUTE',
        confidence: 0.85,
        reasoning: ['风险可控', '保留关键人工检查点', '平衡效率和安全'],
        pros: ['效率较高', '关键节点人工确认', '风险可控'],
        cons: ['需要部分人工干预', '处理时间稍长']
      })
    }

    // 选项3: 人工审核后执行
    options.push({
      action: 'REQUIRE_APPROVAL',
      confidence: 0.95,
      reasoning: ['确保安全', '人工最终确认', '适用于高风险情况'],
      pros: ['安全性最高', '人工最终把关', '可处理复杂情况'],
      cons: ['效率较低', '依赖人工可用性', '成本较高']
    })

    // 选项4: 延迟执行
    if (riskAssessment.level === 'CRITICAL' || decisionContext.systemStatus.load > 0.9) {
      options.push({
        action: 'DELAY_EXECUTION',
        confidence: 0.8,
        reasoning: ['系统负载过高', '风险过大', '等待更好时机'],
        pros: ['避免高风险操作', '等待系统恢复', '减少错误概率'],
        cons: ['延迟生产进度', '可能影响交期', '资源闲置']
      })
    }

    return options
  }

  /**
   * 选择最佳决策选项
   */
  private selectBestOption(options: any[], riskAssessment: any) {
    // 根据风险容忍度和智能化水平选择最佳选项
    let bestOption = options[0]

    for (const option of options) {
      // 综合考虑置信度、风险容忍度和效率
      const score = this.calculateOptionScore(option, riskAssessment)
      const bestScore = this.calculateOptionScore(bestOption, riskAssessment)

      if (score > bestScore) {
        bestOption = option
      }
    }

    return bestOption
  }

  /**
   * 计算选项得分
   */
  private calculateOptionScore(option: any, riskAssessment: any): number {
    let score = option.confidence * 100

    // 根据风险容忍度调整得分
    if (this.riskTolerance === 'CONSERVATIVE') {
      if (option.action === 'REQUIRE_APPROVAL') score += 20
      if (option.action === 'AUTO_EXECUTE_ALL') score -= 30
    } else if (this.riskTolerance === 'AGGRESSIVE') {
      if (option.action === 'AUTO_EXECUTE_ALL') score += 20
      if (option.action === 'REQUIRE_APPROVAL') score -= 10
    }

    // 根据风险级别调整
    if (riskAssessment.level === 'HIGH' || riskAssessment.level === 'CRITICAL') {
      if (option.action.includes('AUTO')) score -= 25
      if (option.action === 'REQUIRE_APPROVAL') score += 15
    }

    return score
  }

  /**
   * 判断是否需要人工审批
   */
  private shouldRequireApproval(option: any, riskAssessment: any): boolean {
    // 强制审批条件
    if (riskAssessment.level === 'CRITICAL') return true
    if (option.confidence < 0.7) return true
    if (option.action === 'REQUIRE_APPROVAL') return true

    // 基于风险容忍度
    if (this.riskTolerance === 'CONSERVATIVE' && riskAssessment.level === 'HIGH') return true

    return false
  }

  /**
   * 处理生产阶段变更事件（智能化版本）
   */
  async handleStageChange(event: StageChangeEvent): Promise<void> {
    try {
      console.log(`🤖 智能处理生产阶段变更: ${event.fromStage} → ${event.toStage}`)

      // 1. 智能决策分析
      const decision = await this.makeIntelligentDecision(event, {})

      console.log(`智能决策结果: ${decision.action} (置信度: ${(decision.confidence * 100).toFixed(1)}%, 风险: ${decision.riskLevel})`)
      console.log(`决策理由: ${decision.reasoning.join(', ')}`)

      // 2. 根据决策执行相应操作
      if (decision.requiresApproval) {
        await this.requestHumanApproval(event, decision)
      } else {
        await this.executeAutomatedActions(event, decision)
      }

      // 3. 记录决策和执行结果
      await this.logDecisionAndExecution(event, decision)

    } catch (error) {
      console.error('智能处理生产阶段变更失败:', error)
      // 降级到人工处理
      await this.fallbackToManualProcessing(event, error)
      throw error
    }
  }

  /**
   * 执行自动化操作
   */
  private async executeAutomatedActions(event: StageChangeEvent, decision: IntelligentDecision): Promise<void> {
    try {
      switch (decision.action) {
        case 'AUTO_EXECUTE_ALL':
          await this.executeFullAutomation(event)
          break

        case 'SEMI_AUTO_EXECUTE':
          await this.executeSemiAutomation(event)
          break

        case 'DELAY_EXECUTION':
          await this.scheduleDelayedExecution(event, decision)
          break

        default:
          console.warn(`未知的自动化操作: ${decision.action}`)
          await this.executeBasicAutomation(event)
      }
    } catch (error) {
      console.error('执行自动化操作失败:', error)
      throw error
    }
  }

  /**
   * 完全自动化执行
   */
  private async executeFullAutomation(event: StageChangeEvent): Promise<void> {
    console.log('🚀 执行完全自动化流程')

    // 并行执行所有自动化操作
    await Promise.all([
      this.executeInventoryAutomation(event),
      this.recordStageCost(event),
      this.triggerQualityCheck(event),
      this.updateProductionOrderStatus(event)
    ])

    // 发送通知
    await this.sendStageChangeNotifications(event)

    console.log('✅ 完全自动化流程执行完成')
  }

  /**
   * 半自动化执行
   */
  private async executeSemiAutomation(event: StageChangeEvent): Promise<void> {
    console.log('⚡ 执行半自动化流程')

    // 1. 自动执行低风险操作
    await this.recordStageCost(event)
    await this.updateProductionOrderStatus(event)

    // 2. 库存转移需要确认
    const inventoryDecision = await this.evaluateInventoryTransfer(event)
    if (inventoryDecision.autoApprove) {
      await this.executeInventoryAutomation(event)
    } else {
      await this.requestInventoryTransferApproval(event, inventoryDecision)
    }

    // 3. 质量检验根据风险决定
    const qualityRisk = await this.assessQualityRisk(event)
    if (qualityRisk.level <= 'MEDIUM') {
      await this.triggerQualityCheck(event)
    } else {
      await this.requestQualityCheckApproval(event, qualityRisk)
    }

    // 4. 发送通知
    await this.sendStageChangeNotifications(event)

    console.log('✅ 半自动化流程执行完成')
  }

  /**
   * 请求人工审批
   */
  private async requestHumanApproval(event: StageChangeEvent, decision: IntelligentDecision): Promise<void> {
    console.log('👤 请求人工审批')

    // 创建审批任务
    await prisma.approvalTask.create({
      data: {
        type: 'STAGE_CHANGE_APPROVAL',
        entityType: 'ProductionOrder',
        entityId: event.productionOrderId.toString(),
        title: `生产阶段变更审批: ${event.fromStage} → ${event.toStage}`,
        description: `智能系统建议: ${decision.action}\n置信度: ${(decision.confidence * 100).toFixed(1)}%\n风险级别: ${decision.riskLevel}\n理由: ${decision.reasoning.join(', ')}`,
        priority: decision.riskLevel === 'CRITICAL' ? 'HIGH' : decision.riskLevel === 'HIGH' ? 'MEDIUM' : 'LOW',
        assignedRole: this.getApprovalRole(event.toStage),
        requestData: JSON.stringify({
          event,
          decision,
          alternatives: decision.alternatives
        }),
        status: 'PENDING',
        createdAt: new Date()
      }
    })

    // 发送审批通知
    await this.sendApprovalNotification(event, decision)

    console.log('📋 人工审批任务已创建')
  }

  /**
   * 降级到人工处理
   */
  private async fallbackToManualProcessing(event: StageChangeEvent, error: any): Promise<void> {
    console.log('🔄 降级到人工处理模式')

    // 创建紧急处理任务
    await prisma.emergencyTask.create({
      data: {
        type: 'AUTOMATION_FAILURE',
        entityType: 'ProductionOrder',
        entityId: event.productionOrderId.toString(),
        title: `自动化处理失败 - 生产阶段变更`,
        description: `自动化系统处理失败，需要人工介入\n错误信息: ${error.message}\n阶段变更: ${event.fromStage} → ${event.toStage}`,
        priority: 'HIGH',
        assignedRole: 'SYSTEM_ADMIN',
        errorDetails: JSON.stringify({
          error: error.message,
          stack: error.stack,
          event
        }),
        status: 'PENDING',
        createdAt: new Date()
      }
    })

    // 发送紧急通知
    await this.sendEmergencyNotification(event, error)
  }

  /**
   * 执行库存自动转移
   */
  private async executeInventoryAutomation(event: StageChangeEvent): Promise<void> {
    try {
      // 根据阶段变更触发相应的库存转移
      const automationRules = await this.getApplicableAutomationRules(event)

      for (const rule of automationRules) {
        await this.inventoryEngine.executeAutomaticTransfer(
          event.productionOrderId,
          event.fromStage || '',
          event.toStage
        )
      }
    } catch (error) {
      console.error('执行库存自动转移失败:', error)
      // 不抛出错误，避免阻塞其他自动化流程
    }
  }

  /**
   * 自动记录阶段成本
   */
  private async recordStageCost(event: StageChangeEvent): Promise<void> {
    try {
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: event.productionOrderId },
        include: { product: true }
      })

      if (!productionOrder) return

      // 根据阶段自动记录相应的成本
      const stageCostConfig = this.getStageCostConfig(event.toStage)
      
      if (stageCostConfig) {
        await this.costEngine.recordProductionCost({
          productionOrderId: event.productionOrderId,
          costCategory: stageCostConfig.category,
          costType: stageCostConfig.type,
          stage: event.toStage,
          location: stageCostConfig.location,
          amount: stageCostConfig.estimatedCost,
          description: `阶段自动成本记录：${event.toStage}`,
          recordedBy: event.changedBy
        })
      }
    } catch (error) {
      console.error('记录阶段成本失败:', error)
    }
  }

  /**
   * 触发质量检验
   */
  private async triggerQualityCheck(event: StageChangeEvent): Promise<void> {
    try {
      // 在特定阶段自动创建质量检验记录
      const qualityCheckStages = ['IN_PRODUCTION', 'PACKAGING', 'SALES_READY']
      
      if (qualityCheckStages.includes(event.toStage)) {
        await prisma.qualityRecord.create({
          data: {
            productionOrderId: event.productionOrderId,
            checkType: this.getQualityCheckType(event.toStage),
            checkStage: event.toStage as any,
            status: 'PENDING',
            scheduledDate: new Date(),
            checkedBy: event.changedBy,
            notes: `阶段自动质检：${event.toStage}`
          }
        })
      }
    } catch (error) {
      console.error('触发质量检验失败:', error)
    }
  }

  /**
   * 更新生产订单状态
   */
  private async updateProductionOrderStatus(event: StageChangeEvent): Promise<void> {
    try {
      // 根据阶段自动更新订单状态
      const newStatus = this.getOrderStatusByStage(event.toStage)
      
      if (newStatus) {
        await prisma.productionOrder.update({
          where: { id: event.productionOrderId },
          data: {
            status: newStatus,
            currentStage: event.toStage as any,
            updatedAt: new Date()
          }
        })

        // 记录状态变更历史
        await prisma.productionStatusUpdate.create({
          data: {
            productionOrderId: event.productionOrderId,
            fromStatus: null, // TODO: 获取之前的状态
            toStatus: newStatus,
            updatedBy: event.changedBy,
            notes: `阶段变更自动更新状态：${event.toStage}`
          }
        })
      }
    } catch (error) {
      console.error('更新生产订单状态失败:', error)
    }
  }

  /**
   * 发送阶段变更通知
   */
  private async sendStageChangeNotifications(event: StageChangeEvent): Promise<void> {
    try {
      // 获取需要通知的人员
      const notificationTargets = await this.getNotificationTargets(event)

      // 发送通知（这里可以集成邮件、短信、WebSocket等）
      for (const target of notificationTargets) {
        // TODO: 实现通知发送逻辑
        console.log(`发送通知给 ${target.name}: 生产订单 ${event.productionOrderId} 进入 ${event.toStage} 阶段`)
      }
    } catch (error) {
      console.error('发送阶段变更通知失败:', error)
    }
  }

  /**
   * 获取适用的自动化规则
   */
  private async getApplicableAutomationRules(event: StageChangeEvent): Promise<any[]> {
    return await prisma.inventoryAutomationRule.findMany({
      where: {
        isActive: true,
        triggerEvent: 'STAGE_COMPLETED',
        sourceStage: event.fromStage,
        targetStage: event.toStage
      },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true
      }
    })
  }

  /**
   * 获取阶段成本配置
   */
  private getStageCostConfig(stage: string): any {
    const stageConfigs: { [key: string]: any } = {
      'DESIGN': {
        category: 'DIRECT_LABOR',
        type: 'LABOR',
        location: '广州设计中心',
        estimatedCost: 200
      },
      'MATERIAL_PROCUREMENT': {
        category: 'DIRECT_MATERIAL',
        type: 'MATERIAL',
        location: '广州采购中心',
        estimatedCost: 500
      },
      'SHIPPING_TO_PRODUCTION': {
        category: 'SHIPPING_COST',
        type: 'SHIPPING',
        location: '广州→广西',
        estimatedCost: 50
      },
      'IN_PRODUCTION': {
        category: 'DIRECT_LABOR',
        type: 'LABOR',
        location: '广西生产基地',
        estimatedCost: 800
      },
      'QUALITY_CHECK': {
        category: 'QUALITY_COST',
        type: 'QUALITY',
        location: '广西生产基地',
        estimatedCost: 100
      },
      'SHIPPING_BACK': {
        category: 'SHIPPING_COST',
        type: 'SHIPPING',
        location: '广西→广州',
        estimatedCost: 50
      },
      'PACKAGING': {
        category: 'DIRECT_LABOR',
        type: 'LABOR',
        location: '广州包装中心',
        estimatedCost: 150
      }
    }

    return stageConfigs[stage] || null
  }

  /**
   * 获取质量检验类型
   */
  private getQualityCheckType(stage: string): string {
    const checkTypes: { [key: string]: string } = {
      'IN_PRODUCTION': 'PROCESS_CHECK',
      'PACKAGING': 'FINAL_CHECK',
      'SALES_READY': 'DELIVERY_CHECK'
    }

    return checkTypes[stage] || 'GENERAL_CHECK'
  }

  /**
   * 根据阶段获取订单状态
   */
  private getOrderStatusByStage(stage: string): string | null {
    const statusMapping: { [key: string]: string } = {
      'DESIGN': 'IN_PROGRESS',
      'MATERIAL_PROCUREMENT': 'IN_PROGRESS',
      'SHIPPING_TO_PRODUCTION': 'IN_PROGRESS',
      'IN_PRODUCTION': 'IN_PROGRESS',
      'QUALITY_CHECK': 'IN_PROGRESS',
      'SHIPPING_BACK': 'IN_PROGRESS',
      'PACKAGING': 'IN_PROGRESS',
      'SALES_READY': 'COMPLETED'
    }

    return statusMapping[stage] || null
  }

  /**
   * 获取通知目标
   */
  private async getNotificationTargets(event: StageChangeEvent): Promise<any[]> {
    // 根据阶段获取需要通知的角色
    const stageNotificationRoles: { [key: string]: string[] } = {
      'DESIGN': ['DESIGNER', 'PROJECT_MANAGER'],
      'MATERIAL_PROCUREMENT': ['PURCHASER', 'PROJECT_MANAGER'],
      'SHIPPING_TO_PRODUCTION': ['LOGISTICS', 'PRODUCTION_MANAGER'],
      'IN_PRODUCTION': ['PRODUCTION_WORKER', 'PRODUCTION_MANAGER'],
      'QUALITY_CHECK': ['QUALITY_INSPECTOR', 'PRODUCTION_MANAGER'],
      'SHIPPING_BACK': ['LOGISTICS', 'PACKAGING_MANAGER'],
      'PACKAGING': ['PACKAGING_WORKER', 'PACKAGING_MANAGER'],
      'SALES_READY': ['SALES', 'PROJECT_MANAGER']
    }

    const roles = stageNotificationRoles[event.toStage] || []
    
    if (roles.length === 0) return []

    return await prisma.employee.findMany({
      where: {
        role: { in: roles },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
  }
}

/**
 * 全局阶段变更处理器
 */
export const stageAutomation = new ProductionStageAutomation()

/**
 * 触发阶段变更事件的便捷函数
 */
export async function triggerStageChange(
  productionOrderId: number,
  fromStage: string | null,
  toStage: string,
  changedBy: number,
  metadata?: any
): Promise<void> {
  const event: StageChangeEvent = {
    productionOrderId,
    fromStage,
    toStage,
    changedBy,
    timestamp: new Date(),
    metadata
  }

  await stageAutomation.handleStageChange(event)
}
