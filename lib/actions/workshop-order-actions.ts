/**
 * 团建订单管理模块
 *
 * 本模块提供团建订单管理相关的功能，包括团建订单的增删改查等。
 *
 * @module 团建订单管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * 获取所有团建订单
 *
 * 获取所有团建订单，可以根据状态和日期范围筛选。
 *
 * @param status - 订单状态
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 团建订单列表，包含客户、讲师、助理和服务项目信息
 *
 * @example
 * ```typescript
 * // 获取所有团建订单
 * const orders = await getWorkshops();
 *
 * // 获取待确认的团建订单
 * const pendingOrders = await getWorkshops('pending');
 *
 * // 获取指定日期范围的团建订单
 * const rangeOrders = await getWorkshops(undefined, '2023-01-01', '2023-12-31');
 * ```
 *
 * @throws 如果获取团建订单失败，会抛出错误
 *
 * @category 查询
 */
export async function getWorkshops(status?: string, startDate?: string, endDate?: string) {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.date = {
        lte: new Date(endDate),
      };
    }

    // 查询团建订单
    const workshops = await prisma.workshop.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            type: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        assistant: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        serviceItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return workshops;
  } catch (error) {
    console.error("Error fetching workshops:", error);
    throw new Error("获取团建订单失败");
  }
}

/**
 * 获取单个团建订单
 *
 * 根据ID获取单个团建订单的详细信息。
 *
 * @param id - 团建订单ID
 * @returns 团建订单详细信息，包含客户、讲师、助理和服务项目信息
 *
 * @example
 * ```typescript
 * // 获取ID为1的团建订单
 * const order = await getWorkshop(1);
 * console.log(order.customer.name); // 输出客户名称
 * ```
 *
 * @throws 如果团建订单不存在或获取失败，会抛出错误
 *
 * @category 查询
 */
export async function getWorkshop(id: number) {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            type: true,
            address: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            email: true,
          },
        },
        assistant: {
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            email: true,
          },
        },
        serviceItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!workshop) {
      throw new Error("团建订单不存在");
    }

    return workshop;
  } catch (error) {
    console.error("Error fetching workshop:", error);
    throw new Error("获取团建订单失败");
  }
}

/**
 * 创建团建订单
 *
 * 创建新的团建订单，包括服务项目。
 *
 * @param data - 团建订单创建数据
 * @returns 创建的团建订单
 *
 * @example
 * ```typescript
 * // 创建新的团建订单
 * const order = await createWorkshop({
 *   customerId: 1,
 *   activityDate: new Date(),
 *   activityTime: "14:00",
 *   activityType: "jewelry_enameling",
 *   locationType: "in_gallery",
 *   baseType: "jewelry",
 *   location: "聆花珐琅馆",
 *   participants: 10,
 *   duration: 2,
 *   teacherId: 1,
 *   assistantId: 2,
 *   managerId: 3,
 *   totalAmount: 2000,
 *   depositAmount: 500,
 *   paymentStatus: "deposit_paid",
 *   paymentMethod: "微信支付",
 *   status: "confirmed",
 *   notes: "客户要求准备10套工具",
 *   serviceItems: [
 *     { productId: 1, quantity: 10, price: 200, notes: "饰品点蓝体验" }
 *   ]
 * });
 * ```
 *
 * @throws 如果创建团建订单失败，会抛出错误
 *
 * @category 创建
 */
