const fetch = require('node-fetch');

async function testProductionRoutes() {
  console.log('🔍 生产管理页面路由测试');
  console.log('==========================\n');

  const baseUrl = 'http://localhost:3001';
  const testResults = [];

  // 测试页面路由
  const pageTests = [
    {
      name: '生产管理主页',
      url: '/production',
      expectedStatus: 200,
      description: '默认生产订单标签页'
    },
    {
      name: '生产订单标签页',
      url: '/production?tab=orders',
      expectedStatus: 200,
      description: '生产订单管理'
    },
    {
      name: '生产基地标签页',
      url: '/production?tab=bases',
      expectedStatus: 200,
      description: '生产基地管理'
    },
    {
      name: '计件工单标签页',
      url: '/production?tab=production',
      expectedStatus: 200,
      description: '计件工单管理'
    },
    {
      name: '制作报表标签页',
      url: '/production?tab=reports',
      expectedStatus: 200,
      description: '生产数据分析报表'
    }
  ];

  console.log('1. 📄 页面路由测试\n');

  for (const test of pageTests) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; Test/1.0)'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type');
      const isHTML = contentType && contentType.includes('text/html');
      
      let hasContent = false;
      let hasErrors = false;
      let contentLength = 0;
      
      if (response.ok && isHTML) {
        const html = await response.text();
        contentLength = html.length;
        hasContent = html.includes('<html') && html.includes('</html>');
        
        // 检查是否有明显的错误
        hasErrors = html.includes('Error:') || 
                   html.includes('404') || 
                   html.includes('500') ||
                   html.includes('Application error');
      }

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        responseTime,
        success: response.status === test.expectedStatus && hasContent && !hasErrors,
        contentType,
        isHTML,
        hasContent,
        hasErrors,
        contentLength
      };

      testResults.push(result);

      const statusIcon = result.success ? '✅' : '❌';
      const timeIcon = responseTime <= 2000 ? '⚡' : responseTime <= 5000 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      console.log(`   内容: ${isHTML ? 'HTML' : contentType || 'Unknown'} (${(contentLength/1024).toFixed(1)}KB)`);
      console.log(`   描述: ${test.description}`);
      
      if (hasErrors) {
        console.log(`   ⚠️  检测到错误内容`);
      }
      
      console.log('');

    } catch (error) {
      const result = {
        name: test.name,
        url: test.url,
        error: error.message,
        success: false
      };
      
      testResults.push(result);
      
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 测试API端点
  console.log('2. 📡 相关API端点测试\n');
  
  const apiTests = [
    {
      name: '生产订单API',
      url: '/api/production/orders',
      expectedStatus: 200
    },
    {
      name: '生产基地API',
      url: '/api/production/bases',
      expectedStatus: 200
    },
    {
      name: '计件工单API',
      url: '/api/piece-works',
      expectedStatus: 200
    },
    {
      name: '生产报表API',
      url: '/api/production/reports',
      expectedStatus: 200
    },
    {
      name: '生产预警API',
      url: '/api/production/alerts',
      expectedStatus: 200
    }
  ];

  for (const test of apiTests) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      let hasData = false;
      let dataKeys = [];
      
      if (response.ok) {
        try {
          const data = await response.json();
          hasData = !!data;
          if (typeof data === 'object' && data !== null) {
            dataKeys = Object.keys(data);
          }
        } catch (e) {
          // JSON解析失败
        }
      }

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        responseTime,
        success: response.status === test.expectedStatus,
        hasData,
        dataKeys
      };

      const statusIcon = result.success ? '✅' : '❌';
      const timeIcon = responseTime <= 120 ? '⚡' : responseTime <= 500 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      
      if (hasData && dataKeys.length > 0) {
        console.log(`   数据: ${dataKeys.slice(0, 3).join(', ')}${dataKeys.length > 3 ? '...' : ''}`);
      }
      
      console.log('');

    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 性能分析
  console.log('3. ⚡ 性能分析\n');
  
  const successfulPageTests = testResults.filter(r => r.success && r.responseTime);
  if (successfulPageTests.length > 0) {
    const avgResponseTime = successfulPageTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulPageTests.length;
    const maxResponseTime = Math.max(...successfulPageTests.map(r => r.responseTime));
    const minResponseTime = Math.min(...successfulPageTests.map(r => r.responseTime));
    
    console.log(`页面平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`最快页面响应: ${minResponseTime}ms`);
    console.log(`最慢页面响应: ${maxResponseTime}ms`);
    
    const fastPages = successfulPageTests.filter(r => r.responseTime <= 2000).length;
    const slowPages = successfulPageTests.filter(r => r.responseTime > 5000).length;
    
    console.log(`快速页面 (≤2s): ${fastPages}/${successfulPageTests.length}`);
    console.log(`慢速页面 (>5s): ${slowPages}/${successfulPageTests.length}`);
  }

  // 内容分析
  console.log('\n4. 📋 内容分析\n');
  
  const htmlPages = testResults.filter(r => r.isHTML);
  const validPages = testResults.filter(r => r.hasContent && !r.hasErrors);
  const errorPages = testResults.filter(r => r.hasErrors);
  
  console.log(`HTML页面: ${htmlPages.length}/${testResults.length}`);
  console.log(`有效页面: ${validPages.length}/${testResults.length}`);
  console.log(`错误页面: ${errorPages.length}/${testResults.length}`);
  
  if (errorPages.length > 0) {
    console.log('\n错误页面详情:');
    errorPages.forEach(page => {
      console.log(`❌ ${page.name}: 检测到错误内容`);
    });
  }

  // 总体评估
  console.log('\n5. 📊 总体评估\n');
  
  const successfulTests = testResults.filter(r => r.success);
  const successRate = (successfulTests.length / testResults.length) * 100;
  
  const avgPerformance = successfulPageTests.length > 0 
    ? successfulPageTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulPageTests.length 
    : 0;
  
  const performanceScore = avgPerformance <= 2000 ? 100 : avgPerformance <= 5000 ? 80 : 60;
  const reliabilityScore = successRate;
  const contentScore = validPages.length > 0 ? (validPages.length / testResults.length) * 100 : 0;
  
  const overallScore = (performanceScore + reliabilityScore + contentScore) / 3;
  
  console.log(`可靠性评分: ${reliabilityScore.toFixed(1)}%`);
  console.log(`性能评分: ${performanceScore.toFixed(1)}%`);
  console.log(`内容质量评分: ${contentScore.toFixed(1)}%`);
  console.log(`综合评分: ${overallScore.toFixed(1)}%`);
  
  const qualityLevel = overallScore >= 90 ? '优秀' : 
                      overallScore >= 80 ? '良好' : 
                      overallScore >= 70 ? '一般' : '需要改进';
  
  console.log(`质量等级: ${qualityLevel}`);

  // 建议
  console.log('\n6. 💡 改进建议\n');
  
  if (avgPerformance > 2000) {
    console.log('⚠️  建议优化页面加载时间，目标≤2秒');
  }
  
  if (errorPages.length > 0) {
    console.log('⚠️  建议修复检测到错误的页面');
  }
  
  if (successRate < 100) {
    console.log('⚠️  建议修复失败的路由');
  }
  
  if (overallScore >= 90) {
    console.log('✅ 页面路由质量优秀，可以正常使用');
  } else if (overallScore >= 80) {
    console.log('✅ 页面路由质量良好，建议进行小幅优化');
  } else {
    console.log('⚠️  建议进行页面路由优化后再投入使用');
  }

  return {
    totalTests: testResults.length,
    successfulTests: successfulTests.length,
    averageResponseTime: avgPerformance,
    overallScore,
    qualityLevel
  };
}

// 运行测试
testProductionRoutes().then(result => {
  console.log('\n🎯 路由测试完成');
  console.log(`总测试数: ${result.totalTests}`);
  console.log(`成功测试: ${result.successfulTests}`);
  console.log(`平均响应时间: ${result.averageResponseTime.toFixed(2)}ms`);
  console.log(`综合评分: ${result.overallScore.toFixed(1)}%`);
}).catch(error => {
  console.error('❌ 测试失败:', error);
});
