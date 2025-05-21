/**
 * 用户管理模块测试
 * 
 * 这个文件包含用于测试用户管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getUsers, 
  getUsersBasic, 
  createUser, 
  updateUser, 
  deleteUser,
  getUserRoles,
  updateUserRoles
} from '../lib/actions/user-actions';
import { 
  validateCreateUser, 
  validateUpdateUser,
  validateUpdateUserRoles
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
      user: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      userRole: {
        create: mockCreate,
        createMany: mockCreateMany,
        deleteMany: mockDeleteMany,
        findMany: mockFindMany,
      },
      $transaction: vi.fn().mockImplementation(callback => callback({
        userRole: {
          deleteMany: mockDeleteMany,
          createMany: mockCreateMany,
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
  validateCreateUser: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateUser: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateUserRoles: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('用户管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getUsers 函数', () => {
    it('应该正确获取用户列表', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: '用户1',
          email: 'user1@example.com',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
          employee: null,
          userRoles: [
            {
              role: {
                id: 1,
                name: '管理员',
                code: 'admin',
                description: '系统管理员',
              },
            },
          ],
        },
        {
          id: 'user2',
          name: '用户2',
          email: 'user2@example.com',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          employee: null,
          userRoles: [
            {
              role: {
                id: 2,
                name: '用户',
                code: 'user',
                description: '普通用户',
              },
            },
          ],
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockUsers);
      
      const result = await getUsers();
      
      expect(findRecords).toHaveBeenCalledWith('user', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].roles).toHaveLength(1);
      expect(result[0].roles[0].code).toBe('admin');
      expect(result[1].roles[0].code).toBe('user');
    });
  });
  
  describe('createUser 函数', () => {
    it('应该正确创建用户', async () => {
      const mockUser = {
        id: 'user3',
        name: '用户3',
        email: 'user3@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockUser);
      
      const data = {
        name: '用户3',
        email: 'user3@example.com',
        password: 'password123',
        roleIds: [2],
      };
      
      const result = await createUser(data);
      
      expect(validateCreateUser).toHaveBeenCalledWith(data);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'user3@example.com',
        },
      });
      expect(createRecord).toHaveBeenCalledWith('user', expect.objectContaining({
        name: '用户3',
        email: 'user3@example.com',
      }));
      expect(prisma.userRole.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user3', roleId: 2 }],
        skipDuplicates: true,
      });
      expect(result.id).toBe('user3');
      expect(result.roles).toEqual([2]);
    });
    
    it('应该在邮箱已存在时抛出错误', async () => {
      const mockUser = {
        id: 'user3',
        email: 'user3@example.com',
      };
      
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      
      const data = {
        name: '用户3',
        email: 'user3@example.com',
        password: 'password123',
      };
      
      await expect(createUser(data)).rejects.toThrow('该邮箱已被注册');
    });
  });
  
  describe('updateUserRoles 函数', () => {
    it('应该正确更新用户角色', async () => {
      const mockUser = {
        id: 'user1',
        name: '用户1',
        email: 'user1@example.com',
      };
      
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      
      const result = await updateUserRoles('user1', [1, 3]);
      
      expect(validateUpdateUserRoles).toHaveBeenCalledWith({ roleIds: [1, 3] });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
      });
      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
      expect(prisma.userRole.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user1', roleId: 1 }),
          expect.objectContaining({ userId: 'user1', roleId: 3 }),
        ]),
      });
      expect(result.success).toBe(true);
    });
  });
});
