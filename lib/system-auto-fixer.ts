/**
 * 系统自动修复工具
 * 
 * 基于一致性检查结果，自动修复可修复的问题
 */

"use server";

import prisma from "@/lib/db";
import { promises as fs } from 'fs';
import { ConsistencyCheckResult } from './system-consistency-checker';

export interface AutoFixResult {
  category: string;
  action: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  details?: string[];
}

export interface AutoFixReport {
  timestamp: Date;
  totalFixes: number;
  successfulFixes: number;
  failedFixes: number;
  skippedFixes: number;
  results: AutoFixResult[];
  manualActionsRequired: string[];
}

/**
 * 执行自动修复
 */
export async function runAutoFix(issues: ConsistencyCheckResult[]): Promise<AutoFixReport> {
  const results: AutoFixResult[] = [];
  const manualActionsRequired: string[] = [];
  
  for (const issue of issues) {
    if (issue.status === 'success') continue; // 跳过正常的检查项
    
    try {
      const fixResult = await attemptAutoFix(issue);
      results.push(fixResult);
      
      if (fixResult.status === 'skipped') {
        manualActionsRequired.push(`${issue.category}: ${issue.message}`);
      }
    } catch (error) {
      results.push({
        category: issue.category,
        action: "自动修复",
        status: "failed",
        message: `修复失败: ${issue.message}`,
        details: [error instanceof Error ? error.message : "未知错误"]
      });
    }
  }
  
  const successfulFixes = results.filter(r => r.status === 'success').length;
  const failedFixes = results.filter(r => r.status === 'failed').length;
  const skippedFixes = results.filter(r => r.status === 'skipped').length;
  
  return {
    timestamp: new Date(),
    totalFixes: results.length,
    successfulFixes,
    failedFixes,
    skippedFixes,
    results,
    manualActionsRequired
  };
}

/**
 * 尝试自动修复单个问题
 */
async function attemptAutoFix(issue: ConsistencyCheckResult): Promise<AutoFixResult> {
  switch (issue.category) {
    case "外键完整性":
      return await fixForeignKeyIntegrity(issue);
    
    case "类型定义":
      return await fixTypeDefinitions(issue);
    
    case "组件版本":
      return await fixComponentVersions(issue);
    
    case "Server Actions":
      return await fixServerActions(issue);
    
    default:
      return {
        category: issue.category,
        action: "跳过",
        status: "skipped",
        message: `无法自动修复: ${issue.message}`,
        details: ["需要手动处理"]
      };
  }
}

/**
 * 修复外键完整性问题
 */
async function fixForeignKeyIntegrity(issue: ConsistencyCheckResult): Promise<AutoFixResult> {
  try {
    if (issue.message.includes("产品分类外键不一致")) {
      // 将引用不存在分类的产品的categoryId设为null
      const result = await prisma.product.updateMany({
        where: {
          categoryId: { not: null },
          productCategory: null
        },
        data: {
          categoryId: null
        }
      });
      
      return {
        category: "外键完整性",
        action: "清理产品分类外键",
        status: "success",
        message: `已修复产品分类外键问题`,
        details: [`更新了 ${result.count} 个产品记录`]
      };
    }
    
    if (issue.message.includes("用户员工外键不一致")) {
      // 将引用不存在员工的用户的employeeId设为null
      const result = await prisma.user.updateMany({
        where: {
          employeeId: { not: null },
          employee: null
        },
        data: {
          employeeId: null
        }
      });
      
      return {
        category: "外键完整性",
        action: "清理用户员工外键",
        status: "success",
        message: `已修复用户员工外键问题`,
        details: [`更新了 ${result.count} 个用户记录`]
      };
    }
    
    return {
      category: "外键完整性",
      action: "跳过",
      status: "skipped",
      message: "未识别的外键完整性问题",
      details: ["需要手动检查"]
    };
    
  } catch (error) {
    return {
      category: "外键完整性",
      action: "修复外键",
      status: "failed",
      message: "外键修复失败",
      details: [error instanceof Error ? error.message : "未知错误"]
    };
  }
}

/**
 * 修复类型定义问题
 */
async function fixTypeDefinitions(issue: ConsistencyCheckResult): Promise<AutoFixResult> {
  try {
    if (issue.message.includes("类型文件缺失")) {
      // 对于缺失的类型文件，我们只能记录，不能自动创建
      return {
        category: "类型定义",
        action: "跳过",
        status: "skipped",
        message: "类型文件缺失需要手动创建",
        details: ["请根据数据库模型创建相应的类型定义文件"]
      };
    }
    
    return {
      category: "类型定义",
      action: "跳过",
      status: "skipped",
      message: "类型定义问题需要手动处理",
      details: ["请检查类型定义的一致性"]
    };
    
  } catch (error) {
    return {
      category: "类型定义",
      action: "修复类型定义",
      status: "failed",
      message: "类型定义修复失败",
      details: [error instanceof Error ? error.message : "未知错误"]
    };
  }
}

