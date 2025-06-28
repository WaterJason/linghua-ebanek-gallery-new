/**
 * 批量操作和扩展功能测试脚本
 * 测试批量操作、单位材质管理、文件上传等功能
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
    
    // 检查缓存头
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      console.log(`   缓存策略: ${cacheControl}`);
    }
    
    if (!response.ok) {
      console.log(`   错误: ${result.error || result.details || 'Unknown error'}`);
    } else {
      if (result.units && result.units.length !== undefined) {
        console.log(`   单位数量: ${result.units.length}`);
      }
      if (result.materials && result.materials.length !== undefined) {
        console.log(`   材质数量: ${result.materials.length}`);
      }
      if (result.updatedCount !== undefined) {
        console.log(`   更新数量: ${result.updatedCount}`);
      }
      if (result.success) {
        console.log(`   操作成功: ${result.message || '成功'}`);
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

async function runBatchExtendedTests() {
  console.log('🚀 开始批量操作和扩展功能测试...\n');
  
  const results = [];
  
  // 1. 测试单位管理API
  console.log('📏 测试单位管理API...');
  const unitsResult = await testAPI('/api/products/units');
  results.push(unitsResult);
  
  // 2. 测试材质管理API
  console.log('\n🧱 测试材质管理API...');
  const materialsResult = await testAPI('/api/products/materials');
  results.push(materialsResult);
  
  // 3. 测试单位添加功能
  console.log('\n📏 测试单位添加功能...');
  const testUnit = {
    unit: '批量测试单位'
  };
  const addUnitResult = await testAPI('/api/products/units', 'POST', testUnit);
  results.push(addUnitResult);
  
  // 4. 测试材质添加功能
  console.log('\n🧱 测试材质添加功能...');
  const testMaterial = {
    material: '批量测试材质'
  };
  const addMaterialResult = await testAPI('/api/products/materials', 'POST', testMaterial);
  results.push(addMaterialResult);
  
  // 5. 创建测试产品用于批量操作
  console.log('\n📝 创建测试产品用于批量操作...');
  const testProducts = [
    {
      name: '批量测试产品1',
      price: 100.00,
      commissionRate: 10,
      description: '用于批量操作测试的产品1',
      sku: 'BATCH-TEST-001'
    },
    {
      name: '批量测试产品2',
      price: 200.00,
      commissionRate: 15,
      description: '用于批量操作测试的产品2',
      sku: 'BATCH-TEST-002'
    },
    {
      name: '批量测试产品3',
      price: 300.00,
      commissionRate: 20,
      description: '用于批量操作测试的产品3',
      sku: 'BATCH-TEST-003'
    }
  ];
  
  const createdProductIds = [];
  for (let i = 0; i < testProducts.length; i++) {
    const createResult = await testAPI('/api/products', 'POST', testProducts[i]);
    results.push(createResult);
    if (createResult.success && createResult.data.product) {
      createdProductIds.push(createResult.data.product.id);
      console.log(`   创建产品ID: ${createResult.data.product.id}`);
    }
  }
  
  // 6. 测试批量更新功能
  if (createdProductIds.length > 0) {
    console.log('\n📦 测试批量更新功能...');
    const batchUpdateData = {
      ids: createdProductIds,
      fields: {
        price: 999.99,
        unit: '批量测试单位',
        material: '批量测试材质'
      }
    };
    const batchUpdateResult = await testAPI('/api/products/batch-update', 'POST', batchUpdateData);
    results.push(batchUpdateResult);
  }
  
  // 7. 验证批量更新结果
  if (createdProductIds.length > 0) {
    console.log('\n🔍 验证批量更新结果...');
    for (const productId of createdProductIds) {
      const verifyResult = await testAPI(`/api/products/${productId}`);
      results.push(verifyResult);
      if (verifyResult.success && verifyResult.data.product) {
        const product = verifyResult.data.product;
        console.log(`   产品${productId}: 价格=${product.price}, 单位=${product.unit}, 材质=${product.material}`);
      }
    }
  }
  
  // 8. 测试导出功能
  console.log('\n📤 测试导出功能...');
  const exportResult = await testAPI('/api/products/export?format=json');
  results.push(exportResult);
  
  // 9. 测试产品统计API
  console.log('\n📊 测试产品统计API...');
  const statsResult = await testAPI('/api/products/stats');
  results.push(statsResult);
  
  // 10. 测试单位删除功能（检查约束）
  console.log('\n🗑️ 测试单位删除功能（应该失败，因为有产品在使用）...');
  const deleteUnitResult = await testAPI('/api/products/units', 'DELETE', { unit: '批量测试单位' });
  results.push(deleteUnitResult);
  
  // 11. 测试材质删除功能（检查约束）
  console.log('\n🗑️ 测试材质删除功能（应该失败，因为有产品在使用）...');
  const deleteMaterialResult = await testAPI('/api/products/materials', 'DELETE', { material: '批量测试材质' });
  results.push(deleteMaterialResult);
  
  // 12. 清理测试数据 - 删除创建的产品
  if (createdProductIds.length > 0) {
    console.log('\n🧹 清理测试数据...');
    for (const productId of createdProductIds) {
      const deleteResult = await testAPI(`/api/products/${productId}`, 'DELETE');
      results.push(deleteResult);
    }
  }
  
  // 13. 现在可以删除单位和材质了
  console.log('\n🗑️ 删除测试单位和材质...');
  const finalDeleteUnitResult = await testAPI('/api/products/units', 'DELETE', { unit: '批量测试单位' });
  results.push(finalDeleteUnitResult);
  
  const finalDeleteMaterialResult = await testAPI('/api/products/materials', 'DELETE', { material: '批量测试材质' });
  results.push(finalDeleteMaterialResult);
  
  // 14. 性能压力测试
  console.log('\n⚡ 性能压力测试（并发请求）...');
  const performanceTests = [];
  for (let i = 0; i < 3; i++) {
    performanceTests.push(testAPI('/api/products/units'));
    performanceTests.push(testAPI('/api/products/materials'));
  }
  const performanceResults = await Promise.all(performanceTests);
  results.push(...performanceResults);
  
  // 生成测试报告
  console.log('\n📊 批量操作和扩展功能测试结果汇总:');
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
  
  // 功能完整性检查
  console.log('\n🎯 功能完整性检查:');
  const functionalityChecks = {
    '单位管理功能': results.some(r => r.data && r.data.units && Array.isArray(r.data.units)),
    '材质管理功能': results.some(r => r.data && r.data.materials && Array.isArray(r.data.materials)),
    '批量更新功能': results.some(r => r.data && r.data.updatedCount !== undefined),
    '数据导出功能': results.some(r => r.data && (r.data.products || r.data.data)),
    '约束检查功能': results.some(r => r.data && r.data.conflicts),
    '缓存策略设置': results.some(r => r.cacheControl && r.cacheControl.includes('max-age')),
  };
  
  Object.entries(functionalityChecks).forEach(([feature, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${feature}`);
  });
  
  console.log('\n🎯 阶段4批量操作和扩展功能测试完成！');
  
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
runBatchExtendedTests().catch(console.error);
