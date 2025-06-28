'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ProductionStateMachine, ProductionStage, ProductionStatus } from '@/lib/production/state-machine';
import { TimeManagementSystem } from '@/lib/production/time-management';
import { LocationManagementSystem } from '@/lib/production/location-management';
import { NotificationSystem } from '@/lib/production/notification-system';

/**
 * 获取所有生产基地
 */
export async function getProductionBases() {
  try {
    const bases = await prisma.productionBase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        productionOrders: {
          select: {
            id: true,
            status: true,
          },
        },
        qualityRecords: {
          select: {
            qualityScore: true,
          },
        },
      },
    });

    // 计算统计数据
    const basesWithStats = bases.map(base => {
      const activeOrders = base.productionOrders.filter(order =>
        ['pending', 'confirmed', 'in_production', 'quality_check'].includes(order.status)
      ).length;

      const completedOrders = base.productionOrders.filter(order =>
        order.status === 'completed'
      ).length;

      const qualityScores = base.qualityRecords
        .map(record => record.qualityScore)
        .filter(score => score !== null) as number[];

      const averageQuality = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : null;

      return {
        ...base,
        activeOrders,
        completedOrders,
        averageQuality,
      };
    });

    return basesWithStats;
  } catch (error) {
    console.error('Error fetching production bases:', error);
    throw new Error('Failed to fetch production bases');
  }
}

/**
 * 创建生产基地
 */
export async function createProductionBase(data: {
  name: string;
  code: string;
  location: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  specialties: string[];
  capacity?: number;
  leadTime?: number;
  qualityRating?: number;
  notes?: string;
}) {
  try {
    const base = await prisma.productionBase.create({
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        address: data.address,
        specialties: data.specialties,
        capacity: data.capacity,
        leadTime: data.leadTime,
        qualityRating: data.qualityRating,
        notes: data.notes,
      },
    });

    revalidatePath('/production');
    return base;
  } catch (error) {
    console.error('Error creating production base:', error);
    throw new Error('Failed to create production base');
  }
}

/**
 * 更新生产基地
 */
export async function updateProductionBase(id: number, data: {
  name?: string;
  code?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  specialties?: string[];
  capacity?: number;
  leadTime?: number;
  qualityRating?: number;
  isActive?: boolean;
  notes?: string;
}) {
  try {
    const base = await prisma.productionBase.update({
      where: { id },
      data,
    });

    revalidatePath('/production');
    return base;
  } catch (error) {
    console.error('Error updating production base:', error);
    throw new Error('Failed to update production base');
  }
}

/**
 * 获取所有生产订单（支持筛选和分页）
 */
export async function getProductionOrders(
  filters?: {
    stage?: string;
    status?: string;
    priority?: string;
    productionBaseId?: number;
    assignedToUserId?: number;
    search?: string;
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    const where: any = {};

    if (filters?.stage) {
      where.currentStage = filters.stage;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.productionBaseId) {
      where.productionBaseId = filters.productionBaseId;
    }
    if (filters?.assignedToUserId) {
      where.assignedToUserId = filters.assignedToUserId;
    }
    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { productionBase: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionBase: {
            select: {
              name: true,
              location: true,
            },
          },
          employee: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          qualityRecords: {
            select: {
              qualityGrade: true,
              qualityScore: true,
              result: true,
              status: true,
            },
          },
          shippingRecords: {
            select: {
              shippingType: true,
              status: true,
              shippedDate: true,
              actualDeliveryDate: true,
            },
          },
          stageHistories: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              stage: true,
              status: true,
              startTime: true,
              endTime: true,
              location: true,
            },
          },
        },
      }),
      prisma.productionOrder.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching production orders:', error);
    throw new Error('Failed to fetch production orders');
  }
}

/**
 * 创建生产订单
 */
