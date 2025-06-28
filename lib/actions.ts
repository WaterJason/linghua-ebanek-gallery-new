/**
 * 服务器操作函数桥接文件
 *
 * 这个文件仅用于向后兼容，重新导出所有模块化的服务器操作函数。
 * 推荐直接从特定模块导入函数，例如：
 * import { getUsers } from "@/lib/actions/user-actions";
 *
 * 注意：此文件不包含 "use server" 指令，因为它导出了非异步函数和类型定义。
 * 所有实际的服务器操作函数都在各自的模块文件中，并且这些文件都包含 "use server" 指令。
 *
 * @deprecated 此文件将在2024年6月30日后移除。请直接从特定模块导入函数。
 */

// 导出所有模块
export * from "./actions/user-actions";
export * from "./actions/auth-actions";
export * from "./actions/role-actions";
export * from "./actions/employee-actions";
export * from "./actions/product-actions";
export * from "./actions/inventory-actions";
export * from "./actions/sales-actions";
export * from "./actions/purchase-actions";
export * from "./actions/workshop-actions";
export * from "./actions/system-actions";
export * from "./actions/schedule-actions";
export * from "./actions/channel-actions";

// 从customer-actions中导入特定函数，避免与sales-actions冲突
import {
  getCustomers as getCustomersFromCustomerActions,
  createCustomer as createCustomerFromCustomerActions,
  updateCustomer as updateCustomerFromCustomerActions,
  deleteCustomer as deleteCustomerFromCustomerActions
} from "./actions/customer-actions";

// 重新导出customer-actions中的函数
export {
  getCustomersFromCustomerActions as getCustomers,
  createCustomerFromCustomerActions as createCustomer,
  updateCustomerFromCustomerActions as updateCustomer,
  deleteCustomerFromCustomerActions as deleteCustomer
};

// 导出类型定义
export * from "./actions/types";

// 创建日志的简化函数，直接调用 createSystemLog
import { createSystemLog } from "./actions/system-actions";
export const createLog = async (data: {
  module: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: any;
  userId?: string;
}) => {
  return createSystemLog(data);
};
