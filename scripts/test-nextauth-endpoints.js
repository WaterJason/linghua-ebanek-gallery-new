// Test NextAuth endpoints to ensure they return proper JSON responses

async function testNextAuthEndpoints() {
  console.log('🔐 开始测试NextAuth端点...\n');

  const baseUrl = 'http://localhost:3001';
  
  const endpoints = [
    {
      name: 'CSRF Token',
      url: '/api/auth/csrf',
      method: 'GET',
      expectedType: 'json',
      expectedFields: ['csrfToken']
    },
    {
      name: 'Session',
      url: '/api/auth/session',
      method: 'GET',
      expectedType: 'json',
      expectedFields: null // Can be null or object
    },
    {
      name: 'Providers',
      url: '/api/auth/providers',
      method: 'GET',
      expectedType: 'json',
      expectedFields: null
    },
    {
      name: 'SignIn Page',
      url: '/api/auth/signin',
      method: 'GET',
      expectedType: 'html', // This should return HTML
      expectedFields: null
    }
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 测试 ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
      
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Accept': endpoint.expectedType === 'json' ? 'application/json' : 'text/html',
          'Content-Type': 'application/json'
        }
      });

      console.log(`   状态码: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);

      if (response.status !== 200) {
        console.log(`   ❌ 状态码错误: 期望200，实际${response.status}`);
        allPassed = false;
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (endpoint.expectedType === 'json') {
        if (!contentType.includes('application/json')) {
          console.log(`   ⚠️  Content-Type警告: 期望JSON，实际${contentType}`);
        }

        try {
          const data = await response.json();
          console.log(`   📄 响应数据: ${JSON.stringify(data).substring(0, 100)}${JSON.stringify(data).length > 100 ? '...' : ''}`);
          
          if (endpoint.expectedFields) {
            const missingFields = endpoint.expectedFields.filter(field => !(field in data));
            if (missingFields.length > 0) {
              console.log(`   ❌ 缺少字段: ${missingFields.join(', ')}`);
              allPassed = false;
            } else {
              console.log(`   ✅ 包含所有期望字段`);
            }
          } else {
            console.log(`   ✅ JSON解析成功`);
          }
        } catch (jsonError) {
          console.log(`   ❌ JSON解析失败: ${jsonError.message}`);
          
          // 尝试获取响应文本来诊断问题
          try {
            const text = await response.clone().text();
            console.log(`   📄 实际响应内容: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            
            if (text.includes('<!DOCTYPE')) {
              console.log(`   🔍 诊断: 收到HTML响应而不是JSON`);
            }
          } catch (textError) {
            console.log(`   ❌ 无法读取响应内容: ${textError.message}`);
          }
          
          allPassed = false;
        }
      } else {
        // HTML响应
        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.log(`   ✅ 正确返回HTML响应`);
        } else {
          console.log(`   ⚠️  响应不是标准HTML格式`);
        }
      }

    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      allPassed = false;
    }
    
    console.log(''); // 空行分隔
  }

  // 测试中间件是否正确处理NextAuth路径
  console.log('🛡️  测试中间件对NextAuth路径的处理...');
  
  const authPaths = [
    '/api/auth/csrf',
    '/api/auth/session',
    '/api/auth/providers',
    '/api/auth/callback/credentials'
  ];

  for (const path of authPaths) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { 
        method: 'GET',
        redirect: 'manual' // 不自动跟随重定向
      });
      
      if (response.status === 307 || response.status === 302) {
        const location = response.headers.get('location');
        console.log(`   ⚠️  ${path} 被重定向到: ${location}`);
        allPassed = false;
      } else {
        console.log(`   ✅ ${path} 正常处理 (${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${path} 测试失败: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n🎉 NextAuth端点测试完成！');
  console.log(`\n📋 测试结果: ${allPassed ? '✅ 全部通过' : '❌ 存在问题'}`);
  
  if (!allPassed) {
    console.log('\n🔧 可能的解决方案:');
    console.log('   1. 检查middleware.ts是否正确处理/api/auth/*路径');
    console.log('   2. 确认NextAuth配置正确');
    console.log('   3. 验证API路由文件存在且正确导出');
    console.log('   4. 检查是否有其他中间件干扰');
  }

  return allPassed;
}

testNextAuthEndpoints();
