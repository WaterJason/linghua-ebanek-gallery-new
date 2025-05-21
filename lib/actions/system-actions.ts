/**
 * 系统管理模块
 *
 * 本模块提供系统管理相关的功能，包括系统设置的查询和更新、系统日志的记录和查询等。
 *
 * @module 系统管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaSystemSetting,
  PrismaSystemLog,
  SystemSettingUpdateParams,
  SystemLogCreateParams
} from "@/types/prisma-models";
import {
  validateUpdateSystemSettings,
  validateCreateSystemLog
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";

/**
 * 获取系统设置
 *
 * 获取系统设置，如果不存在则创建默认设置。
 *
 * @returns 系统设置
 *
 * @example
 * ```typescript
 * // 获取系统设置
 * const settings = await getSystemSettings();
 * console.log(settings.companyName); // 输出公司名称
 * ```
 *
 * @category 查询
 */
export async function getSystemSettings(): Promise<PrismaSystemSetting> {
  try {
    // 获取系统设置，如果不存在则创建默认设置
    let settings = await prisma.systemSetting.findFirst();

    if (!settings) {
      // 使用类型安全的包装函数创建系统设置
      settings = await createRecord('systemSetting', {
        companyName: "聆花掐丝珐琅馆",
        coffeeSalesCommissionRate: 20,
        gallerySalesCommissionRate: 10,
        teacherWorkshopFee: 200,
        assistantWorkshopFee: 130,
        teacherWorkshopFeeOutside: 200,
        assistantWorkshopFeeOutside: 130,
        teacherWorkshopFeeInside: 180,
        assistantWorkshopFeeInside: 110,
        enableImageUpload: true,
        enableNotifications: true,
        // 薪资计算规则默认值
        basicWorkingHours: 8,
        basicWorkingDays: 22,
        overtimeRate: 1.5,
        weekendOvertimeRate: 2,
        holidayOvertimeRate: 3,
        socialInsuranceRate: 0,
        taxRate: 0,
      });
    }

    return settings as PrismaSystemSetting;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    throw new Error("Failed to fetch system settings");
  }
}

/**
 * 更新系统设置
 */
export async function updateSystemSettings(data: any) {
  try {
    // 获取当前设置
    let settings = await prisma.systemSetting.findFirst();

    if (settings) {
      // 更新现有设置
      settings = await prisma.systemSetting.update({
        where: { id: settings.id },
        data: {
          companyName: data.companyName,
          coffeeSalesCommissionRate: Number.parseFloat(data.coffeeSalesCommissionRate),
          gallerySalesCommissionRate: Number.parseFloat(data.gallerySalesCommissionRate),
          enableImageUpload: data.enableImageUpload,
          enableNotifications: data.enableNotifications,
          // 保留其他字段的现有值
          teacherWorkshopFee: settings.teacherWorkshopFee,
          assistantWorkshopFee: settings.assistantWorkshopFee,
          teacherWorkshopFeeOutside: settings.teacherWorkshopFeeOutside,
          assistantWorkshopFeeOutside: settings.assistantWorkshopFeeOutside,
          teacherWorkshopFeeInside: settings.teacherWorkshopFeeInside,
          assistantWorkshopFeeInside: settings.assistantWorkshopFeeInside,
          basicWorkingHours: settings.basicWorkingHours,
          basicWorkingDays: settings.basicWorkingDays,
          overtimeRate: settings.overtimeRate,
          weekendOvertimeRate: settings.weekendOvertimeRate,
          holidayOvertimeRate: settings.holidayOvertimeRate,
          socialInsuranceRate: settings.socialInsuranceRate,
          taxRate: settings.taxRate,
        },
      });
    } else {
      // 创建新设置
      settings = await prisma.systemSetting.create({
        data: {
          companyName: data.companyName,
          coffeeSalesCommissionRate: Number.parseFloat(data.coffeeSalesCommissionRate),
          gallerySalesCommissionRate: Number.parseFloat(data.gallerySalesCommissionRate),
          enableImageUpload: data.enableImageUpload,
          enableNotifications: data.enableNotifications,
          // 默认值
          teacherWorkshopFee: 200,
          assistantWorkshopFee: 130,
          teacherWorkshopFeeOutside: 200,
          assistantWorkshopFeeOutside: 130,
          teacherWorkshopFeeInside: 180,
          assistantWorkshopFeeInside: 110,
          basicWorkingHours: 8,
          basicWorkingDays: 22,
          overtimeRate: 1.5,
          weekendOvertimeRate: 2,
          holidayOvertimeRate: 3,
          socialInsuranceRate: 0,
          taxRate: 0,
        },
      });
    }

    revalidatePath("/settings");
    return settings;
  } catch (error) {
    console.error("Error updating system settings:", error);
    throw new Error("Failed to update system settings");
  }
}

