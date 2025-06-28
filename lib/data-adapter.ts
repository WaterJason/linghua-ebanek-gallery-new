/**
 * 数据适配层 - 解决前端与后端数据结构不匹配问题
 *
 * 这个适配层提供了前端组件与Prisma模型之间的数据转换，
 * 确保数据结构的一致性，同时保持向后兼容性。
 */

import { Product as PrismaProduct, ProductCategory, ProductTag } from "@prisma/client";

// 扩展的Prisma产品类型，包含关联数据
export type ExtendedPrismaProduct = PrismaProduct & {
  productCategory?: ProductCategory | null;
  productTags?: Array<{
    tag: ProductTag;
  }>;
};

// 前端产品接口（保持现有结构）
export interface FrontendProduct {
  id?: number;
  name: string;
  price: number;
  commissionRate: number;
  type?: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null; // 计算字段
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  status?: string; // 前端状态字段
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  tags?: string[] | null; // 计算字段
  details?: string | null;
  inventory?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 前端表单数据接口
export interface FrontendProductFormData {
  id?: number;
  name: string;
  categoryId?: number | null;
  price: number;
  commissionRate: number;
  cost?: number | null;
  barcode?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  status: string;
  type?: string;
  description?: string | null;
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  tags?: string[] | null;
  details?: string | null;
  inventory?: number | null;
}

// 后端创建产品输入接口
export interface BackendProductInput {
  name: string;
  price: number;
  commissionRate: number;
  type?: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  description?: string | null;
  categoryId?: number | null;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  details?: string | null;
  inventory?: number | null;
  tagIds?: number[]; // 标签ID数组
}

/**
 * 数据适配器类
 */
export class ProductDataAdapter {

  /**
   * 将Prisma产品数据转换为前端格式
   */
  static toFrontend(prismaProduct: ExtendedPrismaProduct): FrontendProduct {
    return {
      id: prismaProduct.id,
      name: prismaProduct.name,
      price: prismaProduct.price,
      commissionRate: prismaProduct.commissionRate,
      type: prismaProduct.type,
      imageUrl: prismaProduct.imageUrl,
      imageUrls: prismaProduct.imageUrls,
      description: prismaProduct.description,
      categoryId: prismaProduct.categoryId,
      // 计算字段：从关联数据获取分类名称
      categoryName: prismaProduct.productCategory?.name || null,
      cost: prismaProduct.cost,
      sku: prismaProduct.sku,
      barcode: prismaProduct.barcode,
      // 状态字段映射：根据type字段计算status
      status: this.mapTypeToStatus(prismaProduct.type),
      dimensions: prismaProduct.dimensions,
      material: prismaProduct.material,
      unit: prismaProduct.unit,
      // 计算字段：从关联数据获取标签数组
      tags: prismaProduct.productTags?.map(pt => pt.tag.name) || [],
      details: prismaProduct.details,
      inventory: prismaProduct.inventory,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    };
  }

  /**
   * 将前端表单数据转换为后端输入格式
   */
  static toBackend(frontendData: FrontendProductFormData, tagIds?: number[]): BackendProductInput {
    return {
      name: frontendData.name.trim(),
      price: Number(frontendData.price),
      commissionRate: Number(frontendData.commissionRate) || 0,
      // 类型字段映射：根据status计算type
      type: this.mapStatusToType(frontendData.status),
      imageUrl: frontendData.imageUrl || null,
      imageUrls: frontendData.imageUrls || [],
      description: frontendData.description || null,
      categoryId: frontendData.categoryId,
      cost: frontendData.cost ? Number(frontendData.cost) : null,
      sku: frontendData.sku || null,
      barcode: frontendData.barcode || null,
      dimensions: frontendData.dimensions || null,
      material: frontendData.material || null,
      unit: frontendData.unit || null,
      details: frontendData.details || null,
      inventory: frontendData.inventory ? Number(frontendData.inventory) : null,
      tagIds: tagIds || [],
    };
  }

  /**
   * 批量转换Prisma产品数据为前端格式
   */
  static toFrontendList(prismaProducts: ExtendedPrismaProduct[]): FrontendProduct[] {
    return prismaProducts.map(product => this.toFrontend(product));
  }

  /**
   * 将type字段映射为前端status
   */
  private static mapTypeToStatus(type: string): string {
    switch (type) {
      case "product":
        return "active";
      case "discontinued":
        return "inactive";
      case "draft":
        return "draft";
      default:
        return "active";
    }
  }

  /**
   * 将前端status映射为type字段
   */
  private static mapStatusToType(status: string): string {
    switch (status) {
      case "active":
        return "product";
      case "inactive":
        return "discontinued";
      case "draft":
        return "draft";
      default:
        return "product";
    }
  }

