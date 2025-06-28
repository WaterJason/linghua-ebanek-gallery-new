/**
 * 作品类型定义
 */
export interface Artwork {
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
 * 作品分类类型定义
 */
export interface ArtworkCategory {
  id: number;
  name: string;
  code?: string | null;
  parentId?: number | null;
  parent?: ArtworkCategory | null;
  children?: ArtworkCategory[] | null;
  level?: number;
  path?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  artworkCount?: number; // 前端计算，非数据库字段
}

/**
 * 作品表单数据类型
 */
export interface ArtworkFormData {
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
export interface ArtworkCategoryFormData {
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
 * 作品过滤条件类型
 */
export interface ArtworkFilter {
  searchQuery: string;
  categoryId?: number | null;
  statusFilter: string;
  materialFilter?: string | null;
}

/**
 * 作品单位类型
 */
export interface ArtworkUnit {
  id: number;
  name: string;
  description?: string;
}

/**
 * 作品材质类型
 */
export interface ArtworkMaterial {
  id: number;
  name: string;
  description?: string;
}

/**
 * 作品标签类型
 */
export interface ArtworkTag {
  id: number;
  name: string;
  color?: string | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * 批量编辑数据类型
 */
export interface ArtworkBatchEditData {
  artworkIds: number[];
  updates: Partial<ArtworkFormData>;
}

/**
 * 导入结果类型
 */
export interface ArtworkImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors?: string[];
  data?: Artwork[];
}

/**
 * API响应类型
 */
export interface ArtworkApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 作品统计类型
 */
export interface ArtworkStats {
  total: number;
  active: number;
  inactive: number;
  categories: number;
  totalValue: number;
  averagePrice: number;
}

/**
 * 作品搜索参数类型
 */
export interface ArtworkSearchParams {
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
 * 作品导出参数类型
 */
export interface ArtworkExportParams {
  format: 'json' | 'csv' | 'excel';
  fields?: string[];
  filters?: ArtworkSearchParams;
}

/**
 * 作品图片上传结果类型
 */
export interface ArtworkImageUploadResult {
  success: boolean;
  url?: string;
  urls?: string[];
  error?: string;
}
