/**
 * 库存管理模块测试
 * 
 * 这个文件包含用于测试库存管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getInventory, 
  getProductInventory, 
  createInventory, 
  updateInventory, 
  deleteInventory,
  transferInventory,
  getInventoryLocations,
  createInventoryLocation,
  updateInventoryLocation,
  deleteInventoryLocation
} from '../lib/actions/inventory-actions';
import { 
  validateCreateInventoryItem, 
  validateUpdateInventoryItem,
  validateCreateWarehouse,
  validateUpdateWarehouse,
  validateInventoryTransfer
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
      inventoryItem: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
      },
      inventoryTransaction: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      warehouse: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      product: {
        findUnique: mockFindUnique,
      },
      $transaction: vi.fn().mockImplementation(callback => callback({
        inventoryItem: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
        },
        inventoryTransaction: {
          create: mockCreate,
        },
      })),
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
  validateCreateInventoryItem: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateInventoryItem: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateWarehouse: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateWarehouse: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateInventoryTransfer: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('库存管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getInventory 函数', () => {
    it('应该正确获取库存列表', async () => {
      const mockInventory = [
        {
          id: 1,
          productId: 1,
          quantity: 10,
          warehouseId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 1,
            name: '测试产品1',
            price: 100,
            productCategory: {
              id: 1,
              name: '测试分类',
            },
          },
          warehouse: {
            id: 1,
            name: '测试仓库',
            location: '测试位置',
            description: '测试描述',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockInventory);
      
      const result = await getInventory();
      
      expect(findRecords).toHaveBeenCalledWith('inventoryItem', expect.any(Object));
      expect(result).toEqual(mockInventory);
    });
  });
  
  describe('getProductInventory 函数', () => {
    it('应该正确获取产品库存', async () => {
      const mockInventory = [
        {
          id: 1,
          productId: 1,
          quantity: 10,
          warehouseId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 1,
            name: '测试产品1',
            price: 100,
            productCategory: {
              id: 1,
              name: '测试分类',
            },
          },
          warehouse: {
            id: 1,
            name: '测试仓库',
            location: '测试位置',
            description: '测试描述',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockInventory);
      
      const result = await getProductInventory(1);
      
      expect(findRecords).toHaveBeenCalledWith('inventoryItem', expect.objectContaining({
        where: { productId: 1 },
      }));
      expect(result).toEqual(mockInventory);
    });
  });
  
  describe('createInventory 函数', () => {
    it('应该正确创建库存', async () => {
      const mockProduct = {
        id: 1,
        name: '测试产品',
        price: 100,
      };
      
      const mockInventory = {
        id: 1,
        productId: 1,
        quantity: 10,
        warehouseId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockInventory);
      
      const data = {
        productId: 1,
        quantity: 10,
        warehouseId: 1,
      };
      
      const result = await createInventory(data);
      
      expect(validateCreateInventoryItem).toHaveBeenCalledWith(data);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
        where: {
          productId: 1,
          warehouseId: 1,
        },
      });
      expect(createRecord).toHaveBeenCalledWith('inventoryItem', expect.objectContaining({
        productId: 1,
        quantity: 10,
        warehouseId: 1,
      }));
      expect(result).toEqual(mockInventory);
    });
    
    it('应该在产品不存在时抛出错误', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);
      
      const data = {
        productId: 1,
        quantity: 10,
        warehouseId: 1,
      };
      
      await expect(createInventory(data)).rejects.toThrow('产品不存在');
    });
    
    it('应该在库存记录已存在时抛出错误', async () => {
      const mockProduct = {
        id: 1,
        name: '测试产品',
        price: 100,
      };
      
      const mockInventory = {
        id: 1,
        productId: 1,
        quantity: 10,
        warehouseId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(mockInventory);
      
      const data = {
        productId: 1,
        quantity: 10,
        warehouseId: 1,
      };
      
      await expect(createInventory(data)).rejects.toThrow('该产品在指定仓库已有库存记录');
    });
  });
  
  describe('transferInventory 函数', () => {
    it('应该正确转移库存', async () => {
      const mockSourceInventory = {
        id: 1,
        productId: 1,
        quantity: 20,
        warehouseId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockTargetInventory = {
        id: 2,
        productId: 1,
        quantity: 5,
        warehouseId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.inventoryItem.findFirst as any)
        .mockResolvedValueOnce(mockSourceInventory)
        .mockResolvedValueOnce(mockTargetInventory);
      
      const data = {
        productId: 1,
        quantity: 10,
        fromLocationId: 1,
        toLocationId: 2,
        notes: '测试转移',
      };
      
      const result = await transferInventory(data);
      
      expect(validateInventoryTransfer).toHaveBeenCalledWith(data);
      expect(prisma.inventoryItem.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
    
    it('应该在源仓库库存不足时抛出错误', async () => {
      const mockSourceInventory = {
        id: 1,
        productId: 1,
        quantity: 5,
        warehouseId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(mockSourceInventory);
      
      const data = {
        productId: 1,
        quantity: 10,
        fromLocationId: 1,
        toLocationId: 2,
        notes: '测试转移',
      };
      
      await expect(transferInventory(data)).rejects.toThrow('源仓库库存不足');
    });
  });
});
