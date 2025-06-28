/**
 * 前端新增流程调试脚本
 * 
 * 监控前端新增操作的完整流程，找出为什么删除可以工作但新增不工作
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFrontendAddFlow() {
  console.log('🔍 开始调试前端新增流程...\n');

  try {
    // 1. 检查当前状态
    console.log('1️⃣ 检查当前数据状态...');
    
    const beforeCount = await prisma.product.count({
      where: { type: 'product' }
    });
    
    console.log(`✅ 当前真实产品数量: ${beforeCount}`);

    // 2. 模拟完整的前端新增流程
    console.log('\n2️⃣ 模拟完整的前端新增流程...');
    
    // 步骤1: 表单验证
    console.log('📝 步骤1: 表单验证...');
    const formData = {
      name: '流程调试产品',
      price: 199.99,
      commissionRate: 5.0,
      type: 'product',
      sku: 'FLOW-DEBUG-001',
      description: '用于调试前端流程的产品',
      cost: 100.00,
      material: '调试材料',
      unit: '个',
      inventory: 20,
      categoryId: null,
      status: 'active'
    };

    // 表单验证逻辑
    if (!formData.name || formData.name.trim() === "") {
      console.log('❌ 表单验证失败: 产品名称为空');
      return;
    }

    if (formData.price <= 0) {
      console.log('❌ 表单验证失败: 产品价格必须大于0');
      return;
    }

    console.log('✅ 表单验证通过');

    // 步骤2: 数据准备
    console.log('📝 步骤2: 数据准备...');
    const productData = {
      ...formData,
      name: formData.name.trim(),
      price: Number(formData.price),
      commissionRate: isNaN(Number(formData.commissionRate)) ? 0 : Number(formData.commissionRate),
      cost: formData.cost && !isNaN(Number(formData.cost)) ? Number(formData.cost) : null,
    };

    console.log('✅ 数据准备完成:', JSON.stringify(productData, null, 2));

    // 步骤3: 模拟saveProduct函数
    console.log('📝 步骤3: 模拟saveProduct函数...');
    
    try {
      // 模拟createProduct Server Action
      console.log('🔄 调用createProduct Server Action...');
      
      const newProduct = await prisma.product.create({
        data: {
          name: productData.name,
          price: productData.price,
          commissionRate: productData.commissionRate,
          type: 'product',
          sku: productData.sku,
          description: productData.description,
          cost: productData.cost,
          material: productData.material,
          unit: productData.unit,
          inventory: productData.inventory,
          categoryId: productData.categoryId,
          status: productData.status || 'active'
        }
      });

      console.log('✅ createProduct成功:', newProduct.id);

      // 步骤4: 模拟前端状态更新
      console.log('📝 步骤4: 模拟前端状态更新...');
      
      // 检查产品是否真的被创建
      const verifyProduct = await prisma.product.findUnique({
        where: { id: newProduct.id }
      });

      if (verifyProduct) {
        console.log('✅ 产品创建验证成功');
      } else {
        console.log('❌ 产品创建验证失败');
      }

      // 步骤5: 模拟数据重载
      console.log('📝 步骤5: 模拟数据重载...');
      
      const afterCount = await prisma.product.count({
        where: { type: 'product' }
      });

      console.log(`✅ 重载后产品数量: ${afterCount} (之前: ${beforeCount})`);

      if (afterCount > beforeCount) {
        console.log('✅ 前端应该能看到新产品');
      } else {
        console.log('❌ 前端可能看不到新产品');
      }

      // 清理测试数据
      await prisma.product.delete({
        where: { id: newProduct.id }
      });
      console.log('🧹 测试数据已清理');

    } catch (serverActionError) {
      console.log('❌ Server Action失败:', serverActionError.message);
      
      // 检查是否是特定的错误
      if (serverActionError.message.includes('Unique constraint')) {
        console.log('💡 可能是SKU重复导致的错误');
      } else if (serverActionError.message.includes('Foreign key constraint')) {
        console.log('💡 可能是分类ID无效导致的错误');
      } else if (serverActionError.message.includes('validation')) {
        console.log('💡 可能是数据验证失败');
      }
    }

    // 3. 检查可能的问题点
    console.log('\n3️⃣ 检查可能的问题点...');
    
    console.log('🔍 检查点1: Server Actions是否正确导入');
    console.log('   - createProduct函数是否存在');
    console.log('   - 函数是否正确导出');
    console.log('   - 是否有"use server"指令');

    console.log('🔍 检查点2: 前端错误处理');
    console.log('   - executeFormOperation是否正确处理null返回值');
    console.log('   - saveProduct返回null时是否有错误提示');
    console.log('   - 错误是否被正确捕获和显示');

    console.log('🔍 检查点3: 数据格式问题');
    console.log('   - 表单数据类型是否正确');
    console.log('   - 数字字段是否正确转换');
    console.log('   - 可选字段是否正确处理');

    console.log('🔍 检查点4: 权限和验证');
    console.log('   - 用户是否有创建产品的权限');
    console.log('   - 是否有额外的验证逻辑阻止创建');
    console.log('   - 数据库约束是否正确');

    // 4. 提供具体的调试步骤
    console.log('\n4️⃣ 具体调试步骤...');
    
    console.log('🔧 请按以下步骤调试:');
    console.log('   1. 打开浏览器开发者工具');
    console.log('   2. 切换到Console标签');
    console.log('   3. 尝试添加一个产品');
    console.log('   4. 观察控制台输出:');
    console.log('      - "处理产品表单提交:" 日志');
    console.log('      - "Saving product data:" 日志');
    console.log('      - "Product saved successfully:" 日志');
    console.log('      - 任何错误信息');
    console.log('   5. 切换到Network标签');
    console.log('   6. 查看是否有POST请求到/products');
    console.log('   7. 检查请求的状态码和响应');

    console.log('\n💡 常见问题和解决方案:');
    console.log('   问题1: 没有看到"处理产品表单提交"日志');
    console.log('   解决: 检查表单提交事件是否被正确绑定');
    console.log('   ');
    console.log('   问题2: 看到日志但没有网络请求');
    console.log('   解决: 检查表单验证是否失败');
    console.log('   ');
    console.log('   问题3: 有网络请求但返回错误');
    console.log('   解决: 检查Server Action的实现和数据格式');
    console.log('   ');
    console.log('   问题4: 请求成功但前端没有更新');
    console.log('   解决: 检查状态更新和数据重载逻辑');

    // 5. 检查Server Actions文件
    console.log('\n5️⃣ 检查Server Actions文件...');
    
    console.log('📁 需要检查的文件:');
    console.log('   - lib/actions/product-actions.ts');
    console.log('   - 确认createProduct函数存在');
    console.log('   - 确认函数有"use server"指令');
    console.log('   - 确认函数正确导出');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行调试
debugFrontendAddFlow().catch(console.error);
