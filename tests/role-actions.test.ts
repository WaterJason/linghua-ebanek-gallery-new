/**
 * 角色管理模块测试
 * 
 * 这个文件包含用于测试角色管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getRoles, 
  getRole, 
  createRole, 
  updateRole, 
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getPermissions
} from '../lib/actions/role-actions';
import { 
  validateCreateRole, 
  validateUpdateRole
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
  const mockCount = vi.fn();
  
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      role: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        count: mockCount,
      },
      rolePermission: {
        create: mockCreate,
        createMany: mockCreateMany,
        deleteMany: mockDeleteMany,
        findMany: mockFindMany,
      },
      permission: {
        findMany: mockFindMany,
      },
      $transaction: vi.fn().mockImplementation(callback => callback({
        rolePermission: {
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
  validateCreateRole: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateRole: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

// 模拟 init-account-system 模块
vi.mock('../init-account-system', () => ({
  initAccountSystem: vi.fn(),
}));

describe('角色管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getRoles 函数', () => {
    it('应该正确获取角色列表', async () => {
      (prisma.role.count as any).mockResolvedValue(2);
      
      const mockRoles = [
        {
          id: 1,
          name: '管理员',
          code: 'admin',
          description: '系统管理员',
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            userRoles: 1,
          },
        },
        {
          id: 2,
          name: '用户',
          code: 'user',
          description: '普通用户',
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            userRoles: 2,
          },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockRoles);
      
      const result = await getRoles();
      
      expect(prisma.role.count).toHaveBeenCalled();
      expect(findRecords).toHaveBeenCalledWith('role', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].userCount).toBe(1);
      expect(result[1].userCount).toBe(2);
    });
    
    it('应该在角色表为空时尝试初始化', async () => {
      (prisma.role.count as any).mockResolvedValue(0);
      
      const { initAccountSystem } = await import('../init-account-system');
      
      const mockRoles = [
        {
          id: 1,
          name: '管理员',
          code: 'admin',
          description: '系统管理员',
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            userRoles: 0,
          },
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockRoles);
      
      const result = await getRoles();
      
      expect(prisma.role.count).toHaveBeenCalled();
      expect(initAccountSystem).toHaveBeenCalled();
      expect(findRecords).toHaveBeenCalledWith('role', expect.any(Object));
      expect(result).toHaveLength(1);
    });
  });
  
  describe('createRole 函数', () => {
    it('应该正确创建角色', async () => {
      const mockRole = {
        id: 3,
        name: '销售经理',
        code: 'sales_manager',
        description: '负责销售团队管理',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.role.findFirst as any).mockResolvedValue(null);
      (createRecord as any).mockResolvedValue(mockRole);
      
      const data = {
        name: '销售经理',
        code: 'sales_manager',
        description: '负责销售团队管理',
        permissionIds: [1, 2, 3],
      };
      
      const result = await createRole(data);
      
      expect(validateCreateRole).toHaveBeenCalledWith(data);
      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: 'sales_manager' },
            { name: '销售经理' },
          ],
        },
      });
      expect(createRecord).toHaveBeenCalledWith('role', expect.objectContaining({
        name: '销售经理',
        code: 'sales_manager',
        isSystem: false,
      }));
      expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ roleId: 3, permissionId: 1 }),
          expect.objectContaining({ roleId: 3, permissionId: 2 }),
          expect.objectContaining({ roleId: 3, permissionId: 3 }),
        ]),
        skipDuplicates: true,
      });
      expect(result).toEqual(mockRole);
    });
    
    it('应该在角色已存在时抛出错误', async () => {
      const mockRole = {
        id: 3,
        name: '销售经理',
        code: 'sales_manager',
      };
      
      (prisma.role.findFirst as any).mockResolvedValue(mockRole);
      
      const data = {
        name: '销售经理',
        code: 'sales_manager',
        description: '负责销售团队管理',
      };
      
      await expect(createRole(data)).rejects.toThrow('角色名称或代码已存在');
    });
  });
});