export async function createProductionOrder(data: {
  productionBaseId: number;
  employeeId: number;
  sourceOrderId?: number;
  salesOrderId?: number;
  productId: number;
  quantity: number;
  currentStage?: string;
  status?: string;
  priority?: string;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  assignedToUserId?: number;
  location?: string;
  totalAmount: number;
  shippingMethod?: string;
  notes?: string;
  items?: {
    productId: number;
    quantity: number;
    specifications?: string;
  }[];
}) {
  try {
    // 生成订单号
    const orderNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const order = await prisma.productionOrder.create({
      data: {
        orderNumber,
        productionBaseId: data.productionBaseId,
        employeeId: data.employeeId,
        sourceOrderId: data.sourceOrderId,
        salesOrderId: data.salesOrderId,
        productId: data.productId,
        quantity: data.quantity,
        currentStage: data.currentStage as any || 'DESIGN',
        status: data.status as any || 'PENDING',
        priority: data.priority as any || 'NORMAL',
        orderDate: new Date(),
        estimatedStartDate: data.estimatedStartDate,
        estimatedEndDate: data.estimatedEndDate,
        assignedToUserId: data.assignedToUserId,
        location: data.location || '广州设计中心',
        totalAmount: data.totalAmount,
        shippingMethod: data.shippingMethod,
        notes: data.notes,
        items: data.items ? {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            specifications: item.specifications,
          })),
        } : undefined,
        stageHistories: {
          create: {
            stage: data.currentStage as any || 'DESIGN',
            status: 'IN_PROGRESS',
            startTime: new Date(),
            location: data.location || '广州设计中心',
            operatorId: data.employeeId,
            notes: '生产订单已创建，开始设计阶段',
          },
        },
      },
      include: {
        items: true,
        stageHistories: true,
        productionBase: true,
        employee: true,
        product: true,
      },
    });

    revalidatePath('/production');
    return order;
  } catch (error) {
    console.error('Error creating production order:', error);
    throw new Error('Failed to create production order');
  }
}

/**
 * 更新生产订单状态
 */
export async function updateProductionOrderStatus(id: number, status: string, data?: {
  actualStartDate?: Date;
  actualEndDate?: Date;
  notes?: string;
}) {
  try {
    const updateData: any = { status };

    if (data?.actualStartDate) updateData.actualStartDate = data.actualStartDate;
    if (data?.actualEndDate) updateData.actualEndDate = data.actualEndDate;
    if (data?.notes) updateData.notes = data.notes;

    const order = await prisma.productionOrder.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/production');
    return order;
  } catch (error) {
    console.error('Error updating production order status:', error);
    throw new Error('Failed to update production order status');
  }
}

/**
 * 创建质量检验记录
 */
export async function createQualityRecord(data: {
  productionOrderId?: number;
  productionBaseId: number;
  productId: number;
  inspectorId: number;
  inspectionDate: Date;
  qualityGrade: string;
  qualityScore?: number;
  defectDescription?: string;
  actionRequired?: string;
  status: string;
  images?: string[];
  notes?: string;
}) {
  try {
    const record = await prisma.qualityRecord.create({
      data,
    });

    revalidatePath('/production');
    return record;
  } catch (error) {
    console.error('Error creating quality record:', error);
    throw new Error('Failed to create quality record');
  }
}

/**
 * 创建物流记录
 */
export async function createShippingRecord(data: {
  productionOrderId: number;
  shippingType: string;
  shippingDate: Date;
  expectedDate?: Date;
  carrier?: string;
  trackingNumber?: string;
  shippingCost?: number;
  notes?: string;
}) {
  try {
    const record = await prisma.shippingRecord.create({
      data,
    });

    revalidatePath('/production');
    return record;
  } catch (error) {
    console.error('Error creating shipping record:', error);
    throw new Error('Failed to create shipping record');
  }
}

/**
 * 更新物流记录状态
 */
export async function updateShippingRecordStatus(id: number, status: string, actualDate?: Date) {
  try {
    const updateData: any = { status };
    if (actualDate) updateData.actualDeliveryDate = actualDate;

    const record = await prisma.shippingRecord.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/production');
    return record;
  } catch (error) {
    console.error('Error updating shipping record status:', error);
    throw new Error('Failed to update shipping record status');
  }
}

/**
 * 获取单个生产订单详情
 */
