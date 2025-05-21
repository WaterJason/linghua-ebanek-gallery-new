/**
 * 数据操作测试
 * 
 * 这个文件包含用于测试数据操作的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  createRecord, 
  updateRecord, 
  deleteRecord, 
  findRecords, 
  findRecord 
} from '../lib/prisma-wrapper';

// 模拟 Prisma 客户端
vi.mock('@prisma/client', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockFindMany = vi.fn();
  const mockFindUnique = vi.fn();
  
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      product: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
      },
      customer: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
      },
      employee: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
      },
      $disconnect: vi.fn(),
    })),
  };
});

// 模拟 model-sync 模块
vi.mock('../lib/model-sync', () => ({
  checkModelSync: vi.fn().mockResolvedValue({ isValid: true, errors: [] }),
  convertToModelFormat: vi.fn().mockImplementation((model, data) => data),
}));

describe('数据操作测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('createRecord 函数', () => {
    it('应该正确创建产品记录', async () => {
      const mockProduct = {
        id: 1,
        name: '测试产品',
        price: 100,
        commissionRate: 10,
        type: 'product',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.product.create as any).mockResolvedValue(mockProduct);
      
      const data = {
        name: '测试产品',
        price: 100,
        commissionRate: 10,
        type: 'product',
      };
      
      const result = await createRecord('product', data);
      
      expect(prisma.product.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockProduct);
    });
    
    it('应该正确创建客户记录', async () => {
      const mockCustomer = {
        id: 1,
        name: '测试客户',
        phone: '13800138000',
        email: 'test@example.com',
        type: 'individual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.customer.create as any).mockResolvedValue(mockCustomer);
      
      const data = {
        name: '测试客户',
        phone: '13800138000',
        email: 'test@example.com',
        type: 'individual',
      };
      
      const result = await createRecord('customer', data);
      
      expect(prisma.customer.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCustomer);
    });
    
    it('应该正确创建员工记录', async () => {
      const mockEmployee = {
        id: 1,
        name: '测试员工',
        position: '经理',
        dailySalary: 200,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.employee.create as any).mockResolvedValue(mockEmployee);
      
      const data = {
        name: '测试员工',
        position: '经理',
        dailySalary: 200,
        status: 'active',
      };
      
      const result = await createRecord('employee', data);
      
      expect(prisma.employee.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockEmployee);
    });
  });
  
  describe('updateRecord 函数', () => {
    it('应该正确更新产品记录', async () => {
      const mockProduct = {
        id: 1,
        name: '更新后的产品',
        price: 200,
        commissionRate: 10,
        type: 'product',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.product.update as any).mockResolvedValue(mockProduct);
      
      const data = {
        name: '更新后的产品',
        price: 200,
      };
      
      const result = await updateRecord('product', 1, data);
      
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data,
      });
      expect(result).toEqual(mockProduct);
    });
  });
  
  describe('deleteRecord 函数', () => {
    it('应该正确删除产品记录', async () => {
      const mockProduct = {
        id: 1,
        name: '测试产品',
        price: 100,
        commissionRate: 10,
        type: 'product',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.product.delete as any).mockResolvedValue(mockProduct);
      
      const result = await deleteRecord('product', 1);
      
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ success: true });
    });
  });
  
  describe('findRecords 函数', () => {
    it('应该正确查找产品记录', async () => {
      const mockProducts = [
        {
          id: 1,
          name: '测试产品1',
          price: 100,
          commissionRate: 10,
          type: 'product',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: '测试产品2',
          price: 200,
          commissionRate: 20,
          type: 'product',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      
      const options = {
        where: {
          type: 'product',
        },
        orderBy: {
          price: 'asc',
        },
      };
      
      const result = await findRecords('product', options);
      
      expect(prisma.product.findMany).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockProducts);
    });
  });
  
  describe('findRecord 函数', () => {
    it('应该正确查找单个产品记录', async () => {
      const mockProduct = {
        id: 1,
        name: '测试产品',
        price: 100,
        commissionRate: 10,
        type: 'product',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      
      const result = await findRecord('product', 1);
      
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockProduct);
    });
  });
});
