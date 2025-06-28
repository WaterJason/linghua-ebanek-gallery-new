/**
 * 系统一致性检查工具
 * 
 * 用于检查ERP系统中的数据结构一致性、类型定义匹配、前端组件版本等问题
 */

"use server";

import prisma from "@/lib/db";
import { promises as fs } from 'fs';
import path from 'path';

export interface ConsistencyCheckResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface SystemConsistencyReport {
  timestamp: Date;
  overallStatus: 'healthy' | 'warning' | 'critical';
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  errorChecks: number;
  results: ConsistencyCheckResult[];
  recommendations: string[];
}

/**
 * 执行完整的系统一致性检查
 */
export async function runSystemConsistencyCheck(): Promise<SystemConsistencyReport> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 1. 数据库模型一致性检查
    const dbResults = await checkDatabaseConsistency();
    results.push(...dbResults);
    
    // 2. TypeScript类型定义检查
    const typeResults = await checkTypeDefinitions();
    results.push(...typeResults);
    
    // 3. 前端组件版本检查
    const componentResults = await checkComponentVersions();
    results.push(...componentResults);
    
    // 4. Server Actions一致性检查
    const actionResults = await checkServerActions();
    results.push(...actionResults);
    
    // 5. 路由结构检查
    const routeResults = await checkRouteStructure();
    results.push(...routeResults);
    
  } catch (error) {
    results.push({
      category: "系统检查",
      status: "error",
      message: "系统一致性检查过程中发生错误",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P0"
    });
  }
  
  // 统计结果
  const passedChecks = results.filter(r => r.status === 'success').length;
  const warningChecks = results.filter(r => r.status === 'warning').length;
  const errorChecks = results.filter(r => r.status === 'error').length;
  
  // 确定整体状态
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (errorChecks > 0) {
    overallStatus = 'critical';
  } else if (warningChecks > 0) {
    overallStatus = 'warning';
  }
  
  // 生成建议
  const recommendations = generateRecommendations(results);
  
  return {
    timestamp: new Date(),
    overallStatus,
    totalChecks: results.length,
    passedChecks,
    warningChecks,
    errorChecks,
    results,
    recommendations
  };
}

/**
 * 检查数据库模型一致性
 */
async function checkDatabaseConsistency(): Promise<ConsistencyCheckResult[]> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 检查关键表是否存在且有数据
    const tables = [
      { name: 'User', model: prisma.user },
      { name: 'Artwork', model: prisma.product },
      { name: 'ArtworkCategory', model: prisma.productCategory },
      { name: 'Employee', model: prisma.employee },
      { name: 'Order', model: prisma.order },
      { name: 'InventoryItem', model: prisma.inventoryItem }
    ];
    
    for (const table of tables) {
      try {
        const count = await table.model.count();
        results.push({
          category: "数据库一致性",
          status: "success",
          message: `${table.name}表结构正常`,
          details: [`记录数: ${count}`],
          priority: "P1"
        });
      } catch (error) {
        results.push({
          category: "数据库一致性",
          status: "error",
          message: `${table.name}表访问失败`,
          details: [error instanceof Error ? error.message : "未知错误"],
          priority: "P0"
        });
      }
    }
    
    // 检查外键关系
    const foreignKeyChecks = await checkForeignKeyIntegrity();
    results.push(...foreignKeyChecks);
    
  } catch (error) {
    results.push({
      category: "数据库一致性",
      status: "error",
      message: "数据库连接或查询失败",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P0"
    });
  }
  
  return results;
}

/**
 * 检查外键完整性
 */
async function checkForeignKeyIntegrity(): Promise<ConsistencyCheckResult[]> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 检查产品分类关联
    const productsWithInvalidCategory = await prisma.artwork.findMany({
      where: {
        categoryId: { not: null },
        productCategory: null
      }
    });
    
    if (productsWithInvalidCategory.length > 0) {
      results.push({
        category: "外键完整性",
        status: "error",
        message: "发现产品分类外键不一致",
        details: [`${productsWithInvalidCategory.length}个产品引用了不存在的分类`],
        priority: "P1"
      });
    } else {
      results.push({
        category: "外键完整性",
        status: "success",
        message: "产品分类外键关系正常",
        priority: "P2"
      });
    }
    
    // 检查用户员工关联
    const usersWithInvalidEmployee = await prisma.user.findMany({
      where: {
        employeeId: { not: null },
        employee: null
      }
    });
    
    if (usersWithInvalidEmployee.length > 0) {
      results.push({
        category: "外键完整性",
        status: "error",
        message: "发现用户员工外键不一致",
        details: [`${usersWithInvalidEmployee.length}个用户引用了不存在的员工`],
        priority: "P1"
      });
    } else {
      results.push({
        category: "外键完整性",
        status: "success",
        message: "用户员工外键关系正常",
        priority: "P2"
      });
    }
    
  } catch (error) {
    results.push({
      category: "外键完整性",
      status: "error",
      message: "外键完整性检查失败",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P1"
    });
  }
  
  return results;
}

/**
 * 检查TypeScript类型定义
 */
