/**
 * 实时通知和预警系统
 * 聆花掐丝珐琅馆ERP系统
 */

import { ProductionStage } from './state-machine';
import { DeliveryAlert } from './time-management';

export type NotificationType = 
  | 'stage_change'
  | 'quality_alert'
  | 'delivery_warning'
  | 'exception'
  | 'approval_required'
  | 'resource_shortage'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'system' | 'email' | 'sms' | 'websocket';

export interface NotificationRule {
  id: string;
  type: NotificationType;
  conditions: Record<string, any>;
  recipients: {
    roles: string[];
    users: number[];
    locations?: string[];
  };
  channels: NotificationChannel[];
  priority: NotificationPriority;
  template: string;
  throttle?: {
    maxPerHour: number;
    maxPerDay: number;
  };
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  recipients: number[];
  channels: NotificationChannel[];
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: any;
  }[];
  actions: {
    type: 'notify' | 'escalate' | 'auto_action';
    config: Record<string, any>;
  }[];
  cooldown: number; // minutes
  isActive: boolean;
}

// 预定义通知规则
export const DEFAULT_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'stage_change_notification',
    type: 'stage_change',
    conditions: {},
    recipients: {
      roles: ['production_manager', 'quality_inspector'],
      users: [],
    },
    channels: ['system', 'websocket'],
    priority: 'normal',
    template: '生产订单 {{orderNumber}} 已进入 {{newStage}} 阶段',
    isActive: true,
  },
  {
    id: 'quality_failure_alert',
    type: 'quality_alert',
    conditions: { result: 'FAILED' },
    recipients: {
      roles: ['production_manager', 'quality_manager'],
      users: [],
    },
    channels: ['system', 'websocket', 'email'],
    priority: 'high',
    template: '质检不合格：订单 {{orderNumber}} 需要返工处理',
    throttle: {
      maxPerHour: 5,
      maxPerDay: 20,
    },
    isActive: true,
  },
  {
    id: 'delivery_warning',
    type: 'delivery_warning',
    conditions: { daysUntilDeadline: { lte: 3 } },
    recipients: {
      roles: ['sales_manager', 'production_manager'],
      users: [],
    },
    channels: ['system', 'websocket', 'email'],
    priority: 'high',
    template: '交期预警：订单 {{orderNumber}} 还有 {{daysUntilDeadline}} 天到期',
    isActive: true,
  },
  {
    id: 'exception_alert',
    type: 'exception',
    conditions: {},
    recipients: {
      roles: ['production_manager', 'general_manager'],
      users: [],
    },
    channels: ['system', 'websocket', 'email', 'sms'],
    priority: 'urgent',
    template: '生产异常：订单 {{orderNumber}} 发生 {{exceptionType}} 异常',
    isActive: true,
  },
];

// 预定义预警规则
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'overdue_order_alert',
    name: '逾期订单预警',
    description: '检测逾期的生产订单',
    conditions: [
      {
        field: 'estimatedEndDate',
        operator: 'lt',
        value: 'NOW()',
      },
      {
        field: 'status',
        operator: 'ne',
        value: 'COMPLETED',
      },
    ],
    actions: [
      {
        type: 'notify',
        config: {
          type: 'delivery_warning',
          priority: 'urgent',
        },
      },
      {
        type: 'escalate',
        config: {
          to: 'general_manager',
          after: 24, // hours
        },
      },
    ],
    cooldown: 60, // 1 hour
    isActive: true,
  },
  {
    id: 'quality_trend_alert',
    name: '质量趋势预警',
    description: '检测质量问题趋势',
    conditions: [
      {
        field: 'qualityFailureRate',
        operator: 'gt',
        value: 0.15, // 15%
      },
    ],
    actions: [
      {
        type: 'notify',
        config: {
          type: 'quality_alert',
          priority: 'high',
        },
      },
    ],
    cooldown: 240, // 4 hours
    isActive: true,
  },
  {
    id: 'resource_shortage_alert',
    name: '资源短缺预警',
    description: '检测生产资源短缺',
    conditions: [
      {
        field: 'availableCapacity',
        operator: 'lt',
        value: 0.2, // 20%
      },
    ],
    actions: [
      {
        type: 'notify',
        config: {
          type: 'resource_shortage',
          priority: 'high',
        },
      },
    ],
    cooldown: 120, // 2 hours
    isActive: true,
  },
];

