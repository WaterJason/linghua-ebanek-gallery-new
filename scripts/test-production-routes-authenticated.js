const fetch = require('node-fetch');

async function testProductionRoutesAuthenticated() {
  console.log('🔍 生产管理页面路由测试（已认证）');
  console.log('==================================\n');

  const baseUrl = 'http://localhost:3001';
  let sessionCookie = null;

  // 1. 先进行登录获取会话
  console.log('1. 🔐 用户认证\n');
  
  try {
    // 获取登录页面和CSRF token
    const loginPageResponse = await fetch(`${baseUrl}/login`);
    const loginPageHtml = await loginPageResponse.text();
    
    // 提取CSRF token（简化处理）
    const csrfMatch = loginPageHtml.match(/name="csrfToken" value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    
    console.log('✅ 获取登录页面成功');
    console.log(`   CSRF Token: ${csrfToken ? '已获取' : '未找到'}`);

    // 模拟登录（使用管理员账号）
    const loginData = new URLSearchParams({
      email: 'admin@linghua.com',
      password: 'Admin123456',
      csrfToken: csrfToken,
      callbackUrl: `${baseUrl}/production`
    });

    const loginResponse = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': loginPageResponse.headers.get('set-cookie') || ''
      },
      body: loginData,
      redirect: 'manual'
    });

    // 获取会话cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      sessionCookie = setCookieHeader;
      console.log('✅ 登录成功，获取会话cookie');
    } else {
      console.log('⚠️  登录可能失败，未获取到会话cookie');
    }

  } catch (error) {
    console.log('❌ 认证过程失败:', error.message);
    console.log('⚠️  将继续进行未认证测试\n');
  }

  // 2. 测试页面路由（带认证）
  console.log('\n2. 📄 页面路由测试（已认证）\n');
  
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

  const testResults = [];

  for (const test of pageTests) {
    try {
      const startTime = Date.now();
      
      const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; Test/1.0)'
      };

      // 如果有会话cookie，添加到请求头
      if (sessionCookie) {
        headers['Cookie'] = sessionCookie;
      }

      const response = await fetch(`${baseUrl}${test.url}`, {
        method: 'GET',
        headers,
        redirect: 'manual'
      });
      
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type');
      const isHTML = contentType && contentType.includes('text/html');
      const isRedirect = response.status >= 300 && response.status < 400;
      
      let hasContent = false;
      let hasErrors = false;
      let contentLength = 0;
      let isLoginRedirect = false;
      
      if (isRedirect) {
        const location = response.headers.get('location');
        isLoginRedirect = location && location.includes('/login');
      } else if (response.ok && isHTML) {
        const html = await response.text();
        contentLength = html.length;
        hasContent = html.includes('<html') && html.includes('</html>');
        isLoginRedirect = html.includes('/login') && html.includes('callbackUrl');
        
        // 检查是否有明显的错误
        hasErrors = html.includes('Error:') || 
                   html.includes('Application error') ||
                   html.includes('500') ||
                   (html.includes('404') && !html.includes('not-found'));
      }

      const result = {
        name: test.name,
        url: test.url,
        status: response.status,
        responseTime,
        success: !isLoginRedirect && response.status === test.expectedStatus && hasContent && !hasErrors,
        contentType,
        isHTML,
        hasContent,
        hasErrors,
        isLoginRedirect,
        isRedirect,
        contentLength
      };

      testResults.push(result);

      const statusIcon = result.success ? '✅' : (isLoginRedirect ? '🔐' : '❌');
      const timeIcon = responseTime <= 2000 ? '⚡' : responseTime <= 5000 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      
      if (isLoginRedirect) {
        console.log(`   认证: 需要登录`);
      } else if (isHTML) {
        console.log(`   内容: HTML (${(contentLength/1024).toFixed(1)}KB)`);
      } else {
        console.log(`   内容: ${contentType || 'Unknown'}`);
      }
      
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

  // 3. 测试API端点
  console.log('3. 📡 相关API端点测试\n');
  
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
      
      const headers = {
        'Content-Type': 'application/json'
      };

      // 如果有会话cookie，添加到请求头
      if (sessionCookie) {
        headers['Cookie'] = sessionCookie;
      }
      
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: 'GET',
        headers
      });
      
      const responseTime = Date.now() - startTime;
      
      let hasData = false;
      let dataKeys = [];
      let dataCount = 0;
      
      if (response.ok) {
        try {
          const data = await response.json();
          hasData = !!data;
          if (typeof data === 'object' && data !== null) {
            dataKeys = Object.keys(data);
            // 尝试获取数据数量
            if (Array.isArray(data)) {
              dataCount = data.length;
            } else if (data.data && Array.isArray(data.data)) {
              dataCount = data.data.length;
            }
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
        dataKeys,
        dataCount
      };

      const statusIcon = result.success ? '✅' : '❌';
      const timeIcon = responseTime <= 120 ? '⚡' : responseTime <= 500 ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   状态: ${response.status} ${timeIcon} ${responseTime}ms`);
      
      if (hasData && dataKeys.length > 0) {
        console.log(`   数据: ${dataKeys.slice(0, 3).join(', ')}${dataKeys.length > 3 ? '...' : ''}`);
        if (dataCount > 0) {
          console.log(`   记录数: ${dataCount}`);
        }
      }
      
      console.log('');

    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
    }
  }

  // 4. 分析结果
  console.log('4. 📊 测试结果分析\n');
  
  const successfulPages = testResults.filter(r => r.success);
  const loginRedirectPages = testResults.filter(r => r.isLoginRedirect);
  const errorPages = testResults.filter(r => r.hasErrors);
  
  console.log(`成功页面: ${successfulPages.length}/${testResults.length}`);
  console.log(`需要登录: ${loginRedirectPages.length}/${testResults.length}`);
  console.log(`错误页面: ${errorPages.length}/${testResults.length}`);
  
  if (loginRedirectPages.length > 0) {
    console.log('\n需要登录的页面:');
    loginRedirectPages.forEach(page => {
      console.log(`🔐 ${page.name}: 需要身份验证`);
    });
  }
  
  if (errorPages.length > 0) {
    console.log('\n错误页面详情:');
    errorPages.forEach(page => {
      console.log(`❌ ${page.name}: 检测到错误内容`);
    });
  }

  // 5. 功能验证建议
  console.log('\n5. 💡 功能验证建议\n');
  
  if (loginRedirectPages.length === testResults.length) {
    console.log('✅ 所有页面都正确实施了身份验证保护');
    console.log('📝 建议：使用有效凭据登录后再测试页面功能');
  } else if (successfulPages.length > 0) {
    console.log('✅ 部分页面可以正常访问');
    console.log('📝 建议：检查身份验证配置的一致性');
  }
  
  if (errorPages.length === 0) {
    console.log('✅ 未检测到页面错误');
  }
  
  console.log('📝 建议：');
  console.log('   1. 使用管理员账号登录系统');
  console.log('   2. 手动测试各个标签页的切换功能');
  console.log('   3. 验证每个标签页的核心功能');
  console.log('   4. 检查数据加载和显示是否正常');

  return {
    totalTests: testResults.length,
    successfulTests: successfulPages.length,
    loginRedirectTests: loginRedirectPages.length,
    errorTests: errorPages.length,
    authenticationRequired: loginRedirectPages.length > 0
  };
}

// 运行测试
testProductionRoutesAuthenticated().then(result => {
  console.log('\n🎯 路由测试完成');
  console.log(`总测试数: ${result.totalTests}`);
  console.log(`成功测试: ${result.successfulTests}`);
  console.log(`需要登录: ${result.loginRedirectTests}`);
  console.log(`错误测试: ${result.errorTests}`);
  console.log(`需要身份验证: ${result.authenticationRequired ? '是' : '否'}`);
}).catch(error => {
  console.error('❌ 测试失败:', error);
});
