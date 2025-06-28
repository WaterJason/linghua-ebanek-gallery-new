"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth-actions"
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

    // 构建查询条件
    const where: any = {
      userId: user.id,
    }

    // 根据筛选条件添加查询条件
    if (filter === "completed") {
      where.completed = true
    } else if (filter === "high") {
      where.priority = "high"
      where.completed = false
    } else if (filter !== "all") {
      where.type = filter
      where.completed = false
    } else {
      where.completed = false
    }

    // 从数据库获取待办事项
    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" }
      ],
      take: limit,
    })

    // 转换为前端需要的格式
    return todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      type: todo.type,
      priority: todo.priority,
      dueDate: todo.dueDate,
      completed: todo.completed,
      link: todo.link,
    }))
  } catch (error) {
    console.error("Error getting todo list:", error)
    return []
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

    // 从数据库获取未完成待办事项数量
    const count = await prisma.todo.count({
      where: {
        userId: user.id,
        completed: false,
      },
    })

    return count
  } catch (error) {
    console.error("获取未完成待办事项数量失败:", error)
    return 0
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

    // 在数据库中创建待办事项
    const todo = await prisma.todo.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        type: data.type || "other",
        priority: data.priority || "medium",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        link: data.link,
      },
    })

    revalidatePath("/todos")
    return todo
  } catch (error) {
    console.error("Error creating todo:", error)
    throw error
  }
}

/**
 * 更新待办事项状态
 *
 * @param todoId - 待办事项ID
 * @param completed - 是否完成
 * @returns 更新结果
 */
export async function updateTodoStatus(todoId: string, completed: boolean) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 更新待办事项状态
    const todo = await prisma.todo.update({
      where: {
        id: todoId,
        userId: user.id, // 确保只能更新自己的待办事项
      },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        status: completed ? "completed" : "pending",
      },
    })

    revalidatePath("/todos")
    return todo
  } catch (error) {
    console.error("Error updating todo status:", error)
    throw error
  }
}

/**
 * 删除待办事项
 *
 * @param todoId - 待办事项ID
 * @returns 删除结果
 */
export async function deleteTodo(todoId: string) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 删除待办事项
    await prisma.todo.delete({
      where: {
        id: todoId,
        userId: user.id, // 确保只能删除自己的待办事项
      },
    })

    revalidatePath("/todos")
    return true
  } catch (error) {
    console.error("Error deleting todo:", error)
    throw error
  }
}

/**
 * 获取系统设置
 *
 * 获取系统全局设置，包括系统名称、版本、主题等。
 *
 * @returns 系统设置
 *
 * @example
 * ```typescript
 * // 获取系统设置
 * const settings = await getSystemSettings();
 * console.log(settings.systemName); // 输出系统名称
 * ```
 *
 * @throws 如果获取系统设置失败，会抛出错误
 *
 * @category 查询
 */
export async function getSystemSettings() {
  try {
    // 从数据库获取系统设置
    const settings = await prisma.systemSetting.findMany();

    // 如果没有设置记录，返回默认设置
    if (!settings || settings.length === 0) {
      return {
        systemName: "灵华文化ERP系统",
        version: "1.0.0",
        theme: "light",
        language: "zh-CN",
        logoUrl: "/images/logo.png",
        companyName: "灵华文化",
        companyAddress: "北京市朝阳区",
        companyPhone: "010-12345678",
        companyEmail: "contact@linghua.com",
        enableNotifications: true,
        enableAuditLog: true,
        maintenanceMode: false,
        lastBackupTime: null
      };
    }

    // 将设置转换为对象格式
    const settingsObject: Record<string, any> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    // 返回设置对象，包含默认值
    return {
      systemName: settingsObject.systemName || "灵华文化ERP系统",
      version: settingsObject.version || "1.0.0",
      theme: settingsObject.theme || "light",
      language: settingsObject.language || "zh-CN",
      logoUrl: settingsObject.logoUrl || "/images/logo.png",
      companyName: settingsObject.companyName || "灵华文化",
      companyAddress: settingsObject.companyAddress || "北京市朝阳区",
      companyPhone: settingsObject.companyPhone || "010-12345678",
      companyEmail: settingsObject.companyEmail || "contact@linghua.com",
      enableNotifications: settingsObject.enableNotifications === "false" ? false : true,
      enableAuditLog: settingsObject.enableAuditLog === "false" ? false : true,
      maintenanceMode: settingsObject.maintenanceMode === "true" ? true : false,
      lastBackupTime: settingsObject.lastBackupTime ? new Date(settingsObject.lastBackupTime) : null
    };
  } catch (error) {
    console.error("获取系统设置失败:", error);
    // 返回默认设置而不是抛出错误，确保系统可以继续运行
    return {
      systemName: "灵华文化ERP系统",
      version: "1.0.0",
      theme: "light",
      language: "zh-CN",
      logoUrl: "/images/logo.png",
      companyName: "灵华文化",
      companyAddress: "北京市朝阳区",
      companyPhone: "010-12345678",
      companyEmail: "contact@linghua.com",
      enableNotifications: true,
      enableAuditLog: true,
      maintenanceMode: false,
      lastBackupTime: null
    };
  }
}

