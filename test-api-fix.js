/**
 * 紧急API修复测试脚本
 * 专门测试产品创建、分类创建和产品更新功能
 */

const BASE_URL = 'http://localhost:3001';

async function testAPI(endpoint, method = 'GET', data = null) {
  const startTime = Date.now();
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`🔄 测试 ${method} ${endpoint}...`);
    if (data) {
      console.log(`   数据:`, JSON.stringify(data, null, 2));
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseTime = Date.now() - startTime;
    
    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { error: 'Invalid JSON response' };
    }
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${method} ${endpoint} - ${response.status} (${responseTime}ms)`);
    
    if (!response.ok) {
      console.log(`   错误: ${result.error || result.details || 'Unknown error'}`);
      if (result.details) {
        console.log(`   详情: ${result.details}`);
      }
    } else {
      if (result.success !== undefined) {
        console.log(`   操作状态: ${result.success ? '成功' : '失败'}`);
      }
      if (result.product) {
        console.log(`   产品ID: ${result.product.id}, 名称: ${result.product.name}`);
      }
      if (result.category) {
        console.log(`   分类ID: ${result.category.id}, 名称: ${result.category.name}`);
      }
    }
    
    return {
      success: response.ok,
      status: response.status,
      responseTime,
      data: result
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ ${method} ${endpoint} - 网络错误 (${responseTime}ms)`);
    console.log(`   错误: ${error.message}`);
    
    return {
      success: false,
      status: 0,
      responseTime,
      error: error.message
    };
  }
}

async function runEmergencyFixTest() {
  console.log('🚨 开始紧急API修复测试...\n');
  
  const results = [];
  
  // 1. 测试产品分类创建
  console.log('📁 测试产品分类创建功能...');
  const testCategory = {
    name: '紧急修复测试分类',
    code: 'EMERGENCY-FIX-CAT',
    description: '用于紧急修复测试的分类',
    isActive: true,
    sortOrder: 1
  };
  const createCategoryResult = await testAPI('/api/products/categories', 'POST', testCategory);
  results.push(createCategoryResult);
  
  let createdCategoryId = null;
  if (createCategoryResult.success && createCategoryResult.data.category) {
    createdCategoryId = createCategoryResult.data.category.id;
  }
  
  // 2. 测试产品创建
  console.log('\n📦 测试产品创建功能...');
  const testProduct = {
    name: '紧急修复测试产品',
    price: 99.99,
    commissionRate: 10,
    description: '用于紧急修复测试的产品',
    sku: 'EMERGENCY-FIX-001',
    categoryId: createdCategoryId
  };
  const createProductResult = await testAPI('/api/products', 'POST', testProduct);
  results.push(createProductResult);
  
  let createdProductId = null;
  if (createProductResult.success && createProductResult.data.product) {
    createdProductId = createProductResult.data.product.id;
  }
  
  // 3. 测试产品更新
  if (createdProductId) {
    console.log('\n✏️ 测试产品更新功能...');
    const updateProduct = {
      id: createdProductId,
      name: '紧急修复测试产品 - 已更新',
      price: 199.99,
      commissionRate: 15,
      description: '用于紧急修复测试的产品 - 已更新',
      sku: 'EMERGENCY-FIX-001-UPDATED'
    };
    const updateProductResult = await testAPI('/api/products', 'PUT', updateProduct);
    results.push(updateProductResult);
  }
  
  // 4. 测试分类更新
  if (createdCategoryId) {
    console.log('\n✏️ 测试分类更新功能...');
    const updateCategory = {
      id: createdCategoryId,
      name: '紧急修复测试分类 - 已更新',
      code: 'EMERGENCY-FIX-CAT-UPDATED',
      description: '用于紧急修复测试的分类 - 已更新'
    };
    const updateCategoryResult = await testAPI('/api/products/categories', 'PUT', updateCategory);
    results.push(updateCategoryResult);
  }
  
  // 5. 验证数据读取
  console.log('\n🔍 验证数据读取功能...');
  const readProductsResult = await testAPI('/api/products');
  results.push(readProductsResult);
  
  const readCategoriesResult = await testAPI('/api/products/categories');
  results.push(readCategoriesResult);
  
  // 6. 清理测试数据
  if (createdProductId) {
    console.log('\n🧹 清理测试产品...');
    const deleteProductResult = await testAPI(`/api/products/${createdProductId}`, 'DELETE');
    results.push(deleteProductResult);
  }
  
  if (createdCategoryId) {
    console.log('\n🧹 清理测试分类...');
    const deleteCategoryResult = await testAPI(`/api/products/categories/${createdCategoryId}`, 'DELETE');
    results.push(deleteCategoryResult);
  }
  
  // 生成测试报告
  console.log('\n📊 紧急修复测试结果汇总:');
  console.log('=' * 60);
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / total;
  
  console.log(`总测试数: ${total}`);
  console.log(`成功数: ${successful}`);
  console.log(`失败数: ${total - successful}`);
  console.log(`成功率: ${((successful / total) * 100).toFixed(1)}%`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  
  // 功能状态检查
  console.log('\n🎯 功能状态检查:');
  const functionalityStatus = {
    '分类创建': results[0]?.success || false,
    '产品创建': results[1]?.success || false,
    '产品更新': results[2]?.success || false,
    '分类更新': results[3]?.success || false,
    '数据读取': results[4]?.success && results[5]?.success || false,
  };
  
  Object.entries(functionalityStatus).forEach(([feature, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${feature}`);
  });
  
  // 失败分析
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的测试 (${failedTests.length}个):`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. 状态码: ${test.status}, 错误: ${test.error || '未知错误'}`);
    });
  }
  
  // 修复建议
  if (successful < total) {
    console.log('\n🔧 修复建议:');
    if (!functionalityStatus['分类创建']) {
      console.log('   - 检查分类创建API的认证和数据验证');
    }
    if (!functionalityStatus['产品创建']) {
      console.log('   - 检查产品创建API的认证和数据验证');
    }
    if (!functionalityStatus['产品更新']) {
      console.log('   - 检查产品更新API的认证和数据验证');
    }
    if (!functionalityStatus['分类更新']) {
      console.log('   - 检查分类更新API的认证和数据验证');
    }
  } else {
    console.log('\n🎉 所有功能测试通过！API工作正常。');
  }
  
  console.log('\n🎯 紧急修复测试完成！');
  
  return {
    total,
    successful,
    failed: total - successful,
    successRate: (successful / total) * 100,
    avgResponseTime,
    functionalityStatus
  };
}

// 运行测试
runEmergencyFixTest().catch(console.error);
