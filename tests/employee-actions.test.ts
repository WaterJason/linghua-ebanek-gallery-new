/**
 * 员工管理模块测试
 * 
 * 这个文件包含用于测试员工管理模块的测试用例
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getEmployeePositions,
  getEmployeeStatuses,
  getEmployeeAttendance,
  getEmployeeSalary
} from '../lib/actions/employee-actions';
import { 
  validateCreateEmployee, 
  validateUpdateEmployee
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
      employee: {
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
      },
      user: {
        update: mockUpdate,
        findFirst: mockFindFirst,
      },
      attendance: {
        findMany: mockFindMany,
      },
      salary: {
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
  validateCreateEmployee: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  validateUpdateEmployee: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
}));

describe('员工管理模块测试', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await prisma.$disconnect();
  });
  
  describe('getEmployees 函数', () => {
    it('应该正确获取员工列表', async () => {
      const mockEmployees = [
        {
          id: 1,
          name: '员工1',
          position: '销售经理',
          phone: '13800138001',
          email: 'employee1@example.com',
          dailySalary: 200,
          status: 'active',
          salary: 6000,
          address: '地址1',
          emergencyContact: '紧急联系人1',
          emergencyPhone: '13900139001',
          idNumber: '110101199001011234',
          bankAccount: '6225123456789012',
          bankName: '中国银行',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: '员工2',
          position: '销售顾问',
          phone: '13800138002',
          email: 'employee2@example.com',
          dailySalary: 150,
          status: 'active',
          salary: 4500,
          address: '地址2',
          emergencyContact: '紧急联系人2',
          emergencyPhone: '13900139002',
          idNumber: '110101199001021234',
          bankAccount: '6225123456789013',
          bankName: '工商银行',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (findRecords as any).mockResolvedValue(mockEmployees);
      
      const result = await getEmployees();
      
      expect(findRecords).toHaveBeenCalledWith('employee', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('员工1');
      expect(result[1].name).toBe('员工2');
    });
  });
  
  describe('createEmployee 函数', () => {
    it('应该正确创建员工', async () => {
      const mockEmployee = {
        id: 3,
        name: '员工3',
        position: '销售顾问',
        phone: '13800138003',
        email: 'employee3@example.com',
        dailySalary: 150,
        status: 'active',
        salary: 4500,
        address: '地址3',
        emergencyContact: '紧急联系人3',
        emergencyPhone: '13900139003',
        idNumber: '110101199001031234',
        bankAccount: '6225123456789014',
        bankName: '建设银行',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (createRecord as any).mockResolvedValue(mockEmployee);
      
      const data = {
        name: '员工3',
        position: '销售顾问',
        phone: '13800138003',
        email: 'employee3@example.com',
        dailySalary: 150,
      };
      
      const result = await createEmployee(data);
      
      expect(validateCreateEmployee).toHaveBeenCalledWith(data);
      expect(createRecord).toHaveBeenCalledWith('employee', expect.objectContaining({
        name: '员工3',
        position: '销售顾问',
      }));
      expect(result).toEqual(mockEmployee);
    });
    
    it('应该在验证失败时抛出错误', async () => {
      (validateCreateEmployee as any).mockReturnValueOnce({ isValid: false, errors: ['员工名称为必填项'] });
      
      const data = {
        position: '销售顾问',
        phone: '13800138003',
      };
      
      await expect(createEmployee(data as any)).rejects.toThrow('员工名称为必填项');
    });
  });
  
  describe('updateEmployee 函数', () => {
    it('应该正确更新员工', async () => {
      const mockEmployee = {
        id: 1,
        name: '员工1更新',
        position: '销售总监',
        phone: '13800138001',
        email: 'employee1@example.com',
        dailySalary: 250,
        status: 'active',
        salary: 7500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (findRecord as any).mockResolvedValue({ id: 1, name: '员工1' });
      (updateRecord as any).mockResolvedValue(mockEmployee);
      
      const data = {
        name: '员工1更新',
        position: '销售总监',
        dailySalary: 250,
        salary: 7500,
      };
      
      const result = await updateEmployee(1, data);
      
      expect(validateUpdateEmployee).toHaveBeenCalledWith(data);
      expect(findRecord).toHaveBeenCalledWith('employee', 1);
      expect(updateRecord).toHaveBeenCalledWith('employee', 1, expect.objectContaining({
        name: '员工1更新',
        position: '销售总监',
      }));
      expect(result).toEqual(mockEmployee);
    });
    
    it('应该在员工不存在时抛出错误', async () => {
      (findRecord as any).mockResolvedValue(null);
      
      const data = {
        name: '员工1更新',
      };
      
      await expect(updateEmployee(999, data)).rejects.toThrow('员工不存在');
    });
  });
});
