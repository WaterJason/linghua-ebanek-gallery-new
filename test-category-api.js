/**
 * 产品分类API专项测试脚本
 * 测试分类管理的完整CRUD功能、层级结构、缓存策略等
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
    } else if (result.performance) {
      console.log(`   性能: ${result.performance.responseTime}ms`);
      if (result.count !== undefined) {
        console.log(`   记录数: ${result.count}`);
      }
      if (result.totalCategories !== undefined) {
        console.log(`   分类总数: ${result.totalCategories}`);
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

async function runCategoryTests() {
  console.log('🚀 开始产品分类API专项测试...\n');
  
  const results = [];
  
  // 1. 测试分类层级结构
  console.log('🏗️ 测试分类层级结构...');
  results.push(await testAPI('/api/products/test?action=category_hierarchy'));
  
  // 2. 测试分类验证功能
  console.log('\n✅ 测试分类验证功能...');
  results.push(await testAPI('/api/products/test?action=category_validation'));
  
  // 3. 测试分类约束检查
  console.log('\n🔒 测试分类约束检查...');
  results.push(await testAPI('/api/products/test?action=category_constraints'));
  
  // 4. 测试分类列表API（含缓存）
  console.log('\n📋 测试分类列表API...');
  results.push(await testAPI('/api/products/test?action=categories'));
  
  // 5. 测试分类创建功能
  console.log('\n📝 测试分类创建功能...');
  const testCategory = {
    type: 'category',
    name: 'API测试分类',
    description: '这是一个API测试分类',
    code: 'API-TEST-CAT',
    isActive: true,
    sortOrder: 1
  };
  const createResult = await testAPI('/api/products/test', 'POST', testCategory);
  results.push(createResult);
  
  let testCategoryId = null;
  if (createResult.success && createResult.data.category) {
    testCategoryId = createResult.data.category.id;
    console.log(`   创建的分类ID: ${testCategoryId}`);
  }
  
  // 6. 测试子分类创建（如果父分类创建成功）
  if (testCategoryId) {
    console.log('\n📁 测试子分类创建...');
    const testSubCategory = {
      type: 'category',
      name: 'API测试子分类',
      description: '这是一个API测试子分类',
      parentId: testCategoryId,
      isActive: true,
      sortOrder: 1
    };
    const subCreateResult = await testAPI('/api/products/test', 'POST', testSubCategory);
    results.push(subCreateResult);
    
    if (subCreateResult.success && subCreateResult.data.category) {
      console.log(`   创建的子分类ID: ${subCreateResult.data.category.id}`);
      console.log(`   层级: ${subCreateResult.data.category.level}`);
      console.log(`   路径: ${subCreateResult.data.category.path}`);
    }
  }
  
  // 7. 测试分类层级结构更新后的状态
  console.log('\n🔄 测试分类层级结构更新后状态...');
  results.push(await testAPI('/api/products/test?action=category_hierarchy'));
  
  // 8. 测试产品与分类关联
  console.log('\n🔗 测试产品与分类关联...');
  if (testCategoryId) {
    const testProductWithCategory = {
      type: 'product',
      name: 'API测试产品（含分类）',
      price: '199.99',
      commissionRate: '15',
      categoryId: testCategoryId.toString(),
      description: '这是一个带分类的API测试产品',
      sku: 'API-TEST-002'
    };
    const productResult = await testAPI('/api/products/test', 'POST', testProductWithCategory);
    results.push(productResult);
    
    if (productResult.success) {
      console.log(`   产品创建成功，分类ID: ${productResult.data.product.categoryId}`);
      console.log(`   分类名称: ${productResult.data.product.categoryName || '未设置'}`);
    }
  }
  
  // 9. 测试分类约束检查（更新后）
  console.log('\n🔒 测试分类约束检查（更新后）...');
  results.push(await testAPI('/api/products/test?action=category_constraints'));
  
  // 10. 性能压力测试
  console.log('\n⚡ 性能压力测试...');
  const performanceTests = [];
  for (let i = 0; i < 5; i++) {
    performanceTests.push(testAPI('/api/products/test?action=categories'));
  }
  const performanceResults = await Promise.all(performanceTests);
  results.push(...performanceResults);
  
  // 生成测试报告
  console.log('\n📊 分类API测试结果汇总:');
  console.log('=' * 60);
  
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
    cachedResponses.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.cacheControl}`);
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
  
  // 功能完整性检查
  console.log('\n🎯 功能完整性检查:');
  const functionalityChecks = {
    '分类层级结构': results.some(r => r.data && r.data.action === 'category_hierarchy' && r.success),
    '分类验证功能': results.some(r => r.data && r.data.action === 'category_validation' && r.success),
    '分类约束检查': results.some(r => r.data && r.data.action === 'category_constraints' && r.success),
    '分类创建功能': results.some(r => r.data && r.data.type === 'category' && r.success),
    '产品分类关联': results.some(r => r.data && r.data.type === 'product' && r.data.product && r.data.product.categoryId),
  };
  
  Object.entries(functionalityChecks).forEach(([feature, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${feature}`);
  });
  
  console.log('\n🎯 阶段2分类API测试完成！');
  
  return {
    total,
    successful,
    failed: total - successful,
    successRate: (successful / total) * 100,
    avgResponseTime,
    performanceCompliant: slowTests.length === 0,
    functionalityChecks
  };
}

// 运行测试
runCategoryTests().catch(console.error);
