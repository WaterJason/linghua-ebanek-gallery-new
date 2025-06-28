/**
 * 产品类型定义
 * 基于作品管理模块，排除SKU、成本价格、佣金率、详情字段
 */
export interface Product {
  id?: number;
  name: string;
  price: number;
  type?: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null; // 多图片支持
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null; // 分类名称，用于显示
  barcode?: string | null;
  // 新增字段
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  tags?: string[] | null;
  inventory?: number | null;
}

/**
 * 产品分类类型定义
 */
export interface ProductCategory {
  id: number;
  name: string;
  code?: string | null;
  parentId?: number | null;
  parent?: ProductCategory | null;
  children?: ProductCategory[] | null;
  level?: number;
  path?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  productCount?: number; // 前端计算，非数据库字段
}

/**
 * 产品表单数据类型
 */
export interface ProductFormData {
  id?: number;
  name: string;
  categoryId?: number | null;
  price?: number | null; // 改为可选
  barcode?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null; // 多图片支持
  type?: string;
  description?: string | null;
  // 新增字段
  dimensions?: string | null;
  material?: string | null; // 保留用于兼容性
  unit?: string | null; // 保留用于兼容性
  tags?: string[] | null;
  tagIds?: number[]; // 新增标签ID数组
  inventory?: number | null;
}

/**
 * 分类表单数据类型
 */
export interface ProductCategoryFormData {
  id?: number;
  name: string;
  code?: string | null;
  parentId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * 产品过滤条件类型
 */
export interface ProductFilter {
  searchQuery: string;
  categoryId?: number | null;
  statusFilter: string;
  materialFilter?: string | null;
  tagFilter?: string | null; // 新增标签过滤
}

/**
 * 产品单位类型
 */
export interface ProductUnit {
  id: number;
  name: string;
  description?: string;
}

/**
 * 产品材质类型
 */
export interface ProductMaterial {
  id: number;
  name: string;
  description?: string;
}

/**
 * 产品标签类型
 */
export interface ProductTag {
  id: number;
  name: string;
  color?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 批量编辑数据类型
 */
export interface ProductBatchEditData {
  productIds: number[];
  updates: Partial<ProductFormData>;
}

/**
 * 导入结果类型
 */
export interface ProductImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors?: string[];
  data?: Product[];
}

/**
 * API响应类型
 */
export interface ProductApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 产品统计类型
 */
export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  categories: number;
  totalValue: number;
  averagePrice: number;
}

/**
 * 产品搜索参数类型
 */
export interface ProductSearchParams {
  query?: string;
  categoryId?: number;
  status?: string;
  material?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 产品导出参数类型
 */
export interface ProductExportParams {
  format: 'json' | 'csv' | 'excel';
  fields?: string[];
  filters?: ProductSearchParams;
}

/**
 * 产品图片上传结果类型
 */
export interface ProductImageUploadResult {
  success: boolean;
  url?: string;
  urls?: string[];
  error?: string;
}

/**
 * 库存管理类型
 */
export interface ProductInventory {
  productId: number;
  productName: string;
  totalInventory: number;
  warehouseInventory?: {
    warehouseId: number;
    warehouseName: string;
    quantity: number;
    minQuantity?: number;
  }[];
}

/**
 * 库存操作类型
 */
export interface InventoryOperation {
  productId: number;
  warehouseId?: number;
  quantity: number;
  operation: 'set' | 'add' | 'subtract';
}

/**
 * 材料和单位管理类型
 */
export interface MaterialUnit {
  name: string;
  productCount: number;
}
