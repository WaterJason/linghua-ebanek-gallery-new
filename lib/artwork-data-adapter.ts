/**
 * 作品数据适配层 - 解决前端与后端数据结构不匹配问题
 *
 * 这个适配层提供了前端组件与Prisma模型之间的数据转换，
 * 确保数据结构的一致性，同时保持向后兼容性。
 */

import { Artwork as PrismaArtwork, ArtworkCategory, ArtworkTag } from "@prisma/client";

// 扩展的Prisma作品类型，包含关联数据
export type ExtendedPrismaArtwork = PrismaArtwork & {
  artworkCategory?: ArtworkCategory | null;
  artworkTags?: Array<{
    tag: ArtworkTag;
  }>;
};

// 前端作品类型
export interface FrontendArtwork {
  id: number;
  name: string;
  price: number;
  commissionRate: number;
  type: string;
  imageUrl: string | null;
  imageUrls: string[];
  description: string | null;
  categoryId: number | null;
  categoryName: string | null; // 计算字段
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  status: string; // 计算字段
  dimensions: string | null;
  material: string | null;
  unit: string | null;
  tags: string[]; // 计算字段
  details: string | null;
  inventory: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// 前端作品表单数据类型
export interface FrontendArtworkFormData {
  id?: number;
  name: string;
  price: number | string;
  commissionRate: number | string;
  categoryId?: number | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  description?: string | null;
  cost?: number | string | null;
  sku?: string | null;
  barcode?: string | null;
  status: string;
  dimensions?: string | null;
  material?: string | null;
  unit?: string | null;
  details?: string | null;
  inventory?: number | string | null;
}

// 后端作品输入类型
export interface BackendArtworkInput {
  name: string;
  price: number;
  commissionRate: number;
  type: string;
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
  tagIds?: number[];
}

/**
 * 作品数据适配器
 * 负责前端和后端数据格式的转换
 */
export class ArtworkDataAdapter {
  /**
   * 将Prisma作品数据转换为前端格式
   */
  static toFrontend(prismaArtwork: ExtendedPrismaArtwork): FrontendArtwork {
    return {
      id: prismaArtwork.id,
      name: prismaArtwork.name,
      price: prismaArtwork.price,
      commissionRate: prismaArtwork.commissionRate,
      type: prismaArtwork.type,
      imageUrl: prismaArtwork.imageUrl,
      imageUrls: prismaArtwork.imageUrls,
      description: prismaArtwork.description,
      categoryId: prismaArtwork.categoryId,
      // 计算字段：从关联数据获取分类名称
      categoryName: prismaArtwork.artworkCategory?.name || null,
      cost: prismaArtwork.cost,
      sku: prismaArtwork.sku,
      barcode: prismaArtwork.barcode,
      // 状态字段映射：根据type字段计算status
      status: this.mapTypeToStatus(prismaArtwork.type),
      dimensions: prismaArtwork.dimensions,
      material: prismaArtwork.material,
      unit: prismaArtwork.unit,
      // 计算字段：从关联数据获取标签数组
      tags: prismaArtwork.artworkTags?.map(artworkTag => artworkTag.tag.name) || [],
      details: prismaArtwork.details,
      inventory: prismaArtwork.inventory,
      createdAt: prismaArtwork.createdAt,
      updatedAt: prismaArtwork.updatedAt,
    };
  }

  /**
   * 将前端表单数据转换为后端输入格式
   */
  static toBackend(frontendData: FrontendArtworkFormData, tagIds?: number[]): BackendArtworkInput {
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
   * 批量转换Prisma作品数据为前端格式
   */
  static toFrontendList(prismaArtworks: ExtendedPrismaArtwork[]): FrontendArtwork[] {
    return prismaArtworks.map(artwork => this.toFrontend(artwork));
  }

  /**
   * 将type字段映射为前端status
   */
  private static mapTypeToStatus(type: string): string {
    switch (type) {
      case "artwork":
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
        return "artwork";
      case "inactive":
        return "discontinued";
      case "draft":
        return "draft";
      default:
        return "artwork";
    }
  }

  /**
   * 验证并转换前端数据
   * 确保数据类型正确，处理字符串到数字的转换
   */
  static validateAndTransform(data: any): BackendArtworkInput {
    // 基础验证
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('作品名称是必填项');
    }

    if (!data.price || isNaN(Number(data.price))) {
      throw new Error('作品价格必须是有效数字');
    }

    // 数据转换
    const transformedData: BackendArtworkInput = {
      name: String(data.name).trim(),
      price: Number(data.price),
      commissionRate: Number(data.commissionRate) || 0,
      type: this.mapStatusToType(data.status || 'active'),
      imageUrl: data.imageUrl || null,
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      description: data.description || null,
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      cost: data.cost ? Number(data.cost) : null,
      sku: data.sku || null,
      barcode: data.barcode || null,
      dimensions: data.dimensions || null,
      material: data.material || null,
      unit: data.unit || null,
      details: data.details || null,
      inventory: data.inventory ? Number(data.inventory) : null,
      tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    };

    return transformedData;
  }

  /**
   * 获取默认的作品表单数据
   */
  static getDefaultFormData(): FrontendArtworkFormData {
    return {
      name: '',
      price: 0,
      commissionRate: 0,
      categoryId: null,
      imageUrl: null,
      imageUrls: [],
      description: null,
      cost: null,
      sku: null,
      barcode: null,
      status: 'active',
      dimensions: null,
      material: null,
      unit: null,
      details: null,
      inventory: null,
    };
  }

  /**
   * 检查数据是否为占位符类型
   */
  static isPlaceholderType(type: string): boolean {
    return ['category_placeholder', 'unit_placeholder', 'material_placeholder'].includes(type);
  }
}