/**
 * 通知系统类
 */
export class NotificationSystem {
  private static notifications: Notification[] = [];
  private static rules: NotificationRule[] = DEFAULT_NOTIFICATION_RULES;
  private static alertRules: AlertRule[] = DEFAULT_ALERT_RULES;

  /**
   * 发送生产阶段变更通知
   */
  static async sendStageChangeNotification(
    orderId: number,
    orderNumber: string,
    fromStage: ProductionStage,
    toStage: ProductionStage,
    operatorId: number
  ): Promise<void> {
    const notification: Notification = {
      id: `stage_change_${orderId}_${Date.now()}`,
      type: 'stage_change',
      priority: 'normal',
      title: '生产阶段变更',
      message: `生产订单 ${orderNumber} 已从 ${fromStage} 进入 ${toStage} 阶段`,
      data: {
        orderId,
        orderNumber,
        fromStage,
        toStage,
        operatorId,
        timestamp: new Date(),
      },
      recipients: await this.getRecipients('stage_change'),
      channels: ['system', 'websocket'],
      createdAt: new Date(),
      status: 'pending',
    };

    await this.sendNotification(notification);
  }

  /**
   * 发送质量预警通知
   */
  static async sendQualityAlert(
    orderId: number,
    orderNumber: string,
    qualityResult: string,
    defects: string[],
    inspectorId: number
  ): Promise<void> {
    const priority: NotificationPriority = qualityResult === 'FAILED' ? 'high' : 'normal';
    
    const notification: Notification = {
      id: `quality_alert_${orderId}_${Date.now()}`,
      type: 'quality_alert',
      priority,
      title: '质量检验结果',
      message: `订单 ${orderNumber} 质检结果: ${qualityResult}${defects.length > 0 ? `，发现问题: ${defects.join(', ')}` : ''}`,
      data: {
        orderId,
        orderNumber,
        qualityResult,
        defects,
        inspectorId,
        timestamp: new Date(),
      },
      recipients: await this.getRecipients('quality_alert'),
      channels: qualityResult === 'FAILED' ? ['system', 'websocket', 'email'] : ['system', 'websocket'],
      createdAt: new Date(),
      status: 'pending',
    };

    await this.sendNotification(notification);
  }

  /**
   * 发送交期预警通知
   */
  static async sendDeliveryWarning(
    orderId: number,
    orderNumber: string,
    alert: DeliveryAlert
  ): Promise<void> {
    const notification: Notification = {
      id: `delivery_warning_${orderId}_${Date.now()}`,
      type: 'delivery_warning',
      priority: alert.type === 'critical' ? 'urgent' : 'high',
      title: '交期预警',
      message: alert.message,
      data: {
        orderId,
        orderNumber,
        alert,
        timestamp: new Date(),
      },
      recipients: await this.getRecipients('delivery_warning'),
      channels: alert.type === 'critical' ? ['system', 'websocket', 'email', 'sms'] : ['system', 'websocket', 'email'],
      createdAt: new Date(),
      status: 'pending',
    };

    await this.sendNotification(notification);
  }

  /**
   * 发送异常通知
   */
  static async sendExceptionAlert(
    orderId: number,
    orderNumber: string,
    exceptionType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    const priorityMap = {
      low: 'normal' as NotificationPriority,
      medium: 'normal' as NotificationPriority,
      high: 'high' as NotificationPriority,
      critical: 'urgent' as NotificationPriority,
    };

    const notification: Notification = {
      id: `exception_${orderId}_${Date.now()}`,
      type: 'exception',
      priority: priorityMap[severity],
      title: '生产异常',
      message: `订单 ${orderNumber} 发生 ${exceptionType} 异常: ${description}`,
      data: {
        orderId,
        orderNumber,
        exceptionType,
        description,
        severity,
        timestamp: new Date(),
      },
      recipients: await this.getRecipients('exception'),
      channels: severity === 'critical' ? ['system', 'websocket', 'email', 'sms'] : ['system', 'websocket', 'email'],
      createdAt: new Date(),
      status: 'pending',
    };

    await this.sendNotification(notification);
  }

