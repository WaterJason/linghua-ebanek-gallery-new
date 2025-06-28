/**
 * 产品类型定义
 */
export interface Product {
  id?: number;
  name: string;
  price: number;
  commissionRate: number;
  type?: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null; // 多图片支持
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null; // 分类名称，用于显示
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  status?: string;
  // 新增字段
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  tags?: string[] | null;
  details?: string | null;
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
  price: number;
  commissionRate: number; // 添加缺失的佣金率字段
  cost?: number | null; // 添加成本字段
  barcode?: string | null;
  sku?: string | null; // 添加SKU字段
  imageUrl?: string | null;
  imageUrls?: string[] | null; // 多图片支持
  status: string;
  type?: string;
  description?: string | null; // 添加描述字段
  // 新增字段
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  tags?: string[] | null;
  details?: string | null;
  inventory?: number | null;
}

/**
 * 分类表单数据类型
 */
export interface CategoryFormData {
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
 * 批量编辑数据类型
 */
export interface BatchEditData {
  ids: number[];
  fields: {
    categoryId?: number | null;
    price?: number | null;
    status?: string | null;
    unit?: string | null;
    material?: string | null;
    tags?: string[] | null;
  };
}

/**
 * 产品导入结果类型
 */
export interface ImportResult {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors?: string[];
}

/**
 * 产品API响应类型
 */
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}