/**
 * 获取仪表盘数据
 *
 * @param timeRange - 时间范围（day, week, month, year）
 * @returns 仪表盘数据
 */
export async function getDashboardData(timeRange = "month") {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 计算时间范围
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (timeRange) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 1)
        previousEndDate = new Date(startDate)
        break
      case "week":
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        previousEndDate = new Date(startDate)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        previousEndDate = new Date(now.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // 并行获取所有数据
    const [
      gallerySalesData,
      coffeeSalesData,
      workshopsData,
      employeesData,
      inventoryData,
      ordersData,
      recentSalesData,
      topProductsData,
      lowStockData
    ] = await Promise.all([
      getGallerySalesStats(startDate, previousStartDate, previousEndDate),
      getCoffeeSalesStats(startDate, previousStartDate, previousEndDate),
      getWorkshopsStats(startDate, previousStartDate, previousEndDate),
      getEmployeesStats(),
      getInventoryStats(),
      getOrdersStats(startDate, previousStartDate, previousEndDate),
      getRecentSalesData(),
      getTopProductsData(startDate),
      getLowStockItems()
    ])

    return {
      gallerySales: gallerySalesData,
      coffeeSales: coffeeSalesData,
      workshops: workshopsData,
      employees: employeesData,
      inventory: inventoryData,
      orders: ordersData,
      recentSales: recentSalesData,
      topProducts: topProductsData,
      lowStockItems: lowStockData
    }
  } catch (error) {
    console.error("获取仪表盘数据失败:", error)
    // 返回空数据结构而不是抛出错误，确保UI可以正常渲染
    return {
      gallerySales: { current: 0, previous: 0, growth: 0, data: [] },
      coffeeSales: { current: 0, previous: 0, growth: 0, data: [] },
      workshops: { current: 0, previous: 0, growth: 0, data: [] },
      employees: { total: 0, active: 0, performance: [] },
      inventory: { total: 0, lowStock: 0, distribution: [] },
      orders: { total: 0, pending: 0, growth: 0 },
      recentSales: [],
      topProducts: [],
      lowStockItems: []
    }
  }
}

/**
 * 获取画廊销售统计数据
 */
async function getGallerySalesStats(startDate: Date, previousStartDate: Date, previousEndDate: Date) {
  try {
    // 获取当前期间的销售数据
    const currentSales = await prisma.gallerySale.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: new Date()
        }
      },
      _sum: {
        totalAmount: true
      }
    })

    // 获取上一期间的销售数据
    const previousSales = await prisma.gallerySale.aggregate({
      where: {
        date: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      },
      _sum: {
        totalAmount: true
      }
    })

    const current = currentSales._sum.totalAmount || 0
    const previous = previousSales._sum.totalAmount || 0
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0

    // 获取趋势数据（最近12个月）
    const trendData = await prisma.gallerySale.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        }
      },
      _sum: {
        totalAmount: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    const data = trendData.map(item => ({
      date: item.date.toISOString().slice(0, 7), // YYYY-MM format
      value: item._sum.totalAmount || 0
    }))

    return {
      current: Number(current),
      previous: Number(previous),
      growth: Number(growth.toFixed(1)),
      data
    }
  } catch (error) {
    console.error("获取画廊销售统计失败:", error)
    return { current: 0, previous: 0, growth: 0, data: [] }
  }
}