  /**
   * 批量检查预警规则
   */
  static async checkAlertRules(
    orders: Array<{
      id: number;
      orderNumber: string;
      currentStage: ProductionStage;
      status: string;
      estimatedEndDate: Date;
      qualityRecords: Array<{ result: string }>;
    }>
  ): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.isActive) continue;

      for (const order of orders) {
        if (this.evaluateConditions(rule.conditions, order)) {
          await this.executeAlertActions(rule, order);
        }
      }
    }
  }

  /**
   * 获取用户未读通知
   */
  static getUnreadNotifications(userId: number): Notification[] {
    return this.notifications.filter(
      n => n.recipients.includes(userId) && n.status !== 'read'
    );
  }

  /**
   * 标记通知为已读
   */
  static markAsRead(notificationId: string, userId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.recipients.includes(userId)) {
      notification.status = 'read';
      notification.readAt = new Date();
    }
  }

  /**
   * 发送通知（内部方法）
   */
  private static async sendNotification(notification: Notification): Promise<void> {
    // 检查节流限制
    if (await this.isThrottled(notification)) {
      return;
    }

    this.notifications.push(notification);

    // 这里应该集成实际的通知发送逻辑
    // 例如：WebSocket推送、邮件发送、短信发送等
    console.log(`发送通知: ${notification.title} - ${notification.message}`);

    notification.status = 'sent';
    notification.sentAt = new Date();
  }

  /**
   * 获取通知接收者
   */
  private static async getRecipients(notificationType: NotificationType): Promise<number[]> {
    const rule = this.rules.find(r => r.type === notificationType && r.isActive);
    if (!rule) return [];

    // 这里应该根据角色和用户配置获取实际的用户ID列表
    // 简化实现，返回示例用户ID
    return [1, 2, 3]; // 示例用户ID
  }

  /**
   * 检查是否被节流限制
   */
  private static async isThrottled(notification: Notification): Promise<boolean> {
    const rule = this.rules.find(r => r.type === notification.type);
    if (!rule?.throttle) return false;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentNotifications = this.notifications.filter(
      n => n.type === notification.type && n.createdAt > oneHourAgo
    );

    const dailyNotifications = this.notifications.filter(
      n => n.type === notification.type && n.createdAt > oneDayAgo
    );

    return (
      recentNotifications.length >= rule.throttle.maxPerHour ||
      dailyNotifications.length >= rule.throttle.maxPerDay
    );
  }

  /**
   * 评估预警条件
   */
  private static evaluateConditions(conditions: any[], data: any): boolean {
    return conditions.every(condition => {
      const fieldValue = data[condition.field];
      const targetValue = condition.value === 'NOW()' ? new Date() : condition.value;

      switch (condition.operator) {
        case 'eq': return fieldValue === targetValue;
        case 'ne': return fieldValue !== targetValue;
        case 'gt': return fieldValue > targetValue;
        case 'lt': return fieldValue < targetValue;
        case 'gte': return fieldValue >= targetValue;
        case 'lte': return fieldValue <= targetValue;
        case 'in': return Array.isArray(targetValue) && targetValue.includes(fieldValue);
        case 'contains': return String(fieldValue).includes(String(targetValue));
        default: return false;
      }
    });
  }

  /**
   * 执行预警动作
   */
  private static async executeAlertActions(rule: AlertRule, data: any): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'notify':
          // 发送通知
          break;
        case 'escalate':
          // 升级处理
          break;
        case 'auto_action':
          // 自动操作
          break;
      }
    }
  }
}
