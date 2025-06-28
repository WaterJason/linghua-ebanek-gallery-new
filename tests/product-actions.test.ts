/**
 * 产品管理模块测试
 * 
 * 这个文件包含用于测试产品管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getArtworks, 
  getArtwork, 
  createArtwork, 
  updateArtwork, 
  deleteArtwork,
  getArtworkCategories,
  createArtworkCategory,
  updateArtworkCategory,
  deleteArtworkCategory,
  getProductTags,
  createProductTag,
  updateProductTag,
  deleteProductTag
} from '../lib/actions/product-actions';
import { 
  validateCreateProduct, 
  validateUpdateProduct,
  validateCreateProductCategory,
  validateUpdateProductCategory,
  validateCreateProductTag,
  validateUpdateProductTag
} from '../lib/validation';
import { findRecord, findRecords, createRecord, updateRecord } from '../lib/prisma-wrapper';

// 模拟 Prisma 客户端
vi.mock('@prisma/client', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockFindMany = vi.fn();
  const mockFindUnique = vi.fn();
  const mockFindFirst = vi.fn();
  const mockDeleteMany = vi.fn();
  
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      product: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      productCategory: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      productTag: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      productTagsOnProducts: {
        create: mockCreate,
        delete: mockDelete,
        findMany: mockFindMany,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
      },
      inventoryItem: {
        findFirst: mockFindFirst,
      },
      salesItem: {
        findFirst: mockFindFirst,
      },
      $disconnect: vi.fn(),
    })),
  };
});

// 模拟 Next.js 的 revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// 模拟 prisma-wrapper 模块
vi.mock('../lib/prisma-wrapper', () => ({
  findRecord: vi.fn(),
  findRecords: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
}));

// 模拟 validation 模块
vi.mock('../lib/validation', () => ({
  validateCreateProduct: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateProduct: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateProductCategory: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateProductCategory: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateProductTag: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateProductTag: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('产品管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getArtworks 函数', () => {
    it('应该正确获取产品列表', async () => {
      const mockProducts = [
        {
          id: 1,
          name: '产品1',
          code: 'P001',
          description: '描述1',
          price: 100,
          productCategory: { id: 1, name: '类别1' },
          productTags: [
            { tag: { id: 1, name: '标签1' } },
            { tag: { id: 2, name: '标签2' } },
          ],
        },
        {
          id: 2,
          name: '产品2',
          code: 'P002',
          description: '描述2',
          price: 200,
          productCategory: { id: 1, name: '类别1' },
          productTags: [],
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockProducts);
      
      const result = await getArtworks();
      
      expect(findRecords).toHaveBeenCalledWith('product', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('产品1');
      expect(result[0].tags).toHaveLength(2);
      expect(result[1].name).toBe('产品2');
      expect(result[1].tags).toHaveLength(0);
    });
  });
  
  describe('createArtwork 函数', () => {
    it('应该正确创建产品', async () => {
      const mockProduct = {
        id: 3,
        name: '产品3',
        code: 'P003',
        description: '描述3',
        price: 300,
        categoryId: 1,
      };
      
      (prisma.artwork.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockProduct);
      
      const data = {
        name: '产品3',
        code: 'P003',
        description: '描述3',
        price: 300,
        categoryId: 1,
      };
      
      const result = await createArtwork(data);
      
      expect(validateCreateProduct).toHaveBeenCalledWith(data);
      expect(prisma.artwork.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: 'P003' },
            { name: '产品3' },
          ],
        },
      });
      expect(createRecord).toHaveBeenCalledWith('product', expect.objectContaining({
        name: '产品3',
        code: 'P003',
      }));
      expect(result).toEqual(mockProduct);
    });
    
    it('应该在产品已存在时抛出错误', async () => {
      const mockProduct = {
        id: 3,
        name: '产品3',
        code: 'P003',
      };
      
      (prisma.artwork.findFirst as any).mockResolvedValue(mockProduct);
      
      const data = {
        name: '产品3',
        code: 'P003',
        description: '描述3',
        price: 300,
        categoryId: 1,
      };
      
      await expect(createArtwork(data)).rejects.toThrow('产品名称或编码已存在');
    });
  });
  
  describe('deleteArtwork 函数', () => {
    it('应该正确删除产品', async () => {
      (prisma.artwork.findUnique as any).mockResolvedValue({ id: 1, name: '产品1' });
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(null);
      (prisma.salesItem.findFirst as any).mockResolvedValue(null);
      
      const result = await deleteArtwork(1);
      
      expect(prisma.artwork.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
        where: { productId: 1 },
      });
      expect(prisma.salesItem.findFirst).toHaveBeenCalledWith({
        where: { productId: 1 },
      });
      expect(prisma.productTagsOnProducts.deleteMany).toHaveBeenCalledWith({
        where: { productId: 1 },
      });
      expect(prisma.artwork.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.success).toBe(true);
    });
    
    it('应该在产品有库存记录时抛出错误', async () => {
      (prisma.artwork.findUnique as any).mockResolvedValue({ id: 1, name: '产品1' });
      (prisma.inventoryItem.findFirst as any).mockResolvedValue({ id: 1, productId: 1 });
      
      await expect(deleteArtwork(1)).rejects.toThrow('产品有库存记录，无法删除');
    });
  });
});
