"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-utils"
import { NotificationType } from "./notification-actions"

/**
 * 获取未读通知数量
 *
 * @param type 可选的通知类型过滤
 * @returns 未读通知数量
 */
export async function getUnreadNotificationCount(type?: NotificationType) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return 0
    }

    // 构建查询条件
    const where: any = {
      userId: user.id,
      read: false,
    }

    if (type) {
      where.type = type
    }

    // 查询未读通知数量
    const count = await prisma.notification.count({
      where,
    })

    return count
  } catch (error) {
    console.error("获取未读通知数量失败:", error)
    return 0
  }
}

/**
 * 获取未完成待办事项数量
 *
 * @returns 未完成待办事项数量
 */
export async function getUncompletedTodosCount() {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return 0
    }

    // 这里应该从数据库中获取未完成待办事项数量
    // 由于目前没有实现待办事项系统，返回模拟数据
    return 5
  } catch (error) {
    console.error("Error getting uncompleted todos count:", error)
    return 0
  }
}

/**
 * 获取通知列表
 *
 * @param limit - 限制返回的通知数量
 * @param filter - 筛选条件（all, unread, order, inventory等）
 * @returns 通知列表
 */
export async function getNotifications(limit = 10, filter = "all") {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    // 构建查询条件
    const where: any = {
      userId: user.id,
    }

    // 根据筛选条件设置查询条件
    if (filter === "unread") {
      where.read = false
    } else if (filter !== "all") {
      where.type = filter
    }

    // 查询通知列表
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    // 转换为前端需要的格式
    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      timestamp: notification.createdAt,
      read: notification.read,
      link: notification.link || undefined,
    }))
  } catch (error) {
    console.error("获取通知列表失败:", error)
    return []
  }
}

/**
 * 获取待办事项列表
 *
 * @param limit - 限制返回的待办事项数量
 * @param filter - 筛选条件（all, high, order, completed等）
 * @returns 待办事项列表
 */
export async function getTodoList(limit = 10, filter = "all") {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    // 这里应该从数据库中获取待办事项列表
    // 由于目前没有实现待办事项系统，返回空数组
    return []
  } catch (error) {
    console.error("Error getting todo list:", error)
    return []
  }
}

/**
 * 标记通知为已读
 *
 * @param id - 通知ID
 * @returns 是否成功
 */
export async function markNotificationAsRead(id: string) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    // 查询通知
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    // 检查通知是否存在且属于当前用户
    if (!notification || notification.userId !== user.id) {
      return false
    }

    // 更新通知状态
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    // 重新验证通知页面
    revalidatePath("/notifications")
    return true
  } catch (error) {
    console.error("标记通知为已读失败:", error)
    return false
  }
}

/**
 * 标记所有通知为已读
 *
 * @param type 可选的通知类型过滤
 * @returns 是否成功
 */
export async function markAllNotificationsAsRead(type?: NotificationType) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    // 构建查询条件
    const where: any = {
      userId: user.id,
      read: false,
    }

    if (type) {
      where.type = type
    }

    // 更新所有通知状态
    await prisma.notification.updateMany({
      where,
      data: { read: true },
    })

    // 重新验证通知页面
    revalidatePath("/notifications")
    return true
  } catch (error) {
    console.error("标记所有通知为已读失败:", error)
    return false
  }
}

/**
 * 切换待办事项完成状态
 *
 * @param id - 待办事项ID
 * @returns 是否成功
 */
export async function toggleTodoStatus(id: string) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    // 这里应该更新数据库中的待办事项状态
    // 由于目前没有实现待办事项系统，直接返回成功
    revalidatePath("/todos")
    return true
  } catch (error) {
    console.error("Error toggling todo status:", error)
    return false
  }
}

/**
 * 创建待办事项
 *
 * @param data - 待办事项数据
 * @returns 创建的待办事项
 */
export async function createTodo(data: any) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 这里应该在数据库中创建待办事项
    // 由于目前没有实现待办事项系统，直接返回模拟数据
    const todo = {
      id: `todo-${Date.now()}`,
      ...data,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false
    }

    revalidatePath("/todos")
    return todo
  } catch (error) {
    console.error("Error creating todo:", error)
    throw error
  }
}