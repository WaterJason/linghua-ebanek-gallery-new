/**
 * 前端重构验证测试脚本
 * 测试API调用和SWR缓存功能
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
    
    // 检查缓存头
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      console.log(`   缓存策略: ${cacheControl}`);
    }
    
    if (!response.ok) {
      console.log(`   错误: ${result.error || result.details || 'Unknown error'}`);
    } else {
      if (result.products && result.products.length !== undefined) {
        console.log(`   产品数量: ${result.products.length}`);
      }
      if (result.categories && result.categories.length !== undefined) {
        console.log(`   分类数量: ${result.categories.length}`);
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
      data: result,
      cacheControl
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

async function runFrontendRefactorTests() {
  console.log('🚀 开始前端重构验证测试...\n');
  
  const results = [];
  
  // 1. 测试产品列表API（新格式）
  console.log('📋 测试产品列表API（新格式）...');
  const productsResult = await testAPI('/api/products');
  results.push(productsResult);
  
  // 2. 测试分类列表API（新格式）
  console.log('\n📂 测试分类列表API（新格式）...');
  const categoriesResult = await testAPI('/api/products/categories');
  results.push(categoriesResult);
  
  // 3. 测试分类列表API（含产品计数）
  console.log('\n📊 测试分类列表API（含产品计数）...');
  const categoriesWithCountResult = await testAPI('/api/products/categories?includeCount=true');
  results.push(categoriesWithCountResult);
  
  // 4. 测试产品创建API（新格式）
  console.log('\n📝 测试产品创建API（新格式）...');
  const testProduct = {
    name: '前端重构测试产品',
    price: 299.99,
    commissionRate: 12,
    description: '这是一个前端重构测试产品',
    sku: 'FRONTEND-TEST-001',
    type: 'product'
  };
  const createProductResult = await testAPI('/api/products', 'POST', testProduct);
  results.push(createProductResult);
  
  let testProductId = null;
  if (createProductResult.success && createProductResult.data.product) {
    testProductId = createProductResult.data.product.id;
    console.log(`   创建的产品ID: ${testProductId}`);
  }
  
  // 5. 测试单个产品API（如果创建成功）
  if (testProductId) {
    console.log('\n🔍 测试单个产品API...');
    const singleProductResult = await testAPI(`/api/products/${testProductId}`);
    results.push(singleProductResult);
    
    // 6. 测试产品更新API
    console.log('\n✏️ 测试产品更新API...');
    const updateData = {
      name: '前端重构测试产品（已更新）',
      price: 399.99,
      description: '这是一个更新后的前端重构测试产品'
    };
    const updateProductResult = await testAPI(`/api/products/${testProductId}`, 'PUT', updateData);
    results.push(updateProductResult);
  }
  
  // 7. 测试分类创建API（新格式）
  console.log('\n📁 测试分类创建API（新格式）...');
  const testCategory = {
    name: '前端重构测试分类',
    description: '这是一个前端重构测试分类',
    code: 'FRONTEND-TEST-CAT',
    isActive: true,
    sortOrder: 1
  };
  const createCategoryResult = await testAPI('/api/products/categories', 'POST', testCategory);
  results.push(createCategoryResult);
  
  let testCategoryId = null;
  if (createCategoryResult.success && createCategoryResult.data.category) {
    testCategoryId = createCategoryResult.data.category.id;
    console.log(`   创建的分类ID: ${testCategoryId}`);
  }
  
  // 8. 测试产品与分类关联（如果分类创建成功）
  if (testCategoryId) {
    console.log('\n🔗 测试产品与分类关联...');
    const testProductWithCategory = {
      name: '前端重构测试产品（含分类）',
      price: 499.99,
      commissionRate: 15,
      categoryId: testCategoryId,
      description: '这是一个带分类的前端重构测试产品',
      sku: 'FRONTEND-TEST-002'
    };
    const productWithCategoryResult = await testAPI('/api/products', 'POST', testProductWithCategory);
    results.push(productWithCategoryResult);
    
    if (productWithCategoryResult.success) {
      console.log(`   产品创建成功，分类ID: ${productWithCategoryResult.data.product.categoryId}`);
      console.log(`   分类名称: ${productWithCategoryResult.data.product.categoryName || '未设置'}`);
    }
  }
  
  // 9. 测试缓存策略（重复请求）
  console.log('\n💾 测试缓存策略（重复请求）...');
  const cacheTest1 = await testAPI('/api/products/categories');
  const cacheTest2 = await testAPI('/api/products/categories');
  results.push(cacheTest1, cacheTest2);
  
  // 10. 性能压力测试
  console.log('\n⚡ 性能压力测试（并发请求）...');
  const performanceTests = [];
  for (let i = 0; i < 3; i++) {
    performanceTests.push(testAPI('/api/products'));
    performanceTests.push(testAPI('/api/products/categories'));
  }
  const performanceResults = await Promise.all(performanceTests);
  results.push(...performanceResults);
  
  // 生成测试报告
  console.log('\n📊 前端重构验证测试结果汇总:');
  console.log('=' * 70);
  
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
    slowTests.forEach((test, index) => {
      console.log(`   ${test.responseTime}ms - 需要优化`);
    });
  } else {
    console.log('\n✅ 所有测试都符合≤120ms性能要求');
  }
  
  // 缓存策略分析
  const cachedResponses = results.filter(r => r.cacheControl);
  if (cachedResponses.length > 0) {
    console.log(`\n💾 缓存策略分析:`);
    const uniqueCacheStrategies = [...new Set(cachedResponses.map(r => r.cacheControl))];
    uniqueCacheStrategies.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy}`);
    });
  }
  
  // 失败测试分析
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的测试 (${failedTests.length}个):`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. 状态码: ${test.status}, 错误: ${test.error || '未知错误'}`);
    });
  }
  
  // API格式验证
  console.log('\n🎯 API格式验证:');
  const formatChecks = {
    '产品列表格式': results.some(r => r.data && r.data.products && Array.isArray(r.data.products)),
    '分类列表格式': results.some(r => r.data && r.data.categories && Array.isArray(r.data.categories)),
    '产品创建格式': results.some(r => r.data && r.data.product && r.data.success),
    '分类创建格式': results.some(r => r.data && r.data.category && r.data.success),
    '缓存头设置': results.some(r => r.cacheControl && r.cacheControl.includes('max-age')),
  };
  
  Object.entries(formatChecks).forEach(([feature, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${feature}`);
  });
  
  console.log('\n🎯 阶段3前端重构验证测试完成！');
  
  return {
    total,
    successful,
    failed: total - successful,
    successRate: (successful / total) * 100,
    avgResponseTime,
    performanceCompliant: slowTests.length === 0,
    formatChecks
  };
}

// 运行测试
runFrontendRefactorTests().catch(console.error);
