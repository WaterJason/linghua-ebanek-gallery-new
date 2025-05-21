/**
 * 通用类型定义
 */

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 日期范围
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

// 排序参数
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// 过滤参数
export interface FilterParams {
  field: string;
  value: string | number | boolean | null;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';
}

/**
 * 用户相关类型
 */

// 用户创建参数
export interface UserCreateParams {
  name: string;
  email: string;
  password: string;
  role?: string;
  roleIds?: number[];
}

// 用户更新参数
export interface UserUpdateParams {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  roleIds?: number[];
}

// 用户角色更新参数
export interface UserRolesUpdateParams {
  userId: string;
  roleIds: number[];
}

// 用户资料更新参数
export interface UserProfileUpdateParams {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  image?: string;
}

// 用户密码更新参数
export interface UserPasswordUpdateParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 用户设置更新参数
export interface UserSettingsUpdateParams {
  theme?: string;
  language?: string;
  enableNotifications?: boolean;
  enableTwoFactorAuth?: boolean;
}

/**
 * 角色相关类型
 */

// 角色创建参数
export interface RoleCreateParams {
  name: string;
  code: string;
  description?: string;
  permissionIds?: number[];
}

// 角色更新参数
export interface RoleUpdateParams {
  name?: string;
  code?: string;
  description?: string;
}

// 角色权限更新参数
export interface RolePermissionsUpdateParams {
  roleId: number;
  permissionIds: number[];
}

/**
 * 员工相关类型
 */

// 员工创建参数
export interface EmployeeCreateParams {
  name: string;
  position?: string;
  department?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  salary?: number;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  idNumber?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  userId?: string;
}

// 员工更新参数
export interface EmployeeUpdateParams {
  name?: string;
  position?: string;
  department?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  salary?: number;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  idNumber?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  userId?: string;
}

// 薪资记录创建参数
export interface SalaryRecordCreateParams {
  employeeId: number;
  month: string;
  baseSalary?: number;
  overtimePay?: number;
  bonus?: number;
  deductions?: number;
  totalSalary?: number;
  status?: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  notes?: string;
  adjustments?: SalaryAdjustmentCreateParams[];
}

// 薪资记录更新参数
export interface SalaryRecordUpdateParams {
  baseSalary?: number;
  overtimePay?: number;
  bonus?: number;
  deductions?: number;
  totalSalary?: number;
  status?: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  notes?: string;
  adjustments?: SalaryAdjustmentCreateParams[];
}

// 薪资调整创建参数
export interface SalaryAdjustmentCreateParams {
  salaryRecordId: number;
  type: 'bonus' | 'deduction';
  amount: number;
  reason?: string;
}

/**
 * 产品相关类型
 */

// 产品创建参数
export interface ProductCreateParams {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  categoryId?: number;
  unitId?: number;
  images?: string[];
  dimensions?: Record<string, any>;
  weight?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  attributes?: Record<string, any>;
  tagIds?: number[];
  materialIds?: number[];
}

// 产品更新参数
export interface ProductUpdateParams {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  categoryId?: number;
  unitId?: number;
  images?: string[];
  dimensions?: Record<string, any>;
  weight?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  attributes?: Record<string, any>;
  tagIds?: number[];
  materialIds?: number[];
}

// 产品分类创建参数
export interface ProductCategoryCreateParams {
  name: string;
  description?: string;
  parentId?: number;
  image?: string;
  isActive?: boolean;
}

// 产品分类更新参数
export interface ProductCategoryUpdateParams {
  name?: string;
  description?: string;
  parentId?: number;
  image?: string;
  isActive?: boolean;
}

// 产品标签创建参数
export interface ProductTagCreateParams {
  name: string;
  description?: string;
  color?: string;
}

// 产品标签更新参数
export interface ProductTagUpdateParams {
  name?: string;
  description?: string;
  color?: string;
}

/**
 * 库存相关类型
 */

// 库存创建参数
export interface InventoryCreateParams {
  productId: number;
  quantity?: number;
  locationId?: number;
  notes?: string;
}

// 库存更新参数
export interface InventoryUpdateParams {
  quantity?: number;
  locationId?: number;
  notes?: string;
}

// 库存转移参数
export interface InventoryTransferParams {
  productId: number;
  quantity: number;
  fromLocationId: number;
  toLocationId?: number;
}

// 库存位置创建参数
export interface InventoryLocationCreateParams {
  name: string;
  description?: string;
  isActive?: boolean;
}

