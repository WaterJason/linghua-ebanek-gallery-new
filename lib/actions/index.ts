/**
 * 服务器操作函数索引
 *
 * 这个文件导出所有模块化的服务器操作函数的类型定义。
 *
 * 推荐的导入方式：
 * 1. 直接从特定模块导入函数: `import { getUsers } from "@/lib/actions/user-actions"`
 * 2. 导入整个模块: `import * as userActions from "@/lib/actions/user-actions"`
 *
 * @deprecated 此文件将在2024年6月30日后移除。请直接从特定模块导入函数。
 * @module actions
 */

// 只导出类型定义，不导入模块

// 导出类型定义
export * from './types';

/**
 * 模块导入指南
 *
 * 用户相关: `import { getUsers, createUser } from "@/lib/actions/user-actions"`
 * 认证相关: `import { getCurrentUser, login } from "@/lib/actions/auth-actions"`
 * 角色相关: `import { getRoles, createRole } from "@/lib/actions/role-actions"`
 * 员工相关: `import { getEmployees, createEmployee } from "@/lib/actions/employee-actions"`
 * 产品相关: `import { getProducts, createProduct } from "@/lib/actions/product-actions"`
 * 库存相关: `import { getInventory, updateInventory } from "@/lib/actions/inventory-actions"`
 * 销售相关: `import { getSalesOrders, createSalesOrder } from "@/lib/actions/sales-actions"`
 * 采购相关: `import { getPurchaseOrders, createPurchaseOrder } from "@/lib/actions/purchase-actions"`
 * 团建相关: `import { getWorkshopActivities, createWorkshopActivity } from "@/lib/actions/workshop-actions"`
 * 系统相关: `import { getSystemSettings, updateSystemSetting } from "@/lib/actions/system-actions"`
 * 日程相关: `import { getSchedules, createSchedule } from "@/lib/actions/schedule-actions"`
 * 渠道相关: `import { getChannels, createChannel } from "@/lib/actions/channel-actions"`
 */
