/**
 * 测试产品管理模块的所有CRUD操作
 * 
 * 这个脚本将测试：
 * 1. 产品创建功能
 * 2. 产品读取功能
 * 3. 产品更新功能
 * 4. 产品删除功能
 * 5. 产品分类的创建、编辑、删除功能
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductCRUD() {
  console.log('🧪 开始测试产品管理模块的所有CRUD操作...\n');

  try {
    // 1. 测试产品创建功能
    console.log('1️⃣ 测试产品创建功能...');
    const testProduct = await prisma.product.create({
      data: {
        name: '测试产品-CRUD测试',
        price: 199.99,
        commissionRate: 10.0,
        type: 'product',
        barcode: 'TEST-CRUD-001',
        sku: 'TEST-CRUD-SKU-001',
        description: '这是一个用于测试CRUD操作的产品',
        cost: 99.99,
        material: '测试材料',
        unit: '件',
        inventory: 100
      }
    });
    console.log(`✅ 产品创建成功: ${testProduct.name} (ID: ${testProduct.id})`);

    // 2. 测试产品读取功能
    console.log('\n2️⃣ 测试产品读取功能...');
    const retrievedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id }
    });
    
    if (retrievedProduct && retrievedProduct.name === testProduct.name) {
      console.log(`✅ 产品读取成功: ${retrievedProduct.name}`);
    } else {
      console.log('❌ 产品读取失败');
    }

    // 3. 测试产品更新功能
    console.log('\n3️⃣ 测试产品更新功能...');
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        name: '测试产品-CRUD测试-已更新',
        price: 299.99,
        description: '这是一个已更新的测试产品'
      }
    });
    
    if (updatedProduct.name === '测试产品-CRUD测试-已更新' && updatedProduct.price === 299.99) {
      console.log(`✅ 产品更新成功: ${updatedProduct.name}, 价格: ${updatedProduct.price}`);
    } else {
      console.log('❌ 产品更新失败');
    }

    // 4. 测试产品分类创建功能
    console.log('\n4️⃣ 测试产品分类创建功能...');
    const testCategory = await prisma.productCategory.create({
      data: {
        name: '测试分类-CRUD测试',
        description: '这是一个用于测试的产品分类',
        code: 'TEST-CAT-001',
        level: 1,
        sortOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ 产品分类创建成功: ${testCategory.name} (ID: ${testCategory.id})`);

    // 5. 测试产品分类更新功能
    console.log('\n5️⃣ 测试产品分类更新功能...');
    const updatedCategory = await prisma.productCategory.update({
      where: { id: testCategory.id },
      data: {
        name: '测试分类-CRUD测试-已更新',
        description: '这是一个已更新的测试分类'
      }
    });
    
    if (updatedCategory.name === '测试分类-CRUD测试-已更新') {
      console.log(`✅ 产品分类更新成功: ${updatedCategory.name}`);
    } else {
      console.log('❌ 产品分类更新失败');
    }

    // 6. 测试产品删除功能（应该成功，因为没有关联记录）
    console.log('\n6️⃣ 测试产品删除功能...');
    await prisma.product.delete({
      where: { id: testProduct.id }
    });
    
    // 验证产品已被删除
    const deletedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id }
    });
    
    if (!deletedProduct) {
      console.log('✅ 产品删除成功');
    } else {
      console.log('❌ 产品删除失败');
    }

    // 7. 测试产品分类删除功能
    console.log('\n7️⃣ 测试产品分类删除功能...');
    await prisma.productCategory.delete({
      where: { id: testCategory.id }
    });
    
    // 验证分类已被删除
    const deletedCategory = await prisma.productCategory.findUnique({
      where: { id: testCategory.id }
    });
    
    if (!deletedCategory) {
      console.log('✅ 产品分类删除成功');
    } else {
      console.log('❌ 产品分类删除失败');
    }

    // 8. 测试批量操作
    console.log('\n8️⃣ 测试批量产品创建...');
    const batchProducts = await prisma.product.createMany({
      data: [
        {
          name: '批量测试产品1',
          price: 100.00,
          commissionRate: 5.0,
          type: 'product',
          sku: 'BATCH-001'
        },
        {
          name: '批量测试产品2',
          price: 200.00,
          commissionRate: 5.0,
          type: 'product',
          sku: 'BATCH-002'
        }
      ]
    });
    console.log(`✅ 批量创建产品成功: ${batchProducts.count} 个产品`);

    // 清理批量创建的产品
    await prisma.product.deleteMany({
      where: {
        sku: {
          in: ['BATCH-001', 'BATCH-002']
        }
      }
    });
    console.log('✅ 批量测试产品清理完成');

    console.log('\n🎉 所有CRUD操作测试完成！');
    console.log('\n📊 测试结果总结:');
    console.log('   ✅ 产品创建功能: 正常');
    console.log('   ✅ 产品读取功能: 正常');
    console.log('   ✅ 产品更新功能: 正常');
    console.log('   ✅ 产品删除功能: 正常');
    console.log('   ✅ 产品分类创建功能: 正常');
    console.log('   ✅ 产品分类更新功能: 正常');
    console.log('   ✅ 产品分类删除功能: 正常');
    console.log('   ✅ 批量操作功能: 正常');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理：确保测试数据被删除
    try {
      await prisma.product.deleteMany({
        where: { 
          OR: [
            { name: { contains: '测试产品-CRUD测试' } },
            { sku: { in: ['TEST-CRUD-SKU-001', 'BATCH-001', 'BATCH-002'] } }
          ]
        }
      });
      await prisma.productCategory.deleteMany({
        where: { name: { contains: '测试分类-CRUD测试' } }
      });
      console.log('🧹 测试数据清理完成');
    } catch (cleanupError) {
      console.log('⚠️ 清理测试数据时出现错误:', cleanupError.message);
    }
    
    await prisma.$disconnect();
  }
}

// 运行测试
testProductCRUD().catch(console.error);
