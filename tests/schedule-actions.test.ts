/**
 * 日程管理模块测试
 * 
 * 这个文件包含用于测试日程管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getSchedules, 
  getEmployeeSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule,
  batchCreateSchedules
} from '../lib/actions/schedule-actions';
import { 
  validateCreateSchedule, 
  validateUpdateSchedule,
  validateBatchCreateSchedules
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
  const mockCreateMany = vi.fn();
  
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      schedule: {
        create: mockCreate,
        createMany: mockCreateMany,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      employee: {
        findUnique: mockFindUnique,
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
  validateCreateSchedule: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateSchedule: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateBatchCreateSchedules: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('日程管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getSchedules 函数', () => {
    it('应该正确获取日程列表', async () => {
      const mockSchedules = [
        {
          id: 1,
          employeeId: 1,
          date: new Date('2023-06-01'),
          startTime: '09:00',
          endTime: '18:00',
          employee: { id: 1, name: '员工1' },
          createdBy: { id: 'user1', name: '用户1', email: 'user1@example.com' },
        },
        {
          id: 2,
          employeeId: 2,
          date: new Date('2023-06-02'),
          startTime: '09:00',
          endTime: '18:00',
          employee: { id: 2, name: '员工2' },
          createdBy: { id: 'user1', name: '用户1', email: 'user1@example.com' },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockSchedules);
      
      const result = await getSchedules();
      
      expect(findRecords).toHaveBeenCalledWith('schedule', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].date).toEqual(new Date('2023-06-01'));
      expect(result[1].date).toEqual(new Date('2023-06-02'));
    });
    
    it('应该根据日期范围筛选日程', async () => {
      const mockSchedules = [
        {
          id: 1,
          employeeId: 1,
          date: new Date('2023-06-01'),
          startTime: '09:00',
          endTime: '18:00',
          employee: { id: 1, name: '员工1' },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockSchedules);
      
      const result = await getSchedules('2023-06-01', '2023-06-30');
      
      expect(findRecords).toHaveBeenCalledWith('schedule', expect.objectContaining({
        where: {
          date: {
            gte: new Date('2023-06-01'),
            lte: new Date('2023-06-30'),
          },
        },
      }));
      expect(result).toHaveLength(1);
      expect(result[0].date).toEqual(new Date('2023-06-01'));
    });
  });
  
  describe('createSchedule 函数', () => {
    it('应该正确创建日程', async () => {
      const mockEmployee = {
        id: 1,
        name: '员工1',
      };
      
      const mockSchedule = {
        id: 1,
        employeeId: 1,
        date: new Date('2023-07-01'),
        startTime: '09:00',
        endTime: '18:00',
      };
      
      (prisma.employee.findUnique as any).mockResolvedValue(mockEmployee);
      (prisma.schedule.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockSchedule);
      
      const data = {
        employeeId: 1,
        date: '2023-07-01',
        startTime: '09:00',
        endTime: '18:00',
      };
      
      const result = await createSchedule(data);
      
      expect(validateCreateSchedule).toHaveBeenCalledWith(data);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.schedule.findFirst).toHaveBeenCalledWith({
        where: {
          employeeId: 1,
          date: new Date('2023-07-01'),
        },
      });
      expect(createRecord).toHaveBeenCalledWith('schedule', expect.objectContaining({
        employeeId: 1,
        date: new Date('2023-07-01'),
        startTime: '09:00',
        endTime: '18:00',
      }));
      expect(result).toEqual(mockSchedule);
    });
    
    it('应该在员工不存在时抛出错误', async () => {
      (prisma.employee.findUnique as any).mockResolvedValue(null);
      
      const data = {
        employeeId: 999,
        date: '2023-07-01',
        startTime: '09:00',
        endTime: '18:00',
      };
      
      await expect(createSchedule(data)).rejects.toThrow('员工不存在');
    });
    
    it('应该在日程冲突时抛出错误', async () => {
      const mockEmployee = {
        id: 1,
        name: '员工1',
      };
      
      const mockExistingSchedule = {
        id: 1,
        employeeId: 1,
        date: new Date('2023-07-01'),
      };
      
      (prisma.employee.findUnique as any).mockResolvedValue(mockEmployee);
      (prisma.schedule.findFirst as any).mockResolvedValue(mockExistingSchedule);
      
      const data = {
        employeeId: 1,
        date: '2023-07-01',
        startTime: '09:00',
        endTime: '18:00',
      };
      
      await expect(createSchedule(data)).rejects.toThrow('该员工在指定日期已有日程安排');
    });
  });
});
