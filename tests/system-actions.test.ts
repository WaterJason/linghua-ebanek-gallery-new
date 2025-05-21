/**
 * 系统管理模块测试
 * 
 * 这个文件包含用于测试系统管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getSystemSettings, 
  updateSystemSettings, 
  getSystemLogs, 
  createSystemLog,
  clearSystemLogs,
  getSystemStats
} from '../lib/actions/system-actions';
import { 
  validateUpdateSystemSettings,
  validateCreateSystemLog
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
  const mockCount = vi.fn();
  
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      systemSetting: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      systemLog: {
        create: mockCreate,
        findMany: mockFindMany,
        deleteMany: mockDeleteMany,
      },
      user: {
        count: mockCount,
      },
      product: {
        count: mockCount,
        findMany: mockFindMany,
      },
      order: {
        count: mockCount,
        findMany: mockFindMany,
      },
      customer: {
        count: mockCount,
      },
      workshopActivity: {
        count: mockCount,
      },
      workshop: {
        findMany: mockFindMany,
      },
      employee: {
        count: mockCount,
      },
      supplier: {
        count: mockCount,
      },
      inventoryItem: {
        count: mockCount,
      },
      gallerySale: {
        findMany: mockFindMany,
      },
      coffeeShopSale: {
        findMany: mockFindMany,
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
  validateUpdateSystemSettings: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateSystemLog: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('系统管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getSystemSettings 函数', () => {
    it('应该正确获取系统设置', async () => {
      const mockSettings = {
        id: 1,
        companyName: '聆花掐丝珐琅馆',
        coffeeSalesCommissionRate: 20,
        gallerySalesCommissionRate: 10,
        teacherWorkshopFee: 200,
        assistantWorkshopFee: 130,
        teacherWorkshopFeeOutside: 200,
        assistantWorkshopFeeOutside: 130,
        teacherWorkshopFeeInside: 180,
        assistantWorkshopFeeInside: 110,
        enableImageUpload: true,
        enableNotifications: true,
        basicWorkingHours: 8,
        basicWorkingDays: 22,
        overtimeRate: 1.5,
        weekendOvertimeRate: 2,
        holidayOvertimeRate: 3,
        socialInsuranceRate: 0,
        taxRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.systemSetting.findFirst as any).mockResolvedValue(mockSettings);
      
      const result = await getSystemSettings();
      
      expect(prisma.systemSetting.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });
    
    it('应该在系统设置不存在时创建默认设置', async () => {
      const mockSettings = {
        id: 1,
        companyName: '聆花掐丝珐琅馆',
        coffeeSalesCommissionRate: 20,
        gallerySalesCommissionRate: 10,
        teacherWorkshopFee: 200,
        assistantWorkshopFee: 130,
        teacherWorkshopFeeOutside: 200,
        assistantWorkshopFeeOutside: 130,
        teacherWorkshopFeeInside: 180,
        assistantWorkshopFeeInside: 110,
        enableImageUpload: true,
        enableNotifications: true,
        basicWorkingHours: 8,
        basicWorkingDays: 22,
        overtimeRate: 1.5,
        weekendOvertimeRate: 2,
        holidayOvertimeRate: 3,
        socialInsuranceRate: 0,
        taxRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.systemSetting.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockSettings);
      
      const result = await getSystemSettings();
      
      expect(prisma.systemSetting.findFirst).toHaveBeenCalled();
      expect(createRecord).toHaveBeenCalledWith('systemSetting', expect.objectContaining({
        companyName: '聆花掐丝珐琅馆',
      }));
      expect(result).toEqual(mockSettings);
    });
  });
  
  describe('createSystemLog 函数', () => {
    it('应该正确创建系统日志', async () => {
      const mockLog = {
        id: 1,
        level: 'info',
        module: '用户管理',
        message: '用户登录成功',
        details: JSON.stringify({ userId: 'user123', ip: '192.168.1.1' }),
        userId: 'user123',
        timestamp: new Date(),
      };
      
      (createRecord as any).mockResolvedValue(mockLog);
      
      const data = {
        level: 'info',
        module: '用户管理',
        message: '用户登录成功',
        details: JSON.stringify({ userId: 'user123', ip: '192.168.1.1' }),
        userId: 'user123',
      };
      
      const result = await createSystemLog(data);
      
      expect(validateCreateSystemLog).toHaveBeenCalledWith(data);
      expect(createRecord).toHaveBeenCalledWith('systemLog', expect.objectContaining({
        level: 'info',
        module: '用户管理',
        message: '用户登录成功',
      }));
      expect(result).toEqual(mockLog);
    });
  });
});
