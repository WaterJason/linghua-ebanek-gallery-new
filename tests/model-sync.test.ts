/**
 * 模型同步测试
 * 
 * 这个文件包含用于测试模型同步的测试用例
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { checkModelSync, convertToModelFormat } from '../lib/model-sync';
import { 
  validateCreateProduct, 
  validateUpdateProduct,
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCreateEmployee,
  validateUpdateEmployee
} from '../lib/validation';

// 初始化 Prisma 客户端
const prisma = new PrismaClient();

describe('模型同步测试', () => {
  describe('checkModelSync 函数', () => {
    it('应该正确检查有效的产品数据', async () => {
      const data = {
        name: '测试产品',
        price: 100,
        commissionRate: 10,
        type: 'product',
      };
      
      const result = await checkModelSync('Product', data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('应该检测到无效的产品字段', async () => {
      const data = {
        name: '测试产品',
        price: 100,
        commissionRate: 10,
        type: 'product',
        invalidField: 'invalid', // 无效字段
      };
      
      const result = await checkModelSync('Product', data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('invalidField');
    });
    
    it('应该正确检查有效的客户数据', async () => {
      const data = {
        name: '测试客户',
        phone: '13800138000',
        email: 'test@example.com',
        type: 'individual',
      };
      
      const result = await checkModelSync('Customer', data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('应该检测到无效的客户字段', async () => {
      const data = {
        name: '测试客户',
        phone: '13800138000',
        email: 'test@example.com',
        type: 'individual',
        invalidField: 'invalid', // 无效字段
      };
      
      const result = await checkModelSync('Customer', data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('invalidField');
    });
    
    it('应该正确检查有效的员工数据', async () => {
      const data = {
        name: '测试员工',
        position: '经理',
        dailySalary: 200,
        status: 'active',
      };
      
      const result = await checkModelSync('Employee', data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('应该检测到无效的员工字段', async () => {
      const data = {
        name: '测试员工',
        position: '经理',
        dailySalary: 200,
        status: 'active',
        department: '销售部', // 无效字段
      };
      
      const result = await checkModelSync('Employee', data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('department');
    });
  });
  
  describe('convertToModelFormat 函数', () => {
    it('应该正确转换产品数据类型', async () => {
      const data = {
        name: '测试产品',
        price: '100', // 字符串类型
        commissionRate: '10', // 字符串类型
        type: 'product',
      };
      
      const result = await convertToModelFormat('Product', data);
      expect(result.price).toBe(100); // 转换为数字类型
      expect(result.commissionRate).toBe(10); // 转换为数字类型
    });
    
    it('应该正确转换客户数据类型', async () => {
      const data = {
        name: '测试客户',
        phone: '13800138000',
        email: 'test@example.com',
        type: 'individual',
        isActive: 'true', // 字符串类型
      };
      
      const result = await convertToModelFormat('Customer', data);
      expect(result.isActive).toBe(true); // 转换为布尔类型
    });
    
    it('应该正确转换员工数据类型', async () => {
      const data = {
        name: '测试员工',
        position: '经理',
        dailySalary: '200', // 字符串类型
        status: 'active',
      };
      
      const result = await convertToModelFormat('Employee', data);
      expect(result.dailySalary).toBe(200); // 转换为数字类型
    });
  });
  
  describe('验证函数测试', () => {
    describe('产品验证', () => {
      it('应该正确验证有效的产品创建数据', () => {
        const data = {
          name: '测试产品',
          price: 100,
          commissionRate: 10,
          type: 'product',
        };
        
        const result = validateCreateProduct(data);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('应该检测到无效的产品创建数据', () => {
        const data = {
          // 缺少必填字段 name
          price: 100,
          commissionRate: 10,
          type: 'product',
        };
        
        const result = validateCreateProduct(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
      
      it('应该正确验证有效的产品更新数据', () => {
        const data = {
          name: '测试产品',
          price: 100,
        };
        
        const result = validateUpdateProduct(data);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('应该检测到无效的产品更新数据', () => {
        const data = {
          price: -100, // 价格不能为负数
        };
        
        const result = validateUpdateProduct(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
    
    describe('客户验证', () => {
      it('应该正确验证有效的客户创建数据', () => {
        const data = {
          name: '测试客户',
          phone: '13800138000',
          email: 'test@example.com',
          type: 'individual',
        };
        
        const result = validateCreateCustomer(data);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('应该检测到无效的客户创建数据', () => {
        const data = {
          // 缺少必填字段 name
          phone: '13800138000',
          email: 'test@example.com',
          type: 'individual',
        };
        
        const result = validateCreateCustomer(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
    
    describe('员工验证', () => {
      it('应该正确验证有效的员工创建数据', () => {
        const data = {
          name: '测试员工',
          position: '经理',
          dailySalary: 200,
          status: 'active',
        };
        
        const result = validateCreateEmployee(data);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('应该检测到无效的员工创建数据', () => {
        const data = {
          // 缺少必填字段 name
          position: '经理',
          dailySalary: 200,
          status: 'active',
        };
        
        const result = validateCreateEmployee(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });
});
