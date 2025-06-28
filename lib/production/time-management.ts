/**
 * 智能时间管理系统
 * 聆花掐丝珐琅馆ERP系统
 */

import { ProductionStage, STAGE_FLOW_RULES } from './state-machine';

export interface TimeEstimate {
  optimistic: number;    // 乐观估计（天）
  realistic: number;     // 现实估计（天）
  pessimistic: number;   // 悲观估计（天）
  confidence: number;    // 置信度 (0-1)
}

export interface DeliveryAlert {
  type: 'warning' | 'danger' | 'critical';
  daysUntilDeadline: number;
  message: string;
  suggestedActions: string[];
  riskLevel: number; // 0-100
}

export interface BottleneckAnalysis {
  stage: ProductionStage;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 对整体进度的影响 (0-100)
  causes: string[];
  recommendations: string[];
}

/**
 * 智能时间管理类
 */
export class TimeManagementSystem {
  /**
   * 基于历史数据计算动态时间预估
   */
  static calculateDynamicEstimate(
    stage: ProductionStage,
    productComplexity: number = 1, // 产品复杂度系数 (0.5-2.0)
    seasonalFactor: number = 1,    // 季节性因子 (0.8-1.5)
    workloadFactor: number = 1,    // 工作负荷因子 (0.7-1.8)
    historicalData?: {
      averageDuration: number;
      standardDeviation: number;
      completionRate: number;
    }
  ): TimeEstimate {
    const baseEstimate = STAGE_FLOW_RULES[stage].estimatedDays;
    
    // 如果有历史数据，使用历史数据进行调整
    let adjustedEstimate = baseEstimate;
    let confidence = 0.7; // 默认置信度

    if (historicalData) {
      adjustedEstimate = historicalData.averageDuration;
      confidence = Math.min(0.95, historicalData.completionRate);
    }

    // 应用各种因子
    const finalEstimate = adjustedEstimate * productComplexity * seasonalFactor * workloadFactor;

    // 计算三点估算
    const optimistic = finalEstimate * 0.7;
    const realistic = finalEstimate;
    const pessimistic = finalEstimate * 1.5;

    return {
      optimistic: Math.round(optimistic * 10) / 10,
      realistic: Math.round(realistic * 10) / 10,
      pessimistic: Math.round(pessimistic * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * 生成交期预警
   */
  static generateDeliveryAlerts(
    currentStage: ProductionStage,
    startDate: Date,
    targetDeliveryDate: Date,
    currentDate: Date = new Date()
  ): DeliveryAlert[] {
    const alerts: DeliveryAlert[] = [];
    const daysUntilDeadline = Math.ceil(
      (targetDeliveryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 计算剩余工作量
    const remainingStages = this.getRemainingStages(currentStage);
    const estimatedRemainingDays = remainingStages.reduce(
      (total, stage) => total + STAGE_FLOW_RULES[stage].estimatedDays,
      0
    );

    const riskLevel = Math.max(0, Math.min(100, 
      ((estimatedRemainingDays - daysUntilDeadline) / estimatedRemainingDays) * 100
    ));

    // 3天预警
    if (daysUntilDeadline <= 3 && daysUntilDeadline > 1) {
      alerts.push({
        type: 'warning',
        daysUntilDeadline,
        message: `交期临近，还有 ${daysUntilDeadline} 天到期`,
        suggestedActions: [
          '检查当前进度',
          '评估是否需要加急处理',
          '通知相关负责人',
        ],
        riskLevel: Math.max(30, riskLevel),
      });
    }

    // 1天预警
    if (daysUntilDeadline <= 1 && daysUntilDeadline > 0) {
      alerts.push({
        type: 'danger',
        daysUntilDeadline,
        message: `紧急：明天就是交期！`,
        suggestedActions: [
          '立即检查生产状态',
          '考虑加班或外包',
          '准备延期说明',
          '通知客户可能的延期',
        ],
        riskLevel: Math.max(70, riskLevel),
      });
    }

    // 逾期预警
    if (daysUntilDeadline <= 0) {
      alerts.push({
        type: 'critical',
        daysUntilDeadline,
        message: `已逾期 ${Math.abs(daysUntilDeadline)} 天！`,
        suggestedActions: [
          '立即联系客户说明情况',
          '制定紧急补救方案',
          '评估损失和赔偿',
          '分析逾期原因',
        ],
        riskLevel: 100,
      });
    }

    // 进度风险预警
    if (estimatedRemainingDays > daysUntilDeadline && daysUntilDeadline > 0) {
      alerts.push({
        type: 'warning',
        daysUntilDeadline,
        message: `按当前进度可能延期 ${estimatedRemainingDays - daysUntilDeadline} 天`,
        suggestedActions: [
          '优化生产流程',
          '增加人力资源',
          '考虑并行处理',
          '与客户协商延期',
        ],
        riskLevel,
      });
    }

    return alerts;
  }

  /**
   * 关键路径分析
   */
  static analyzeCriticalPath(
    currentStage: ProductionStage,
    targetDate: Date,
    currentDate: Date = new Date()
  ): {
    criticalPath: ProductionStage[];
    totalDuration: number;
    slack: number; // 时间余量（天）
    bottlenecks: BottleneckAnalysis[];
  } {
    const remainingStages = this.getRemainingStages(currentStage);
    const totalDuration = remainingStages.reduce(
      (total, stage) => total + STAGE_FLOW_RULES[stage].estimatedDays,
      0
    );

    const availableDays = Math.ceil(
      (targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const slack = availableDays - totalDuration;

    // 识别瓶颈
    const bottlenecks: BottleneckAnalysis[] = [];
    
    remainingStages.forEach(stage => {
      const stageDuration = STAGE_FLOW_RULES[stage].estimatedDays;
      const stageImpact = (stageDuration / totalDuration) * 100;
      
      let severity: BottleneckAnalysis['severity'] = 'low';
      const causes: string[] = [];
      const recommendations: string[] = [];

      if (stageDuration >= 7) {
        severity = 'high';
        causes.push('阶段耗时较长');
        recommendations.push('考虑分解为子阶段');
      }

      if (stage === 'IN_PRODUCTION') {
        severity = 'medium';
        causes.push('手工制作工艺复杂');
        recommendations.push('优化工艺流程', '增加熟练工人');
      }

      if (slack < 0 && stageImpact > 20) {
        severity = 'critical';
        causes.push('时间紧张，影响较大');
        recommendations.push('优先处理此阶段', '考虑外包或加急');
      }

      if (severity !== 'low') {
        bottlenecks.push({
          stage,
          severity,
          impact: Math.round(stageImpact),
          causes,
          recommendations,
        });
      }
    });

    return {
      criticalPath: remainingStages,
      totalDuration,
      slack,
      bottlenecks,
    };
  }

  /**
   * 智能调度建议
   */
  static generateSchedulingRecommendations(
    orders: Array<{
      id: number;
      priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      currentStage: ProductionStage;
      targetDate: Date;
      complexity: number;
    }>
  ): Array<{
    orderId: number;
    recommendedStartDate: Date;
    recommendedPriority: number;
    reasoning: string[];
  }> {
    const recommendations = orders.map(order => {
      const remainingDays = this.getRemainingStages(order.currentStage)
        .reduce((total, stage) => total + STAGE_FLOW_RULES[stage].estimatedDays, 0);

      const urgencyScore = this.calculateUrgencyScore(order.targetDate, remainingDays);
      const priorityScore = this.getPriorityScore(order.priority);
      const complexityScore = order.complexity;

      const finalScore = urgencyScore * 0.5 + priorityScore * 0.3 + complexityScore * 0.2;

      const reasoning: string[] = [];
      if (urgencyScore > 80) reasoning.push('交期紧急');
      if (priorityScore > 80) reasoning.push('优先级高');
      if (complexityScore > 1.5) reasoning.push('产品复杂度高');

      const recommendedStartDate = new Date();
      recommendedStartDate.setDate(recommendedStartDate.getDate() + Math.max(0, 
        Math.ceil((order.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) - remainingDays
      ));

      return {
        orderId: order.id,
        recommendedStartDate,
        recommendedPriority: Math.round(finalScore),
        reasoning,
      };
    });

    return recommendations.sort((a, b) => b.recommendedPriority - a.recommendedPriority);
  }

  /**
   * 获取剩余阶段
   */
  private static getRemainingStages(currentStage: ProductionStage): ProductionStage[] {
    const allStages: ProductionStage[] = [
      'DESIGN',
      'MATERIAL_PROCUREMENT',
      'SHIPPING_TO_PRODUCTION',
      'IN_PRODUCTION',
      'QUALITY_CHECK',
      'SHIPPING_BACK',
      'PACKAGING',
      'SALES_READY',
    ];

    const currentIndex = allStages.indexOf(currentStage);
    return allStages.slice(currentIndex + 1);
  }

  /**
   * 计算紧急程度评分
   */
  private static calculateUrgencyScore(targetDate: Date, remainingDays: number): number {
    const daysUntilTarget = Math.ceil(
      (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilTarget <= 0) return 100;
    if (daysUntilTarget < remainingDays) return 90;
    if (daysUntilTarget < remainingDays * 1.2) return 70;
    if (daysUntilTarget < remainingDays * 1.5) return 50;
    return 30;
  }

  /**
   * 获取优先级评分
   */
  private static getPriorityScore(priority: string): number {
    const scores = {
      URGENT: 100,
      HIGH: 80,
      NORMAL: 50,
      LOW: 20,
    };
    return scores[priority as keyof typeof scores] || 50;
  }
}
