/**
 * 认证管理模块测试
 * 
 * 这个文件包含用于测试认证管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getCurrentUser, 
  getUserLoginHistory, 
  recordUserLogin,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  verifyTwoFactorAuth
} from '../lib/actions/auth-actions';
import { validateUserLoginRecord } from '../lib/validation';

// 模拟 Prisma 客户端
vi.mock('@prisma/client', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockFindMany = vi.fn();
  const mockFindUnique = vi.fn();
  const mockFindFirst = vi.fn();
  
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findUnique: mockFindUnique,
        update: mockUpdate,
      },
      userLoginHistory: {
        create: mockCreate,
        findMany: mockFindMany,
      },
      twoFactorAuth: {
        findUnique: mockFindUnique,
        create: mockCreate,
        update: mockUpdate,
        delete: vi.fn(),
      },
      $disconnect: vi.fn(),
    })),
  };
});

// 模拟 auth.ts 模块
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockReturnValue({
    user: {
      id: 'user1',
      name: '用户1',
      email: 'user1@example.com',
    },
  }),
}));

// 模拟 validation 模块
vi.mock('../lib/validation', () => ({
  validateUserLoginRecord: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('认证管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getCurrentUser 函数', () => {
    it('应该正确获取当前用户信息', async () => {
      const mockUser = {
        id: 'user1',
        name: '用户1',
        email: 'user1@example.com',
        role: 'admin',
        userRoles: [
          {
            role: {
              id: 1,
              name: '管理员',
              code: 'admin',
            },
          },
        ],
        userSettings: {
          theme: 'light',
          language: 'zh-CN',
        },
      };
      
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      
      const result = await getCurrentUser();
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });
    
    it('应该在用户未登录时返回null', async () => {
      vi.mock('@/lib/auth', () => ({
        auth: vi.fn().mockReturnValue({ user: null }),
      }), { virtual: true });
      
      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });
  });
  
  describe('getUserLoginHistory 函数', () => {
    it('应该正确获取用户登录历史', async () => {
      const mockLoginHistory = [
        {
          id: 1,
          userId: 'user1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          loginTime: new Date(),
          status: 'success',
        },
        {
          id: 2,
          userId: 'user1',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          loginTime: new Date(),
          status: 'success',
        },
      ];
      
      (prisma.userLoginHistory.findMany as any).mockResolvedValue(mockLoginHistory);
      
      const result = await getUserLoginHistory('user1');
      
      expect(prisma.userLoginHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: {
          loginTime: "desc",
        },
        take: 10,
      });
      expect(result).toEqual(mockLoginHistory);
    });
  });
  
  describe('recordUserLogin 函数', () => {
    it('应该正确记录用户登录', async () => {
      const mockLoginRecord = {
        id: 1,
        userId: 'user1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        loginTime: expect.any(Date),
        status: 'success',
      };
      
      (prisma.userLoginHistory.create as any).mockResolvedValue(mockLoginRecord);
      
      const result = await recordUserLogin('user1', '192.168.1.1', 'Mozilla/5.0...');
      
      expect(validateUserLoginRecord).toHaveBeenCalledWith({
        userId: 'user1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      });
      expect(prisma.userLoginHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          loginTime: expect.any(Date),
          status: 'success',
        },
      });
      expect(result).toEqual(mockLoginRecord);
    });
    
    it('应该在验证失败时返回null', async () => {
      (validateUserLoginRecord as any).mockReturnValueOnce({ isValid: false, errors: ['用户ID为必填项'] });
      
      const result = await recordUserLogin('', '192.168.1.1', 'Mozilla/5.0...');
      
      expect(validateUserLoginRecord).toHaveBeenCalled();
      expect(prisma.userLoginHistory.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