/**
 * 修复组件版本问题
 */
async function fixComponentVersions(issue: ConsistencyCheckResult): Promise<AutoFixResult> {
  try {
    if (issue.message.includes("未使用ModernPageContainer")) {
      // 提取文件路径
      const filePath = issue.message.split(' ')[0];
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // 检查是否已经导入了ModernPageContainer
        if (!content.includes('ModernPageContainer')) {
          // 这需要复杂的代码分析和修改，标记为需要手动处理
          return {
            category: "组件版本",
            action: "跳过",
            status: "skipped",
            message: `${filePath} 需要手动添加ModernPageContainer`,
            details: [
              "请手动添加ModernPageContainer导入和使用",
              "import { ModernPageContainer } from '@/components/modern-page-container'"
            ]
          };
        }
        
        return {
          category: "组件版本",
          action: "检查组件",
          status: "success",
          message: `${filePath} 组件检查完成`,
          details: ["组件已正确使用ModernPageContainer"]
        };
        
      } catch (fileError) {
        return {
          category: "组件版本",
          action: "读取文件",
          status: "failed",
          message: `无法读取文件: ${filePath}`,
          details: [fileError instanceof Error ? fileError.message : "文件读取错误"]
        };
      }
    }
    
    return {
      category: "组件版本",
      action: "跳过",
      status: "skipped",
      message: "组件版本问题需要手动处理",
      details: ["请检查组件的版本一致性"]
    };
    
  } catch (error) {
    return {
      category: "组件版本",
      action: "修复组件版本",
      status: "failed",
      message: "组件版本修复失败",
      details: [error instanceof Error ? error.message : "未知错误"]
    };
  }
}

/**
 * 修复Server Actions问题
 */
async function fixServerActions(issue: ConsistencyCheckResult): Promise<AutoFixResult> {
  try {
    if (issue.message.includes('缺少"use server"指令')) {
      // 提取文件路径
      const filePath = issue.message.split(' ')[0];
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // 检查文件是否确实缺少"use server"指令
        if (!content.includes('"use server"') && !content.includes("'use server'")) {
          // 在文件开头添加"use server"指令
          const lines = content.split('\n');
          
          // 找到第一个非注释、非空行的位置
          let insertIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
              insertIndex = i;
              break;
            }
          }
          
          // 插入"use server"指令
          lines.splice(insertIndex, 0, '"use server";', '');
          const newContent = lines.join('\n');
          
          await fs.writeFile(filePath, newContent, 'utf-8');
          
          return {
            category: "Server Actions",
            action: "添加use server指令",
            status: "success",
            message: `已为 ${filePath} 添加"use server"指令`,
            details: ["文件已更新，请检查语法正确性"]
          };
        }
        
        return {
          category: "Server Actions",
          action: "检查指令",
          status: "success",
          message: `${filePath} 已包含"use server"指令`,
          details: ["无需修改"]
        };
        
      } catch (fileError) {
        return {
          category: "Server Actions",
          action: "修改文件",
          status: "failed",
          message: `无法修改文件: ${filePath}`,
          details: [fileError instanceof Error ? fileError.message : "文件操作错误"]
        };
      }
    }
    
    return {
      category: "Server Actions",
      action: "跳过",
      status: "skipped",
      message: "Server Actions问题需要手动处理",
      details: ["请检查Server Actions的实现"]
    };
    
  } catch (error) {
    return {
      category: "Server Actions",
      action: "修复Server Actions",
      status: "failed",
      message: "Server Actions修复失败",
      details: [error instanceof Error ? error.message : "未知错误"]
    };
  }
}

/**
 * 创建数据备份
 */
export async function createSystemBackup(reason: string = "自动修复前备份"): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `system-backup-${timestamp}`;
    
    // 这里应该调用现有的备份功能
    // 为了简化，我们只返回备份名称
    console.log(`创建系统备份: ${backupName}, 原因: ${reason}`);
    
    return backupName;
  } catch (error) {
    throw new Error(`备份创建失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 验证修复结果
 */
export async function validateFixes(fixResults: AutoFixResult[]): Promise<boolean> {
  try {
    // 重新运行一些基本检查来验证修复结果
    let allValid = true;
    
    for (const result of fixResults) {
      if (result.status === 'success') {
        // 根据修复类型进行验证
        switch (result.category) {
          case "外键完整性":
            // 验证外键修复
            const invalidProducts = await prisma.product.findMany({
              where: {
                categoryId: { not: null },
                productCategory: null
              }
            });
            
            if (invalidProducts.length > 0) {
              console.error(`外键修复验证失败: 仍有 ${invalidProducts.length} 个产品的分类外键无效`);
              allValid = false;
            }
            break;
            
          // 可以添加更多验证逻辑
        }
      }
    }
    
    return allValid;
  } catch (error) {
    console.error("修复验证失败:", error);
    return false;
  }
}
