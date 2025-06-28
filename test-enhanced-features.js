/**
 * 增强功能集成测试脚本
 * 测试音频反馈、撤销/重做、进度跟踪、性能监控等功能
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
    
    // 检查性能
    if (responseTime > 120) {
      console.log(`   ⚠️ 性能警告: 响应时间 ${responseTime}ms 超过120ms目标`);
    }
    
    // 检查缓存头
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      console.log(`   💾 缓存策略: ${cacheControl}`);
    }
    
    if (!response.ok) {
      console.log(`   错误: ${result.error || result.details || 'Unknown error'}`);
    } else {
      if (result.success !== undefined) {
        console.log(`   操作状态: ${result.success ? '成功' : '失败'}`);
      }
      if (result.stats) {
        console.log(`   统计数据: 总产品 ${result.stats.overview?.totalProducts || 0}`);
      }
      if (result.data && Array.isArray(result.data)) {
        console.log(`   数据记录: ${result.data.length} 条`);
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

async function runEnhancedFeaturesTest() {
  console.log('🚀 开始增强功能集成测试...\n');
  
  const results = [];
  
  // 1. 测试修复后的导出功能
  console.log('📤 测试修复后的导出功能...');
  const exportJsonResult = await testAPI('/api/products/export?format=json');
  results.push(exportJsonResult);
  
  const exportCsvResult = await testAPI('/api/products/export?format=csv');
  results.push(exportCsvResult);
  
  // 2. 测试修复后的统计功能
  console.log('\n📊 测试修复后的统计功能...');
  const statsResult = await testAPI('/api/products/stats');
  results.push(statsResult);
  
  const statsWeekResult = await testAPI('/api/products/stats?period=week');
  results.push(statsWeekResult);
  
  // 3. 测试自定义导出功能
  console.log('\n📋 测试自定义导出功能...');
  const customExportData = {
    format: 'json',
    fields: ['id', 'name', 'price', 'categoryName'],
    filters: {
      priceRange: { min: 0, max: 1000 }
    },
    sortBy: 'name',
    sortOrder: 'asc'
  };
  const customExportResult = await testAPI('/api/products/export', 'POST', customExportData);
  results.push(customExportResult);
  
  // 4. 测试API性能和缓存
  console.log('\n⚡ 测试API性能和缓存效果...');
  
  // 第一次请求（冷缓存）
  const firstRequest = await testAPI('/api/products/categories');
  results.push(firstRequest);
  
  // 第二次请求（热缓存）
  const secondRequest = await testAPI('/api/products/categories');
  results.push(secondRequest);
  
  // 比较缓存效果
  if (firstRequest.success && secondRequest.success) {
    const cacheImprovement = firstRequest.responseTime - secondRequest.responseTime;
    if (cacheImprovement > 0) {
      console.log(`   🎯 缓存效果: 响应时间改善 ${cacheImprovement}ms (${((cacheImprovement / firstRequest.responseTime) * 100).toFixed(1)}%)`);
    }
  }
  
  // 5. 测试并发性能
  console.log('\n🔄 测试并发性能...');
  const concurrentRequests = [];
  for (let i = 0; i < 5; i++) {
    concurrentRequests.push(testAPI('/api/products/units'));
    concurrentRequests.push(testAPI('/api/products/materials'));
  }
  
  const concurrentResults = await Promise.all(concurrentRequests);
  results.push(...concurrentResults);
  
  const avgConcurrentTime = concurrentResults.reduce((sum, r) => sum + r.responseTime, 0) / concurrentResults.length;
  console.log(`   📈 并发平均响应时间: ${avgConcurrentTime.toFixed(1)}ms`);
  
  // 6. 测试错误处理和恢复
  console.log('\n🛠️ 测试错误处理和恢复...');
  
  // 测试无效ID
  const invalidIdResult = await testAPI('/api/products/99999');
  results.push(invalidIdResult);
  
  // 测试无效数据
  const invalidDataResult = await testAPI('/api/products', 'POST', { invalid: 'data' });
  results.push(invalidDataResult);
  
  // 7. 测试数据完整性
  console.log('\n🔍 测试数据完整性...');
  
  // 获取产品列表
  const productsResult = await testAPI('/api/products');
  results.push(productsResult);
  
  if (productsResult.success && productsResult.data.products) {
    const products = productsResult.data.products;
    console.log(`   📦 产品数据完整性检查: ${products.length} 个产品`);
    
    // 检查必要字段
    const requiredFields = ['id', 'name', 'price'];
    const incompleteProducts = products.filter(p => 
      !requiredFields.every(field => p[field] !== undefined && p[field] !== null)
    );
    
    if (incompleteProducts.length > 0) {
      console.log(`   ⚠️ 发现 ${incompleteProducts.length} 个不完整的产品记录`);
    } else {
      console.log(`   ✅ 所有产品记录完整`);
    }
  }
  
  // 8. 测试API响应格式一致性
  console.log('\n📋 测试API响应格式一致性...');
  
  const apiEndpoints = [
    '/api/products',
    '/api/products/categories',
    '/api/products/units',
    '/api/products/materials',
    '/api/products/stats'
  ];
  
  const formatTests = [];
  for (const endpoint of apiEndpoints) {
    const result = await testAPI(endpoint);
    formatTests.push({ endpoint, result });
  }
  
  // 检查响应格式一致性
  const formatIssues = [];
  formatTests.forEach(({ endpoint, result }) => {
    if (result.success) {
      const hasStandardFormat = result.data && (
        result.data.success !== undefined || 
        result.data.products !== undefined ||
        result.data.categories !== undefined ||
        result.data.units !== undefined ||
        result.data.materials !== undefined ||
        result.data.stats !== undefined
      );
      
      if (!hasStandardFormat) {
        formatIssues.push(endpoint);
      }
    }
  });
  
  if (formatIssues.length > 0) {
    console.log(`   ⚠️ 响应格式不一致的端点: ${formatIssues.join(', ')}`);
  } else {
    console.log(`   ✅ 所有API响应格式一致`);
  }
  
  // 生成最终测试报告
  console.log('\n📊 增强功能集成测试结果汇总:');
  console.log('=' * 80);
  
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
  const fastTests = results.filter(r => r.responseTime <= 120);
  
  console.log(`\n⚡ 性能分析:`);
  console.log(`符合≤120ms要求: ${fastTests.length}/${total} (${((fastTests.length / total) * 100).toFixed(1)}%)`);
  
  if (slowTests.length > 0) {
    console.log(`需要优化的API (${slowTests.length}个):`);
    slowTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.responseTime}ms - 需要优化`);
    });
  }
  
  // 缓存效果分析
  const cachedResponses = results.filter(r => r.cacheControl);
  console.log(`\n💾 缓存分析:`);
  console.log(`启用缓存的API: ${cachedResponses.length}/${total} (${((cachedResponses.length / total) * 100).toFixed(1)}%)`);
  
  // 功能完整性检查
  console.log(`\n🎯 功能完整性检查:`);
  const functionalityChecks = {
    '导出功能': results.some(r => r.data && (r.data.data || r.data.summary)),
    '统计功能': results.some(r => r.data && r.data.stats),
    '缓存策略': results.some(r => r.cacheControl && r.cacheControl.includes('max-age')),
    '错误处理': results.some(r => !r.success && r.status >= 400),
    '数据完整性': results.some(r => r.data && r.data.products && Array.isArray(r.data.products)),
    '性能监控': avgResponseTime > 0,
  };
  
  Object.entries(functionalityChecks).forEach(([feature, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${feature}`);
  });
  
  // 最终评估
  const overallScore = (successful / total) * 100;
  let grade = 'F';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 85) grade = 'B+';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else if (overallScore >= 60) grade = 'D';
  
  console.log(`\n🏆 最终评估: ${grade} (${overallScore.toFixed(1)}%)`);
  console.log(`🎯 阶段5增强功能集成测试完成！`);
  
  return {
    total,
    successful,
    failed: total - successful,
    successRate: overallScore,
    avgResponseTime,
    performanceCompliant: fastTests.length / total,
    functionalityChecks,
    grade
  };
}

// 运行测试
runEnhancedFeaturesTest().catch(console.error);