/**
 * 获取咖啡店销售统计数据
 */
async function getCoffeeSalesStats(startDate: Date, previousStartDate: Date, previousEndDate: Date) {
  try {
    // 获取当前期间的销售数据
    const currentSales = await prisma.coffeeShopSale.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: new Date()
        }
      },
      _sum: {
        totalAmount: true
      }
    })

    // 获取上一期间的销售数据
    const previousSales = await prisma.coffeeShopSale.aggregate({
      where: {
        date: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      },
      _sum: {
        totalAmount: true
      }
    })

    const current = currentSales._sum.totalAmount || 0
    const previous = previousSales._sum.totalAmount || 0
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0

    // 获取趋势数据（最近12个月）
    const trendData = await prisma.coffeeShopSale.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        }
      },
      _sum: {
        totalAmount: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    const data = trendData.map(item => ({
      date: item.date.toISOString().slice(0, 7), // YYYY-MM format
      value: item._sum.totalAmount || 0
    }))

    return {
      current: Number(current),
      previous: Number(previous),
      growth: Number(growth.toFixed(1)),
      data
    }
  } catch (error) {
    console.error("获取咖啡店销售统计失败:", error)
    return { current: 0, previous: 0, growth: 0, data: [] }
  }
}

/**
 * 获取工坊统计数据
 */
async function getWorkshopsStats(startDate: Date, previousStartDate: Date, previousEndDate: Date) {
  try {
    // 获取当前期间的工坊数量
    const currentWorkshops = await prisma.workshop.count({
      where: {
        date: {
          gte: startDate,
          lte: new Date()
        }
      }
    })

    // 获取上一期间的工坊数量
    const previousWorkshops = await prisma.workshop.count({
      where: {
        date: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      }
    })

    const growth = previousWorkshops > 0 ? ((currentWorkshops - previousWorkshops) / previousWorkshops) * 100 : 0

    // 获取趋势数据（最近12个月）
    const trendData = await prisma.workshop.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    const data = trendData.map(item => ({
      date: item.date.toISOString().slice(0, 7), // YYYY-MM format
      value: item._count.id
    }))

    return {
      current: currentWorkshops,
      previous: previousWorkshops,
      growth: Number(growth.toFixed(1)),
      data
    }
  } catch (error) {
    console.error("获取工坊统计失败:", error)
    return { current: 0, previous: 0, growth: 0, data: [] }
  }
}

/**
 * 获取员工统计数据
 */
async function getEmployeesStats() {
  try {
    const totalEmployees = await prisma.employee.count()
    const activeEmployees = await prisma.employee.count({
      where: {
        status: 'active'
      }
    })

    // 获取员工绩效数据（基于最近的薪资记录）
    const performanceData = await prisma.employee.findMany({
      where: {
        status: 'active'
      },
      include: {
        salaryRecords: {
          orderBy: {
            month: 'desc'
          },
          take: 1
        }
      },
      take: 10
    })

    const performance = performanceData.map(emp => ({
      name: emp.name,
      performance: emp.salaryRecords[0]?.totalSalary || emp.dailySalary * 22
    }))

    return {
      total: totalEmployees,
      active: activeEmployees,
      performance
    }
  } catch (error) {
    console.error("获取员工统计失败:", error)
    return { total: 0, active: 0, performance: [] }
  }
}

/**
 * 获取工坊排期数据
 *
 * @returns 工坊排期数据
 */
/**
 * 获取库存统计数据
 */
async function getInventoryStats() {
  try {
    const totalItems = await prisma.inventoryItem.count()

    // 获取低库存商品数量（使用原生SQL查询）
    const lowStockResult = await prisma.$queryRaw<[{count: bigint}]>`
      SELECT COUNT(*) as count
      FROM "InventoryItem"
      WHERE quantity <= COALESCE(min_quantity, 10)
    `
    const lowStockItems = Number(lowStockResult[0]?.count || 0)

    // 获取库存分布（按仓库）
    const distribution = await prisma.inventoryItem.groupBy({
      by: ['warehouseId'],
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    })

    const distributionWithNames = await Promise.all(
      distribution.map(async (item) => {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: item.warehouseId },
          select: { name: true }
        })
        return {
          warehouse: warehouse?.name || '未知仓库',
          quantity: item._sum.quantity || 0,
          items: item._count.id
        }
      })
    )

    return {
      total: totalItems,
      lowStock: lowStockItems,
      distribution: distributionWithNames
    }
  } catch (error) {
    console.error("获取库存统计失败:", error)
    return { total: 0, lowStock: 0, distribution: [] }
  }
}

