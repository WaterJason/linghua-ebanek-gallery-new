/**
 * 数据迁移Server Actions
 * 
 * 用于处理产品管理模块的数据结构迁移和字段映射修复
 */

"use server";

import prisma from "@/lib/db";
import { FieldMappingIssue, MigrationResult } from "@/lib/data-migration-tool";

/**
 * 检测产品数据的字段映射问题
 */
export async function detectFieldMappingIssues(): Promise<FieldMappingIssue[]> {
  const issues: FieldMappingIssue[] = [];
  
  try {
    // 获取所有产品数据
    const products = await prisma.product.findMany({
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    for (const product of products) {
      // 检查废弃的category字段
      if (product.category && product.categoryId) {
        issues.push({
          id: product.id,
          field: 'category',
          currentValue: product.category,
          expectedValue: null,
          severity: 'warning',
          description: '存在废弃的category字段，应使用categoryId关联'
        });
      }

      // 检查type字段的一致性
      if (product.type && !['product', 'discontinued', 'draft'].includes(product.type)) {
        issues.push({
          id: product.id,
          field: 'type',
          currentValue: product.type,
          expectedValue: 'product',
          severity: 'error',
          description: '产品类型字段值不符合规范'
        });
      }

      // 检查价格字段
      if (product.price <= 0) {
        issues.push({
          id: product.id,
          field: 'price',
          currentValue: product.price,
          expectedValue: '>0',
          severity: 'error',
          description: '产品价格必须大于0'
        });
      }

      // 检查佣金率字段
      if (product.commissionRate < 0 || product.commissionRate > 100) {
        issues.push({
          id: product.id,
          field: 'commissionRate',
          currentValue: product.commissionRate,
          expectedValue: '0-100',
          severity: 'warning',
          description: '佣金率应在0-100之间'
        });
      }

      // 检查SKU格式
      if (product.sku && !/^[A-Z0-9-_]+$/i.test(product.sku)) {
        issues.push({
          id: product.id,
          field: 'sku',
          currentValue: product.sku,
          expectedValue: '标准格式',
          severity: 'warning',
          description: 'SKU格式不符合规范（应只包含字母、数字、连字符和下划线）'
        });
      }

      // 检查分类关联
      if (product.categoryId && !product.productCategory) {
        issues.push({
          id: product.id,
          field: 'categoryId',
          currentValue: product.categoryId,
          expectedValue: null,
          severity: 'error',
          description: '分类ID引用了不存在的分类'
        });
      }
    }

  } catch (error) {
    console.error("检测字段映射问题时发生错误:", error);
    issues.push({
      id: 0,
      field: 'system',
      currentValue: 'error',
      expectedValue: 'normal',
      severity: 'error',
      description: `系统错误: ${error instanceof Error ? error.message : '未知错误'}`
    });
  }

  return issues;
}

/**
 * 修复废弃的category字段
 */
export async function fixDeprecatedCategoryField(): Promise<MigrationResult> {
  let processed = 0;
  let updated = 0;
  let errors = 0;
  const warnings: string[] = [];

  try {
    // 查找有废弃category字段的产品
    const productsWithCategory = await prisma.product.findMany({
      where: {
        category: { not: null }
      }
    });

    processed = productsWithCategory.length;

    for (const product of productsWithCategory) {
      try {
        // 清除废弃的category字段
        await prisma.product.update({
          where: { id: product.id },
          data: { category: null }
        });
        
        updated++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 的废弃category字段已清除`);
      } catch (error) {
        errors++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 修复失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return {
      success: errors === 0,
      message: `废弃字段修复完成，处理了 ${processed} 个产品，成功更新 ${updated} 个`,
      details: { processed, updated, errors, warnings }
    };

  } catch (error) {
    return {
      success: false,
      message: `废弃字段修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { processed, updated, errors, warnings }
    };
  }
}

/**
 * 标准化产品类型字段
 */
export async function standardizeProductTypes(): Promise<MigrationResult> {
  let processed = 0;
  let updated = 0;
  let errors = 0;
  const warnings: string[] = [];

  try {
    // 查找类型字段不规范的产品
    const productsWithInvalidType = await prisma.product.findMany({
      where: {
        type: { notIn: ['product', 'discontinued', 'draft'] }
      }
    });

    processed = productsWithInvalidType.length;

    for (const product of productsWithInvalidType) {
      try {
        // 标准化类型字段
        let standardType = 'product';
        
        // 根据现有类型推断标准类型
        if (product.type.includes('inactive') || product.type.includes('disabled')) {
          standardType = 'discontinued';
        } else if (product.type.includes('draft') || product.type.includes('temp')) {
          standardType = 'draft';
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { type: standardType }
        });
        
        updated++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 类型从 "${product.type}" 标准化为 "${standardType}"`);
      } catch (error) {
        errors++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 类型标准化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return {
      success: errors === 0,
      message: `产品类型标准化完成，处理了 ${processed} 个产品，成功更新 ${updated} 个`,
      details: { processed, updated, errors, warnings }
    };

  } catch (error) {
    return {
      success: false,
      message: `产品类型标准化失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { processed, updated, errors, warnings }
    };
  }
}

/**
 * 修复外键关联问题
 */
export async function fixForeignKeyIssues(): Promise<MigrationResult> {
  let processed = 0;
  let updated = 0;
  let errors = 0;
  const warnings: string[] = [];

  try {
    // 查找分类外键有问题的产品
    const productsWithInvalidCategory = await prisma.product.findMany({
      where: {
        categoryId: { not: null },
        productCategory: null
      }
    });

    processed = productsWithInvalidCategory.length;

    for (const product of productsWithInvalidCategory) {
      try {
        // 清除无效的分类ID
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: null }
        });
        
        updated++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 的无效分类ID已清除`);
      } catch (error) {
        errors++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 外键修复失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return {
      success: errors === 0,
      message: `外键关联修复完成，处理了 ${processed} 个产品，成功更新 ${updated} 个`,
      details: { processed, updated, errors, warnings }
    };

  } catch (error) {
    return {
      success: false,
      message: `外键关联修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { processed, updated, errors, warnings }
    };
  }
}

/**
 * 数据验证和清理
 */
export async function validateAndCleanData(): Promise<MigrationResult> {
  let processed = 0;
  let updated = 0;
  let errors = 0;
  const warnings: string[] = [];

  try {
    const products = await prisma.product.findMany();
    processed = products.length;

    for (const product of products) {
      try {
        let needsUpdate = false;
        const updateData: any = {};

        // 清理和标准化字符串字段
        if (product.name !== product.name.trim()) {
          updateData.name = product.name.trim();
          needsUpdate = true;
        }

        if (product.description && product.description !== product.description.trim()) {
          updateData.description = product.description.trim();
          needsUpdate = true;
        }

        if (product.sku && product.sku !== product.sku.trim().toUpperCase()) {
          updateData.sku = product.sku.trim().toUpperCase();
          needsUpdate = true;
        }

        // 验证数值字段
        if (product.price <= 0) {
          warnings.push(`产品 ${product.name} (ID: ${product.id}) 价格无效: ${product.price}`);
        }

        if (product.commissionRate < 0 || product.commissionRate > 100) {
          updateData.commissionRate = Math.max(0, Math.min(100, product.commissionRate));
          needsUpdate = true;
          warnings.push(`产品 ${product.name} (ID: ${product.id}) 佣金率已调整到合理范围`);
        }

        if (needsUpdate) {
          await prisma.product.update({
            where: { id: product.id },
            data: updateData
          });
          updated++;
        }

      } catch (error) {
        errors++;
        warnings.push(`产品 ${product.name} (ID: ${product.id}) 数据清理失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return {
      success: errors === 0,
      message: `数据验证和清理完成，处理了 ${processed} 个产品，成功更新 ${updated} 个`,
      details: { processed, updated, errors, warnings }
    };

  } catch (error) {
    return {
      success: false,
      message: `数据验证和清理失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: { processed, updated, errors, warnings }
    };
  }
}

/**
 * 执行完整的数据迁移
 */
export async function runFullMigration(): Promise<{
  success: boolean;
  message: string;
  results: MigrationResult[];
}> {
  const results: MigrationResult[] = [];

  try {
    console.log("开始执行完整数据迁移...");

    // 1. 修复废弃字段
    console.log("步骤1: 修复废弃字段");
    const step1 = await fixDeprecatedCategoryField();
    results.push(step1);

    // 2. 标准化产品类型
    console.log("步骤2: 标准化产品类型");
    const step2 = await standardizeProductTypes();
    results.push(step2);

    // 3. 修复外键关联
    console.log("步骤3: 修复外键关联");
    const step3 = await fixForeignKeyIssues();
    results.push(step3);

    // 4. 数据验证和清理
    console.log("步骤4: 数据验证和清理");
    const step4 = await validateAndCleanData();
    results.push(step4);

    const allSuccess = results.every(r => r.success);
    const totalProcessed = results.reduce((sum, r) => sum + r.details.processed, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.details.updated, 0);

    return {
      success: allSuccess,
      message: `数据迁移${allSuccess ? '成功' : '部分成功'}完成，总共处理 ${totalProcessed} 条记录，更新 ${totalUpdated} 条记录`,
      results
    };

  } catch (error) {
    return {
      success: false,
      message: `数据迁移失败: ${error instanceof Error ? error.message : '未知错误'}`,
      results
    };
  }
}