/**
 * 删除系统设置
 */
export async function deleteSystemSetting(key: string) {
  try {
    // 检查设置是否存在
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      throw new Error(`Setting ${key} does not exist`);
    }

    // 删除设置
    await prisma.systemSetting.delete({
      where: { key },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error(`Error deleting system setting ${key}:`, error);
    throw new Error(`Failed to delete system setting ${key}`);
  }
}

/**
 * 获取系统日志
 */
export async function getSystemLogs(level?: string, module?: string, startDate?: string, endDate?: string, limit?: number) {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (level) {
      whereClause.level = level;
    }

    if (module) {
      whereClause.module = module;
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.timestamp = {
        lte: new Date(endDate),
      };
    }

    // 获取日志
    const logs = await prisma.systemLog.findMany({
      where: whereClause,
      orderBy: {
        timestamp: "desc",
      },
      take: limit || 100,
    });

    // 如果有用户ID，获取用户信息
    const logsWithUserInfo = await Promise.all(
      logs.map(async (log) => {
        if (log.userId) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: log.userId },
              select: {
                id: true,
                name: true,
                email: true,
              },
            });

            return {
              ...log,
              userName: user?.name || null,
              userEmail: user?.email || null,
            };
          } catch (error) {
            console.error(`Error fetching user for log ${log.id}:`, error);
            return log;
          }
        }
        return log;
      })
    );

    return logsWithUserInfo;
  } catch (error) {
    console.error("Error fetching system logs:", error);
    throw new Error("Failed to fetch system logs");
  }
}

/**
 * 创建系统日志
 *
 * 创建新的系统日志记录。
 *
 * @param data - 系统日志创建参数
 * @returns 创建的系统日志
 *
 * @example
 * ```typescript
 * // 创建系统日志
 * const log = await createSystemLog({
 *   level: 'info',
 *   module: '用户管理',
 *   message: '用户登录成功',
 *   details: JSON.stringify({ userId: 'user123', ip: '192.168.1.1' }),
 *   userId: 'user123'
 * });
 * console.log(log.id); // 输出新创建的日志ID
 * ```
 *
 * @category 创建
 */
