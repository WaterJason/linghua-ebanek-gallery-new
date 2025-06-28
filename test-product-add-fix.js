/**
 * 验证产品新增功能修复测试脚本
 * 
 * 测试修复后的产品新增功能是否正常工作
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductAddFix() {
  console.log('🎯 验证产品新增功能修复...\n');

  try {
    // 1. 记录修复前状态
    console.log('1️⃣ 记录修复前状态...');
    
    const beforeProducts = await prisma.product.count({
      where: { type: 'product' }
    });
    
    const beforeCategories = await prisma.productCategory.count();
    
    console.log(`✅ 修复前状态:`);
    console.log(`   - 真实产品数: ${beforeProducts}`);
    console.log(`   - 分类数: ${beforeCategories}`);

    // 2. 创建测试分类（如果需要）
    console.log('\n2️⃣ 准备测试分类...');
    
    let testCategory = await prisma.productCategory.findFirst({
      where: { name: '修复测试分类' }
    });

    if (!testCategory) {
      testCategory = await prisma.productCategory.create({
        data: {
          name: '修复测试分类',
          description: '用于验证修复的测试分类',
          code: 'FIX-TEST-CAT',
          level: 1,
          sortOrder: 1,
          isActive: true
        }
      });
      console.log(`✅ 创建测试分类: ${testCategory.name} (ID: ${testCategory.id})`);
    } else {
      console.log(`✅ 使用现有测试分类: ${testCategory.name} (ID: ${testCategory.id})`);
    }

    // 3. 测试修复后的产品创建（模拟前端数据格式）
    console.log('\n3️⃣ 测试修复后的产品创建...');
    
    // 模拟前端传递的数据格式
    const frontendData = {
      name: '修复测试产品',
      price: '299.99',  // 字符串格式（模拟表单输入）
      commissionRate: '8.5',  // 字符串格式
      cost: '150.00',  // 字符串格式
      categoryId: testCategory.id.toString(),  // 字符串格式的分类ID
      inventory: '50',  // 字符串格式
      type: 'product',
      sku: 'FIX-TEST-001',
      description: '用于验证修复的测试产品',
      material: '测试材料',
      unit: '件'
    };

    console.log('📝 前端数据格式:', JSON.stringify(frontendData, null, 2));

    // 模拟hooks/use-products.ts中的数据处理逻辑
    const processedData = {
      ...frontendData,
      name: frontendData.name.trim(),
      price: Number(frontendData.price),
      commissionRate: isNaN(Number(frontendData.commissionRate)) ? 0 : Number(frontendData.commissionRate),
      cost: frontendData.cost && !isNaN(Number(frontendData.cost)) ? Number(frontendData.cost) : null,
      categoryId: frontendData.categoryId ? (typeof frontendData.categoryId === 'string' ? parseInt(frontendData.categoryId) : frontendData.categoryId) : null,
      inventory: frontendData.inventory ? (typeof frontendData.inventory === 'string' ? parseInt(frontendData.inventory) : frontendData.inventory) : null,
    };

    console.log('📝 处理后数据格式:', JSON.stringify(processedData, null, 2));

    // 4. 直接调用createProduct逻辑（模拟Server Action）
    console.log('\n4️⃣ 模拟createProduct Server Action...');
    
    try {
      const newProduct = await prisma.product.create({
        data: {
          name: processedData.name,
          description: processedData.description || "",
          sku: processedData.sku || "",
          barcode: processedData.barcode || "",
          price: processedData.price,
          commissionRate: processedData.commissionRate,
          cost: processedData.cost,
          categoryId: processedData.categoryId,
          unit: processedData.unit || null,
          imageUrl: processedData.imageUrl || null,
          imageUrls: processedData.imageUrls || [],
          dimensions: processedData.dimensions || null,
          material: processedData.material || null,
          details: processedData.details || null,
          inventory: processedData.inventory,
          type: processedData.type || "product",
        },
      });

      console.log(`✅ 产品创建成功: ${newProduct.name} (ID: ${newProduct.id})`);

      // 5. 验证创建结果
      console.log('\n5️⃣ 验证创建结果...');
      
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
        console.log(`   - 佣金率: ${verifyProduct.commissionRate}%`);
        console.log(`   - 成本: ${verifyProduct.cost}`);
        console.log(`   - 分类ID: ${verifyProduct.categoryId}`);
        console.log(`   - 分类名称: ${verifyProduct.productCategory?.name || '无'}`);
        console.log(`   - 库存: ${verifyProduct.inventory}`);
        console.log(`   - SKU: ${verifyProduct.sku}`);
        console.log(`   - 类型: ${verifyProduct.type}`);

        // 验证关键字段
        const validations = [
          { field: 'categoryId', expected: testCategory.id, actual: verifyProduct.categoryId },
          { field: 'price', expected: 299.99, actual: verifyProduct.price },
          { field: 'commissionRate', expected: 8.5, actual: verifyProduct.commissionRate },
          { field: 'cost', expected: 150.00, actual: verifyProduct.cost },
          { field: 'inventory', expected: 50, actual: verifyProduct.inventory }
        ];

        let allValid = true;
        console.log('\n📋 字段验证结果:');
        validations.forEach(({ field, expected, actual }) => {
          const isValid = actual === expected;
          console.log(`   ${isValid ? '✅' : '❌'} ${field}: 期望 ${expected}, 实际 ${actual}`);
          if (!isValid) allValid = false;
        });

        if (allValid) {
          console.log('\n🎉 所有字段验证通过！修复成功！');
        } else {
          console.log('\n⚠️ 部分字段验证失败，需要进一步检查');
        }

      } else {
        console.log('❌ 产品验证失败，产品未找到');
      }

      // 6. 检查修复后状态
      console.log('\n6️⃣ 检查修复后状态...');
      
      const afterProducts = await prisma.product.count({
        where: { type: 'product' }
      });
      
      console.log(`✅ 修复后状态:`);
      console.log(`   - 真实产品数: ${afterProducts} (增加: ${afterProducts - beforeProducts})`);
      
      if (afterProducts > beforeProducts) {
        console.log('✅ 产品数量正确增加，前端应该能看到新产品');
      }

      // 7. 清理测试数据
      console.log('\n7️⃣ 清理测试数据...');
      
      await prisma.product.delete({
        where: { id: newProduct.id }
      });
      console.log('✅ 测试产品已删除');

    } catch (createError) {
      console.log(`❌ 产品创建失败: ${createError.message}`);
      
      // 分析错误原因
      if (createError.message.includes('categoryId')) {
        console.log('💡 错误分析: categoryId字段相关问题');
      } else if (createError.message.includes('Unique constraint')) {
        console.log('💡 错误分析: 唯一约束冲突（SKU或名称重复）');
      } else {
        console.log('💡 错误分析: 其他数据库错误');
      }
    }

    // 8. 修复效果总结
    console.log('\n8️⃣ 修复效果总结...');
    
    console.log('🔧 修复内容:');
    console.log('   1. 在hooks/use-products.ts中添加了categoryId字段处理');
    console.log('   2. 在hooks/use-products.ts中添加了inventory字段处理');
    console.log('   3. 确保字符串类型的数字字段正确转换为数字类型');
    console.log('   4. 保持与Server Action期望的数据格式一致');

    console.log('\n💡 预期结果:');
    console.log('   - 前端新增产品功能现在应该正常工作');
    console.log('   - 产品分类选择功能应该正常工作');
    console.log('   - 新创建的产品应该立即显示在产品列表中');
    console.log('   - 不再出现"Unknown argument categoryId"错误');

    console.log('\n🎯 下一步测试:');
    console.log('   1. 在浏览器中访问 http://localhost:3001/products');
    console.log('   2. 点击"添加产品"按钮');
    console.log('   3. 填写产品信息并选择分类');
    console.log('   4. 提交表单');
    console.log('   5. 验证产品是否立即显示在列表中');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理测试分类
    try {
      await prisma.productCategory.deleteMany({
        where: { 
          OR: [
            { name: '修复测试分类' },
            { code: 'FIX-TEST-CAT' }
          ]
        }
      });
      console.log('\n🧹 测试分类已清理');
    } catch (cleanupError) {
      console.log('⚠️ 清理测试分类时出现错误:', cleanupError.message);
    }
    
    await prisma.$disconnect();
  }
}

// 运行测试
testProductAddFix().catch(console.error);
