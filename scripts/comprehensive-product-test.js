#!/usr/bin/env node

/**
 * 产品管理模块综合测试脚本
 *
 * 此脚本全面测试产品管理模块的所有功能，包括：
 * 1. 产品CRUD操作
 * 2. 分类管理功能
 * 3. 单位和材质管理
 * 4. 数据完整性验证
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveProductTest() {
  console.log('🧪 开始产品管理模块综合测试...\n');

  const testResults = {
    productCRUD: false,
    categoryManagement: false,
    unitMaterialManagement: false,
    dataIntegrity: false,
    noPlaceholderProducts: false
  };

  try {
    // 1. 测试产品CRUD操作
    console.log('1️⃣ 测试产品CRUD操作...');

    // 创建测试产品
    const testProduct = await prisma.product.create({
      data: {
        name: `综合测试产品_${Date.now()}`,
        price: 199.99,
        commissionRate: 0.1,
        type: "product",
        description: "这是一个综合测试产品",
        unit: "套",
        material: "景泰蓝",
        inventory: 20,
        sku: `TEST_${Date.now()}`,
        barcode: `BAR_${Date.now()}`
      }
    });
    console.log(`   ✅ 创建产品: ${testProduct.name}`);

    // 读取产品
    const readProduct = await prisma.product.findUnique({
      where: { id: testProduct.id }
    });
    if (readProduct && readProduct.name === testProduct.name) {
      console.log(`   ✅ 读取产品: ${readProduct.name}`);
    } else {
      throw new Error('产品读取失败');
    }

    // 更新产品
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        name: testProduct.name + '_已更新',
        price: 299.99
      }
    });
    console.log(`   ✅ 更新产品: ${updatedProduct.name}`);

    // 删除产品
    await prisma.product.delete({
      where: { id: testProduct.id }
    });
    console.log(`   ✅ 删除产品: ${updatedProduct.name}`);

    testResults.productCRUD = true;

    // 2. 测试分类管理功能
    console.log('\n2️⃣ 测试分类管理功能...');

    // 创建测试分类
    const testCategory = await prisma.productCategory.create({
      data: {
        name: `测试分类_${Date.now()}`,
        description: "这是一个测试分类",
        code: `TEST_CAT_${Date.now()}`,
        isActive: true,
        sortOrder: 1
      }
    });
    console.log(`   ✅ 创建分类: ${testCategory.name}`);

    // 创建带分类的产品
    const productWithCategory = await prisma.product.create({
      data: {
        name: `带分类的测试产品_${Date.now()}`,
        price: 99.99,
        commissionRate: 0,
        type: "product",
        categoryId: testCategory.id
      }
    });
    console.log(`   ✅ 创建带分类的产品: ${productWithCategory.name}`);

    // 验证分类关联
    const categoryWithProducts = await prisma.productCategory.findUnique({
      where: { id: testCategory.id },
      include: {
        products: true,
        _count: { select: { products: true } }
      }
    });

    if (categoryWithProducts && categoryWithProducts._count.products > 0) {
      console.log(`   ✅ 分类关联验证: ${categoryWithProducts.name} 有 ${categoryWithProducts._count.products} 个产品`);
    } else {
      throw new Error('分类关联验证失败');
    }

    // 清理测试数据
    await prisma.product.delete({ where: { id: productWithCategory.id } });
    await prisma.productCategory.delete({ where: { id: testCategory.id } });
    console.log(`   ✅ 清理分类测试数据`);

    testResults.categoryManagement = true;

    // 3. 测试单位和材质管理
    console.log('\n3️⃣ 测试单位和材质管理...');

    // 创建带单位和材质的产品
    const productWithUnitMaterial = await prisma.product.create({
      data: {
        name: `单位材质测试产品_${Date.now()}`,
        price: 149.99,
        commissionRate: 0,
        type: "product",
        unit: "件",
        material: "纯银"
      }
    });
    console.log(`   ✅ 创建带单位材质的产品: ${productWithUnitMaterial.name}`);

    // 验证单位提取
    const units = await prisma.product.findMany({
      where: {
        unit: { not: null },
        type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      },
      select: { unit: true },
      distinct: ['unit']
    });
    console.log(`   ✅ 提取单位: 发现 ${units.length} 个不同单位`);

    // 验证材质提取
    const materials = await prisma.product.findMany({
      where: {
        material: { not: null },
        type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      },
      select: { material: true },
      distinct: ['material']
    });
    console.log(`   ✅ 提取材质: 发现 ${materials.length} 个不同材质`);

    // 清理测试数据
    await prisma.product.delete({ where: { id: productWithUnitMaterial.id } });
    console.log(`   ✅ 清理单位材质测试数据`);

    testResults.unitMaterialManagement = true;

    // 4. 验证数据完整性
    console.log('\n4️⃣ 验证数据完整性...');

    // 检查是否有占位产品
    const placeholderProducts = await prisma.product.findMany({
      where: {
        type: { in: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      }
    });

    if (placeholderProducts.length === 0) {
      console.log(`   ✅ 无占位产品: 数据库中没有占位产品`);
      testResults.noPlaceholderProducts = true;
    } else {
      console.log(`   ❌ 发现占位产品: ${placeholderProducts.length} 个`);
    }

    // 检查产品类型一致性
    const invalidTypeProducts = await prisma.product.findMany({
      where: {
        type: { notIn: ["product", "category_placeholder", "unit_placeholder", "material_placeholder"] }
      }
    });

    if (invalidTypeProducts.length === 0) {
      console.log(`   ✅ 产品类型一致性: 所有产品类型都是有效的`);
    } else {
      console.log(`   ❌ 产品类型异常: 发现 ${invalidTypeProducts.length} 个异常类型产品`);
    }

    // 检查价格数据完整性 (price字段是Float类型，不可为null)
    const invalidPriceProducts = await prisma.product.findMany({
      where: {
        price: { lt: 0 },
        type: "product"
      }
    });

    if (invalidPriceProducts.length === 0) {
      console.log(`   ✅ 价格数据完整性: 所有产品价格都是有效的`);
    } else {
      console.log(`   ❌ 价格数据异常: 发现 ${invalidPriceProducts.length} 个异常价格产品`);
    }

    testResults.dataIntegrity = invalidTypeProducts.length === 0 && invalidPriceProducts.length === 0;

    // 5. 测试总结
    console.log('\n📊 测试结果总结:');
    Object.entries(testResults).forEach(([test, result]) => {
      const status = result ? '✅ 通过' : '❌ 失败';
      const testName = {
        productCRUD: '产品CRUD操作',
        categoryManagement: '分类管理功能',
        unitMaterialManagement: '单位材质管理',
        dataIntegrity: '数据完整性',
        noPlaceholderProducts: '无占位产品'
      }[test];
      console.log(`   ${testName}: ${status}`);
    });

    const allTestsPassed = Object.values(testResults).every(result => result);

    if (allTestsPassed) {
      console.log('\n🎉 所有测试通过！产品管理模块工作正常。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关功能。');
    }

    return testResults;

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
if (require.main === module) {
  comprehensiveProductTest()
    .then((results) => {
      const allPassed = Object.values(results).every(result => result);
      console.log(`\n🏁 测试完成! ${allPassed ? '全部通过' : '部分失败'}`);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { comprehensiveProductTest };