async function checkTypeDefinitions(): Promise<ConsistencyCheckResult[]> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 检查类型定义文件是否存在
    const typeFiles = [
      'types/artwork.ts',
      'types/prisma-models.ts',
      'types/user.ts',
      'types/employee.ts'
    ];
    
    for (const file of typeFiles) {
      try {
        await fs.access(file);
        results.push({
          category: "类型定义",
          status: "success",
          message: `类型文件存在: ${file}`,
          priority: "P2"
        });
      } catch {
        results.push({
          category: "类型定义",
          status: "warning",
          message: `类型文件缺失: ${file}`,
          priority: "P2"
        });
      }
    }
    
  } catch (error) {
    results.push({
      category: "类型定义",
      status: "error",
      message: "类型定义检查失败",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P1"
    });
  }
  
  return results;
}

/**
 * 检查前端组件版本
 */
async function checkComponentVersions(): Promise<ConsistencyCheckResult[]> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 检查关键组件是否使用ModernPageContainer
    const componentFiles = [
      'app/(main)/products/page.tsx',
      'app/(main)/employees/page.tsx',
      'app/(main)/inventory/page.tsx',
      'app/(main)/sales/page.tsx'
    ];
    
    for (const file of componentFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        if (content.includes('ModernPageContainer')) {
          results.push({
            category: "组件版本",
            status: "success",
            message: `${file} 使用了ModernPageContainer`,
            priority: "P2"
          });
        } else {
          results.push({
            category: "组件版本",
            status: "warning",
            message: `${file} 未使用ModernPageContainer`,
            priority: "P2"
          });
        }
      } catch {
        results.push({
          category: "组件版本",
          status: "warning",
          message: `无法检查文件: ${file}`,
          priority: "P3"
        });
      }
    }
    
  } catch (error) {
    results.push({
      category: "组件版本",
      status: "error",
      message: "组件版本检查失败",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P1"
    });
  }
  
  return results;
}

/**
 * 检查Server Actions一致性
 */
async function checkServerActions(): Promise<ConsistencyCheckResult[]> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 检查Server Actions文件
    const actionFiles = [
      'lib/actions/product-actions.ts',
      'lib/actions/user-actions.ts',
      'lib/actions/employee-actions.ts'
    ];
    
    for (const file of actionFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        if (content.includes('"use server"')) {
          results.push({
            category: "Server Actions",
            status: "success",
            message: `${file} 正确使用了"use server"指令`,
            priority: "P2"
          });
        } else {
          results.push({
            category: "Server Actions",
            status: "error",
            message: `${file} 缺少"use server"指令`,
            priority: "P1"
          });
        }
      } catch {
        results.push({
          category: "Server Actions",
          status: "warning",
          message: `无法检查文件: ${file}`,
          priority: "P3"
        });
      }
    }
    
  } catch (error) {
    results.push({
      category: "Server Actions",
      status: "error",
      message: "Server Actions检查失败",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P1"
    });
  }
  
  return results;
}

/**
 * 检查路由结构
 */
async function checkRouteStructure(): Promise<ConsistencyCheckResult[]> {
  const results: ConsistencyCheckResult[] = [];
  
  try {
    // 检查主要路由是否存在
    const routes = [
      'app/(main)/products/page.tsx',
      'app/(main)/employees/page.tsx',
      'app/(main)/inventory/page.tsx',
      'app/(main)/sales/page.tsx',
      'app/(main)/finance/page.tsx'
    ];
    
    for (const route of routes) {
      try {
        await fs.access(route);
        results.push({
          category: "路由结构",
          status: "success",
          message: `路由存在: ${route}`,
          priority: "P2"
        });
      } catch {
        results.push({
          category: "路由结构",
          status: "error",
          message: `路由缺失: ${route}`,
          priority: "P1"
        });
      }
    }
    
  } catch (error) {
    results.push({
      category: "路由结构",
      status: "error",
      message: "路由结构检查失败",
      details: [error instanceof Error ? error.message : "未知错误"],
      priority: "P1"
    });
  }
  
  return results;
}

/**
 * 生成修复建议
 */
function generateRecommendations(results: ConsistencyCheckResult[]): string[] {
  const recommendations: string[] = [];
  
  const errorResults = results.filter(r => r.status === 'error');
  const warningResults = results.filter(r => r.status === 'warning');
  
  if (errorResults.length > 0) {
    recommendations.push("🚨 优先修复所有错误级别的问题，这些问题可能影响系统稳定性");
  }
  
  if (warningResults.length > 0) {
    recommendations.push("⚠️ 处理警告级别的问题，提升系统一致性");
  }
  
  // 具体建议
  if (errorResults.some(r => r.category === "数据库一致性")) {
    recommendations.push("🔧 检查数据库连接和表结构，确保所有必要的表都存在且可访问");
  }
  
  if (errorResults.some(r => r.category === "外键完整性")) {
    recommendations.push("🔗 修复外键关系不一致问题，清理孤立记录或补充缺失的关联记录");
  }
  
  if (warningResults.some(r => r.category === "组件版本")) {
    recommendations.push("🎨 统一前端组件版本，确保所有页面都使用ModernPageContainer布局");
  }
  
  if (errorResults.some(r => r.category === "Server Actions")) {
    recommendations.push("⚡ 修复Server Actions文件，确保所有服务器端操作都包含正确的指令");
  }
  
  recommendations.push("📋 定期运行一致性检查，建立预防性维护机制");
  recommendations.push("📚 更新开发文档，确保团队遵循统一的开发规范");
  
  return recommendations;
}
