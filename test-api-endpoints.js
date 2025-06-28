/**
 * 产品管理API端点测试脚本
 * 用于验证第三阶段重构的API功能
 */

const BASE_URL = 'http://localhost:3001';

// 模拟认证会话（实际应用中需要真实的session token）
const headers = {
  'Content-Type': 'application/json',
  'Cookie': 'next-auth.session-token=test-session' // 需要真实的session
};

async function testAPI(endpoint, method = 'GET', data = null) {
  const startTime = Date.now();
  
  try {
    const options = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`🔄 测试 ${method} ${endpoint}...`);
    
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
    } else if (result.performance) {
      console.log(`   性能: ${result.performance.responseTime}ms`);
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

async function runTests() {
  console.log('🚀 开始产品管理API端点测试...\n');
  
  const results = [];
  
  // 1. 测试产品列表API
  console.log('📋 测试产品列表API...');
  results.push(await testAPI('/api/products'));
  results.push(await testAPI('/api/products?page=1&limit=10'));
  results.push(await testAPI('/api/products?search=test'));
  results.push(await testAPI('/api/products?categoryId=1'));
  
  // 2. 测试产品创建API
  console.log('\n📝 测试产品创建API...');
  const testProduct = {
    name: 'API测试产品',
    price: 99.99,
    commissionRate: 10,
    description: '这是一个API测试产品',
    type: 'product',
    sku: 'API-TEST-001'
  };
  const createResult = await testAPI('/api/products', 'POST', testProduct);
  results.push(createResult);
  
  let testProductId = null;
  if (createResult.success && createResult.data.product) {
    testProductId = createResult.data.product.id;
    console.log(`   创建的产品ID: ${testProductId}`);
  }
  
  // 3. 测试单个产品API（如果创建成功）
  if (testProductId) {
    console.log('\n🔍 测试单个产品API...');
    results.push(await testAPI(`/api/products/${testProductId}`));
    
    // 4. 测试产品更新API
    console.log('\n✏️ 测试产品更新API...');
    const updateData = {
      name: 'API测试产品（已更新）',
      price: 199.99,
      description: '这是一个更新后的API测试产品'
    };
    results.push(await testAPI(`/api/products/${testProductId}`, 'PUT', updateData));
    
    // 5. 测试产品删除API
    console.log('\n🗑️ 测试产品删除API...');
    results.push(await testAPI(`/api/products/${testProductId}`, 'DELETE'));
  }
  
  // 6. 测试产品分类API
  console.log('\n📂 测试产品分类API...');
  results.push(await testAPI('/api/products/categories'));
  results.push(await testAPI('/api/products/categories?includeCount=true'));
  
  // 7. 测试分类创建API
  console.log('\n📁 测试分类创建API...');
  const testCategory = {
    name: 'API测试分类',
    description: '这是一个API测试分类',
    isActive: true
  };
  const categoryResult = await testAPI('/api/products/categories', 'POST', testCategory);
  results.push(categoryResult);
  
  let testCategoryId = null;
  if (categoryResult.success && categoryResult.data.category) {
    testCategoryId = categoryResult.data.category.id;
    console.log(`   创建的分类ID: ${testCategoryId}`);
  }
  
  // 8. 测试单个分类API（如果创建成功）
  if (testCategoryId) {
    console.log('\n📋 测试单个分类API...');
    results.push(await testAPI(`/api/products/categories/${testCategoryId}`));
    
    // 9. 测试分类更新API
    console.log('\n✏️ 测试分类更新API...');
    const updateCategoryData = {
      name: 'API测试分类（已更新）',
      description: '这是一个更新后的API测试分类'
    };
    results.push(await testAPI(`/api/products/categories/${testCategoryId}`, 'PUT', updateCategoryData));
    
    // 10. 测试分类删除API
    console.log('\n🗑️ 测试分类删除API...');
    results.push(await testAPI(`/api/products/categories/${testCategoryId}`, 'DELETE'));
  }
  
  // 11. 测试扩展功能API
  console.log('\n🔧 测试扩展功能API...');
  results.push(await testAPI('/api/products/units'));
  results.push(await testAPI('/api/products/materials'));
  
  // 12. 测试批量操作API
  console.log('\n📦 测试批量操作API...');
  const batchData = {
    operation: 'import',
    products: [
      {
        name: '批量测试产品1',
        price: 50.00,
        commissionRate: 5
      },
      {
        name: '批量测试产品2',
        price: 75.00,
        commissionRate: 8
      }
    ]
  };
  results.push(await testAPI('/api/products/batch-update', 'POST', batchData));
  
  // 生成测试报告
  console.log('\n📊 测试结果汇总:');
  console.log('=' * 50);
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / total;
  
  console.log(`总测试数: ${total}`);
  console.log(`成功数: ${successful}`);
  console.log(`失败数: ${total - successful}`);
  console.log(`成功率: ${((successful / total) * 100).toFixed(1)}%`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  
  // 性能分析
  const slowTests = results.filter(r => r.responseTime > 120);
  if (slowTests.length > 0) {
    console.log(`\n⚠️ 超过120ms的测试 (${slowTests.length}个):`);
    slowTests.forEach(test => {
      console.log(`   ${test.responseTime}ms - 需要优化`);
    });
  } else {
    console.log('\n✅ 所有测试都符合≤120ms性能要求');
  }
  
  // 失败测试分析
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的测试 (${failedTests.length}个):`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. 状态码: ${test.status}, 错误: ${test.error || '未知错误'}`);
    });
  }
  
  console.log('\n🎯 阶段1测试完成！');
  
  return {
    total,
    successful,
    failed: total - successful,
    successRate: (successful / total) * 100,
    avgResponseTime,
    performanceCompliant: slowTests.length === 0
  };
}

// 运行测试
runTests().catch(console.error);
