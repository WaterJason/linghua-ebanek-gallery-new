/**
 * 实时前端新增功能调试脚本
 * 
 * 专门调试为什么删除可以工作但新增不工作的问题
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFrontendAddIssue() {
  console.log('🔍 开始实时调试前端新增功能问题...\n');

  try {
    // 1. 记录当前状态
    console.log('1️⃣ 记录当前数据库状态...');
    
    const beforeProducts = await prisma.product.findMany({
      where: { type: 'product' },
      orderBy: { createdAt: 'desc' }
    });
    
    const beforeCategories = await prisma.productCategory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ 当前状态:`);
    console.log(`   - 真实产品数: ${beforeProducts.length}`);
    console.log(`   - 分类数: ${beforeCategories.length}`);

    // 2. 模拟前端新增产品操作
    console.log('\n2️⃣ 模拟前端新增产品操作...');
    
    try {
      // 模拟createProduct Server Action
      const testProductData = {
        name: '调试测试产品',
        price: 99.99,
        commissionRate: 5.0,
        type: 'product',
        sku: 'DEBUG-001',
        description: '用于调试的测试产品',
        cost: 50.00,
        material: '调试材料',
        unit: '个',
        inventory: 10,
        categoryId: beforeCategories.length > 0 ? beforeCategories[0].id : null
      };

      console.log(`📝 尝试创建产品: ${testProductData.name}`);
      
      const newProduct = await prisma.product.create({
        data: testProductData
      });

      console.log(`✅ 产品创建成功: ID ${newProduct.id}`);

      // 验证创建结果
      const verifyProduct = await prisma.product.findUnique({
        where: { id: newProduct.id },
        include: {
          productCategory: true
        }
      });

      if (verifyProduct) {
        console.log(`✅ 产品验证成功:`);
        console.log(`   - 名称: ${verifyProduct.name}`);
        console.log(`   - 价格: ${verifyProduct.price}`);
        console.log(`   - 分类: ${verifyProduct.productCategory?.name || '无'}`);
      }

    } catch (createError) {
      console.log(`❌ 产品创建失败: ${createError.message}`);
    }

    // 3. 模拟前端新增分类操作
    console.log('\n3️⃣ 模拟前端新增分类操作...');
    
    try {
      const testCategoryData = {
        name: '调试测试分类',
        description: '用于调试的测试分类',
        code: 'DEBUG-CAT-001',
        level: 1,
        sortOrder: 1,
        isActive: true
      };

      console.log(`📝 尝试创建分类: ${testCategoryData.name}`);
      
      const newCategory = await prisma.productCategory.create({
        data: testCategoryData
      });

      console.log(`✅ 分类创建成功: ID ${newCategory.id}`);

    } catch (createError) {
      console.log(`❌ 分类创建失败: ${createError.message}`);
    }

    // 4. 检查数据库连接和权限
    console.log('\n4️⃣ 检查数据库连接和权限...');
    
    try {
      // 测试基本查询
      const testQuery = await prisma.product.count();
      console.log(`✅ 数据库连接正常，产品总数: ${testQuery}`);

      // 测试写入权限
      const testWrite = await prisma.product.create({
        data: {
          name: '权限测试产品',
          price: 1.00,
          commissionRate: 0,
          type: 'product',
          sku: 'PERM-TEST-001',
          description: '测试写入权限',
          cost: 0.50,
          material: '测试',
          unit: '个',
          inventory: 1
        }
      });

      console.log(`✅ 数据库写入权限正常，测试产品ID: ${testWrite.id}`);

      // 立即删除测试产品
      await prisma.product.delete({
        where: { id: testWrite.id }
      });
      console.log(`✅ 测试产品已清理`);

    } catch (dbError) {
      console.log(`❌ 数据库操作失败: ${dbError.message}`);
    }

    // 5. 检查Server Actions的具体实现
    console.log('\n5️⃣ 检查Server Actions实现...');
    
    // 检查是否有特殊的验证逻辑
    console.log(`📋 检查可能的问题:`);
    console.log(`   1. 前端表单验证是否阻止提交`);
    console.log(`   2. Server Actions是否有额外的权限检查`);
    console.log(`   3. 前端状态管理是否有问题`);
    console.log(`   4. 网络请求是否被拦截`);
    console.log(`   5. 浏览器缓存是否影响操作`);

    // 6. 检查最新的数据状态
    console.log('\n6️⃣ 检查最新数据状态...');
    
    const afterProducts = await prisma.product.findMany({
      where: { type: 'product' },
      orderBy: { createdAt: 'desc' }
    });
    
    const afterCategories = await prisma.productCategory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ 最新状态:`);
    console.log(`   - 真实产品数: ${afterProducts.length} (之前: ${beforeProducts.length})`);
    console.log(`   - 分类数: ${afterCategories.length} (之前: ${beforeCategories.length})`);

    const newProductsCount = afterProducts.length - beforeProducts.length;
    const newCategoriesCount = afterCategories.length - beforeCategories.length;

    if (newProductsCount > 0) {
      console.log(`✅ 新增了 ${newProductsCount} 个产品`);
      afterProducts.slice(0, newProductsCount).forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id})`);
      });
    }

    if (newCategoriesCount > 0) {
      console.log(`✅ 新增了 ${newCategoriesCount} 个分类`);
      afterCategories.slice(0, newCategoriesCount).forEach(category => {
        console.log(`   - ${category.name} (ID: ${category.id})`);
      });
    }

    // 7. 提供调试建议
    console.log('\n7️⃣ 调试建议...');
    
    console.log(`🔧 请在浏览器中执行以下调试步骤:`);
    console.log(`   1. 打开开发者工具 (F12)`);
    console.log(`   2. 切换到 Network 标签`);
    console.log(`   3. 尝试添加一个产品`);
    console.log(`   4. 观察是否有 POST /products 请求`);
    console.log(`   5. 检查请求的状态码和响应`);
    console.log(`   6. 切换到 Console 标签查看错误信息`);

    console.log(`\n💡 可能的问题原因:`);
    console.log(`   - 前端表单验证失败`);
    console.log(`   - JavaScript错误阻止提交`);
    console.log(`   - Server Action调用失败`);
    console.log(`   - 权限验证问题`);
    console.log(`   - 网络连接问题`);

    console.log(`\n🎯 下一步调试:`);
    console.log(`   1. 检查浏览器控制台错误`);
    console.log(`   2. 监控网络请求`);
    console.log(`   3. 验证表单数据`);
    console.log(`   4. 检查Server Action日志`);

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    // 清理调试数据
    try {
      await prisma.product.deleteMany({
        where: { 
          OR: [
            { name: { contains: '调试测试产品' } },
            { sku: 'DEBUG-001' }
          ]
        }
      });
      await prisma.productCategory.deleteMany({
        where: { 
          OR: [
            { name: { contains: '调试测试分类' } },
            { code: 'DEBUG-CAT-001' }
          ]
        }
      });
      console.log('\n🧹 调试数据已清理');
    } catch (cleanupError) {
      console.log('⚠️ 清理调试数据时出现错误:', cleanupError.message);
    }
    
    await prisma.$disconnect();
  }
}

// 运行调试
debugFrontendAddIssue().catch(console.error);
