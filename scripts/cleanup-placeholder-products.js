#!/usr/bin/env node

/**
 * 清理占位产品脚本
 * 
 * 此脚本用于清理数据库中的占位产品，包括：
 * 1. category_placeholder - 分类占位产品
 * 2. unit_placeholder - 单位占位产品  
 * 3. material_placeholder - 材质占位产品
 * 
 * 这些占位产品是旧版本系统为了管理分类、单位、材质而创建的，
 * 现在已经不需要了，会导致产品列表显示混乱。
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupPlaceholderProducts() {
  console.log('🧹 开始清理占位产品...\n');

  try {
    // 1. 查找所有占位产品
    console.log('1️⃣ 查找占位产品...');
    const placeholderProducts = await prisma.product.findMany({
      where: {
        type: {
          in: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    if (placeholderProducts.length === 0) {
      console.log('   ✅ 没有发现占位产品，数据库已经是干净的！');
      return;
    }

    console.log(`   发现 ${placeholderProducts.length} 个占位产品:`);
    
    // 按类型分组显示
    const groupedProducts = placeholderProducts.reduce((acc, product) => {
      if (!acc[product.type]) {
        acc[product.type] = [];
      }
      acc[product.type].push(product);
      return acc;
    }, {});

    Object.entries(groupedProducts).forEach(([type, products]) => {
      console.log(`\n   ${type} (${products.length} 个):`);
      products.forEach(product => {
        console.log(`     - ${product.name} (ID: ${product.id})`);
      });
    });

    // 2. 检查是否有关联数据
    console.log('\n2️⃣ 检查关联数据...');
    
    const placeholderIds = placeholderProducts.map(p => p.id);
    
    // 检查库存记录
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { productId: { in: placeholderIds } }
    });

    // 检查销售记录
    const salesItems = await prisma.salesItem.findMany({
      where: { productId: { in: placeholderIds } }
    });

    // 检查订单项
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: placeholderIds } }
    });

    console.log(`   - 库存记录: ${inventoryItems.length} 个`);
    console.log(`   - 销售记录: ${salesItems.length} 个`);
    console.log(`   - 订单项: ${orderItems.length} 个`);

    if (inventoryItems.length > 0 || salesItems.length > 0 || orderItems.length > 0) {
      console.log('\n⚠️  警告: 发现占位产品有关联数据，需要先清理关联数据');
      console.log('   建议手动检查这些关联数据是否可以安全删除');
      return;
    }

    // 3. 确认删除
    console.log('\n3️⃣ 准备删除占位产品...');
    console.log('   这些占位产品将被永久删除，无法恢复！');
    
    // 在生产环境中，这里应该要求用户确认
    // 为了自动化，我们直接执行删除
    
    // 4. 执行删除
    console.log('\n4️⃣ 执行删除操作...');
    
    let deletedCount = 0;
    
    for (const product of placeholderProducts) {
      try {
        // 删除产品标签关联（如果有）
        await prisma.productTagsOnProducts.deleteMany({
          where: { productId: product.id }
        });

        // 删除产品
        await prisma.product.delete({
          where: { id: product.id }
        });

        console.log(`   ✅ 已删除: ${product.name} (${product.type})`);
        deletedCount++;
      } catch (error) {
        console.log(`   ❌ 删除失败: ${product.name} - ${error.message}`);
      }
    }

    // 5. 验证清理结果
    console.log('\n5️⃣ 验证清理结果...');
    const remainingPlaceholders = await prisma.product.findMany({
      where: {
        type: {
          in: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    });

    console.log(`   删除成功: ${deletedCount} 个`);
    console.log(`   删除失败: ${placeholderProducts.length - deletedCount} 个`);
    console.log(`   剩余占位产品: ${remainingPlaceholders.length} 个`);

    if (remainingPlaceholders.length === 0) {
      console.log('\n✅ 占位产品清理完成！产品列表现在应该只显示真实产品了。');
    } else {
      console.log('\n⚠️  仍有占位产品未清理，请检查错误信息并手动处理。');
    }

    // 6. 显示清理后的统计信息
    console.log('\n6️⃣ 清理后统计信息...');
    const totalProducts = await prisma.product.count();
    const realProducts = await prisma.product.count({
      where: {
        type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      }
    });

    console.log(`   总产品数: ${totalProducts}`);
    console.log(`   真实产品数: ${realProducts}`);
    console.log(`   占位产品数: ${totalProducts - realProducts}`);

  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行清理
if (require.main === module) {
  cleanupPlaceholderProducts()
    .then(() => {
      console.log('\n🎉 清理完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 清理失败:', error);
      process.exit(1);
    });
}

module.exports = { cleanupPlaceholderProducts };
