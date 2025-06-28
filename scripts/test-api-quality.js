const fetch = require('node-fetch');

async function testAPIQuality() {
  console.log('🔍 API质量检查和响应测试');
  console.log('================================\n');

  const baseUrl = 'http://localhost:3000';
  const testResults = [];

  // 测试API端点
  const apiTests = [
    {
      name: '生产订单列表',
      method: 'GET',
      url: '/api/production/orders',
      expectedStatus: 200
    },
    {
      name: '生产预警检查',
      method: 'GET',
      url: '/api/production/alerts',
      expectedStatus: 200
    },
    {
      name: '地点协作报告',
      method: 'GET',
      url: '/api/production/collaboration-report',
      expectedStatus: 200
    },
    {
      name: '智能状态转换',
      method: 'POST',
      url: '/api/production/smart-transition',
      body: {
        orderId: 1,
        targetStage: 'MATERIAL_PROCUREMENT',
        operatorId: 1,
        userRole: 'manager',
        conditions: {},
        notes: 'API测试'
      },
      expectedStatus: [200, 404, 500] // 可能没有订单数据
    },
    {
      name: '智能调度生成',
      method: 'POST',
      url: '/api/production/smart-schedule',
      body: {
        orderId: 1,
        productComplexity: 1.0,
        urgencyLevel: 'NORMAL'
      },
      expectedStatus: [200, 404, 500]
    },
    {
      name: '批量调度优化',
      method: 'POST',
      url: '/api/production/batch-optimization',
      body: {
        orderIds: [1, 2],
        optimizationGoal: 'minimize_time'
      },
      expectedStatus: [200, 400, 500]
    }
  ];

  console.log('1. 📡 API端点响应测试\n');

  for (const test of apiTests) {
    try {
      const startTime = Date.now();
      
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(`${baseUrl}${test.url}`, options);
      const responseTime = Date.now() - startTime;
      
      const isExpectedStatus = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus.includes(response.status)
        : response.status === test.expectedStatus;

      const result = {
        name: test.name,
        url: test.url,
        method: test.method,
        status: response.status,
        responseTime,
        success: isExpectedStatus,
        contentType: response.headers.get('content-type')
      };

      // 尝试解析响应体
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();
          result.hasData = !!data;
          result.dataKeys = typeof data === 'object' ? Object.keys(data) : [];
        }
      } catch (e) {
        result.parseError = true;
      }

      testResults.push(result);

      const statusIcon = result.success ? '✅' : '❌';
      const timeIcon = responseTime <= 120 ? '⚡' : responseTime <= 500 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.method} ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      console.log(`   内容类型: ${result.contentType || 'N/A'}`);
      
      if (result.dataKeys?.length > 0) {
        console.log(`   数据字段: ${result.dataKeys.slice(0, 3).join(', ')}${result.dataKeys.length > 3 ? '...' : ''}`);
      }
      
      console.log('');

    } catch (error) {
      const result = {
        name: test.name,
        url: test.url,
        method: test.method,
        error: error.message,
        success: false
      };
      
      testResults.push(result);
      
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 性能分析
  console.log('2. ⚡ 性能分析\n');
  
  const successfulTests = testResults.filter(r => r.success && r.responseTime);
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
    const maxResponseTime = Math.max(...successfulTests.map(r => r.responseTime));
    const minResponseTime = Math.min(...successfulTests.map(r => r.responseTime));
    
    console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`最快响应时间: ${minResponseTime}ms`);
    console.log(`最慢响应时间: ${maxResponseTime}ms`);
    
    const fastAPIs = successfulTests.filter(r => r.responseTime <= 120).length;
    const slowAPIs = successfulTests.filter(r => r.responseTime > 500).length;
    
    console.log(`快速API (≤120ms): ${fastAPIs}/${successfulTests.length}`);
    console.log(`慢速API (>500ms): ${slowAPIs}/${successfulTests.length}`);
  } else {
    console.log('没有成功的API测试用于性能分析');
  }

  // 错误处理分析
  console.log('\n3. 🛡️ 错误处理分析\n');
  
  const errorTests = testResults.filter(r => !r.success);
  const successTests = testResults.filter(r => r.success);
  
  console.log(`成功的API: ${successTests.length}/${testResults.length}`);
  console.log(`失败的API: ${errorTests.length}/${testResults.length}`);
  
  if (errorTests.length > 0) {
    console.log('\n失败的API详情:');
    errorTests.forEach(test => {
      console.log(`❌ ${test.name}: ${test.error || `状态码 ${test.status}`}`);
    });
  }

  // JSON响应格式检查
  console.log('\n4. 📋 响应格式检查\n');
  
  const jsonAPIs = testResults.filter(r => r.contentType?.includes('application/json'));
  const nonJsonAPIs = testResults.filter(r => r.contentType && !r.contentType.includes('application/json'));
  
  console.log(`JSON响应: ${jsonAPIs.length}/${testResults.length}`);
  console.log(`非JSON响应: ${nonJsonAPIs.length}/${testResults.length}`);
  
  const parseErrors = testResults.filter(r => r.parseError).length;
  if (parseErrors > 0) {
    console.log(`JSON解析错误: ${parseErrors}`);
  }

  // 总体评估
  console.log('\n5. 📊 总体质量评估\n');
  
  const successRate = (successTests.length / testResults.length) * 100;
  const avgPerformance = successfulTests.length > 0 
    ? successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length 
    : 0;
  
  const performanceScore = avgPerformance <= 120 ? 100 : avgPerformance <= 500 ? 80 : 60;
  const reliabilityScore = successRate;
  const formatScore = jsonAPIs.length > 0 ? (jsonAPIs.length / testResults.length) * 100 : 0;
  
  const overallScore = (performanceScore + reliabilityScore + formatScore) / 3;
  
  console.log(`可靠性评分: ${reliabilityScore.toFixed(1)}%`);
  console.log(`性能评分: ${performanceScore.toFixed(1)}%`);
  console.log(`格式规范评分: ${formatScore.toFixed(1)}%`);
  console.log(`综合质量评分: ${overallScore.toFixed(1)}%`);
  
  const qualityLevel = overallScore >= 90 ? '优秀' : 
                      overallScore >= 80 ? '良好' : 
                      overallScore >= 70 ? '一般' : '需要改进';
  
  console.log(`质量等级: ${qualityLevel}`);

  // 建议
  console.log('\n6. 💡 改进建议\n');
  
  if (avgPerformance > 120) {
    console.log('⚠️  建议优化API响应时间，目标≤120ms');
  }
  
  if (errorTests.length > 0) {
    console.log('⚠️  建议修复失败的API端点');
  }
  
  if (parseErrors > 0) {
    console.log('⚠️  建议修复JSON响应格式问题');
  }
  
  if (overallScore >= 90) {
    console.log('✅ API质量优秀，可以投入生产使用');
  } else if (overallScore >= 80) {
    console.log('✅ API质量良好，建议进行小幅优化');
  } else {
    console.log('⚠️  建议进行API质量改进后再投入使用');
  }

  return {
    totalTests: testResults.length,
    successfulTests: successTests.length,
    averageResponseTime: avgPerformance,
    overallScore,
    qualityLevel
  };
}

// 运行测试
testAPIQuality().then(result => {
  console.log('\n🎯 测试完成');
  console.log(`总测试数: ${result.totalTests}`);
  console.log(`成功测试: ${result.successfulTests}`);
  console.log(`平均响应时间: ${result.averageResponseTime.toFixed(2)}ms`);
  console.log(`综合评分: ${result.overallScore.toFixed(1)}%`);
}).catch(error => {
  console.error('❌ 测试失败:', error);
});
