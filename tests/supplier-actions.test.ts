/**
 * 供应商管理模块测试
 * 
 * 这个文件包含用于测试供应商管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getSuppliers, 
  getSupplier, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier
} from '../lib/actions/purchase-actions';
import { 
  validateCreateSupplier, 
  validateUpdateSupplier
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
      supplier: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
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
  validateCreateSupplier: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateSupplier: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('供应商管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getSuppliers 函数', () => {
    it('应该正确获取供应商列表', async () => {
      const mockSuppliers = [
        {
          id: 1,
          name: '供应商1',
          contactPerson: '联系人1',
          phone: '13800138001',
          email: 'supplier1@example.com',
          address: '地址1',
          description: '描述1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            purchaseOrders: 2,
          },
        },
        {
          id: 2,
          name: '供应商2',
          contactPerson: '联系人2',
          phone: '13800138002',
          email: 'supplier2@example.com',
          address: '地址2',
          description: '描述2',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            purchaseOrders: 0,
          },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockSuppliers);
      
      const result = await getSuppliers();
      
      expect(findRecords).toHaveBeenCalledWith('supplier', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].orderCount).toBe(2);
      expect(result[1].orderCount).toBe(0);
    });
  });
  
  describe('createSupplier 函数', () => {
    it('应该正确创建供应商', async () => {
      const mockSupplier = {
        id: 3,
        name: '供应商3',
        contactPerson: '联系人3',
        phone: '13800138003',
        email: 'supplier3@example.com',
        address: '地址3',
        description: '描述3',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.supplier.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockSupplier);
      
      const data = {
        name: '供应商3',
        contactPerson: '联系人3',
        phone: '13800138003',
        email: 'supplier3@example.com',
      };
      
      const result = await createSupplier(data);
      
      expect(validateCreateSupplier).toHaveBeenCalledWith(data);
      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: {
          name: '供应商3',
        },
      });
      expect(createRecord).toHaveBeenCalledWith('supplier', expect.objectContaining({
        name: '供应商3',
        contactPerson: '联系人3',
      }), { checkSync: true });
      expect(result).toEqual(mockSupplier);
    });
    
    it('应该在供应商已存在时抛出错误', async () => {
      const mockSupplier = {
        id: 3,
        name: '供应商3',
      };
      
      (prisma.supplier.findFirst as any).mockResolvedValue(mockSupplier);
      
      const data = {
        name: '供应商3',
        contactPerson: '联系人3',
      };
      
      await expect(createSupplier(data)).rejects.toThrow('供应商已存在');
    });
  });
  
  describe('updateSupplier 函数', () => {
    it('应该正确更新供应商', async () => {
      const mockSupplier = {
        id: 1,
        name: '供应商1更新',
        contactPerson: '联系人1更新',
        phone: '13800138001',
        email: 'supplier1@example.com',
        address: '地址1',
        description: '描述1更新',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (findRecord as any).mockResolvedValue({ id: 1, name: '供应商1' });
      (prisma.supplier.findFirst as any).mockResolvedValue(null);
      (updateRecord as any).mockResolvedValue(mockSupplier);
      
      const data = {
        name: '供应商1更新',
        contactPerson: '联系人1更新',
        description: '描述1更新',
      };
      
      const result = await updateSupplier(1, data);
      
      expect(validateUpdateSupplier).toHaveBeenCalledWith(data);
      expect(findRecord).toHaveBeenCalledWith('supplier', 1);
      expect(updateRecord).toHaveBeenCalledWith('supplier', 1, expect.objectContaining({
        name: '供应商1更新',
        contactPerson: '联系人1更新',
      }), { checkSync: true });
      expect(result).toEqual(mockSupplier);
    });
    
    it('应该在供应商不存在时抛出错误', async () => {
      (findRecord as any).mockResolvedValue(null);
      
      const data = {
        name: '供应商1更新',
      };
      
      await expect(updateSupplier(999, data)).rejects.toThrow('供应商不存在');
    });
  });
});
