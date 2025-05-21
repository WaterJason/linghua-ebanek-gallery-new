/**
 * 销售订单管理模块测试
 * 
 * 这个文件包含用于测试销售订单管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getSalesOrders, 
  getSalesOrder, 
  createSalesOrder, 
  updateSalesOrder, 
  cancelSalesOrder
} from '../lib/actions/sales-actions';
import { 
  validateCreateOrder, 
  validateUpdateOrder
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
      order: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      orderItem: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
      },
      payment: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      inventoryItem: {
        findFirst: mockFindFirst,
        update: mockUpdate,
      },
      inventoryTransaction: {
        create: mockCreate,
      },
      $transaction: vi.fn().mockImplementation(callback => callback({
        order: {
          create: mockCreate,
          update: mockUpdate,
          findUnique: mockFindUnique,
        },
        orderItem: {
          create: mockCreate,
          deleteMany: mockDeleteMany,
        },
        payment: {
          create: mockCreate,
        },
        inventoryItem: {
          findFirst: mockFindFirst,
          update: mockUpdate,
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
  validateCreateOrder: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateOrder: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('销售订单管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getSalesOrders 函数', () => {
    it('应该正确获取销售订单列表', async () => {
      const mockOrders = [
        {
          id: 1,
          orderDate: new Date('2023-06-01'),
          totalAmount: 300,
          status: 'completed',
          paymentStatus: 'paid',
          customer: { id: 1, name: '客户1' },
          orderItems: [
            { 
              id: 1, 
              productId: 1, 
              quantity: 2, 
              price: 100, 
              product: { id: 1, name: '产品1' } 
            },
            { 
              id: 2, 
              productId: 2, 
              quantity: 1, 
              price: 100, 
              product: { id: 2, name: '产品2' } 
            },
          ],
          payments: [
            { id: 1, amount: 300, method: 'cash', status: 'completed' },
          ],
          createdBy: { id: 'user1', name: '用户1', email: 'user1@example.com' },
        },
        {
          id: 2,
          orderDate: new Date('2023-06-15'),
          totalAmount: 200,
          status: 'pending',
          paymentStatus: 'unpaid',
          customer: { id: 2, name: '客户2' },
          orderItems: [
            { 
              id: 3, 
              productId: 1, 
              quantity: 2, 
              price: 100, 
              product: { id: 1, name: '产品1' } 
            },
          ],
          payments: [],
          createdBy: { id: 'user1', name: '用户1', email: 'user1@example.com' },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockOrders);
      
      const result = await getSalesOrders();
      
      expect(findRecords).toHaveBeenCalledWith('order', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].orderItems).toHaveLength(2);
      expect(result[0].payments).toHaveLength(1);
      expect(result[1].id).toBe(2);
      expect(result[1].orderItems).toHaveLength(1);
      expect(result[1].payments).toHaveLength(0);
    });
    
    it('应该根据状态筛选销售订单', async () => {
      const mockOrders = [
        {
          id: 1,
          orderDate: new Date('2023-06-01'),
          totalAmount: 300,
          status: 'completed',
          paymentStatus: 'paid',
          orderItems: [],
          payments: [],
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockOrders);
      
      const result = await getSalesOrders('completed');
      
      expect(findRecords).toHaveBeenCalledWith('order', expect.objectContaining({
        where: { status: 'completed' },
      }));
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
    });
  });
  
  describe('createSalesOrder 函数', () => {
    it('应该正确创建销售订单', async () => {
      const mockOrder = {
        id: 3,
        orderDate: new Date('2023-07-01'),
        totalAmount: 300,
        status: 'pending',
        paymentStatus: 'unpaid',
      };
      
      const mockInventory = {
        id: 1,
        productId: 1,
        quantity: 10,
        warehouseId: 1,
      };
      
      (prisma.$transaction as any).mockResolvedValue(mockOrder);
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(mockInventory);
      
      const data = {
        orderDate: '2023-07-01',
        customerId: 1,
        items: [
          { productId: 1, quantity: 2, price: 100 },
          { productId: 2, quantity: 1, price: 100 },
        ],
      };
      
      const result = await createSalesOrder(data);
      
      expect(validateCreateOrder).toHaveBeenCalledWith(data);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });
  });
  
  describe('cancelSalesOrder 函数', () => {
    it('应该正确取消销售订单', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
        orderItems: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      };
      
      const mockInventory = {
        id: 1,
        productId: 1,
        quantity: 8,
        warehouseId: 1,
      };
      
      (findRecord as any).mockResolvedValue(mockOrder);
      (prisma.inventoryItem.findFirst as any).mockResolvedValue(mockInventory);
      (prisma.$transaction as any).mockResolvedValue({ ...mockOrder, status: 'cancelled' });
      
      const result = await cancelSalesOrder(1);
      
      expect(findRecord).toHaveBeenCalledWith('order', 1, expect.any(Object));
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe('cancelled');
    });
    
    it('应该在订单不存在时抛出错误', async () => {
      (findRecord as any).mockResolvedValue(null);
      
      await expect(cancelSalesOrder(999)).rejects.toThrow('订单不存在');
    });
    
    it('应该在订单已完成或已取消时抛出错误', async () => {
      const mockCompletedOrder = {
        id: 1,
        status: 'completed',
      };
      
      (findRecord as any).mockResolvedValue(mockCompletedOrder);
      
      await expect(cancelSalesOrder(1)).rejects.toThrow('已完成或已取消的订单不能再次取消');
    });
  });
});
