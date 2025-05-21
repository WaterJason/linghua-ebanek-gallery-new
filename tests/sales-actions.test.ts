/**
 * 销售管理模块测试
 *
 * 这个文件包含用于测试销售管理模块的测试用例，包括订单管理、珐琅馆销售和客户管理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  getSalesOrders,
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  cancelSalesOrder,
  getGallerySales,
  createGallerySale,
  getCoffeeShopSales,
  createCoffeeShopSale,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../lib/actions/sales-actions';
import {
  validateCreateOrder,
  validateUpdateOrder,
  validateCreateGallerySale,
  validateUpdateGallerySale,
  validateCreateCoffeeShopSale,
  validateUpdateCoffeeShopSale,
  validateCreateCustomer,
  validateUpdateCustomer
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
  const mockCreateMany = vi.fn();

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      order: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
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
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      inventoryTransaction: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      gallerySale: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      gallerySaleItem: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      coffeeShopSale: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      customer: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      $transaction: vi.fn().mockImplementation(callback => callback({
        order: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          deleteMany: mockDeleteMany,
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
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
        },
        inventoryTransaction: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
        },
        gallerySale: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
        },
        gallerySaleItem: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
        },
        coffeeShopSale: {
          create: mockCreate,
          update: mockUpdate,
          delete: mockDelete,
          findMany: mockFindMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
        },
        customer: {
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
  validateCreateOrder: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateOrder: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateGallerySale: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateGallerySale: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateCoffeeShopSale: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateCoffeeShopSale: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateCustomer: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateCustomer: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('销售管理模块测试', () => {
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
          customerId: 1,
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
          customerId: 2,
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

      const result = await getSalesOrders();

      expect(findRecords).toHaveBeenCalledWith('order', expect.any(Object));
      expect(result).toEqual(mockOrders);
    });

    it('应该根据状态筛选销售订单', async () => {
      const mockOrders = [
        {
          id: 1,
          customerId: 1,
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

      const result = await getSalesOrders('pending');

      expect(findRecords).toHaveBeenCalledWith('order', expect.objectContaining({
        where: expect.objectContaining({
          status: 'pending',
        }),
      }));
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getSalesOrder 函数', () => {
    it('应该正确获取单个销售订单', async () => {
      const mockOrder = {
        id: 1,
        customerId: 1,
        employeeId: 1,
        orderDate: new Date(),
        totalAmount: 100,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (findRecord as any).mockResolvedValue(mockOrder);

      const result = await getSalesOrder(1);

      expect(findRecord).toHaveBeenCalledWith('order', 1, expect.any(Object));
      expect(result).toEqual(mockOrder);
    });

    it('应该在订单不存在时抛出错误', async () => {
      (findRecord as any).mockResolvedValue(null);

      await expect(getSalesOrder(1)).rejects.toThrow('订单不存在');
    });
  });

  describe('createSalesOrder 函数', () => {
    it('应该正确创建销售订单', async () => {
      const mockOrder = {
        id: 1,
        customerId: 1,
        employeeId: 1,
        orderDate: new Date(),
        totalAmount: 100,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.order.create as any).mockResolvedValue(mockOrder);
      (prisma.inventoryItem.findFirst as any).mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 10,
        warehouseId: 1,
      });

      const data = {
        customerId: 1,
        employeeId: 1,
        orderDate: new Date(),
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 50,
          },
        ],
      };

      const result = await createSalesOrder(data);

      expect(validateCreateOrder).toHaveBeenCalledWith(data);
      expect(prisma.order.create).toHaveBeenCalled();
      expect(prisma.orderItem.create).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('应该在验证失败时抛出错误', async () => {
      (validateCreateOrder as any).mockReturnValueOnce({ isValid: false, errors: ['订单项不能为空'] });

      const data = {
        customerId: 1,
        employeeId: 1,
        orderDate: new Date(),
        items: [],
      };

      await expect(createSalesOrder(data)).rejects.toThrow('订单项不能为空');
    });
  });

  describe('getCustomers 函数', () => {
    it('应该正确获取客户列表', async () => {
      const mockCustomers = [
        {
          id: 1,
          name: '客户1',
          phone: '13800138001',
          email: 'customer1@example.com',
          address: '地址1',
          type: 'regular',
          notes: '备注1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            orders: 2,
          },
        },
        {
          id: 2,
          name: '客户2',
          phone: '13800138002',
          email: 'customer2@example.com',
          address: '地址2',
          type: 'vip',
          notes: '备注2',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            orders: 0,
          },
        },
      ];

      (findRecords as any).mockResolvedValue(mockCustomers);

      const result = await getCustomers();

      expect(findRecords).toHaveBeenCalledWith('customer', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].orderCount).toBe(2);
      expect(result[1].orderCount).toBe(0);
    });
  });

  describe('createCustomer 函数', () => {
    it('应该正确创建客户', async () => {
      const mockCustomer = {
        id: 1,
        name: '客户1',
        phone: '13800138001',
        email: 'customer1@example.com',
        address: '地址1',
        type: 'regular',
        notes: '备注1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockCustomer);

      const data = {
        name: '客户1',
        phone: '13800138001',
        email: 'customer1@example.com',
        address: '地址1',
      };

      const result = await createCustomer(data);

      expect(validateCreateCustomer).toHaveBeenCalledWith(data);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          phone: '13800138001',
        },
      });
      expect(createRecord).toHaveBeenCalledWith('customer', expect.objectContaining({
        name: '客户1',
        phone: '13800138001',
      }));
      expect(result).toEqual(mockCustomer);
    });

    it('应该在手机号已存在时抛出错误', async () => {
      const mockCustomer = {
        id: 1,
        name: '客户1',
        phone: '13800138001',
        email: 'customer1@example.com',
      };

      (prisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

      const data = {
        name: '客户2',
        phone: '13800138001',
        email: 'customer2@example.com',
      };

      await expect(createCustomer(data)).rejects.toThrow('该手机号已被注册');
    });
  });

  describe('createGallerySale 函数', () => {
    it('应该正确创建珐琅馆销售记录', async () => {
      const mockSale = {
        id: 1,
        date: new Date('2023-06-01'),
        totalAmount: 300,
        paymentMethod: 'cash',
        notes: '备注',
        createdById: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.$transaction as any).mockResolvedValue(mockSale);

      const data = {
        date: '2023-06-01',
        paymentMethod: 'cash',
        notes: '备注',
        createdById: 'user1',
        items: [
          { productId: 1, quantity: 2, price: 100 },
          { productId: 2, quantity: 1, price: 100 },
        ],
      };

      const result = await createGallerySale(data);

      expect(validateCreateGallerySale).toHaveBeenCalledWith(data);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockSale);
    });
  });
});