export async function createSystemLog(data: SystemLogCreateParams): Promise<PrismaSystemLog> {
  try {
    // 验证数据
    const validation = validateCreateSystemLog(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 使用类型安全的包装函数创建系统日志
    const log = await createRecord('systemLog', {
      message: data.message,
      level: data.level,
      module: data.module,
      details: data.details || null,
      userId: data.userId || null,
      timestamp: new Date(), // 确保设置时间戳
    });

    return log as PrismaSystemLog;
  } catch (error) {
    console.error("Error creating system log:", error);
    // 对于系统日志，我们不使用统一的错误处理机制，因为这可能导致循环依赖
    // 系统日志创建失败不应该阻止应用程序继续运行
    return {
      id: 0,
      message: "Failed to create system log",
      level: "error",
      module: "system",
      details: JSON.stringify(error),
      timestamp: new Date(),
      userId: null
    } as PrismaSystemLog;
  }
}

/**
 * 清除系统日志
 */
export async function clearSystemLogs(olderThan?: string) {
  try {
    let whereClause: any = {};

    if (olderThan) {
      whereClause.timestamp = {
        lt: new Date(olderThan),
      };
    }

    // 删除日志
    const result = await prisma.systemLog.deleteMany({
      where: whereClause,
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error clearing system logs:", error);
    throw new Error("Failed to clear system logs");
  }
}

/**
 * 获取系统统计信息
 */
export async function getSystemStats() {
  try {
    // 获取各种统计信息
    const [
      userCount,
      productCount,
      orderCount,
      customerCount,
      workshopCount,
      employeeCount,
      supplierCount,
      inventoryCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(), // 使用 Order 而不是 SalesOrder
      prisma.customer.count(),
      prisma.workshopActivity.count(),
      prisma.employee.count(),
      prisma.supplier.count(),
      prisma.inventoryItem.count(), // 使用 InventoryItem 而不是 Inventory
    ]);

    // 获取最近的销售订单
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
      },
    });

    // 获取最近的团建活动
    const recentWorkshops = await prisma.workshop.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
      include: {
        activity: true,
        teacher: true,
      },
    });

    // 获取库存不足的产品
    const lowStockProducts = await prisma.product.findMany({
      where: {
        inventory: {
          lte: 10, // 使用固定值，因为 Product 模型中没有 minStock 字段
        },
        inventory: {
          gt: 0,
        },
      },
      take: 5,
      orderBy: {
        inventory: "asc",
      },
    });

    return {
      counts: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        customers: customerCount,
        workshops: workshopCount,
        employees: employeeCount,
        suppliers: supplierCount,
        inventory: inventoryCount,
      },
      recentOrders,
      recentWorkshops,
      lowStockProducts,
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw new Error("Failed to fetch system stats");
  }
}

/**
 * 获取销售统计信息
 */
export async function getSalesStats(startDate?: string, endDate?: string) {
  try {
    // 构建日期范围
    let dateRange: any = {};

    if (startDate && endDate) {
      dateRange = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      dateRange = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateRange = {
        lte: new Date(endDate),
      };
    } else {
      // 默认获取最近30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateRange = {
        gte: thirtyDaysAgo,
      };
    }

    // 获取销售订单
    const salesOrders = await prisma.order.findMany({
      where: {
        createdAt: dateRange,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 获取珐琅馆销售
    const gallerySales = await prisma.gallerySale.findMany({
      where: {
        date: dateRange,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 获取咖啡厅销售
    const coffeeShopSales = await prisma.coffeeShopSale.findMany({
      where: {
        date: dateRange,
      },
    });

    // 计算总销售额
    const totalSalesAmount = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalGallerySalesAmount = gallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCoffeeShopSalesAmount = coffeeShopSales.reduce((sum, sale) => sum + sale.totalSales, 0);

    // 计算产品销售量
    const productSales: Record<number, { productId: number, name: string, quantity: number, amount: number }> = {};

    // 处理销售订单中的产品
    for (const order of salesOrders) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.product.name,
            quantity: 0,
            amount: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].amount += item.price * item.quantity;
      }
    }

    // 处理珐琅馆销售中的产品
    for (const sale of gallerySales) {
      for (const item of sale.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.product.name,
            quantity: 0,
            amount: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].amount += item.price * item.quantity;
      }
    }

    // 转换为数组并排序
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalSales: {
        orders: totalSalesAmount,
        gallery: totalGallerySalesAmount,
        coffeeShop: totalCoffeeShopSalesAmount,
        total: totalSalesAmount + totalGallerySalesAmount + totalCoffeeShopSalesAmount,
      },
      orderCount: salesOrders.length,
      gallerySaleCount: gallerySales.length,
      coffeeShopSaleCount: coffeeShopSales.length,
      topProducts,
    };
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    throw new Error("Failed to fetch sales stats");
  }
}