export async function getProductionOrderById(id: number) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        productionBase: true,
        employee: true,
        product: true,
        salesOrder: true,
        assignedTo: true,
        items: {
          include: {
            product: true,
          },
        },
        qualityRecords: {
          include: {
            inspector: true,
          },
        },
        shippingRecords: true,
        stageHistories: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: true,
          },
        },
        costRecords: {
          include: {
            recordedByUser: true,
          },
        },
        statusUpdates: {
          orderBy: { timestamp: 'desc' },
          include: {
            updatedByUser: true,
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error('Error fetching production order:', error);
    throw new Error('Failed to fetch production order');
  }
}

/**
 * 更新生产订单
 */
export async function updateProductionOrder(id: number, data: any) {
  try {
    const order = await prisma.productionOrder.update({
      where: { id },
      data,
      include: {
        productionBase: true,
        employee: true,
        product: true,
        assignedTo: true,
      },
    });

    revalidatePath('/production');
    return order;
  } catch (error) {
    console.error('Error updating production order:', error);
    throw new Error('Failed to update production order');
  }
}

/**
 * 删除生产订单
 */
export async function deleteProductionOrder(id: number) {
  try {
    await prisma.productionOrder.delete({
      where: { id },
    });

    revalidatePath('/production');
  } catch (error) {
    console.error('Error deleting production order:', error);
    throw new Error('Failed to delete production order');
  }
}

/**
 * 更新生产订单阶段
 */
export async function updateProductionOrderStage(
  id: number,
  data: {
    stage: string;
    status?: string;
    notes?: string;
    operatorId?: number;
    location?: string;
  }
) {
  try {
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id },
      select: { currentStage: true, status: true },
    });

    if (!currentOrder) {
      throw new Error('Production order not found');
    }

    // 计算进度百分比
    const stageProgress = {
      DESIGN: 12.5,
      MATERIAL_PROCUREMENT: 25,
      SHIPPING_TO_PRODUCTION: 37.5,
      IN_PRODUCTION: 50,
      QUALITY_CHECK: 62.5,
      SHIPPING_BACK: 75,
      PACKAGING: 87.5,
      SALES_READY: 100,
    };

    const progressPercentage = stageProgress[data.stage as keyof typeof stageProgress] || 0;

    // 更新订单
    const order = await prisma.productionOrder.update({
      where: { id },
      data: {
        currentStage: data.stage as any,
        status: data.status as any || 'IN_PROGRESS',
        location: data.location,
        progressPercentage,
        updatedAt: new Date(),
      },
    });

    // 创建阶段历史记录
    await prisma.productionStageHistory.create({
      data: {
        productionOrderId: id,
        stage: data.stage as any,
        status: 'IN_PROGRESS',
        startTime: new Date(),
        location: data.location || '',
        operatorId: data.operatorId,
        notes: data.notes,
      },
    });

    // 创建状态更新记录
    await prisma.productionStatusUpdate.create({
      data: {
        productionOrderId: id,
        fromStage: currentOrder.currentStage,
        toStage: data.stage as any,
        fromStatus: currentOrder.status,
        toStatus: data.status as any || 'IN_PROGRESS',
        updatedBy: data.operatorId || 1,
        updateReason: '阶段更新',
        notes: data.notes,
      },
    });

    revalidatePath('/production');
    return order;
  } catch (error) {
    console.error('Error updating production order stage:', error);
    throw new Error('Failed to update production order stage');
  }
}

/**
 * 批量创建生产订单
 */
export async function batchCreateProductionOrders(orders: any[]) {
  try {
    const results = await Promise.all(
      orders.map(order => createProductionOrder(order))
    );

    revalidatePath('/production');
    return results;
  } catch (error) {
    console.error('Error batch creating production orders:', error);
    throw new Error('Failed to batch create production orders');
  }
}

/**
 * 批量更新生产订单
 */
export async function batchUpdateProductionOrders(updates: { id: number; data: any }[]) {
  try {
    const results = await Promise.all(
      updates.map(update => updateProductionOrder(update.id, update.data))
    );

    revalidatePath('/production');
    return results;
  } catch (error) {
    console.error('Error batch updating production orders:', error);
    throw new Error('Failed to batch update production orders');
  }
}

/**
 * 批量删除生产订单
 */
