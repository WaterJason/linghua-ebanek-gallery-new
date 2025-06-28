/**
 * 生产订单状态机 - 8阶段生产流程管理
 * 聆花掐丝珐琅馆ERP系统
 */

export type ProductionStage = 
  | 'DESIGN'                    // 产品设计阶段
  | 'MATERIAL_PROCUREMENT'      // 底胎采购阶段
  | 'SHIPPING_TO_PRODUCTION'    // 物流发送阶段
  | 'IN_PRODUCTION'             // 工艺制作阶段
  | 'QUALITY_CHECK'             // 质量检验阶段
  | 'SHIPPING_BACK'             // 物流返回阶段
  | 'PACKAGING'                 // 包装装裱阶段
  | 'SALES_READY';              // 渠道销售阶段

export type ProductionStatus = 
  | 'PENDING'                   // 待处理
  | 'IN_PROGRESS'               // 进行中
  | 'COMPLETED'                 // 已完成
  | 'CANCELLED'                 // 已取消
  | 'ON_HOLD'                   // 暂停
  | 'DELAYED'                   // 延期
  | 'EXCEPTION'                 // 异常
  | 'REWORK';                   // 返工

export type StageLocation = 
  | '广州设计中心'
  | '广西生产基地'
  | '物流运输中'
  | '广州包装中心';

// 状态流转规则定义
export const STAGE_FLOW_RULES = {
  DESIGN: {
    nextStages: ['MATERIAL_PROCUREMENT', 'CANCELLED'],
    location: '广州设计中心',
    requiredRoles: ['designer', 'manager'],
    estimatedDays: 2,
    canSkip: false,
    prerequisites: [],
  },
  MATERIAL_PROCUREMENT: {
    nextStages: ['SHIPPING_TO_PRODUCTION', 'ON_HOLD', 'CANCELLED'],
    location: '广州设计中心',
    requiredRoles: ['purchaser', 'manager'],
    estimatedDays: 4,
    canSkip: false,
    prerequisites: ['DESIGN'],
  },
  SHIPPING_TO_PRODUCTION: {
    nextStages: ['IN_PRODUCTION', 'EXCEPTION'],
    location: '物流运输中',
    requiredRoles: ['logistics', 'manager'],
    estimatedDays: 2,
    canSkip: false,
    prerequisites: ['MATERIAL_PROCUREMENT'],
  },
  IN_PRODUCTION: {
    nextStages: ['QUALITY_CHECK', 'REWORK', 'EXCEPTION'],
    location: '广西生产基地',
    requiredRoles: ['craftsman', 'production_manager'],
    estimatedDays: 10,
    canSkip: false,
    prerequisites: ['SHIPPING_TO_PRODUCTION'],
  },
  QUALITY_CHECK: {
    nextStages: ['SHIPPING_BACK', 'REWORK', 'EXCEPTION'],
    location: '广西生产基地',
    requiredRoles: ['quality_inspector', 'production_manager'],
    estimatedDays: 1,
    canSkip: false,
    prerequisites: ['IN_PRODUCTION'],
  },
  SHIPPING_BACK: {
    nextStages: ['PACKAGING', 'EXCEPTION'],
    location: '物流运输中',
    requiredRoles: ['logistics', 'manager'],
    estimatedDays: 2,
    canSkip: false,
    prerequisites: ['QUALITY_CHECK'],
  },
  PACKAGING: {
    nextStages: ['SALES_READY', 'QUALITY_CHECK'],
    location: '广州包装中心',
    requiredRoles: ['packager', 'manager'],
    estimatedDays: 2,
    canSkip: false,
    prerequisites: ['SHIPPING_BACK'],
  },
  SALES_READY: {
    nextStages: [],
    location: '广州包装中心',
    requiredRoles: ['sales', 'manager'],
    estimatedDays: 0,
    canSkip: false,
    prerequisites: ['PACKAGING'],
  },
} as const;

// 状态验证规则
export interface StateTransitionRule {
  from: ProductionStage;
  to: ProductionStage;
  conditions: string[];
  requiredData?: string[];
  autoTrigger?: boolean;
}

