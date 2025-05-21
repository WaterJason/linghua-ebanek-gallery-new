/**
 * 采购管理模块测试
 * 
 * 这个文件包含用于测试采购管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getPurchaseOrders, 
  getPurchaseOrder, 
  createPurchaseOrder, 
  updatePurchaseOrder, 
  cancelPurchaseOrder,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../lib/actions/purchase-actions';
import { 
  validateCreatePurchaseOrder, 
  validateUpdatePurchaseOrder,
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
      purchaseOrder: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
      },
      purchaseOrderItem: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
      },
      supplier: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      $transaction: vi.fn().mockImplementation(callback => callback({
        purchaseOrder: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          deleteMany: mockDeleteMany,
        },
        purchaseOrderItem: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          deleteMany: mockDeleteMany,
        },
        supplier: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
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
  validateCreatePurchaseOrder: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdatePurchaseOrder: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateSupplier: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateSupplier: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('采购管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getPurchaseOrders 函数', () => {
    it('应该正确获取采购订单列表', async () => {
      const mockOrders = [
        {
          id: 1,
          supplierId: 1,
          employeeId: 1,
          orderDate: new Date(),
          totalAmount: 100,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          supplierId: 2,
          employeeId: 2,
          orderDate: new Date(),
          totalAmount: 200,
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockOrders);
      
      const result = await getPurchaseOrders();
      
      expect(findRecords).toHaveBeenCalledWith('purchaseOrder', expect.any(Object));
      expect(result).toEqual(mockOrders);
    });
    
    it('应该根据状态筛选采购订单', async () => {
      const mockOrders = [
        {
          id: 1,
          supplierId: 1,
          employeeId: 1,
          orderDate: new Date(),
          totalAmount: 100,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockOrders);
      
      const result = await getPurchaseOrders('pending');
      
      expect(findRecords).toHaveBeenCalledWith('purchaseOrder', expect.objectContaining({
        where: expect.objectContaining({
          status: 'pending',
        }),
      }));
      expect(result).toEqual(mockOrders);
    });
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
        id: 1,
        name: '供应商1',
        contactPerson: '联系人1',
        phone: '13800138001',
        email: 'supplier1@example.com',
        address: '地址1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.supplier.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockSupplier);
      
      const data = {
        name: '供应商1',
        contactPerson: '联系人1',
        phone: '13800138001',
        email: 'supplier1@example.com',
        address: '地址1',
      };
      
      const result = await createSupplier(data);
      
      expect(validateCreateSupplier).toHaveBeenCalledWith(data);
      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: {
          name: data.name,
        },
      });
      expect(createRecord).toHaveBeenCalledWith('supplier', expect.objectContaining({
        name: data.name,
      }), { checkSync: true });
      expect(result).toEqual(mockSupplier);
    });
    
    it('应该在供应商已存在时抛出错误', async () => {
      const mockSupplier = {
        id: 1,
        name: '供应商1',
        contactPerson: '联系人1',
        phone: '13800138001',
        email: 'supplier1@example.com',
        address: '地址1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.supplier.findFirst as any).mockResolvedValue(mockSupplier);
      
      const data = {
        name: '供应商1',
        contactPerson: '联系人1',
        phone: '13800138001',
        email: 'supplier1@example.com',
        address: '地址1',
      };
      
      await expect(createSupplier(data)).rejects.toThrow('供应商已存在');
    });
  });
});