/**
 * 获取团建统计信息
 */
export async function getWorkshopStats(startDate?: string, endDate?: string) {
  try {
    // 构建日期范围
    let dateRange: any = {};

    if (startDate && endDate) {
      dateRange = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      dateRange = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateRange = {
        lte: new Date(endDate),
      };
    } else {
      // 默认获取最近30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateRange = {
        gte: thirtyDaysAgo,
      };
    }

    // 获取团建活动
    const activities = await prisma.workshopActivity.findMany({
      where: {
        date: dateRange,
      },
      include: {
        channel: true,
        instructor: true,
        assistant: true,
        participants: true,
      },
    });

    // 计算总参与人数
    const totalParticipants = activities.reduce((sum, activity) => {
      return sum + (activity.participantCount || activity.participants.length || 0);
    }, 0);

    // 计算总收入
    const totalFee = activities.reduce((sum, activity) => sum + (activity.fee || 0), 0);

    // 按渠道统计
    const channelStats: Record<number, { channelId: number, name: string, count: number, fee: number }> = {};

    for (const activity of activities) {
      if (activity.channelId) {
        if (!channelStats[activity.channelId]) {
          channelStats[activity.channelId] = {
            channelId: activity.channelId,
            name: activity.channel?.name || "未知渠道",
            count: 0,
            fee: 0,
          };
        }
        channelStats[activity.channelId].count += 1;
        channelStats[activity.channelId].fee += activity.fee || 0;
      }
    }

    // 转换为数组并排序
    const topChannels = Object.values(channelStats)
      .sort((a, b) => b.count - a.count);

    // 按讲师统计
    const instructorStats: Record<number, { instructorId: number, name: string, count: number }> = {};

    for (const activity of activities) {
      if (activity.instructorId) {
        if (!instructorStats[activity.instructorId]) {
          instructorStats[activity.instructorId] = {
            instructorId: activity.instructorId,
            name: activity.instructor?.name || "未知讲师",
            count: 0,
          };
        }
        instructorStats[activity.instructorId].count += 1;
      }
    }

    // 转换为数组并排序
    const topInstructors = Object.values(instructorStats)
      .sort((a, b) => b.count - a.count);

    return {
      activityCount: activities.length,
      totalParticipants,
      totalFee,
      topChannels,
      topInstructors,
    };
  } catch (error) {
    console.error("Error fetching workshop stats:", error);
    throw new Error("Failed to fetch workshop stats");
  }
}

/**
 * 创建数据库备份
 */
export async function createBackup(reason: string = "manual") {
  try {
    // 导入备份模块
    const { createBackup } = await import("@/lib/backup");

    // 调用备份函数
    const backupPath = await createBackup(reason);

    // 在服务器操作中调用revalidatePath
    revalidatePath('/settings/backup');

    // 返回备份路径
    return {
      success: true,
      path: backupPath,
      message: "备份创建成功"
    };
  } catch (error) {
    console.error("Error creating database backup:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create database backup");
  }
}

/**
 * 获取数据库备份列表
 */
export async function getBackupsList() {
  try {
    // 导入备份模块
    const { getBackupsList } = await import("@/lib/backup");

    // 调用获取备份列表函数
    const backups = getBackupsList();

    return backups;
  } catch (error) {
    console.error("Error fetching database backups:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch database backups");
  }
}

/**
 * 恢复数据库备份
 */
export async function restoreBackup(filePath: string) {
  try {
    // 导入备份模块
    const { restoreBackup } = await import("@/lib/backup");

    // 调用恢复备份函数
    const result = await restoreBackup(filePath);

    // 在服务器操作中调用revalidatePath
    revalidatePath('/settings/backup');

    return result;
  } catch (error) {
    console.error("Error restoring database backup:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to restore database backup");
  }
}

/**
 * 删除数据库备份
 */
