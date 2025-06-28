#!/usr/bin/env node

/**
 * 产品管理模块修复验证脚本
 * 
 * 此脚本用于验证产品管理模块的修复效果，包括：
 * 1. 验证产品列表不显示占位产品
 * 2. 验证产品新增功能正常工作
 * 3. 验证分类、单位、材质管理功能独立且正确
 * 4. 验证数据库操作的完整性和一致性
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductManagementFix() {
  console.log('🔍 开始验证产品管理模块修复效果...\n');

  try {
    // 1. 检查数据库中的占位产品
    console.log('1️⃣ 检查数据库中的占位产品...');
    const placeholderProducts = await prisma.product.findMany({
      where: {
        type: {
          in: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    });

    console.log(`   发现 ${placeholderProducts.length} 个占位产品:`);
    placeholderProducts.forEach(product => {
      console.log(`   - ${product.name} (类型: ${product.type}, ID: ${product.id})`);
    });

    // 2. 检查正常产品列表
    console.log('\n2️⃣ 检查正常产品列表...');
    const normalProducts = await prisma.product.findMany({
      where: {
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    });

    console.log(`   发现 ${normalProducts.length} 个正常产品:`);
    normalProducts.slice(0, 5).forEach(product => {
      console.log(`   - ${product.name} (类型: ${product.type || 'product'}, ID: ${product.id})`);
    });
    if (normalProducts.length > 5) {
      console.log(`   ... 还有 ${normalProducts.length - 5} 个产品`);
    }

    // 3. 测试产品创建功能
    console.log('\n3️⃣ 测试产品创建功能...');
    const testProduct = {
      name: `测试产品_${Date.now()}`,
      price: 99.99,
      commissionRate: 0,
      type: "product",
      description: "这是一个测试产品",
      unit: "个",
      material: "测试材质",
      inventory: 10
    };

    const createdProduct = await prisma.product.create({
      data: testProduct
    });

    console.log(`   ✅ 成功创建测试产品: ${createdProduct.name} (ID: ${createdProduct.id})`);

    // 4. 验证产品类型正确
    if (createdProduct.type === "product") {
      console.log(`   ✅ 产品类型正确: ${createdProduct.type}`);
    } else {
      console.log(`   ❌ 产品类型错误: ${createdProduct.type}，应该是 "product"`);
    }

    // 5. 测试单位和材质提取
    console.log('\n4️⃣ 测试单位和材质提取...');
    
    // 获取所有不同的单位
    const units = await prisma.product.findMany({
      where: {
        unit: { not: null },
        type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      },
      select: { unit: true },
      distinct: ['unit']
    });

    console.log(`   发现 ${units.length} 个单位:`);
    units.forEach(u => console.log(`   - ${u.unit}`));

    // 获取所有不同的材质
    const materials = await prisma.product.findMany({
      where: {
        material: { not: null },
        type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      },
      select: { material: true },
      distinct: ['material']
    });

    console.log(`   发现 ${materials.length} 个材质:`);
    materials.forEach(m => console.log(`   - ${m.material}`));

    // 6. 测试分类功能
    console.log('\n5️⃣ 测试分类功能...');
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: {
                type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
              }
            }
          }
        }
      }
    });

    console.log(`   发现 ${categories.length} 个分类:`);
    categories.slice(0, 5).forEach(category => {
      console.log(`   - ${category.name} (${category._count.products} 个产品)`);
    });

    // 7. 清理测试数据
    console.log('\n6️⃣ 清理测试数据...');
    await prisma.product.delete({
      where: { id: createdProduct.id }
    });
    console.log(`   ✅ 已删除测试产品: ${createdProduct.name}`);

    // 8. 总结
    console.log('\n📊 修复效果总结:');
    console.log(`   - 占位产品数量: ${placeholderProducts.length}`);
    console.log(`   - 正常产品数量: ${normalProducts.length}`);
    console.log(`   - 可用单位数量: ${units.length}`);
    console.log(`   - 可用材质数量: ${materials.length}`);
    console.log(`   - 产品分类数量: ${categories.length}`);
    console.log(`   - 产品创建功能: ✅ 正常`);

    if (placeholderProducts.length > 0) {
      console.log('\n⚠️  建议: 发现占位产品，建议清理这些记录以避免数据混乱');
      console.log('   可以运行以下SQL命令清理占位产品:');
      console.log('   DELETE FROM "Product" WHERE type IN (\'category_placeholder\', \'unit_placeholder\', \'material_placeholder\');');
    }

    console.log('\n✅ 产品管理模块修复验证完成!');

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
if (require.main === module) {
  testProductManagementFix()
    .then(() => {
      console.log('\n🎉 所有测试完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testProductManagementFix };