  /**
   * 验证前端数据
   */
  static validateFrontendData(data: FrontendProductFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 必填字段验证
    if (!data.name || data.name.trim() === "") {
      errors.push("产品名称不能为空");
    }

    if (!data.price || data.price <= 0) {
      errors.push("产品价格必须大于0");
    }

    if (data.commissionRate < 0 || data.commissionRate > 100) {
      errors.push("佣金率必须在0-100之间");
    }

    // 可选字段验证
    if (data.cost && data.cost < 0) {
      errors.push("成本不能为负数");
    }

    if (data.inventory && data.inventory < 0) {
      errors.push("库存不能为负数");
    }

    // SKU格式验证
    if (data.sku && !/^[A-Z0-9-_]+$/i.test(data.sku)) {
      errors.push("SKU只能包含字母、数字、连字符和下划线");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 数据清理和标准化
   */
  static sanitizeFrontendData(data: FrontendProductFormData): FrontendProductFormData {
    return {
      ...data,
      name: data.name?.trim() || "",
      description: data.description?.trim() || null,
      sku: data.sku?.trim().toUpperCase() || null,
      barcode: data.barcode?.trim() || null,
      dimensions: data.dimensions?.trim() || null,
      material: data.material?.trim() || null,
      unit: data.unit?.trim() || null,
      details: data.details?.trim() || null,
      price: Number(data.price) || 0,
      commissionRate: Number(data.commissionRate) || 0,
      cost: data.cost ? Number(data.cost) : null,
      inventory: data.inventory ? Number(data.inventory) : null,
    };
  }

  /**
   * 字段差异检测
   */
  static detectFieldDifferences(
    frontendData: FrontendProduct,
    prismaData: ExtendedPrismaProduct
  ): string[] {
    const differences: string[] = [];
    const converted = this.toFrontend(prismaData);

    // 比较关键字段
    const fieldsToCompare: (keyof FrontendProduct)[] = [
      'name', 'price', 'commissionRate', 'description', 'categoryId',
      'cost', 'sku', 'barcode', 'dimensions', 'material', 'unit',
      'details', 'inventory'
    ];

    for (const field of fieldsToCompare) {
      if (frontendData[field] !== converted[field]) {
        differences.push(`${field}: ${frontendData[field]} → ${converted[field]}`);
      }
    }

    return differences;
  }

  /**
   * 验证并转换数据（API专用）
   * 结合验证和转换功能，用于API端点
   */
  static validateAndTransform(data: any): BackendProductInput {
    // 数据清理
    const cleanData = {
      name: data.name?.toString().trim() || "",
      price: data.price?.toString() || "0",
      commissionRate: data.commissionRate?.toString() || "0",
      cost: data.cost?.toString() || null,
      categoryId: data.categoryId?.toString() || null,
      categoryName: data.categoryName?.toString() || null,
      sku: data.sku?.toString().trim() || null,
      barcode: data.barcode?.toString().trim() || null,
      description: data.description?.toString().trim() || null,
      imageUrl: data.imageUrl?.toString() || null,
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      type: data.type?.toString() || "product",
      status: data.status?.toString() || "active",
      dimensions: data.dimensions?.toString().trim() || null,
      material: data.material?.toString().trim() || null,
      unit: data.unit?.toString().trim() || null,
      details: data.details?.toString().trim() || null,
      inventory: data.inventory?.toString() || null,
      tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    };

    // 验证必填字段
    if (!cleanData.name) {
      throw new Error("产品名称不能为空");
    }

    const price = Number.parseFloat(cleanData.price);
    if (isNaN(price) || price <= 0) {
      throw new Error("产品价格必须是大于0的数字");
    }

    const commissionRate = Number.parseFloat(cleanData.commissionRate);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      throw new Error("佣金率必须在0-100之间");
    }

    // 验证可选字段
    let cost = null;
    if (cleanData.cost) {
      cost = Number.parseFloat(cleanData.cost);
      if (isNaN(cost) || cost < 0) {
        throw new Error("成本必须是非负数字");
      }
    }

    let categoryId = null;
    if (cleanData.categoryId && cleanData.categoryId !== "uncategorized") {
      categoryId = parseInt(cleanData.categoryId);
      if (isNaN(categoryId)) {
        throw new Error("分类ID必须是有效数字");
      }
    }

    let inventory = null;
    if (cleanData.inventory) {
      inventory = parseInt(cleanData.inventory);
      if (isNaN(inventory) || inventory < 0) {
        throw new Error("库存必须是非负整数");
      }
    }

    // SKU格式验证
    if (cleanData.sku && !/^[A-Z0-9-_]+$/i.test(cleanData.sku)) {
      throw new Error("SKU只能包含字母、数字、连字符和下划线");
    }

    // 返回转换后的数据
    return {
      name: cleanData.name,
      price: price,
      commissionRate: commissionRate,
      type: cleanData.status ? this.mapStatusToType(cleanData.status) : (cleanData.type || "product"),
      imageUrl: cleanData.imageUrl || null,
      imageUrls: cleanData.imageUrls,
      description: cleanData.description || null,
      categoryId: categoryId,
      cost: cost,
      sku: cleanData.sku || null,
      barcode: cleanData.barcode || null,
      dimensions: cleanData.dimensions || null,
      material: cleanData.material || null,
      unit: cleanData.unit || null,
      details: cleanData.details || null,
      inventory: inventory,
      tagIds: cleanData.tagIds.map(id => parseInt(id)).filter(id => !isNaN(id)),
    };
  }

  /**
   * 获取字段映射配置
   */
  static getFieldMappings(): Record<string, string> {
    return {
      // 前端字段 -> Prisma字段
      'categoryName': 'productCategory.name',
      'tags': 'productTags[].tag.name',
      'status': 'type',
    };
  }
}