export async function deleteBackup(filePath: string) {
  try {
    // 导入备份模块
    const { deleteBackup } = await import("@/lib/backup");

    // 调用删除备份函数
    const result = await deleteBackup(filePath);

    // 在服务器操作中调用revalidatePath
    revalidatePath('/settings/backup');

    return result;
  } catch (error) {
    console.error("Error deleting database backup:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete database backup");
  }
}

/**
 * 获取系统信息
 *
 * 获取系统运行状态、资源使用情况和技术栈信息。
 *
 * @returns 系统信息对象
 *
 * @example
 * ```typescript
 * // 获取系统信息
 * const info = await getSystemInfo();
 * console.log(info.version); // 输出系统版本
 * ```
 *
 * @category 查询
 */
export async function getSystemInfo() {
  try {
    // 获取系统基本信息
    const os = require('os');
    const uptime = process.uptime();
    const nodeVersion = process.version;
    const platform = process.platform;

    // 获取内存信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // 获取系统统计信息
    const [
      userCount,
      productCount,
      orderCount,
      customerCount,
      workshopCount,
      employeeCount,
      supplierCount,
      inventoryCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.workshopActivity.count(),
      prisma.employee.count(),
      prisma.supplier.count(),
      prisma.inventoryItem.count(),
    ]);

    // 获取数据库信息
    let databaseInfo;
    try {
      // 获取数据库类型和版本
      const databaseType = "PostgreSQL"; // 从环境变量或配置中获取

      // 获取表数量
      const tables = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      const tableCount = Number(tables[0].count);

      // 获取记录总数（估计值）
      const recordsQuery = await prisma.$queryRaw`
        SELECT
          SUM(n_live_tup) as total_records
        FROM
          pg_stat_user_tables
      `;
      const recordCount = Number(recordsQuery[0].total_records || 0);

      // 获取数据库大小
      const sizeQuery = await prisma.$queryRaw`
        SELECT pg_database_size(current_database()) as size
      `;
      const databaseSize = Number(sizeQuery[0].size);

      // 获取数据库版本
      const versionQuery = await prisma.$queryRaw`SELECT version()`;
      const versionString = String(versionQuery[0].version);
      const versionMatch = versionString.match(/PostgreSQL (\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : "未知";

      databaseInfo = {
        type: databaseType,
        version,
        size: databaseSize,
        tables: tableCount,
        records: recordCount
      };
    } catch (error) {
      console.error("Error fetching database info:", error);
      databaseInfo = {
        type: "PostgreSQL",
        version: "未知",
        size: 0,
        tables: 0,
        records: 0
      };
    }

    // 获取存储信息（估计值）
    const storageInfo = {
      total: 1000 * 1024 * 1024 * 1024, // 1TB
      free: 500 * 1024 * 1024 * 1024,   // 500GB
      used: 500 * 1024 * 1024 * 1024    // 500GB
    };

    // 系统技术栈信息
    const techStack = {
      frontend: [
        { name: "Next.js", version: "15.2.4", description: "React框架，用于构建服务端渲染和静态网站" },
        { name: "React", version: "18.2.0", description: "用户界面库" },
        { name: "Tailwind CSS", version: "3.3.0", description: "实用优先的CSS框架" },
        { name: "shadcn/ui", version: "latest", description: "基于Radix UI的组件库" },
        { name: "Lucide React", version: "latest", description: "图标库" },
        { name: "React Hook Form", version: "latest", description: "表单处理库" },
        { name: "Zod", version: "latest", description: "TypeScript优先的模式验证库" }
      ],
      backend: [
        { name: "Node.js", version: nodeVersion.replace('v', ''), description: "JavaScript运行时" },
        { name: "Next.js API Routes", version: "15.2.4", description: "API路由" },
        { name: "NextAuth.js", version: "latest", description: "认证库" },
        { name: "Prisma", version: "latest", description: "ORM数据库工具" },
        { name: "PostgreSQL", version: databaseInfo.version, description: "关系型数据库" }
      ],
      devTools: [
        { name: "TypeScript", version: "5.0.0", description: "JavaScript的超集，添加静态类型" },
        { name: "ESLint", version: "latest", description: "代码质量工具" },
        { name: "Prettier", version: "latest", description: "代码格式化工具" }
      ]
    };

    // 系统模块信息
    const modules = [
      {
        name: "产品管理",
        code: "products",
        description: "管理产品信息、分类和价格",
        tables: ["Product", "ProductCategory", "ProductImage"],
        features: ["产品创建与编辑", "产品分类管理", "产品图片上传", "产品导入导出"]
      },
      {
        name: "库存管理",
        code: "inventory",
        description: "管理库存、仓库和库存变动",
        tables: ["InventoryItem", "Warehouse", "InventoryTransaction"],
        features: ["库存查询", "库存调拨", "库存预警", "库存分析"]
      },
      {
        name: "采购管理",
        code: "purchasing",
        description: "管理供应商和采购订单",
        tables: ["Supplier", "PurchaseOrder", "PurchaseOrderItem"],
        features: ["供应商管理", "采购订单创建", "采购订单跟踪", "采购分析"]
      },
      {
        name: "生产管理",
        code: "production",
        description: "管理生产计划和计件工作",
        tables: ["PieceWork", "PieceWorkItem", "PieceWorkDetail"],
        features: ["计件工作管理", "计件工项设置", "计件工资计算"]
      },
      {
        name: "销售管理",
        code: "sales",
        description: "管理销售订单、客户和销售记录",
        tables: ["Order", "OrderItem", "Customer", "GallerySale", "GallerySaleItem", "CoffeeShopSale", "CoffeeShopItem"],
        features: ["订单管理", "客户管理", "珐琅馆销售", "咖啡厅销售"]
      },
      {
        name: "人力资源",
        code: "hr",
        description: "管理员工、排班和薪资",
        tables: ["Employee", "Schedule", "ScheduleTemplate", "SalaryRecord", "SalaryAdjustment"],
        features: ["员工管理", "排班管理", "薪资管理", "绩效管理"]
      },
      {
        name: "财务管理",
        code: "finance",
        description: "管理财务记录和报表",
        tables: ["SalaryRecord", "SalaryAdjustment"],
        features: ["薪资发放", "收支记录", "财务报表"]
      },
      {
        name: "渠道管理",
        code: "channels",
        description: "管理销售渠道和佣金",
        tables: ["Channel", "ChannelPrice"],
        features: ["渠道管理", "渠道价格设置", "渠道佣金计算"]
      },
      {
        name: "账号管理",
        code: "accounts",
        description: "管理用户账号和权限",
        tables: ["User", "Role", "Permission"],
        features: ["用户管理", "角色管理", "权限设置", "登录日志"]
      },
      {
        name: "系统管理",
        code: "system",
        description: "管理系统设置和日志",
        tables: ["SystemSetting", "SystemLog"],
        features: ["系统设置", "系统日志", "数据备份", "系统监控"]
      }
    ];

    // 返回系统信息
    return {
      version: "1.2.0", // 系统版本
      name: "聆花掐丝珐琅馆ERP系统",
      description: "专为聆花掐丝珐琅馆定制的企业资源计划系统",
      uptime,
      nodeVersion,
      platform,
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory
      },
      database: databaseInfo,
      storage: storageInfo,
      stats: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        customers: customerCount,
        workshops: workshopCount,
        employees: employeeCount,
        suppliers: supplierCount,
        inventory: inventoryCount,
      },
      techStack,
      modules,
      buildInfo: {
        buildDate: "2024-05-19",
        environment: process.env.NODE_ENV || "development",
        databaseName: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.substring(1) : "linghua_erp"
      }
    };
  } catch (error) {
    console.error("Error fetching system info:", error);
    throw new Error("Failed to fetch system info");
  }
}