/**
 * 获取订单统计数据
 */
async function getOrdersStats(startDate: Date, previousStartDate: Date, previousEndDate: Date) {
  try {
    // 获取当前期间的订单数量
    const currentOrders = await prisma.order.count({
      where: {
        orderDate: {
          gte: startDate,
          lte: new Date()
        }
      }
    })

    // 获取上一期间的订单数量
    const previousOrders = await prisma.order.count({
      where: {
        orderDate: {
          gte: previousStartDate,
          lt: previousEndDate
        }
      }
    })

    // 获取待处理订单数量
    const pendingOrders = await prisma.order.count({
      where: {
        status: {
          in: ['pending', 'processing']
        }
      }
    })

    const growth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0

    return {
      total: currentOrders,
      pending: pendingOrders,
      growth: Number(growth.toFixed(1))
    }
  } catch (error) {
    console.error("获取订单统计失败:", error)
    return { total: 0, pending: 0, growth: 0 }
  }
}

/**
 * 获取最近销售数据
 */
async function getRecentSalesData() {
  try {
    const recentOrders = await prisma.order.findMany({
      where: {
        status: {
          not: 'cancelled'
        }
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      },
      take: 5
    })

    return recentOrders.map(order => ({
      id: order.orderNumber,
      customer: order.customer?.name || '未知客户',
      amount: Number(order.totalAmount),
      status: order.status,
      date: order.orderDate
    }))
  } catch (error) {
    console.error("获取最近销售数据失败:", error)
    return []
  }
}

/**
 * 获取热销产品数据
 */
async function getTopProductsData(startDate: Date) {
  try {
    // 从订单项中统计产品销量
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          orderDate: {
            gte: startDate
          },
          status: {
            not: 'cancelled'
          }
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    const productsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        })
        return {
          name: product?.name || '未知产品',
          sales: item._sum.quantity || 0
        }
      })
    )

    return productsWithNames
  } catch (error) {
    console.error("获取热销产品数据失败:", error)
    return []
  }
}

/**
 * 获取低库存商品数据
 */
async function getLowStockItems() {
  try {
    // 使用原生SQL查询获取低库存商品
    const lowStockItems = await prisma.$queryRaw<Array<{
      id: number;
      productId: number;
      quantity: number;
      minQuantity: number | null;
      productName: string | null;
      productImage: string | null;
    }>>`
      SELECT
        i.id,
        i.product_id as "productId",
        i.quantity,
        i.min_quantity as "minQuantity",
        p.name as "productName",
        p.image as "productImage"
      FROM "InventoryItem" i
      LEFT JOIN "Product" p ON i.product_id = p.id
      WHERE i.quantity <= COALESCE(i.min_quantity, 10)
      ORDER BY i.quantity ASC
      LIMIT 5
    `

    return lowStockItems.map(item => ({
      id: `PRD-${item.productId}`,
      name: item.productName || '未知产品',
      currentStock: item.quantity,
      minStock: item.minQuantity || 0,
      image: item.productImage || '/images/products/default.jpg'
    }))
  } catch (error) {
    console.error("获取低库存商品数据失败:", error)
    return []
  }
}

export async function getWorkshopSchedule() {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 获取未来7天的工坊排期
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const workshops = await prisma.workshop.findMany({
      where: {
        date: {
          gte: today,
          lte: nextWeek
        }
      },
      include: {
        teacher: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            name: true
          }
        },
        activity: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return workshops.map(workshop => ({
      id: `WS-${workshop.id}`,
      title: workshop.activity?.name || '工坊活动',
      type: workshop.type || '体验',
      date: workshop.date,
      startTime: workshop.startTime || '09:00',
      endTime: workshop.endTime || '17:00',
      participants: workshop.participants || 0,
      status: workshop.status || 'pending',
      instructor: workshop.teacher?.name || '未指定',
      assistant: '', // 如果有助教字段可以添加
      location: workshop.location || '主展厅',
      notes: workshop.notes || ''
    }))
  } catch (error) {
    console.error("获取工坊排期数据失败:", error)
    return []
  }
}

