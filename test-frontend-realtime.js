/**
 * 实时前端测试脚本
 * 
 * 这个脚本将：
 * 1. 创建测试产品和分类
 * 2. 监控前端状态变化
 * 3. 验证数据是否正确显示
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFrontendRealtime() {
  console.log('🔍 开始实时前端测试...\n');

  try {
    // 1. 清理现有测试数据
    console.log('1️⃣ 清理现有测试数据...');
    await prisma.product.deleteMany({
      where: { 
        OR: [
          { name: { contains: '实时测试' } },
          { sku: { contains: 'REALTIME' } }
        ]
      }
    });
    await prisma.productCategory.deleteMany({
      where: { 
        OR: [
          { name: { contains: '实时测试' } },
          { code: { contains: 'REALTIME' } }
        ]
      }
    });
    console.log('✅ 测试数据清理完成');

    // 2. 检查当前数据状态
    console.log('\n2️⃣ 检查当前数据状态...');
    const currentProducts = await prisma.product.findMany({
      where: {
        type: 'product' // 只查询真实产品
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const currentCategories = await prisma.productCategory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ 当前真实产品数量: ${currentProducts.length}`);
    console.log(`✅ 当前分类数量: ${currentCategories.length}`);

    if (currentProducts.length > 0) {
      console.log('📋 现有真实产品:');
      currentProducts.slice(0, 3).forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id}, 类型: ${product.type})`);
      });
    }

    // 3. 创建测试分类
    console.log('\n3️⃣ 创建测试分类...');
    const testCategory = await prisma.productCategory.create({
      data: {
        name: '实时测试分类',
        description: '用于实时测试的分类',
        code: 'REALTIME-CAT-001',
        level: 1,
        sortOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ 测试分类创建成功: ${testCategory.name} (ID: ${testCategory.id})`);

    // 4. 创建测试产品
    console.log('\n4️⃣ 创建测试产品...');
    const testProduct = await prisma.product.create({
      data: {
        name: '实时测试产品',
        price: 199.99,
        commissionRate: 5.0,
        type: 'product', // 确保是真实产品类型
        sku: 'REALTIME-PROD-001',
        description: '用于实时测试的产品',
        cost: 100.00,
        material: '测试材料',
        unit: '件',
        inventory: 100,
        categoryId: testCategory.id
      }
    });
    console.log(`✅ 测试产品创建成功: ${testProduct.name} (ID: ${testProduct.id})`);

    // 5. 验证数据创建
    console.log('\n5️⃣ 验证数据创建...');
    const verifyProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
      include: {
        productCategory: true
      }
    });

    if (verifyProduct) {
      console.log(`✅ 产品验证成功:`);
      console.log(`   - 名称: ${verifyProduct.name}`);
      console.log(`   - 类型: ${verifyProduct.type}`);
      console.log(`   - 价格: ${verifyProduct.price}`);
      console.log(`   - SKU: ${verifyProduct.sku}`);
      console.log(`   - 分类: ${verifyProduct.productCategory?.name || '无'}`);
    }

    // 6. 检查前端应该看到的数据
    console.log('\n6️⃣ 检查前端应该看到的数据...');
    const frontendProducts = await prisma.product.findMany({
      include: {
        productCategory: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 模拟前端过滤逻辑
    const filteredProducts = frontendProducts.filter(product => {
      // 过滤掉占位产品
      const isPlaceholderProduct = product.type === "category_placeholder" ||
        product.type === "unit_placeholder" ||
        product.type === "material_placeholder";
      
      return !isPlaceholderProduct;
    });

    console.log(`✅ 数据库中总产品数: ${frontendProducts.length}`);
    console.log(`✅ 过滤后的产品数: ${filteredProducts.length}`);

    if (filteredProducts.length > 0) {
      console.log('📋 前端应该显示的产品:');
      filteredProducts.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id}, 类型: ${product.type}, 分类: ${product.productCategory?.name || '无'})`);
      });
    } else {
      console.log('⚠️ 前端过滤后没有产品显示！');
    }

    // 7. 等待一段时间模拟前端更新
    console.log('\n7️⃣ 等待前端更新...');
    console.log('请在浏览器中检查产品管理页面是否显示了新创建的产品');
    console.log('页面地址: http://localhost:3001/products');
    
    // 等待10秒
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r等待 ${i} 秒... `);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');

    // 8. 再次检查数据状态
    console.log('8️⃣ 再次检查数据状态...');
    const finalProducts = await prisma.product.findMany({
      where: {
        type: 'product'
      },
      include: {
        productCategory: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ 最终真实产品数量: ${finalProducts.length}`);
    
    if (finalProducts.length > 0) {
      console.log('📋 最终产品列表:');
      finalProducts.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id}, 创建时间: ${product.createdAt.toLocaleString()})`);
      });
    }

    // 9. 分析可能的问题
    console.log('\n9️⃣ 问题分析:');
    
    if (filteredProducts.length > 0) {
      console.log('✅ 数据库中有可显示的产品');
      console.log('💡 如果前端仍然显示"没有找到产品"，可能的原因:');
      console.log('   1. 前端缓存问题');
      console.log('   2. revalidatePath没有正确触发');
      console.log('   3. 前端状态更新延迟');
      console.log('   4. 前端过滤逻辑有问题');
      console.log('   5. Server Actions返回的数据格式不正确');
    } else {
      console.log('❌ 数据库中没有可显示的产品');
      console.log('💡 这解释了为什么前端显示"没有找到产品"');
    }

    console.log('\n🔧 建议的修复步骤:');
    console.log('   1. 检查浏览器开发者工具的Network标签');
    console.log('   2. 查看是否有Server Action请求');
    console.log('   3. 检查请求的响应数据');
    console.log('   4. 验证前端状态是否正确更新');
    console.log('   5. 刷新页面查看是否显示新数据');

  } catch (error) {
    console.error('❌ 实时前端测试过程中发生错误:', error);
  } finally {
    console.log('\n🧹 保留测试数据以供前端验证...');
    console.log('测试完成后，请手动清理测试数据');
    await prisma.$disconnect();
  }
}

// 运行测试
testFrontendRealtime().catch(console.error);