/**
 * 获取仪表盘数据
 *
 * 获取系统仪表盘所需的各种统计数据，包括销售、咖啡厅、工作坊等数据。
 *
 * @param timeRange 时间范围，可以是'week'、'month'或'quarter'
 * @returns 仪表盘数据
 */
/**
 * 获取待办事项列表
 *
 * @param limit 限制返回的待办事项数量
 * @param filter 筛选条件，可以是'all'、'completed'、'high'等
 * @returns 待办事项列表
 */
export async function getTodoList(limit: number = 5, filter: string = 'all') {
  try {
    // 这里应该从数据库获取待办事项
    // 由于目前没有待办事项表，我们返回一个空数组
    // 后续可以创建待办事项表并实现此功能
    return [];
  } catch (error) {
    console.error("Error fetching todo list:", error);
    throw new Error("Failed to fetch todo list");
  }
}

/**
 * 获取通知列表
 *
 * @param limit 限制返回的通知数量
 * @param filter 筛选条件，可以是'all'、'unread'、'order'等
 * @returns 通知列表
 */
export async function getNotifications(limit: number = 5, filter: string = 'all') {
  try {
    // 这里应该从数据库获取通知
    // 由于目前没有通知表，我们返回一个空数组
    // 后续可以创建通知表并实现此功能
    return [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

/**
 * 获取手作团建日程
 *
 * @param limit 限制返回的日程数量
 * @param daysAhead 获取未来多少天的日程
 * @returns 手作团建日程列表
 */
export async function getWorkshopSchedule(limit: number = 5, daysAhead: number = 7) {
  try {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + daysAhead);

    // 从数据库获取手作团建日程
    const workshops = await prisma.workshop.findMany({
      where: {
        date: {
          gte: now,
          lte: endDate
        }
      },
      include: {
        activity: true,
        teacher: true,
        assistant: true,
        customer: true
      },
      orderBy: {
        date: 'asc'
      },
      take: limit
    });

    // 转换为前端需要的格式
    return workshops.map(workshop => ({
      id: workshop.id,
      title: workshop.activity?.name || '手作团建活动',
      date: workshop.date,
      startTime: workshop.startTime || '09:00',
      endTime: workshop.endTime || '12:00',
      location: workshop.location || '聆花掐丝珐琅馆',
      locationType: workshop.location === '聆花掐丝珐琅馆' ? 'inside' : 'outside',
      participants: workshop.participantsCount || 0,
      teacher: {
        id: workshop.teacher?.id || 0,
        name: workshop.teacher?.name || '未分配',
        avatar: workshop.teacher?.avatar
      },
      assistant: workshop.assistant ? {
        id: workshop.assistant.id,
        name: workshop.assistant.name,
        avatar: workshop.assistant.avatar
      } : undefined,
      status: 'upcoming'
    }));
  } catch (error) {
    console.error("Error fetching workshop schedule:", error);
    throw new Error("Failed to fetch workshop schedule");
  }
}

export async function getDashboardData(timeRange: string = 'month') {
  try {
    // 根据时间范围确定日期
    const now = new Date();
    let startDate: Date;

    if (timeRange === 'week') {
      // 最近一周
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      // 最近一个月
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'quarter') {
      // 最近三个月
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else {
      // 默认一个月
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    // 上一个时间段的开始日期
    const previousStartDate = new Date(startDate);
    if (timeRange === 'week') {
      previousStartDate.setDate(previousStartDate.getDate() - 7);
    } else if (timeRange === 'month') {
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    } else if (timeRange === 'quarter') {
      previousStartDate.setMonth(previousStartDate.getMonth() - 3);
    }

    // 获取珐琅馆销售数据
    const gallerySales = await prisma.gallerySale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const previousGallerySales = await prisma.gallerySale.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    // 计算珐琅馆销售总额
    const gallerySalesTotal = gallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const previousGallerySalesTotal = previousGallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const gallerySalesGrowth = previousGallerySalesTotal === 0 ? 100 :
      ((gallerySalesTotal - previousGallerySalesTotal) / previousGallerySalesTotal) * 100;

    // 获取咖啡厅销售数据
    const coffeeSales = await prisma.coffeeShopSale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now
        }
      }
    });

    const previousCoffeeSales = await prisma.coffeeShopSale.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    // 计算咖啡厅销售总额
    const coffeeSalesTotal = coffeeSales.reduce((sum, sale) => sum + sale.amount, 0);
    const previousCoffeeSalesTotal = previousCoffeeSales.reduce((sum, sale) => sum + sale.amount, 0);
    const coffeeSalesGrowth = previousCoffeeSalesTotal === 0 ? 100 :
      ((coffeeSalesTotal - previousCoffeeSalesTotal) / previousCoffeeSalesTotal) * 100;

    // 获取工作坊数据
    const workshops = await prisma.workshop.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        activity: true,
        teacher: true,
        assistant: true
      }
    });

    const previousWorkshops = await prisma.workshop.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });

    // 计算工作坊数量
    const workshopsCount = workshops.length;
    const previousWorkshopsCount = previousWorkshops.length;
    const workshopsGrowth = previousWorkshopsCount === 0 ? 100 :
      ((workshopsCount - previousWorkshopsCount) / previousWorkshopsCount) * 100;

    // 获取员工数据
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true
      }
    });

    // 获取库存数据
    const products = await prisma.product.findMany();
    const lowStockProducts = products.filter(product => product.inventory !== null && product.inventory <= 10 && product.inventory > 0);

    // 获取最近销售记录
    const recentSales = await prisma.gallerySale.findMany({
      take: 5,
      orderBy: {
        date: 'desc'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        createdBy: true
      }
    });

    // 获取热销产品
    const productSales = {};
    for (const sale of gallerySales) {
      for (const item of sale.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            id: item.productId,
            name: item.product.name,
            sales: 0
          };
        }
        productSales[item.productId].sales += item.price * item.quantity;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 准备销售趋势数据
    const gallerySalesTrend = [];
    const coffeeSalesTrend = [];

    // 根据时间范围确定数据点数量
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

    // 生成日期范围
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 查找当天的销售数据
      const daySales = gallerySales.filter(sale =>
        new Date(sale.date).toISOString().split('T')[0] === dateStr
      );

      const dayCoffeeSales = coffeeSales.filter(sale =>
        new Date(sale.date).toISOString().split('T')[0] === dateStr
      );

      // 计算当天销售额
      const daySalesAmount = daySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const dayCoffeeSalesAmount = dayCoffeeSales.reduce((sum, sale) => sum + sale.amount, 0);

      // 添加到趋势数据
      gallerySalesTrend.push({
        date: dateStr,
        value: daySalesAmount
      });

      coffeeSalesTrend.push({
        date: dateStr,
        value: dayCoffeeSalesAmount
      });
    }

    // 返回仪表盘数据
    return {
      gallerySales: {
        current: gallerySalesTotal,
        previous: previousGallerySalesTotal,
        growth: gallerySalesGrowth,
        data: gallerySalesTrend
      },
      coffeeSales: {
        current: coffeeSalesTotal,
        previous: previousCoffeeSalesTotal,
        growth: coffeeSalesGrowth,
        data: coffeeSalesTrend
      },
      workshops: {
        current: workshopsCount,
        previous: previousWorkshopsCount,
        growth: workshopsGrowth,
        data: []
      },
      employees: {
        total: employees.length,
        active: employees.filter(e => e.isActive).length,
        performance: []
      },
      inventory: {
        total: products.reduce((sum, product) => sum + (product.inventory || 0), 0),
        lowStock: lowStockProducts.length,
        distribution: []
      },
      recentSales: recentSales.map(sale => ({
        id: sale.id,
        date: sale.date,
        amount: sale.totalAmount,
        employee: sale.createdBy?.name || '未知',
        items: sale.items.length
      })),
      topProducts: topProducts
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
}