export async function batchDeleteProductionOrders(ids: number[]) {
  try {
    await prisma.productionOrder.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    revalidatePath('/production');
    return { deleted: ids.length };
  } catch (error) {
    console.error('Error batch deleting production orders:', error);
    throw new Error('Failed to batch delete production orders');
  }
}

/**
 * 获取生产阶段历史记录
 */
export async function getProductionStageHistory(
  filters?: {
    productionOrderId?: number;
    stage?: string;
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    const where: any = {};

    if (filters?.productionOrderId) {
      where.productionOrderId = filters.productionOrderId;
    }
    if (filters?.stage) {
      where.stage = filters.stage;
    }

    const [history, total] = await Promise.all([
      prisma.productionStageHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionOrder: {
            select: {
              orderNumber: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          operator: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.productionStageHistory.count({ where }),
    ]);

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching stage history:', error);
    throw new Error('Failed to fetch stage history');
  }
}

/**
 * 创建生产阶段历史记录
 */
export async function createProductionStageHistory(data: {
  productionOrderId: number;
  stage: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  location: string;
  operatorId?: number;
  duration?: number;
  notes?: string;
  attachments?: any;
}) {
  try {
    const history = await prisma.productionStageHistory.create({
      data: {
        ...data,
        stage: data.stage as any,
        status: data.status as any,
      },
    });

    revalidatePath('/production');
    return history;
  } catch (error) {
    console.error('Error creating stage history:', error);
    throw new Error('Failed to create stage history');
  }
}

/**
 * 获取质量记录
 */
export async function getQualityRecords(
  filters?: {
    productionOrderId?: number;
    productionBaseId?: number;
    result?: string;
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    const where: any = {};

    if (filters?.productionOrderId) {
      where.productionOrderId = filters.productionOrderId;
    }
    if (filters?.productionBaseId) {
      where.productionBaseId = filters.productionBaseId;
    }
    if (filters?.result) {
      where.result = filters.result;
    }

    const [records, total] = await Promise.all([
      prisma.qualityRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionOrder: {
            select: {
              orderNumber: true,
            },
          },
          productionBase: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
          inspector: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.qualityRecord.count({ where }),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching quality records:', error);
    throw new Error('Failed to fetch quality records');
  }
}

/**
 * 获取物流记录
 */
export async function getShippingRecords(
  filters?: {
    productionOrderId?: number;
    shippingType?: string;
    status?: string;
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    const where: any = {};

    if (filters?.productionOrderId) {
      where.productionOrderId = filters.productionOrderId;
    }
    if (filters?.shippingType) {
      where.shippingType = filters.shippingType;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [records, total] = await Promise.all([
      prisma.shippingRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionOrder: {
            select: {
              orderNumber: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.shippingRecord.count({ where }),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching shipping records:', error);
    throw new Error('Failed to fetch shipping records');
  }
}

/**
 * 获取生产成本记录
 */
export async function getProductionCosts(
  filters?: {
    productionOrderId?: number;
    stage?: string;
    costType?: string;
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    const where: any = {};

    if (filters?.productionOrderId) {
      where.productionOrderId = filters.productionOrderId;
    }
    if (filters?.stage) {
      where.stage = filters.stage;
    }
    if (filters?.costType) {
      where.costType = filters.costType;
    }

    const [costs, total] = await Promise.all([
      prisma.productionCost.findMany({
        where,
        orderBy: { recordedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productionOrder: {
            select: {
              orderNumber: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          recordedByUser: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.productionCost.count({ where }),
    ]);

    return {
      data: costs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching production costs:', error);
    throw new Error('Failed to fetch production costs');
  }
}

/**
 * 创建生产成本记录
 */
export async function createProductionCost(data: {
  productionOrderId: number;
  stage: string;
  costType: string;
  amount: number;
  description?: string;
  recordedBy?: number;
}) {
  try {
    const cost = await prisma.productionCost.create({
      data: {
        ...data,
        stage: data.stage as any,
        costType: data.costType as any,
      },
    });

    revalidatePath('/production');
    return cost;
  } catch (error) {
    console.error('Error creating production cost:', error);
    throw new Error('Failed to create production cost');
  }
}

/**
 * 智能状态转换 - 集成状态机逻辑
 */
export async function smartStageTransition(
  orderId: number,
  targetStage: ProductionStage,
  operatorId: number,
  userRole: string,
  conditions: Record<string, boolean> = {},
  notes?: string
) {
  try {
    // 获取当前订单信息
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        employee: true,
      },
    });

    if (!currentOrder) {
      throw new Error('生产订单不存在');
    }

    // 验证状态转换
    const validation = ProductionStateMachine.validateTransition(
      currentOrder.currentStage as ProductionStage,
      targetStage,
      userRole,
      conditions
    );

    if (!validation.valid) {
      throw new Error(validation.reason || '状态转换验证失败');
    }

    // 获取目标阶段的地点
    const targetLocation = LocationManagementSystem.getStageLocation(targetStage);

    // 检查地点权限
    const locationPermission = LocationManagementSystem.checkLocationPermission(
      operatorId,
      targetLocation,
      targetStage,
      'write',
      [] // 这里应该传入实际的用户权限数据
    );

    if (!locationPermission.allowed) {
      throw new Error(locationPermission.reason || '地点权限验证失败');
    }

    // 计算进度百分比
    const progressPercentage = ProductionStateMachine.calculateProgress(targetStage);

    // 更新订单状态
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        currentStage: targetStage,
        status: 'IN_PROGRESS',
        location: targetLocation,
        progressPercentage,
        assignedToUserId: operatorId,
        updatedAt: new Date(),
      },
    });

    // 创建阶段历史记录
    await prisma.productionStageHistory.create({
      data: {
        productionOrderId: orderId,
        stage: targetStage,
        status: 'IN_PROGRESS',
        startTime: new Date(),
        location: targetLocation,
        operatorId,
        notes: notes || `阶段转换: ${currentOrder.currentStage} → ${targetStage}`,
      },
    });

    // 创建状态更新记录
    await prisma.productionStatusUpdate.create({
      data: {
        productionOrderId: orderId,
        fromStage: currentOrder.currentStage,
        toStage: targetStage,
        fromStatus: currentOrder.status,
        toStatus: 'IN_PROGRESS',
        updatedBy: operatorId,
        updateReason: '智能状态转换',
        notes,
      },
    });

    // 发送通知
    await NotificationSystem.sendStageChangeNotification(
      orderId,
      currentOrder.orderNumber,
      currentOrder.currentStage as ProductionStage,
      targetStage,
      operatorId
    );

    // 检查是否需要预警
    if (currentOrder.estimatedEndDate) {
      const alerts = TimeManagementSystem.generateDeliveryAlerts(
        targetStage,
        currentOrder.orderDate,
        currentOrder.estimatedEndDate
      );

      for (const alert of alerts) {
        await NotificationSystem.sendDeliveryWarning(
          orderId,
          currentOrder.orderNumber,
          alert
        );
      }
    }

    revalidatePath('/production');
    return {
      success: true,
      order: updatedOrder,
      warnings: validation.warnings,
    };
  } catch (error) {
    console.error('Error in smart stage transition:', error);
    throw new Error(`智能状态转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 智能时间预估和调度
 */
export async function generateSmartSchedule(
  orderId: number,
  productComplexity: number = 1,
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        stageHistories: true,
      },
    });

    if (!order) {
      throw new Error('生产订单不存在');
    }

    // 获取历史数据进行时间预估
    const historicalData = await prisma.productionStageHistory.groupBy({
      by: ['stage'],
      where: {
        productionOrder: {
          productId: order.productId,
        },
        endTime: {
          not: null,
        },
      },
      _avg: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    const schedule: Array<{
      stage: ProductionStage;
      estimate: any;
      startDate: Date;
      endDate: Date;
      location: string;
    }> = [];

    let currentDate = new Date();
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

    // 从当前阶段开始计算
    const currentStageIndex = allStages.indexOf(order.currentStage as ProductionStage);
    const remainingStages = allStages.slice(currentStageIndex);

    for (const stage of remainingStages) {
      // 获取历史数据
      const stageHistory = historicalData.find(h => h.stage === stage);
      const historicalAverage = stageHistory?._avg.duration || undefined;

      // 计算动态时间预估
      const estimate = TimeManagementSystem.calculateDynamicEstimate(
        stage,
        productComplexity,
        1, // 季节性因子
        1, // 工作负荷因子
        historicalAverage ? {
          averageDuration: historicalAverage / (24 * 60), // 转换为天
          standardDeviation: 0.2,
          completionRate: 0.9,
        } : undefined
      );

      // 获取地点信息
      const location = LocationManagementSystem.getStageLocation(stage);

      // 计算工作日
      const workingStartDate = LocationManagementSystem.getNextWorkingTime(location, currentDate);
      const estimatedDays = estimate.realistic;
      const endDate = new Date(workingStartDate);
      endDate.setDate(endDate.getDate() + Math.ceil(estimatedDays));

      schedule.push({
        stage,
        estimate,
        startDate: workingStartDate,
        endDate,
        location,
      });

      currentDate = endDate;
    }

    // 更新订单的预估完成时间
    const finalEndDate = schedule[schedule.length - 1]?.endDate;
    if (finalEndDate) {
      await prisma.productionOrder.update({
        where: { id: orderId },
        data: {
          estimatedEndDate: finalEndDate,
        },
      });
    }

    revalidatePath('/production');
    return {
      orderId,
      schedule,
      totalDuration: schedule.reduce((total, item) => total + item.estimate.realistic, 0),
      estimatedCompletion: finalEndDate,
    };
  } catch (error) {
    console.error('Error generating smart schedule:', error);
    throw new Error('智能调度生成失败');
  }
}

/**
 * 批量预警检查和通知
 */
export async function runProductionAlerts() {
  try {
    // 获取所有进行中的订单
    const activeOrders = await prisma.productionOrder.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'DELAYED'],
        },
      },
      include: {
        product: true,
        qualityRecords: true,
        stageHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    const alerts: Array<{
      orderId: number;
      type: string;
      severity: string;
      message: string;
    }> = [];

    for (const order of activeOrders) {
      // 交期预警检查
      if (order.estimatedEndDate) {
        const deliveryAlerts = TimeManagementSystem.generateDeliveryAlerts(
          order.currentStage as ProductionStage,
          order.orderDate,
          order.estimatedEndDate
        );

        for (const alert of deliveryAlerts) {
          alerts.push({
            orderId: order.id,
            type: 'delivery_warning',
            severity: alert.type,
            message: alert.message,
          });

          // 发送通知
          await NotificationSystem.sendDeliveryWarning(
            order.id,
            order.orderNumber,
            alert
          );
        }
      }

      // 质量趋势预警
      const recentQualityRecords = order.qualityRecords.slice(-5);
      const failureRate = recentQualityRecords.length > 0
        ? recentQualityRecords.filter(r => r.result === 'FAILED').length / recentQualityRecords.length
        : 0;

      if (failureRate > 0.3) { // 30%失败率
        alerts.push({
          orderId: order.id,
          type: 'quality_trend',
          severity: 'high',
          message: `质量趋势预警：近期失败率 ${Math.round(failureRate * 100)}%`,
        });

        await NotificationSystem.sendQualityAlert(
          order.id,
          order.orderNumber,
          'TREND_WARNING',
          [`失败率过高: ${Math.round(failureRate * 100)}%`],
          1 // 系统自动检查
        );
      }

      // 阶段停滞预警
      const lastStageHistory = order.stageHistories[0];
      if (lastStageHistory && !lastStageHistory.endTime) {
        const stageStartTime = new Date(lastStageHistory.startTime);
        const hoursInStage = (Date.now() - stageStartTime.getTime()) / (1000 * 60 * 60);
        const expectedDuration = ProductionStateMachine.getEstimatedDuration(
          order.currentStage as ProductionStage
        ) * 24; // 转换为小时

        if (hoursInStage > expectedDuration * 1.5) { // 超过预期时间50%
          alerts.push({
            orderId: order.id,
            type: 'stage_stagnation',
            severity: 'warning',
            message: `阶段停滞：${order.currentStage} 已超时 ${Math.round(hoursInStage - expectedDuration)} 小时`,
          });

          await NotificationSystem.sendExceptionAlert(
            order.id,
            order.orderNumber,
            'STAGE_STAGNATION',
            `阶段 ${order.currentStage} 停滞时间过长`,
            'medium'
          );
        }
      }
    }

    // 运行系统预警规则
    await NotificationSystem.checkAlertRules(
      activeOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        currentStage: order.currentStage as ProductionStage,
        status: order.status,
        estimatedEndDate: order.estimatedEndDate || new Date(),
        qualityRecords: order.qualityRecords,
      }))
    );

    return {
      totalOrders: activeOrders.length,
      alertsGenerated: alerts.length,
      alerts,
    };
  } catch (error) {
    console.error('Error running production alerts:', error);
    throw new Error('生产预警检查失败');
  }
}

/**
 * 生成地点协作报告
 */
export async function generateLocationCollaborationReport() {
  try {
    // 获取所有活跃订单
    const activeOrders = await prisma.productionOrder.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      include: {
        productionBase: true,
      },
    });

    // 转换为地点协作系统需要的格式
    const ordersForAnalysis = activeOrders.map(order => ({
      id: order.id,
      currentStage: order.currentStage as ProductionStage,
      location: (order.location || LocationManagementSystem.getStageLocation(order.currentStage as ProductionStage)) as any,
      startDate: order.orderDate,
      targetDate: order.estimatedEndDate || new Date(),
    }));

    const report = LocationManagementSystem.generateCollaborationReport(ordersForAnalysis);

    // 保存报告到数据库（可选）
    // 这里可以创建一个报告表来存储历史报告

    return {
      generatedAt: new Date(),
      totalOrders: activeOrders.length,
      ...report,
    };
  } catch (error) {
    console.error('Error generating collaboration report:', error);
    throw new Error('地点协作报告生成失败');
  }
}

/**
 * 智能批量调度优化
 */
export async function optimizeBatchScheduling(
  orderIds: number[],
  optimizationGoal: 'minimize_time' | 'balance_workload' | 'minimize_cost' = 'minimize_time'
) {
  try {
    // 获取订单信息
    const orders = await prisma.productionOrder.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      include: {
        product: true,
        stageHistories: true,
      },
    });

    // 转换为调度系统需要的格式
    const ordersForScheduling = orders.map(order => ({
      id: order.id,
      priority: order.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      currentStage: order.currentStage as ProductionStage,
      targetDate: order.estimatedEndDate || new Date(),
      complexity: 1, // 可以根据产品特性计算复杂度
    }));

    // 生成调度建议
    const recommendations = TimeManagementSystem.generateSchedulingRecommendations(ordersForScheduling);

    // 应用调度建议（可选）
    const updates: Array<{
      orderId: number;
      newPriority: number;
      newStartDate: Date;
      reasoning: string[];
    }> = [];

    for (const rec of recommendations) {
      updates.push({
        orderId: rec.orderId,
        newPriority: rec.recommendedPriority,
        newStartDate: rec.recommendedStartDate,
        reasoning: rec.reasoning,
      });

      // 可以选择自动应用调度建议
      // await prisma.productionOrder.update({
      //   where: { id: rec.orderId },
      //   data: {
      //     estimatedStartDate: rec.recommendedStartDate,
      //     // 其他更新字段
      //   },
      // });
    }

    return {
      optimizationGoal,
      totalOrders: orders.length,
      recommendations: updates,
      estimatedImprovement: calculateSchedulingImprovement(orders, recommendations),
    };
  } catch (error) {
    console.error('Error optimizing batch scheduling:', error);
    throw new Error('批量调度优化失败');
  }
}

/**
 * 计算调度改进效果
 */
function calculateSchedulingImprovement(orders: any[], recommendations: any[]): {
  timeReduction: number;
  workloadBalance: number;
  riskReduction: number;
} {
  // 简化的改进计算逻辑
  const highPriorityCount = recommendations.filter(r => r.recommendedPriority > 80).length;
  const totalOrders = orders.length;

  return {
    timeReduction: Math.min(20, highPriorityCount * 2), // 最多20%时间减少
    workloadBalance: Math.min(30, (totalOrders - highPriorityCount) * 3), // 工作负荷平衡改进
    riskReduction: Math.min(25, highPriorityCount * 2.5), // 风险降低
  };
}
