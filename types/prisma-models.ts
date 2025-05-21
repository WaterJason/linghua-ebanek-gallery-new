/**
 * Prisma 模型类型定义
 *
 * 这个文件包含与 Prisma 模型完全匹配的 TypeScript 接口
 * 用于确保代码中使用的类型与数据库模型一致
 */

/**
 * 用户模型接口
 */
export interface PrismaUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  employeeId: number | null;
  roles: number[];
  bio: string | null;
  phone: string | null;
  lastLogin: Date | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
}

/**
 * 员工模型接口
 */
export interface PrismaEmployee {
  id: number;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  dailySalary: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  idNumber: string | null;
  bankAccount: string | null;
  bankName: string | null;
  salary: number | null;
}

/**
 * 产品模型接口
 */
export interface PrismaProduct {
  id: number;
  name: string;
  price: number;
  commissionRate: number;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  barcode: string | null;
  category: string | null;
  categoryId: number | null;
  cost: number | null;
  sku: string | null;
  details: string | null;
  dimensions: string | null;
  material: string | null;
  unit: string | null;
  inventory: number | null;
}

/**
 * 产品分类模型接口
 */
export interface PrismaProductCategory {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: number | null;
  level: number;
  path: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 客户模型接口
 */
export interface PrismaCustomer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  type: string;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 订单模型接口
 */
export interface PrismaOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  employeeId: number;
  orderDate: Date;
  status: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  isCustom: boolean;
  customDesign: string | null;
  customRequirements: string | null;
  designImageUrl: string | null;
  expectedDeliveryDate: Date | null;
  designApproved: boolean | null;
  designerNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 订单项模型接口
 */
export interface PrismaOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  discount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 供应商模型接口
 */
export interface PrismaSupplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 采购订单模型接口
 */
export interface PrismaPurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  employeeId: number;
  orderDate: Date;
  expectedDate: Date | null;
  status: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 采购订单项模型接口
 */
export interface PrismaPurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  price: number;
  receivedQuantity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 系统设置模型接口
 */
export interface PrismaSystemSetting {
  id: number;
  companyName: string;
  coffeeSalesCommissionRate: number;
  gallerySalesCommissionRate: number;
  teacherWorkshopFee: number;
  assistantWorkshopFee: number;
  teacherWorkshopFeeOutside: number;
  assistantWorkshopFeeOutside: number;
  teacherWorkshopFeeInside: number;
  assistantWorkshopFeeInside: number;
  enableImageUpload: boolean;
  enableNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
  basicWorkingDays: number;
  basicWorkingHours: number;
  holidayOvertimeRate: number;
  overtimeRate: number;
  socialInsuranceRate: number;
  taxRate: number;
  weekendOvertimeRate: number;
}

/**
 * 角色模型接口
 */
export interface PrismaRole {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 权限模型接口
 */
export interface PrismaPermission {
  id: number;
  name: string;
  code: string;
  module: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户角色模型接口
 */
export interface PrismaUserRole {
  id: number;
  userId: string;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 角色权限模型接口
 */
export interface PrismaRolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt: Date;
}

/**
 * 渠道模型接口
 */
export interface PrismaChannel {
  id: number;
  name: string;
  code: string;
  description: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 渠道价格模型接口
 */
export interface PrismaChannelPrice {
  id: number;
  channelId: number;
  productId: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 渠道库存模型接口
 */
export interface PrismaChannelInventory {
  id: number;
  channelId: number;
  productId: number;
  quantity: number;
  minQuantity: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工作坊模型接口
 */
export interface PrismaWorkshop {
  id: number;
  date: Date;
  productId: number | null;
  teacherId: number;
  assistantId: number | null;
  role: string;
  locationType: string;
  location: string;
  participants: number;
  duration: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activityId: number | null;
  channelId: number | null;
  customerId: number | null;
  status: string | null;
}

/**
 * 工作坊活动模型接口
 */
export interface PrismaWorkshopActivity {
  id: number;
  name: string;
  description: string | null;
  productId: number;
  duration: number;
  minParticipants: number;
  maxParticipants: number;
  price: number;
  materialFee: number;
  teacherFee: number;
  assistantFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建产品的输入类型
 * 用于 createProduct 函数
 */
export interface CreateProductInput {
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  commissionRate: number;
  cost?: number | null;
  categoryId?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  dimensions?: string | null;
  material?: string | null;
  inventory?: number | null;
  details?: string | null;
  type?: string;
  isActive?: boolean;
}

/**
 * 更新产品的输入类型
 * 用于 updateProduct 函数
 */
export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  price?: number;
  commissionRate?: number;
  cost?: number | null;
  categoryId?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  dimensions?: string | null;
  material?: string | null;
  inventory?: number | null;
  details?: string | null;
  type?: string;
  isActive?: boolean;
}

/**
 * 创建产品分类的输入类型
 * 用于 createProductCategory 函数
 */
export interface CreateProductCategoryInput {
  name: string;
  code?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: number | null;
}

/**
 * 更新产品分类的输入类型
 * 用于 updateProductCategory 函数
 */
export interface UpdateProductCategoryInput {
  name?: string;
  code?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: number | null;
}

/**
 * 批量更新产品的输入类型
 * 用于 batchUpdateProducts 函数
 */
export interface BatchUpdateProductsInput {
  id: number;
  name?: string;
  price?: number;
  commissionRate?: number;
  cost?: number | null;
  categoryId?: number | null;
  unit?: string | null;
  material?: string | null;
  isActive?: boolean;
}

/**
 * 创建客户的输入类型
 */
export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  type?: string;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 更新客户的输入类型
 */
export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  type?: string;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 创建订单的输入类型
 */
export interface CreateOrderInput {
  customerId: number;
  employeeId: number;
  orderDate: Date;
  status?: string;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  isCustom?: boolean;
  customDesign?: string | null;
  customRequirements?: string | null;
  designImageUrl?: string | null;
  expectedDeliveryDate?: Date | null;
  designApproved?: boolean | null;
  designerNotes?: string | null;
  items: CreateOrderItemInput[];
}

/**
 * 创建订单项的输入类型
 */
export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
  price: number;
  discount?: number;
  notes?: string | null;
}

/**
 * 更新订单的输入类型
 */
export interface UpdateOrderInput {
  customerId?: number;
  employeeId?: number;
  orderDate?: Date;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  isCustom?: boolean;
  customDesign?: string | null;
  customRequirements?: string | null;
  designImageUrl?: string | null;
  expectedDeliveryDate?: Date | null;
  designApproved?: boolean | null;
  designerNotes?: string | null;
  items?: UpdateOrderItemInput[];
}

/**
 * 更新订单项的输入类型
 */
export interface UpdateOrderItemInput {
  id?: number;
  productId?: number;
  quantity?: number;
  price?: number;
  discount?: number;
  notes?: string | null;
}

/**
 * 创建供应商的输入类型
 */
export interface CreateSupplierInput {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 更新供应商的输入类型
 */
export interface UpdateSupplierInput {
  name?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 创建采购订单的输入类型
 */
export interface CreatePurchaseOrderInput {
  supplierId: number;
  employeeId: number;
  orderDate: Date;
  expectedDate?: Date | null;
  status?: string;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  items: CreatePurchaseOrderItemInput[];
}

/**
 * 创建采购订单项的输入类型
 */
export interface CreatePurchaseOrderItemInput {
  productId: number;
  quantity: number;
  price: number;
  receivedQuantity?: number;
  notes?: string | null;
}

/**
 * 更新采购订单的输入类型
 */
export interface UpdatePurchaseOrderInput {
  supplierId?: number;
  employeeId?: number;
  orderDate?: Date;
  expectedDate?: Date | null;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string | null;
  notes?: string | null;
  items?: UpdatePurchaseOrderItemInput[];
}

/**
 * 更新采购订单项的输入类型
 */
export interface UpdatePurchaseOrderItemInput {
  id?: number;
  productId?: number;
  quantity?: number;
  price?: number;
  receivedQuantity?: number;
  notes?: string | null;
}

/**
 * 创建员工的输入类型
 */
export interface CreateEmployeeInput {
  name: string;
  position: string;
  phone?: string | null;
  email?: string | null;
  dailySalary: number;
  status?: string;
}

/**
 * 更新员工的输入类型
 */
export interface UpdateEmployeeInput {
  name?: string;
  position?: string;
  phone?: string | null;
  email?: string | null;
  dailySalary?: number;
  status?: string;
}

/**
 * 创建角色的输入类型
 */
export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string | null;
  isSystem?: boolean;
  permissions?: number[];
}

/**
 * 更新角色的输入类型
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  isSystem?: boolean;
  permissions?: number[];
}

/**
 * 创建权限的输入类型
 */
export interface CreatePermissionInput {
  name: string;
  code: string;
  module: string;
  description?: string | null;
}

/**
 * 更新权限的输入类型
 */
export interface UpdatePermissionInput {
  name?: string;
  module?: string;
  description?: string | null;
}

/**
 * 创建渠道的输入类型
 */
export interface CreateChannelInput {
  name: string;
  code: string;
  description?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  isActive?: boolean;
}

/**
 * 更新渠道的输入类型
 */
export interface UpdateChannelInput {
  name?: string;
  description?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  isActive?: boolean;
}

/**
 * 创建工作坊的输入类型
 */
export interface CreateWorkshopInput {
  date: Date;
  productId?: number | null;
  teacherId: number;
  assistantId?: number | null;
  role: string;
  locationType: string;
  location: string;
  participants: number;
  duration: number;
  notes?: string | null;
  activityId?: number | null;
  channelId?: number | null;
  customerId?: number | null;
  status?: string | null;
}

/**
 * 更新工作坊的输入类型
 */
export interface UpdateWorkshopInput {
  date?: Date;
  productId?: number | null;
  teacherId?: number;
  assistantId?: number | null;
  role?: string;
  locationType?: string;
  location?: string;
  participants?: number;
  duration?: number;
  notes?: string | null;
  activityId?: number | null;
  channelId?: number | null;
  customerId?: number | null;
  status?: string | null;
}

/**
 * 创建工作坊活动的输入类型
 */
export interface CreateWorkshopActivityInput {
  name: string;
  description?: string | null;
  productId: number;
  duration: number;
  minParticipants: number;
  maxParticipants: number;
  price: number;
  materialFee?: number;
  teacherFee?: number;
  assistantFee?: number;
  isActive?: boolean;
}

/**
 * 更新工作坊活动的输入类型
 */
export interface UpdateWorkshopActivityInput {
  name?: string;
  description?: string | null;
  productId?: number;
  duration?: number;
  minParticipants?: number;
  maxParticipants?: number;
  price?: number;
  materialFee?: number;
  teacherFee?: number;
  assistantFee?: number;
  isActive?: boolean;
}

/**
 * 库存项模型接口
 */
export interface PrismaInventoryItem {
  id: number;
  productId: number;
  quantity: number;
  warehouseId: number | null;
  createdAt: Date;
  updatedAt: Date;
  product?: PrismaProduct;
  warehouse?: PrismaWarehouse;
}

/**
 * 仓库模型接口
 */
export interface PrismaWarehouse {
  id: number;
  name: string;
  location: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventoryItems?: PrismaInventoryItem[];
}

/**
 * 库存事务模型接口
 */
export interface PrismaInventoryTransaction {
  id: number;
  productId: number;
  quantity: number;
  type: string;
  notes: string | null;
  sourceWarehouseId: number | null;
  targetWarehouseId: number | null;
  relatedTransactionId: number | null;
  createdAt: Date;
  updatedAt: Date;
  product?: PrismaProduct;
  sourceWarehouse?: PrismaWarehouse;
  targetWarehouse?: PrismaWarehouse;
  relatedTransaction?: PrismaInventoryTransaction;
}

/**
 * 创建库存项的输入类型
 */
export interface CreateInventoryItemInput {
  productId: number;
  quantity: number;
  warehouseId?: number | null;
}

/**
 * 更新库存项的输入类型
 */
export interface UpdateInventoryItemInput {
  quantity?: number;
  warehouseId?: number | null;
}

/**
 * 创建仓库的输入类型
 */
export interface CreateWarehouseInput {
  name: string;
  location: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 更新仓库的输入类型
 */
export interface UpdateWarehouseInput {
  name?: string;
  location?: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 库存转移的输入类型
 */
export interface InventoryTransferInput {
  productId: number;
  quantity: number;
  fromLocationId: number;
  toLocationId?: number | null;
  notes?: string | null;
}

/**
 * 工作坊活动模型接口
 */
export interface PrismaWorkshopActivity {
  id: number;
  title: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
  channelId: number | null;
  instructorId: number | null;
  assistantId: number | null;
  participantCount: number | null;
  fee: number | null;
  status: string;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  channel?: PrismaWorkshopChannel;
  instructor?: PrismaWorkshopInstructor;
  assistant?: PrismaWorkshopInstructor;
  participants?: any[];
  createdBy?: any;
}

/**
 * 工作坊渠道模型接口
 */
export interface PrismaWorkshopChannel {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  activities?: PrismaWorkshopActivity[];
}

/**
 * 工作坊讲师模型接口
 */
export interface PrismaWorkshopInstructor {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  bio: string | null;
  fee: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  instructedActivities?: PrismaWorkshopActivity[];
  assistedActivities?: PrismaWorkshopActivity[];
}

/**
 * 创建工作坊活动的输入类型
 */
export interface CreateWorkshopActivityInput {
  title: string;
  date: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  channelId?: number | null;
  instructorId?: number | null;
  assistantId?: number | null;
  participantCount?: number | null;
  fee?: number | null;
  status?: string;
  notes?: string | null;
  createdById?: string | null;
  participantIds?: number[];
}

/**
 * 更新工作坊活动的输入类型
 */
export interface UpdateWorkshopActivityInput {
  title?: string;
  date?: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  channelId?: number | null;
  instructorId?: number | null;
  assistantId?: number | null;
  participantCount?: number | null;
  fee?: number | null;
  status?: string;
  notes?: string | null;
  participantIds?: number[];
}

/**
 * 珐琅馆销售模型接口
 */
export interface PrismaGallerySale {
  id: number;
  date: Date;
  totalAmount: number;
  paymentMethod: string;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: PrismaGallerySaleItem[];
  createdBy?: any;
}

/**
 * 珐琅馆销售项模型接口
 */
export interface PrismaGallerySaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  price: number;
  discount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: PrismaProduct;
  sale?: PrismaGallerySale;
}

/**
 * 咖啡厅销售模型接口
 */
export interface PrismaCoffeeShopSale {
  id: number;
  date: Date;
  amount: number;
  customerCount: number | null;
  paymentMethod: string;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: any;
}

/**
 * 创建珐琅馆销售的输入类型
 */
export interface CreateGallerySaleInput {
  date: Date | string;
  paymentMethod?: string;
  notes?: string | null;
  createdById?: string | null;
  items: CreateGallerySaleItemInput[];
}

/**
 * 创建珐琅馆销售项的输入类型
 */
export interface CreateGallerySaleItemInput {
  productId: number;
  quantity: number;
  price: number;
  discount?: number;
  notes?: string | null;
}

/**
 * 更新珐琅馆销售的输入类型
 */
export interface UpdateGallerySaleInput {
  date?: Date | string;
  paymentMethod?: string;
  notes?: string | null;
  items?: UpdateGallerySaleItemInput[];
}

/**
 * 更新珐琅馆销售项的输入类型
 */
export interface UpdateGallerySaleItemInput {
  id?: number;
  productId?: number;
  quantity?: number;
  price?: number;
  discount?: number;
  notes?: string | null;
}

/**
 * 创建咖啡厅销售的输入类型
 */
export interface CreateCoffeeShopSaleInput {
  date: Date | string;
  amount: number;
  customerCount?: number | null;
  paymentMethod?: string;
  notes?: string | null;
  createdById?: string | null;
}

/**
 * 更新咖啡厅销售的输入类型
 */
export interface UpdateCoffeeShopSaleInput {
  date?: Date | string;
  amount?: number;
  customerCount?: number | null;
  paymentMethod?: string;
  notes?: string | null;
}

/**
 * 渠道模型接口
 */
export interface PrismaChannel {
  id: number;
  name: string;
  type: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commission: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  orders?: any[];
}

/**
 * 渠道佣金模型接口
 */
export interface PrismaChannelCommission {
  id: number;
  channelId: number;
  startDate: Date;
  endDate: Date;
  orderCount: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  paymentDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  channel?: PrismaChannel;
}

/**
 * 创建渠道的输入类型
 */
export interface CreateChannelInput {
  name: string;
  type?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  commission?: number | null;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 更新渠道的输入类型
 */
export interface UpdateChannelInput {
  name?: string;
  type?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  commission?: number | null;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 更新渠道佣金的输入类型
 */
export interface UpdateChannelCommissionInput {
  commissionAmount?: number;
  status?: string;
  paymentDate?: Date | string | null;
  notes?: string | null;
}

/**
 * 财务账户模型接口
 */
export interface PrismaFinancialAccount {
  id: number;
  name: string;
  accountNumber: string | null;
  accountType: string;
  bankName: string | null;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 财务分类模型接口
 */
export interface PrismaFinancialCategory {
  id: number;
  name: string;
  type: string;
  code: string;
  parentId: number | null;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 财务交易记录模型接口
 */
export interface PrismaFinancialTransaction {
  id: number;
  transactionDate: Date;
  amount: number;
  type: string;
  accountId: number;
  categoryId: number | null;
  paymentMethod: string | null;
  relatedId: number | null;
  relatedType: string | null;
  counterparty: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  status: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建财务账户的输入类型
 */
export interface CreateFinancialAccountInput {
  name: string;
  accountNumber?: string | null;
  accountType: string;
  bankName?: string | null;
  initialBalance: number;
  isActive?: boolean;
  notes?: string | null;
}

/**
 * 更新财务账户的输入类型
 */
export interface UpdateFinancialAccountInput {
  name?: string;
  accountNumber?: string | null;
  accountType?: string;
  bankName?: string | null;
  initialBalance?: number;
  isActive?: boolean;
  notes?: string | null;
}

/**
 * 创建财务分类的输入类型
 */
export interface CreateFinancialCategoryInput {
  name: string;
  type: string;
  code: string;
  parentId?: number | null;
  description?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
}

/**
 * 更新财务分类的输入类型
 */
export interface UpdateFinancialCategoryInput {
  name?: string;
  type?: string;
  code?: string;
  parentId?: number | null;
  description?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
}

/**
 * 创建财务交易记录的输入类型
 */
export interface CreateFinancialTransactionInput {
  transactionDate: Date | string;
  amount: number;
  type: string;
  accountId: number;
  categoryId?: number | null;
  paymentMethod?: string | null;
  relatedId?: number | null;
  relatedType?: string | null;
  counterparty?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  status?: string;
  createdById?: string | null;
}

/**
 * 更新财务交易记录的输入类型
 */
export interface UpdateFinancialTransactionInput {
  transactionDate?: Date | string;
  amount?: number;
  type?: string;
  accountId?: number;
  categoryId?: number | null;
  paymentMethod?: string | null;
  relatedId?: number | null;
  relatedType?: string | null;
  counterparty?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  status?: string;
}

/**
 * 角色模型接口
 */
export interface PrismaRole {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  userRoles?: any[];
  rolePermissions?: any[];
}

/**
 * 权限模型接口
 */
export interface PrismaPermission {
  id: number;
  name: string;
  code: string;
  module: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions?: any[];
}

/**
 * 角色权限模型接口
 */
export interface PrismaRolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt: Date;
  updatedAt: Date;
  role?: PrismaRole;
  permission?: PrismaPermission;
}

/**
 * 创建角色的输入类型
 */
export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string | null;
  permissionIds?: number[];
}

/**
 * 更新角色的输入类型
 */
export interface UpdateRoleInput {
  name?: string;
  code?: string;
  description?: string | null;
}

/**
 * 用户模型接口
 */
export interface PrismaUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  employee?: any;
  userRoles?: any[];
}

/**
 * 用户创建参数接口
 */
export interface UserCreateParams {
  name: string;
  email: string;
  password: string;
  role?: string;
  roleIds?: number[];
}

/**
 * 用户更新参数接口
 */
export interface UserUpdateParams {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  roleIds?: number[];
}

/**
 * 用户角色更新参数接口
 */
export interface UserRolesUpdateParams {
  roleIds: number[];
}

/**
 * 用户个人资料更新参数接口
 */
export interface UserProfileUpdateParams {
  name?: string;
  email?: string;
}

/**
 * 用户密码更新参数接口
 */
export interface UserPasswordUpdateParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 用户设置更新参数接口
 */
export interface UserSettingsUpdateParams {
  theme?: string;
  language?: string;
  notifications?: boolean;
}

/**
 * 系统设置模型接口
 */
export interface PrismaSystemSetting {
  id: number;
  companyName: string;
  coffeeSalesCommissionRate: number;
  gallerySalesCommissionRate: number;
  teacherWorkshopFee: number;
  assistantWorkshopFee: number;
  teacherWorkshopFeeOutside: number;
  assistantWorkshopFeeOutside: number;
  teacherWorkshopFeeInside: number;
  assistantWorkshopFeeInside: number;
  enableImageUpload: boolean;
  enableNotifications: boolean;
  basicWorkingHours: number;
  basicWorkingDays: number;
  overtimeRate: number;
  weekendOvertimeRate: number;
  holidayOvertimeRate: number;
  socialInsuranceRate: number;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 系统日志模型接口
 */
export interface PrismaSystemLog {
  id: number;
  level: string;
  module: string;
  message: string;
  details: string | null;
  userId: string | null;
  timestamp: Date;
  user?: PrismaUser;
}

/**
 * 系统设置更新参数接口
 */
export interface SystemSettingUpdateParams {
  companyName?: string;
  coffeeSalesCommissionRate?: number;
  gallerySalesCommissionRate?: number;
  teacherWorkshopFee?: number;
  assistantWorkshopFee?: number;
  teacherWorkshopFeeOutside?: number;
  assistantWorkshopFeeOutside?: number;
  teacherWorkshopFeeInside?: number;
  assistantWorkshopFeeInside?: number;
  enableImageUpload?: boolean;
  enableNotifications?: boolean;
  basicWorkingHours?: number;
  basicWorkingDays?: number;
  overtimeRate?: number;
  weekendOvertimeRate?: number;
  holidayOvertimeRate?: number;
  socialInsuranceRate?: number;
  taxRate?: number;
}

/**
 * 系统日志创建参数接口
 */
export interface SystemLogCreateParams {
  level: string;
  module: string;
  message: string;
  details?: string | null;
  userId?: string | null;
}

/**
 * 用户登录历史模型接口
 */
export interface PrismaUserLoginHistory {
  id: number;
  userId: string;
  ipAddress: string;
  userAgent: string;
  loginTime: Date;
  status: string;
  user?: PrismaUser;
}

/**
 * 用户登录记录创建参数接口
 */
export interface UserLoginRecordParams {
  userId: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * 日程模型接口
 */
export interface PrismaSchedule {
  id: number;
  employeeId: number;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: any;
  createdBy?: any;
}

/**
 * 日程创建参数接口
 */
export interface CreateScheduleInput {
  employeeId: number | string;
  date: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  checkConflict?: boolean;
}

/**
 * 日程更新参数接口
 */
export interface UpdateScheduleInput {
  employeeId?: number | string;
  date?: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  checkConflict?: boolean;
}

/**
 * 批量创建日程参数接口
 */
export interface BatchCreateSchedulesInput {
  employeeIds: (number | string)[];
  dates: (Date | string)[];
  startTime?: string | null;
  endTime?: string | null;
  checkConflict?: boolean;
}

/**
 * 创建工作坊渠道的输入类型
 */
export interface CreateWorkshopChannelInput {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 更新工作坊渠道的输入类型
 */
export interface UpdateWorkshopChannelInput {
  name?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * 创建工作坊讲师的输入类型
 */
export interface CreateWorkshopInstructorInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  specialty?: string | null;
  bio?: string | null;
  fee?: number | null;
  isActive?: boolean;
}

/**
 * 更新工作坊讲师的输入类型
 */
export interface UpdateWorkshopInstructorInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  specialty?: string | null;
  bio?: string | null;
  fee?: number | null;
  isActive?: boolean;
}

/**
 * 仓库模型接口
 */
export interface PrismaWarehouse {
  id: number;
  name: string;
  code: string | null;
  type: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventoryItems?: PrismaInventoryItem[];
}

/**
 * 库存项模型接口
 */
export interface PrismaInventoryItem {
  id: number;
  productId: number;
  warehouseId: number | null;
  quantity: number;
  minQuantity: number | null;
  createdAt: Date;
  updatedAt: Date;
  product?: PrismaProduct;
  warehouse?: PrismaWarehouse;
}

/**
 * 库存事务模型接口
 */
export interface PrismaInventoryTransaction {
  id: number;
  productId: number;
  quantity: number;
  type: string;
  notes: string | null;
  sourceWarehouseId: number | null;
  targetWarehouseId: number | null;
  createdAt: Date;
  updatedAt: Date;
  product?: PrismaProduct;
  sourceWarehouse?: PrismaWarehouse;
  targetWarehouse?: PrismaWarehouse;
}

/**
 * 创建仓库的输入类型
 */
export interface CreateWarehouseInput {
  name: string;
  code?: string | null;
  type?: string;
  location?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 更新仓库的输入类型
 */
export interface UpdateWarehouseInput {
  name?: string;
  code?: string | null;
  type?: string;
  location?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 创建库存项的输入类型
 */
export interface CreateInventoryItemInput {
  productId: number;
  warehouseId?: number | null;
  quantity: number;
  minQuantity?: number | null;
}

/**
 * 更新库存项的输入类型
 */
export interface UpdateInventoryItemInput {
  warehouseId?: number | null;
  quantity?: number;
  minQuantity?: number | null;
  notes?: string | null;
}

/**
 * 库存转移的输入类型
 */
export interface InventoryTransferInput {
  productId: number;
  quantity: number;
  fromLocationId: number;
  toLocationId?: number | null;
  notes?: string | null;
}
