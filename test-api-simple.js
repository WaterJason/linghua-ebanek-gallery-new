/**
 * 简化的API测试脚本
 * 测试产品管理API的核心功能
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
    
    if (!response.ok) {
      console.log(`   错误: ${result.error || result.details || 'Unknown error'}`);
    } else if (result.performance) {
      console.log(`   性能: ${result.performance.responseTime}ms`);
      if (result.count !== undefined) {
        console.log(`   记录数: ${result.count}`);
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

async function runSimpleTests() {
  console.log('🚀 开始产品管理API简化测试...\n');
  
  const results = [];
  
  // 1. 测试数据库连接
  console.log('🔗 测试数据库连接...');
  results.push(await testAPI('/api/products/test?action=database'));
  
  // 2. 测试产品列表
  console.log('\n📋 测试产品列表...');
  results.push(await testAPI('/api/products/test?action=list'));
  
  // 3. 测试分类列表
  console.log('\n📂 测试分类列表...');
  results.push(await testAPI('/api/products/test?action=categories'));
  
  // 4. 测试数据适配层
  console.log('\n🔄 测试数据适配层...');
  results.push(await testAPI('/api/products/test?action=adapter'));
  
  // 5. 测试产品创建
  console.log('\n📝 测试产品创建...');
  const testProduct = {
    name: 'API测试产品',
    price: '99.99',
    commissionRate: '10',
    description: '这是一个API测试产品',
    sku: 'API-TEST-001'
  };
  results.push(await testAPI('/api/products/test', 'POST', testProduct));
  
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
    slowTests.forEach((test, index) => {
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
  
  console.log('\n🎯 阶段1简化测试完成！');
  
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
runSimpleTests().catch(console.error);
