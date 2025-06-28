/**
 * 双地点运营管理系统
 * 广州设计中心 & 广西生产基地协作管理
 * 聆花掐丝珐琅馆ERP系统
 */

import { ProductionStage } from './state-machine';

export type Location = '广州设计中心' | '广西生产基地' | '物流运输中' | '广州包装中心';

export interface LocationConfig {
  name: Location;
  code: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
    workdays: number[]; // 0=Sunday, 1=Monday, etc.
  };
  capabilities: ProductionStage[];
  contactInfo: {
    manager: string;
    phone: string;
    email: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface CrossLocationWorkflow {
  fromLocation: Location;
  toLocation: Location;
  stage: ProductionStage;
  requiredDocuments: string[];
  estimatedTransitTime: number; // hours
  shippingMethod: string;
  trackingRequired: boolean;
}

export interface LocationPermission {
  userId: number;
  location: Location;
  stages: ProductionStage[];
  permissions: ('read' | 'write' | 'approve' | 'manage')[];
  restrictions?: string[];
}

// 地点配置
export const LOCATION_CONFIGS: Record<Location, LocationConfig> = {
  '广州设计中心': {
    name: '广州设计中心',
    code: 'GZ_DESIGN',
    timezone: 'Asia/Shanghai',
    workingHours: {
      start: '09:00',
      end: '18:00',
      workdays: [1, 2, 3, 4, 5], // Monday to Friday
    },
    capabilities: ['DESIGN', 'MATERIAL_PROCUREMENT', 'PACKAGING'],
    contactInfo: {
      manager: '张设计师',
      phone: '020-12345678',
      email: 'design@linghua.com',
    },
    coordinates: {
      latitude: 23.1291,
      longitude: 113.2644,
    },
  },
  '广西生产基地': {
    name: '广西生产基地',
    code: 'GX_PROD',
    timezone: 'Asia/Shanghai',
    workingHours: {
      start: '08:00',
      end: '17:30',
      workdays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    },
    capabilities: ['IN_PRODUCTION', 'QUALITY_CHECK'],
    contactInfo: {
      manager: '李师傅',
      phone: '0771-12345678',
      email: 'production@linghua.com',
    },
    coordinates: {
      latitude: 22.8170,
      longitude: 108.3669,
    },
  },
  '物流运输中': {
    name: '物流运输中',
    code: 'LOGISTICS',
    timezone: 'Asia/Shanghai',
    workingHours: {
      start: '00:00',
      end: '23:59',
      workdays: [0, 1, 2, 3, 4, 5, 6], // 7 days a week
    },
    capabilities: ['SHIPPING_TO_PRODUCTION', 'SHIPPING_BACK'],
    contactInfo: {
      manager: '物流调度中心',
      phone: '400-12345678',
      email: 'logistics@linghua.com',
    },
    coordinates: {
      latitude: 23.0,
      longitude: 110.0,
    },
  },
  '广州包装中心': {
    name: '广州包装中心',
    code: 'GZ_PACK',
    timezone: 'Asia/Shanghai',
    workingHours: {
      start: '09:00',
      end: '18:00',
      workdays: [1, 2, 3, 4, 5],
    },
    capabilities: ['PACKAGING', 'SALES_READY'],
    contactInfo: {
      manager: '包装主管',
      phone: '020-87654321',
      email: 'packaging@linghua.com',
    },
    coordinates: {
      latitude: 23.1291,
      longitude: 113.2644,
    },
  },
};

// 跨地点工作流配置
export const CROSS_LOCATION_WORKFLOWS: CrossLocationWorkflow[] = [
  {
    fromLocation: '广州设计中心',
    toLocation: '广西生产基地',
    stage: 'SHIPPING_TO_PRODUCTION',
    requiredDocuments: ['设计图纸', '材料清单', '生产指令', '质量标准'],
    estimatedTransitTime: 24,
    shippingMethod: '专线物流',
    trackingRequired: true,
  },
  {
    fromLocation: '广西生产基地',
    toLocation: '广州包装中心',
    stage: 'SHIPPING_BACK',
    requiredDocuments: ['质检报告', '产品清单', '包装要求'],
    estimatedTransitTime: 24,
    shippingMethod: '专线物流',
    trackingRequired: true,
  },
];

/**
 * 双地点运营管理类
 */
export class LocationManagementSystem {
  /**
   * 获取阶段对应的地点
   */
  static getStageLocation(stage: ProductionStage): Location {
    for (const [location, config] of Object.entries(LOCATION_CONFIGS)) {
      if (config.capabilities.includes(stage)) {
        return location as Location;
      }
    }
    throw new Error(`未找到阶段 ${stage} 对应的地点`);
  }

  /**
   * 检查用户在特定地点的权限
   */
  static checkLocationPermission(
    userId: number,
    location: Location,
    stage: ProductionStage,
    action: 'read' | 'write' | 'approve' | 'manage',
    userPermissions: LocationPermission[]
  ): { allowed: boolean; reason?: string } {
    const permission = userPermissions.find(
      p => p.userId === userId && p.location === location
    );

    if (!permission) {
      return {
        allowed: false,
        reason: `用户在 ${location} 没有任何权限`,
      };
    }

    if (!permission.stages.includes(stage)) {
      return {
        allowed: false,
        reason: `用户在 ${location} 没有 ${stage} 阶段的权限`,
      };
    }

    if (!permission.permissions.includes(action)) {
      return {
        allowed: false,
        reason: `用户在 ${location} 没有 ${action} 操作权限`,
      };
    }

    return { allowed: true };
  }

  /**
   * 计算地点间的运输时间
   */
  static calculateTransitTime(
    fromLocation: Location,
    toLocation: Location,
    shippingMethod: 'standard' | 'express' | 'urgent' = 'standard'
  ): number {
    const workflow = CROSS_LOCATION_WORKFLOWS.find(
      w => w.fromLocation === fromLocation && w.toLocation === toLocation
    );

    if (!workflow) {
      // 如果没有预定义的工作流，使用距离计算
      const distance = this.calculateDistance(fromLocation, toLocation);
      const baseTime = distance / 50; // 假设平均速度50km/h
      
      const multipliers = {
        standard: 1.0,
        express: 0.7,
        urgent: 0.5,
      };

      return Math.ceil(baseTime * multipliers[shippingMethod]);
    }

    const multipliers = {
      standard: 1.0,
      express: 0.8,
      urgent: 0.6,
    };

    return Math.ceil(workflow.estimatedTransitTime * multipliers[shippingMethod]);
  }

  /**
   * 获取跨地点工作流要求
   */
  static getCrossLocationRequirements(
    fromLocation: Location,
    toLocation: Location
  ): CrossLocationWorkflow | null {
    return CROSS_LOCATION_WORKFLOWS.find(
      w => w.fromLocation === fromLocation && w.toLocation === toLocation
    ) || null;
  }

  /**
   * 检查地点工作时间
   */
  static isLocationWorking(location: Location, dateTime: Date = new Date()): boolean {
    const config = LOCATION_CONFIGS[location];
    const day = dateTime.getDay();
    const time = dateTime.toTimeString().slice(0, 5);

    if (!config.workingHours.workdays.includes(day)) {
      return false;
    }

    return time >= config.workingHours.start && time <= config.workingHours.end;
  }

  /**
   * 获取下一个工作时间
   */
  static getNextWorkingTime(location: Location, fromDate: Date = new Date()): Date {
    const config = LOCATION_CONFIGS[location];
    const nextWorkingTime = new Date(fromDate);

    // 如果当前就在工作时间内，返回当前时间
    if (this.isLocationWorking(location, fromDate)) {
      return fromDate;
    }

    // 寻找下一个工作日
    for (let i = 0; i < 14; i++) { // 最多查找2周
      nextWorkingTime.setDate(nextWorkingTime.getDate() + 1);
      nextWorkingTime.setHours(
        parseInt(config.workingHours.start.split(':')[0]),
        parseInt(config.workingHours.start.split(':')[1]),
        0,
        0
      );

      if (this.isLocationWorking(location, nextWorkingTime)) {
        return nextWorkingTime;
      }
    }

    throw new Error(`无法找到 ${location} 的下一个工作时间`);
  }

  /**
   * 生成地点协作报告
   */
  static generateCollaborationReport(
    orders: Array<{
      id: number;
      currentStage: ProductionStage;
      location: Location;
      startDate: Date;
      targetDate: Date;
    }>
  ): {
    locationWorkload: Record<Location, number>;
    crossLocationTransfers: number;
    bottleneckLocations: Location[];
    recommendations: string[];
  } {
    const locationWorkload: Record<Location, number> = {
      '广州设计中心': 0,
      '广西生产基地': 0,
      '物流运输中': 0,
      '广州包装中心': 0,
    };

    let crossLocationTransfers = 0;
    const recommendations: string[] = [];

    // 统计各地点工作负荷
    orders.forEach(order => {
      locationWorkload[order.location]++;
      
      // 检查是否需要跨地点转移
      const nextStage = this.getNextStage(order.currentStage);
      if (nextStage) {
        const nextLocation = this.getStageLocation(nextStage);
        if (nextLocation !== order.location) {
          crossLocationTransfers++;
        }
      }
    });

    // 识别瓶颈地点
    const avgWorkload = Object.values(locationWorkload).reduce((a, b) => a + b, 0) / 4;
    const bottleneckLocations = Object.entries(locationWorkload)
      .filter(([_, workload]) => workload > avgWorkload * 1.5)
      .map(([location, _]) => location as Location);

    // 生成建议
    if (bottleneckLocations.length > 0) {
      recommendations.push(`瓶颈地点: ${bottleneckLocations.join(', ')}，建议增加资源或优化流程`);
    }

    if (crossLocationTransfers > orders.length * 0.3) {
      recommendations.push('跨地点转移较多，建议优化物流安排');
    }

    return {
      locationWorkload,
      crossLocationTransfers,
      bottleneckLocations,
      recommendations,
    };
  }

  /**
   * 计算两地点间距离（简化版）
   */
  private static calculateDistance(from: Location, to: Location): number {
    const fromConfig = LOCATION_CONFIGS[from];
    const toConfig = LOCATION_CONFIGS[to];

    const lat1 = fromConfig.coordinates.latitude;
    const lon1 = fromConfig.coordinates.longitude;
    const lat2 = toConfig.coordinates.latitude;
    const lon2 = toConfig.coordinates.longitude;

    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * 获取下一个阶段（简化版）
   */
  private static getNextStage(currentStage: ProductionStage): ProductionStage | null {
    const stageOrder: ProductionStage[] = [
      'DESIGN',
      'MATERIAL_PROCUREMENT',
      'SHIPPING_TO_PRODUCTION',
      'IN_PRODUCTION',
      'QUALITY_CHECK',
      'SHIPPING_BACK',
      'PACKAGING',
      'SALES_READY',
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
  }
}
