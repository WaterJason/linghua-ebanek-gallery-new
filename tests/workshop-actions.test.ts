/**
 * 工作坊管理模块测试
 * 
 * 这个文件包含用于测试工作坊管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getWorkshopActivities, 
  getWorkshopActivity, 
  createWorkshopActivity, 
  updateWorkshopActivity, 
  deleteWorkshopActivity,
  getWorkshopChannels,
  createWorkshopChannel,
  updateWorkshopChannel,
  deleteWorkshopChannel,
  getWorkshopInstructors,
  createWorkshopInstructor,
  updateWorkshopInstructor,
  deleteWorkshopInstructor
} from '../lib/actions/workshop-actions';
import { 
  validateCreateWorkshopActivity, 
  validateUpdateWorkshopActivity,
  validateCreateWorkshopChannel,
  validateUpdateWorkshopChannel,
  validateCreateWorkshopInstructor,
  validateUpdateWorkshopInstructor
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
      workshopActivity: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        deleteMany: mockDeleteMany,
      },
      workshopParticipant: {
        create: mockCreate,
        createMany: mockCreateMany,
        deleteMany: mockDeleteMany,
      },
      workshopChannel: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      workshopInstructor: {
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
  validateCreateWorkshopActivity: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateWorkshopActivity: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateWorkshopChannel: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateWorkshopChannel: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateCreateWorkshopInstructor: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateWorkshopInstructor: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('工作坊管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getWorkshopActivities 函数', () => {
    it('应该正确获取工作坊活动列表', async () => {
      const mockActivities = [
        {
          id: 1,
          title: '测试活动1',
          date: new Date(),
          status: 'pending',
          participants: [
            { participant: { id: 1, name: '参与者1' } },
            { participant: { id: 2, name: '参与者2' } },
          ],
        },
        {
          id: 2,
          title: '测试活动2',
          date: new Date(),
          status: 'completed',
          participants: [],
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockActivities);
      
      const result = await getWorkshopActivities();
      
      expect(findRecords).toHaveBeenCalledWith('workshopActivity', expect.any(Object));
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('测试活动1');
      expect(result[0].participants.length).toBe(2);
    });
    
    it('应该根据状态筛选工作坊活动', async () => {
      const mockActivities = [
        {
          id: 1,
          title: '测试活动1',
          date: new Date(),
          status: 'pending',
          participants: [],
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockActivities);
      
      const result = await getWorkshopActivities('pending');
      
      expect(findRecords).toHaveBeenCalledWith('workshopActivity', expect.objectContaining({
        where: expect.objectContaining({
          status: 'pending',
        }),
      }));
      expect(result.length).toBe(1);
    });
    
    it('应该根据日期范围筛选工作坊活动', async () => {
      const mockActivities = [
        {
          id: 1,
          title: '测试活动1',
          date: new Date('2023-06-01'),
          status: 'pending',
          participants: [],
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockActivities);
      
      const result = await getWorkshopActivities(undefined, '2023-01-01', '2023-12-31');
      
      expect(findRecords).toHaveBeenCalledWith('workshopActivity', expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }));
      expect(result.length).toBe(1);
    });
  });
  
  describe('createWorkshopActivity 函数', () => {
    it('应该正确创建工作坊活动', async () => {
      const mockActivity = {
        id: 1,
        title: '测试活动',
        date: new Date('2023-06-01'),
        status: 'pending',
      };
      
      (createRecord as any).mockResolvedValue(mockActivity);
      (prisma.workshopParticipant.createMany as any).mockResolvedValue({ count: 2 });
      
      const data = {
        title: '测试活动',
        date: '2023-06-01',
        channelId: 1,
        instructorId: 1,
        participantIds: [1, 2],
      };
      
      const result = await createWorkshopActivity(data);
      
      expect(validateCreateWorkshopActivity).toHaveBeenCalledWith(data);
      expect(createRecord).toHaveBeenCalledWith('workshopActivity', expect.objectContaining({
        title: '测试活动',
        date: expect.any(Date),
      }));
      expect(prisma.workshopParticipant.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ activityId: 1, participantId: 1 }),
          expect.objectContaining({ activityId: 1, participantId: 2 }),
        ]),
        skipDuplicates: true,
      });
      expect(result).toEqual(mockActivity);
    });
    
    it('应该在验证失败时抛出错误', async () => {
      (validateCreateWorkshopActivity as any).mockReturnValueOnce({ isValid: false, errors: ['活动标题为必填项'] });
      
      const data = {
        date: '2023-06-01',
      };
      
      await expect(createWorkshopActivity(data as any)).rejects.toThrow('活动标题为必填项');
      expect(createRecord).not.toHaveBeenCalled();
    });
  });
});
