const fetch = require('node-fetch');

async function testDualLocationSystem() {
  console.log('🧪 聆花珐琅双地点生产流程库存自动化管理和成本核算系统测试');
  console.log('================================================================\n');

  const baseUrl = 'http://localhost:3003';
  const testResults = {
    apiTests: [],
    functionalTests: [],
    integrationTests: []
  };

  // 1. API端点测试
  console.log('1. 📡 API端点功能测试\n');
  
  const apiEndpoints = [
    {
      name: '库存转移管理',
      url: '/api/inventory/transfers',
      method: 'GET',
      expectedStatus: 200,
      description: '获取库存转移记录'
    },
    {
      name: '自动化规则管理',
      url: '/api/inventory/automation-rules',
      method: 'GET',
      expectedStatus: 200,
      description: '获取库存自动化规则'
    },
    {
      name: '计件工资管理',
      url: '/api/cost-accounting/piece-work',
      method: 'GET',
      expectedStatus: 200,
      description: '获取计件工资记录'
    },
    {
      name: '生产成本管理',
      url: '/api/cost-accounting/production-costs',
      method: 'GET',
      expectedStatus: 200,
      description: '获取生产成本记录'
    },
    {
      name: '生产阶段管理',
      url: '/api/production/orders/1/stage',
      method: 'GET',
      expectedStatus: 200,
      description: '获取生产阶段历史'
    },
    {
      name: '生产仪表板',
      url: '/api/production/dashboard',
      method: 'GET',
      expectedStatus: 200,
      description: '获取生产仪表板数据'
    }
  ];

  for (const test of apiEndpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isSuccess = response.status === test.expectedStatus;
      
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // 非JSON响应
      }

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        responseTime,
        success: isSuccess,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        description: test.description
      };

      testResults.apiTests.push(result);

      const statusIcon = isSuccess ? '✅' : '❌';
      const timeIcon = responseTime <= 120 ? '⚡' : responseTime <= 500 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      console.log(`   描述: ${test.description}`);
      
      if (data && typeof data === 'object') {
        const keys = Object.keys(data).slice(0, 3);
        console.log(`   数据: ${keys.join(', ')}${Object.keys(data).length > 3 ? '...' : ''}`);
      }
      
      console.log('');

    } catch (error) {
      const result = {
        name: test.name,
        url: test.url,
        error: error.message,
        success: false
      };
      
      testResults.apiTests.push(result);
      
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 2. 页面功能测试
  console.log('2. 🖥️  页面功能测试\n');
  
  const pageTests = [
    {
      name: '生产管理主页',
      url: '/production',
      description: '生产管理模块主页面'
    },
    {
      name: '库存自动化标签页',
      url: '/production?tab=inventory',
      description: '双地点库存自动化管理'
    },
    {
      name: '成本核算标签页',
      url: '/production?tab=cost',
      description: '成本核算与薪酬管理'
    },
    {
      name: '生产订单标签页',
      url: '/production?tab=orders',
      description: '智能生产订单管理'
    },
    {
      name: '制作报表标签页',
      url: '/production?tab=reports',
      description: '生产数据分析报表'
    }
  ];

  for (const test of pageTests) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'manual'
      });
      
      const responseTime = Date.now() - startTime;
      const isRedirect = response.status >= 300 && response.status < 400;
      const isLoginRedirect = isRedirect && response.headers.get('location')?.includes('/login');
      
      let hasContent = false;
      if (response.ok) {
        const html = await response.text();
        hasContent = html.includes('<html') && html.includes('</html>');
      }

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        responseTime,
        success: response.ok || isLoginRedirect,
        hasContent,
        isLoginRedirect,
        description: test.description
      };

      testResults.functionalTests.push(result);

      const statusIcon = result.success ? '✅' : '❌';
      const timeIcon = responseTime <= 2000 ? '⚡' : responseTime <= 5000 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      console.log(`   描述: ${test.description}`);
      
      if (isLoginRedirect) {
        console.log(`   认证: 需要登录（正常行为）`);
      } else if (hasContent) {
        console.log(`   内容: HTML页面正常加载`);
      }
      
      console.log('');

    } catch (error) {
      const result = {
        name: test.name,
        url: test.url,
        error: error.message,
        success: false
      };
      
      testResults.functionalTests.push(result);
      
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 3. 集成测试
  console.log('3. 🔗 系统集成测试\n');
  
  const integrationTests = [
    {
      name: '数据库连接',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/health`);
        return response.ok;
      },
      description: '验证数据库连接状态'
    },
    {
      name: '生产订单数据',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/production/orders`);
        const data = await response.json();
        return response.ok && data.data && Array.isArray(data.data);
      },
      description: '验证生产订单数据结构'
    },
    {
      name: '库存数据同步',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/inventory`);
        const data = await response.json();
        return response.ok && data.data;
      },
      description: '验证库存数据同步'
    },
    {
      name: '员工数据集成',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/employees`);
        const data = await response.json();
        return response.ok && data.data && Array.isArray(data.data);
      },
      description: '验证员工数据集成'
    }
  ];

  for (const test of integrationTests) {
    try {
      const startTime = Date.now();
      const success = await test.test();
      const responseTime = Date.now() - startTime;

      const result = {
        name: test.name,
        success,
        responseTime,
        description: test.description
      };

      testResults.integrationTests.push(result);

      const statusIcon = success ? '✅' : '❌';
      const timeIcon = responseTime <= 1000 ? '⚡' : responseTime <= 3000 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   性能: ${timeIcon} ${responseTime}ms`);
      console.log(`   描述: ${test.description}`);
      console.log('');

    } catch (error) {
      const result = {
        name: test.name,
        success: false,
        error: error.message,
        description: test.description
      };
      
      testResults.integrationTests.push(result);
      
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 4. 测试结果汇总
  console.log('4. 📊 测试结果汇总\n');
  
  const apiSuccess = testResults.apiTests.filter(t => t.success).length;
  const functionalSuccess = testResults.functionalTests.filter(t => t.success).length;
  const integrationSuccess = testResults.integrationTests.filter(t => t.success).length;
  
  const totalTests = testResults.apiTests.length + testResults.functionalTests.length + testResults.integrationTests.length;
  const totalSuccess = apiSuccess + functionalSuccess + integrationSuccess;
  const successRate = (totalSuccess / totalTests) * 100;

  console.log(`API端点测试: ${apiSuccess}/${testResults.apiTests.length} 通过`);
  console.log(`页面功能测试: ${functionalSuccess}/${testResults.functionalTests.length} 通过`);
  console.log(`系统集成测试: ${integrationSuccess}/${testResults.integrationTests.length} 通过`);
  console.log(`总体成功率: ${totalSuccess}/${totalTests} (${successRate.toFixed(1)}%)`);

  // 5. 性能分析
  console.log('\n5. ⚡ 性能分析\n');
  
  const apiTimes = testResults.apiTests.filter(t => t.responseTime).map(t => t.responseTime);
  const pageTimes = testResults.functionalTests.filter(t => t.responseTime).map(t => t.responseTime);
  
  if (apiTimes.length > 0) {
    const avgApiTime = apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length;
    const maxApiTime = Math.max(...apiTimes);
    console.log(`API平均响应时间: ${avgApiTime.toFixed(0)}ms`);
    console.log(`API最大响应时间: ${maxApiTime}ms`);
    console.log(`API性能评级: ${avgApiTime <= 120 ? '优秀' : avgApiTime <= 500 ? '良好' : '需要优化'}`);
  }
  
  if (pageTimes.length > 0) {
    const avgPageTime = pageTimes.reduce((sum, time) => sum + time, 0) / pageTimes.length;
    const maxPageTime = Math.max(...pageTimes);
    console.log(`页面平均加载时间: ${avgPageTime.toFixed(0)}ms`);
    console.log(`页面最大加载时间: ${maxPageTime}ms`);
    console.log(`页面性能评级: ${avgPageTime <= 2000 ? '优秀' : avgPageTime <= 5000 ? '良好' : '需要优化'}`);
  }

  // 6. 系统状态评估
  console.log('\n6. 🎯 系统状态评估\n');
  
  if (successRate >= 90) {
    console.log('✅ 系统状态: 优秀 - 所有核心功能正常运行');
  } else if (successRate >= 80) {
    console.log('🟡 系统状态: 良好 - 大部分功能正常，少数问题需要关注');
  } else if (successRate >= 70) {
    console.log('🟠 系统状态: 一般 - 存在一些问题，需要修复');
  } else {
    console.log('🔴 系统状态: 需要改进 - 存在较多问题，需要重点关注');
  }

  console.log('\n📝 建议:');
  console.log('1. 使用管理员账号登录系统测试完整功能');
  console.log('2. 验证库存转移自动化流程');
  console.log('3. 测试计件工资记录和审核功能');
  console.log('4. 检查成本核算和分析报表');
  console.log('5. 验证生产阶段变更的自动化触发');

  return {
    totalTests,
    totalSuccess,
    successRate,
    testResults
  };
}

// 运行测试
testDualLocationSystem().then(result => {
  console.log('\n🎉 双地点生产流程库存自动化管理和成本核算系统测试完成！');
  console.log(`总测试数: ${result.totalTests}`);
  console.log(`成功测试: ${result.totalSuccess}`);
  console.log(`成功率: ${result.successRate.toFixed(1)}%`);
}).catch(error => {
  console.error('❌ 测试失败:', error);
});