// 库存位置更新参数
export interface InventoryLocationUpdateParams {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * 销售相关类型
 */

// 销售订单创建参数
export interface SalesOrderCreateParams {
  customerId?: number;
  items: SalesOrderItemCreateParams[];
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  payment?: PaymentCreateParams;
  createdById?: string;
}

// 销售订单更新参数
export interface SalesOrderUpdateParams {
  customerId?: number;
  items?: SalesOrderItemCreateParams[];
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  payment?: PaymentCreateParams;
}

// 销售订单项创建参数
export interface SalesOrderItemCreateParams {
  productId: number;
  quantity: number;
  price: number;
  discount?: number;
  notes?: string;
}

// 支付创建参数
export interface PaymentCreateParams {
  amount: number;
  method?: 'cash' | 'card' | 'transfer' | 'other';
  status?: 'pending' | 'completed' | 'failed';
  notes?: string;
}

// 客户创建参数
export interface CustomerCreateParams {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// 客户更新参数
export interface CustomerUpdateParams {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * 采购相关类型
 */

// 采购订单创建参数
export interface PurchaseOrderCreateParams {
  supplierId?: number;
  items: PurchaseOrderItemCreateParams[];
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  expectedDeliveryDate?: string;
  createdById?: string;
}

// 采购订单更新参数
export interface PurchaseOrderUpdateParams {
  supplierId?: number;
  items?: PurchaseOrderItemCreateParams[];
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  expectedDeliveryDate?: string;
}

// 采购订单项创建参数
export interface PurchaseOrderItemCreateParams {
  productId: number;
  quantity: number;
  price: number;
  notes?: string;
}

// 采购订单接收参数
export interface PurchaseOrderReceiveParams {
  receivedItems: {
    itemId: number;
    receivedQuantity: number;
    notes?: string;
  }[];
}

// 供应商创建参数
export interface SupplierCreateParams {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// 供应商更新参数
export interface SupplierUpdateParams {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * 团建相关类型
 */

// 团建活动创建参数
export interface WorkshopActivityCreateParams {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  channelId?: number;
  instructorId?: number;
  assistantId?: number;
  participantCount?: number;
  fee?: number;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  participantIds?: number[];
  createdById?: string;
}

// 团建活动更新参数
export interface WorkshopActivityUpdateParams {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  channelId?: number;
  instructorId?: number;
  assistantId?: number;
  participantCount?: number;
  fee?: number;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  participantIds?: number[];
}

// 团建渠道创建参数
export interface WorkshopChannelCreateParams {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// 团建渠道更新参数
export interface WorkshopChannelUpdateParams {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// 团建讲师创建参数
export interface WorkshopInstructorCreateParams {
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  bio?: string;
  fee?: number;
  isActive?: boolean;
}

// 团建讲师更新参数
export interface WorkshopInstructorUpdateParams {
  name?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  bio?: string;
  fee?: number;
  isActive?: boolean;
}

// 团建参与者创建参数
export interface WorkshopParticipantCreateParams {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
}

// 团建参与者更新参数
export interface WorkshopParticipantUpdateParams {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
}

/**
 * 日程相关类型
 */

// 日程创建参数
export interface ScheduleCreateParams {
  employeeId: number;
  date: string;
  startTime?: string;
  endTime?: string;
  type?: 'work' | 'off' | 'leave' | 'training' | 'meeting' | 'other';
  location?: string;
  notes?: string;
  checkConflict?: boolean;
  createdById?: string;
}

// 日程批量创建参数
export interface ScheduleBatchCreateParams {
  employeeIds: number[];
  dates: string[];
  startTime?: string;
  endTime?: string;
  type?: 'work' | 'off' | 'leave' | 'training' | 'meeting' | 'other';
  location?: string;
  notes?: string;
  checkConflict?: boolean;
  createdById?: string;
}

// 日程更新参数
export interface ScheduleUpdateParams {
  employeeId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: 'work' | 'off' | 'leave' | 'training' | 'meeting' | 'other';
  location?: string;
  notes?: string;
  checkConflict?: boolean;
}

/**
 * 渠道相关类型
 */

// 渠道创建参数
export interface ChannelCreateParams {
  name: string;
  type?: 'online' | 'offline' | 'partner' | 'agent' | 'other';
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  commission?: number;
  notes?: string;
  isActive?: boolean;
}

// 渠道更新参数
export interface ChannelUpdateParams {
  name?: string;
  type?: 'online' | 'offline' | 'partner' | 'agent' | 'other';
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  commission?: number;
  notes?: string;
  isActive?: boolean;
}

// 渠道佣金更新参数
export interface ChannelCommissionUpdateParams {
  commissionAmount?: number;
  status?: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  notes?: string;
}

/**
 * 系统相关类型
 */

// 系统设置更新参数
export interface SystemSettingUpdateParams {
  key: string;
  value: any;
}

// 系统日志创建参数
export interface SystemLogCreateParams {
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  module: string;
  details?: string;
  userId?: string;
}
