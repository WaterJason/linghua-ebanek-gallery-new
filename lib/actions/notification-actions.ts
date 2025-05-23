"use server";

/**
 * 通知系统服务
 * 
 * 本模块提供通知相关的功能，包括创建通知、获取通知列表、标记通知为已读等。
 * 
 * @module 通知系统
 * @category 核心模块
 */

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

// 通知类型
export type NotificationType = 
  | "order"       // 订单相关
  | "inventory"   // 库存相关
  | "schedule"    // 排班相关
  | "workshop"    // 团建相关
  | "system"      // 系统相关
  | "finance"     // 财务相关
  | "purchase"    // 采购相关
  | "approval"    // 审批相关
  | "other";      // 其他

// 通知优先级
export type NotificationPriority = "high" | "medium" | "low";

// 创建通知参数
export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  expiresAt?: Date;
}

// 批量创建通知参数
export interface CreateBulkNotificationsParams {
  userIds: string[];
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  expiresAt?: Date;
}

// 获取通知参数
export interface GetNotificationsParams {
  userId?: string;
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 创建通知
 * 
 * @param params 创建通知参数
 * @returns 创建的通知
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority,
        link: params.link,
        expiresAt: params.expiresAt,
      },
    });

    // 重新验证通知页面
    revalidatePath("/notifications");
    
    return notification;
  } catch (error) {
    console.error("创建通知失败:", error);
    throw new Error("创建通知失败");
  }
}

/**
 * 批量创建通知
 * 
 * @param params 批量创建通知参数
 * @returns 创建的通知数量
 */
export async function createBulkNotifications(params: CreateBulkNotificationsParams) {
  try {
    const { userIds, ...notificationData } = params;
    
    // 创建通知数据
    const notificationsData = userIds.map(userId => ({
      userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority,
      link: notificationData.link,
      expiresAt: notificationData.expiresAt,
    }));
    
    // 批量创建通知
    const result = await prisma.notification.createMany({
      data: notificationsData,
    });
    
    // 重新验证通知页面
    revalidatePath("/notifications");
    
    return result.count;
  } catch (error) {
    console.error("批量创建通知失败:", error);
    throw new Error("批量创建通知失败");
  }
}

/**
 * 获取通知列表
 * 
 * @param params 获取通知参数
 * @returns 通知列表和总数
 */
export async function getNotifications(params?: GetNotificationsParams) {
  try {
    // 如果没有指定用户ID，获取当前用户
    let userId = params?.userId;
    if (!userId) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("未授权");
      }
      userId = currentUser.id;
    }
    
    // 构建查询条件
    const where: any = { userId };
    
    if (params?.type) {
      where.type = params.type;
    }
    
    if (params?.read !== undefined) {
      where.read = params.read;
    }
    
    // 查询通知
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params?.limit || 10,
      skip: params?.offset || 0,
    });
    
    // 查询总数
    const total = await prisma.notification.count({ where });
    
    return { notifications, total };
  } catch (error) {
    console.error("获取通知列表失败:", error);
    throw new Error("获取通知列表失败");
  }
}

/**
 * 标记通知为已读
 * 
 * @param notificationId 通知ID
 * @returns 更新的通知
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }
    
    // 查询通知
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    
    // 检查通知是否存在且属于当前用户
    if (!notification || notification.userId !== currentUser.id) {
      throw new Error("通知不存在或无权限");
    }
    
    // 更新通知
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    
    // 重新验证通知页面
    revalidatePath("/notifications");
    
    return updatedNotification;
  } catch (error) {
    console.error("标记通知为已读失败:", error);
    throw new Error("标记通知为已读失败");
  }
}

/**
 * 标记所有通知为已读
 * 
 * @param type 可选的通知类型过滤
 * @returns 更新的通知数量
 */
export async function markAllNotificationsAsRead(type?: NotificationType) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }
    
    // 构建查询条件
    const where: any = {
      userId: currentUser.id,
      read: false,
    };
    
    if (type) {
      where.type = type;
    }
    
    // 更新通知
    const result = await prisma.notification.updateMany({
      where,
      data: { read: true },
    });
    
    // 重新验证通知页面
    revalidatePath("/notifications");
    
    return result.count;
  } catch (error) {
    console.error("标记所有通知为已读失败:", error);
    throw new Error("标记所有通知为已读失败");
  }
}

/**
 * 删除通知
 * 
 * @param notificationId 通知ID
 * @returns 删除的通知
 */
export async function deleteNotification(notificationId: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }
    
    // 查询通知
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    
    // 检查通知是否存在且属于当前用户
    if (!notification || notification.userId !== currentUser.id) {
      throw new Error("通知不存在或无权限");
    }
    
    // 删除通知
    const deletedNotification = await prisma.notification.delete({
      where: { id: notificationId },
    });
    
    // 重新验证通知页面
    revalidatePath("/notifications");
    
    return deletedNotification;
  } catch (error) {
    console.error("删除通知失败:", error);
    throw new Error("删除通知失败");
  }
}