/**
 * 创建系统日志
 *
 * @param data - 日志数据
 * @returns 创建的日志
 */
export async function createSystemLog(data: {
  module: string
  level: "info" | "warn" | "error"
  message: string
  details?: any
  userId?: string
}) {
  try {
    // 获取当前用户
    let userId = data.userId
    if (!userId) {
      const user = await getCurrentUser()
      if (user) {
        userId = user.id
      }
    }

    // 在数据库中创建系统日志
    const log = await prisma.systemLog.create({
      data: {
        module: data.module,
        level: data.level,
        message: data.message,
        details: data.details ? JSON.stringify(data.details) : null,
        userId: userId || null
      }
    })

    // 同时输出到控制台
    console.log(`[${data.level.toUpperCase()}][${data.module}] ${data.message}`)

    return log
  } catch (error) {
    console.error("创建系统日志失败:", error)
    // 即使失败也不抛出异常，避免影响主要功能
    // 但至少输出到控制台
    console.log(`[${data.level.toUpperCase()}][${data.module}] ${data.message}`)
    return null
  }
}

/**
 * 获取系统日志
 *
 * @param options - 查询选项
 * @returns 系统日志列表
 */
export async function getSystemLogs(options: {
  module?: string
  level?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
} = {}) {
  try {
    const {
      module,
      level,
      limit = 50,
      offset = 0,
      startDate,
      endDate
    } = options

    // 构建查询条件
    const where: any = {}

    if (module) {
      where.module = module
    }

    if (level) {
      where.level = level
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    // 获取日志总数
    const total = await prisma.systemLog.count({ where })

    // 获取日志列表
    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    return {
      data: logs,
      total
    }
  } catch (error) {
    console.error("获取系统日志失败:", error)
    return {
      data: [],
      total: 0
    }
  }
}

/**
 * 清理系统日志
 *
 * @param beforeDate - 清理此日期之前的日志
 * @returns 清理结果
 */
export async function clearSystemLogs(beforeDate: Date) {
  try {
    const result = await prisma.systemLog.deleteMany({
      where: {
        createdAt: {
          lt: beforeDate
        }
      }
    })

    await createSystemLog({
      module: 'system',
      level: 'info',
      message: `清理系统日志完成，删除了 ${result.count} 条记录`,
      details: { beforeDate, deletedCount: result.count }
    })

    return result
  } catch (error) {
    console.error("清理系统日志失败:", error)
    throw new Error("清理系统日志失败")
  }
}

/**
 * 更新系统设置
 * @param settings 系统设置数据
 * @returns 更新结果
 */
export async function updateSystemSettings(settings: any) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 检查权限
    if (user.role !== "admin" && user.email !== "admin@linghua.com") {
      throw new Error("权限不足")
    }

    // 更新每个设置项
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: {
          value: String(value),
          updatedAt: new Date()
        },
        create: {
          key,
          value: String(value),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // 记录系统日志
    await createSystemLog({
      module: 'system',
      level: 'info',
      message: '系统设置已更新',
      details: { updatedSettings: Object.keys(settings) }
    })

    revalidatePath("/settings")
    return true
  } catch (error) {
    console.error("更新系统设置失败:", error)
    throw new Error(error instanceof Error ? error.message : "更新系统设置失败")
  }
}

/**
 * 获取系统信息
 * @returns 系统信息
 */
export async function getSystemInfo() {
  try {
    // 获取系统设置
    const settings = await getSystemSettings()

    // 获取数据库统计信息
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()

    // 获取系统运行时间（简化版本）
    const uptime = process.uptime()

    // 获取内存使用情况
    const memoryUsage = process.memoryUsage()

    return {
      systemName: settings.systemName,
      version: settings.version,
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      database: {
        users: userCount,
        products: productCount,
        orders: orderCount,
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    }
  } catch (error) {
    console.error("Error getting system info:", error)
    return {
      systemName: "灵华文化ERP系统",
      version: "1.0.0",
      uptime: 0,
      memory: { used: 0, total: 0, external: 0 },
      database: { users: 0, products: 0, orders: 0 },
      environment: 'unknown',
      nodeVersion: 'unknown',
      platform: 'unknown',
      arch: 'unknown',
    }
  }
}