export const STATE_TRANSITION_RULES: StateTransitionRule[] = [
  {
    from: 'DESIGN',
    to: 'MATERIAL_PROCUREMENT',
    conditions: ['design_approved', 'specifications_complete'],
    requiredData: ['product_specifications', 'material_list'],
    autoTrigger: false,
  },
  {
    from: 'MATERIAL_PROCUREMENT',
    to: 'SHIPPING_TO_PRODUCTION',
    conditions: ['materials_received', 'quality_checked'],
    requiredData: ['material_receipt', 'shipping_info'],
    autoTrigger: false,
  },
  {
    from: 'SHIPPING_TO_PRODUCTION',
    to: 'IN_PRODUCTION',
    conditions: ['materials_delivered', 'production_scheduled'],
    requiredData: ['delivery_confirmation', 'production_plan'],
    autoTrigger: true,
  },
  {
    from: 'IN_PRODUCTION',
    to: 'QUALITY_CHECK',
    conditions: ['production_complete', 'initial_inspection_passed'],
    requiredData: ['production_report', 'quality_checklist'],
    autoTrigger: false,
  },
  {
    from: 'QUALITY_CHECK',
    to: 'SHIPPING_BACK',
    conditions: ['quality_approved', 'packaging_ready'],
    requiredData: ['quality_report', 'shipping_arrangement'],
    autoTrigger: false,
  },
  {
    from: 'QUALITY_CHECK',
    to: 'REWORK',
    conditions: ['quality_failed', 'rework_required'],
    requiredData: ['defect_report', 'rework_instructions'],
    autoTrigger: false,
  },
  {
    from: 'SHIPPING_BACK',
    to: 'PACKAGING',
    conditions: ['products_received', 'packaging_materials_ready'],
    requiredData: ['receipt_confirmation', 'packaging_plan'],
    autoTrigger: true,
  },
  {
    from: 'PACKAGING',
    to: 'SALES_READY',
    conditions: ['packaging_complete', 'final_inspection_passed'],
    requiredData: ['packaging_report', 'inventory_update'],
    autoTrigger: false,
  },
];

// 异常状态处理规则
export const EXCEPTION_HANDLING_RULES = {
  DELAYED: {
    allowedStages: ['MATERIAL_PROCUREMENT', 'IN_PRODUCTION', 'SHIPPING_TO_PRODUCTION', 'SHIPPING_BACK'],
    autoActions: ['notify_stakeholders', 'update_timeline', 'assess_impact'],
    escalationThreshold: 2, // 延期超过2天自动升级
  },
  REWORK: {
    allowedStages: ['IN_PRODUCTION', 'QUALITY_CHECK', 'PACKAGING'],
    autoActions: ['create_rework_order', 'update_costs', 'notify_production'],
    maxReworkCount: 3,
  },
  ON_HOLD: {
    allowedStages: ['DESIGN', 'MATERIAL_PROCUREMENT', 'IN_PRODUCTION'],
    autoActions: ['pause_timeline', 'notify_team', 'resource_reallocation'],
    maxHoldDays: 30,
  },
  EXCEPTION: {
    allowedStages: ['SHIPPING_TO_PRODUCTION', 'IN_PRODUCTION', 'SHIPPING_BACK'],
    autoActions: ['create_incident', 'notify_management', 'emergency_response'],
    requiresApproval: true,
  },
};

/**
 * 状态机核心类
 */
export class ProductionStateMachine {
  /**
   * 验证状态转换是否合法
   */
  static validateTransition(
    currentStage: ProductionStage,
    targetStage: ProductionStage,
    userRole: string,
    conditions: Record<string, boolean> = {}
  ): { valid: boolean; reason?: string; warnings?: string[] } {
    const currentRule = STAGE_FLOW_RULES[currentStage];
    const warnings: string[] = [];

    // 检查目标阶段是否在允许的下一阶段列表中
    if (!currentRule.nextStages.includes(targetStage as any)) {
      return {
        valid: false,
        reason: `不能从 ${currentStage} 直接转换到 ${targetStage}`,
      };
    }

    // 检查用户权限
    const targetRule = STAGE_FLOW_RULES[targetStage];
    if (!targetRule.requiredRoles.includes(userRole) && userRole !== 'manager') {
      return {
        valid: false,
        reason: `用户角色 ${userRole} 无权限执行此操作`,
      };
    }

    // 检查转换条件
    const transitionRule = STATE_TRANSITION_RULES.find(
      rule => rule.from === currentStage && rule.to === targetStage
    );

    if (transitionRule) {
      for (const condition of transitionRule.conditions) {
        if (!conditions[condition]) {
          warnings.push(`缺少必要条件: ${condition}`);
        }
      }
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * 计算阶段进度百分比
   */
  static calculateProgress(stage: ProductionStage): number {
    const progressMap: Record<ProductionStage, number> = {
      DESIGN: 12.5,
      MATERIAL_PROCUREMENT: 25,
      SHIPPING_TO_PRODUCTION: 37.5,
      IN_PRODUCTION: 50,
      QUALITY_CHECK: 62.5,
      SHIPPING_BACK: 75,
      PACKAGING: 87.5,
      SALES_READY: 100,
    };

    return progressMap[stage] || 0;
  }

  /**
   * 获取阶段的预估完成时间
   */
  static getEstimatedDuration(stage: ProductionStage): number {
    return STAGE_FLOW_RULES[stage].estimatedDays;
  }

  /**
   * 获取阶段的操作地点
   */
  static getStageLocation(stage: ProductionStage): StageLocation {
    return STAGE_FLOW_RULES[stage].location as StageLocation;
  }

  /**
   * 检查是否可以跳过某个阶段
   */
  static canSkipStage(stage: ProductionStage): boolean {
    return STAGE_FLOW_RULES[stage].canSkip;
  }

  /**
   * 获取下一个可能的阶段
   */
  static getNextStages(currentStage: ProductionStage): ProductionStage[] {
    return STAGE_FLOW_RULES[currentStage].nextStages as ProductionStage[];
  }
}