export async function createWorkshop(data: any) {
  try {
    // 验证必填字段
    if (!data.customerId) throw new Error("客户ID为必填项");
    if (!data.date) throw new Error("活动日期为必填项");
    if (!data.teacherId) throw new Error("讲师ID为必填项");
    if (!data.managerId) throw new Error("项目负责人ID为必填项");
    if (!data.activityType) throw new Error("活动类型为必填项");
    if (!data.locationType) throw new Error("场地类型为必填项");
    if (!data.baseType) throw new Error("底胎类型为必填项");
    if (!data.location) throw new Error("具体地点为必填项");
    if (!data.participants) throw new Error("参与人数为必填项");
    if (!data.duration) throw new Error("活动时长为必填项");
    if (!data.totalAmount) throw new Error("总金额为必填项");
    if (!data.status) throw new Error("订单状态为必填项");
    if (!data.paymentStatus) throw new Error("支付状态为必填项");
    if (!data.serviceItems || !Array.isArray(data.serviceItems) || data.serviceItems.length === 0) {
      throw new Error("至少需要一个服务项目");
    }

    // 创建团建订单
    const workshop = await prisma.workshop.create({
      data: {
        customerId: data.customerId,
        date: data.date,
        activityType: data.activityType,
        locationType: data.locationType,
        baseType: data.baseType,
        location: data.location,
        participants: data.participants,
        duration: data.duration,
        teacherId: data.teacherId,
        assistantId: data.assistantId,
        managerId: data.managerId,
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount || 0,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod || null,
        status: data.status,
        notes: data.notes || null,
        role: data.activityType === "jewelry_enameling" ? "jewelry_workshop" : "cloisonne_workshop", // 根据活动类型设置角色
        serviceItems: {
          create: data.serviceItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        customer: true,
        teacher: true,
        assistant: true,
        manager: true,
        serviceItems: {
          include: {
            product: true,
          },
        },
      },
    });

    revalidatePath("/workshop");
    return workshop;
  } catch (error) {
    console.error("Error creating workshop:", error);
    throw new Error(error instanceof Error ? error.message : "创建团建订单失败");
  }
}

/**
 * 更新团建订单
 *
 * 更新团建订单信息，包括服务项目。
 *
 * @param id - 团建订单ID
 * @param data - 团建订单更新数据
 * @returns 更新后的团建订单
 *
 * @example
 * ```typescript
 * // 更新团建订单
 * const order = await updateWorkshop(1, {
 *   status: "completed",
 *   paymentStatus: "fully_paid",
 *   notes: "活动已顺利完成"
 * });
 * ```
 *
 * @throws 如果团建订单不存在或更新失败，会抛出错误
 *
 * @category 更新
 */
export async function updateWorkshop(id: number, data: any) {
  try {
    // 检查团建订单是否存在
    const existingWorkshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        serviceItems: true,
      },
    });

    if (!existingWorkshop) {
      throw new Error("团建订单不存在");
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.customerId !== undefined) updateData.customerId = data.customerId;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.activityType !== undefined) {
      updateData.activityType = data.activityType;
      // 如果活动类型改变，也更新角色
      updateData.role = data.activityType === "jewelry_enameling" ? "jewelry_workshop" : "cloisonne_workshop";
    }
    if (data.locationType !== undefined) updateData.locationType = data.locationType;
    if (data.baseType !== undefined) updateData.baseType = data.baseType;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.participants !== undefined) updateData.participants = data.participants;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;
    if (data.assistantId !== undefined) updateData.assistantId = data.assistantId;
    if (data.managerId !== undefined) updateData.managerId = data.managerId;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.role !== undefined) updateData.role = data.role;

    // 如果提供了服务项目，更新服务项目
    if (data.serviceItems && Array.isArray(data.serviceItems)) {
      // 删除现有服务项目
      await prisma.workshopServiceItem.deleteMany({
        where: { workshopId: id },
      });

      // 添加新服务项目
      for (const item of data.serviceItems) {
        await prisma.workshopServiceItem.create({
          data: {
            workshopId: id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null,
          },
        });
      }
    }

    // 更新团建订单
    const workshop = await prisma.workshop.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        teacher: true,
        assistant: true,
        manager: true,
        serviceItems: {
          include: {
            product: true,
          },
        },
      },
    });

    revalidatePath("/workshop");
    return workshop;
  } catch (error) {
    console.error("Error updating workshop:", error);
    throw new Error(error instanceof Error ? error.message : "更新团建订单失败");
  }
}

/**
 * 删除团建订单
 *
 * 删除团建订单及其相关的服务项目。
 *
 * @param id - 团建订单ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的团建订单
 * const result = await deleteWorkshop(1);
 * if (result.success) {
 *   console.log('团建订单删除成功');
 * }
 * ```
 *
 * @throws 如果团建订单不存在或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteWorkshop(id: number) {
  try {
    // 检查团建订单是否存在
    const existingWorkshop = await prisma.workshop.findUnique({
      where: { id },
    });

    if (!existingWorkshop) {
      throw new Error("团建订单不存在");
    }

    // 删除服务项目
    await prisma.workshopServiceItem.deleteMany({
      where: { workshopId: id },
    });

    // 删除团建订单
    await prisma.workshop.delete({
      where: { id },
    });

    revalidatePath("/workshop");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workshop:", error);
    throw new Error(error instanceof Error ? error.message : "删除团建订单失败");
  }
}
