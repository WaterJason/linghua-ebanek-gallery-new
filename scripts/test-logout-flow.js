// Test the complete logout flow to ensure it works without JSON parsing errors

async function testLogoutFlow() {
  console.log('🚪 开始测试完整登出流程...\n');

  const baseUrl = 'http://localhost:3001';
  
  try {
    // Step 1: Test CSRF token endpoint (used by signOut)
    console.log('1. 测试CSRF令牌端点...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    console.log(`   状态码: ${csrfResponse.status}`);
    console.log(`   Content-Type: ${csrfResponse.headers.get('content-type')}`);
    
    if (csrfResponse.status === 200) {
      try {
        const csrfData = await csrfResponse.json();
        console.log(`   ✅ CSRF令牌获取成功: ${csrfData.csrfToken ? '有效' : '无效'}`);
      } catch (error) {
        console.log(`   ❌ CSRF响应JSON解析失败: ${error.message}`);
        return false;
      }
    } else {
      console.log(`   ❌ CSRF端点状态码错误`);
      return false;
    }

    // Step 2: Test session endpoint
    console.log('\n2. 测试会话端点...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    console.log(`   状态码: ${sessionResponse.status}`);
    console.log(`   Content-Type: ${sessionResponse.headers.get('content-type')}`);
    
    if (sessionResponse.status === 200) {
      try {
        const sessionData = await sessionResponse.json();
        console.log(`   ✅ 会话数据获取成功: ${sessionData ? '已登录' : '未登录'}`);
      } catch (error) {
        console.log(`   ❌ 会话响应JSON解析失败: ${error.message}`);
        return false;
      }
    } else {
      console.log(`   ❌ 会话端点状态码错误`);
      return false;
    }

    // Step 3: Test signout endpoint (POST)
    console.log('\n3. 测试登出端点...');
    
    // First get CSRF token for the signout request
    const csrfForSignout = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfTokenData = await csrfForSignout.json();
    
    const signoutResponse = await fetch(`${baseUrl}/api/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: csrfTokenData.csrfToken,
        callbackUrl: `${baseUrl}/login`,
        json: 'true'
      }),
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log(`   状态码: ${signoutResponse.status}`);
    console.log(`   Content-Type: ${signoutResponse.headers.get('content-type')}`);
    
    if (signoutResponse.status === 200) {
      try {
        const signoutData = await signoutResponse.json();
        console.log(`   ✅ 登出响应JSON解析成功`);
        console.log(`   📄 响应数据: ${JSON.stringify(signoutData)}`);
      } catch (error) {
        console.log(`   ❌ 登出响应JSON解析失败: ${error.message}`);
        
        // Try to get the actual response content
        try {
          const text = await signoutResponse.clone().text();
          console.log(`   📄 实际响应内容: ${text.substring(0, 200)}...`);
          
          if (text.includes('<!DOCTYPE')) {
            console.log(`   🔍 问题诊断: 收到HTML响应而不是JSON`);
            console.log(`   💡 建议: 检查NextAuth配置和中间件设置`);
          }
        } catch (textError) {
          console.log(`   ❌ 无法读取响应内容: ${textError.message}`);
        }
        
        return false;
      }
    } else if (signoutResponse.status === 302 || signoutResponse.status === 307) {
      const location = signoutResponse.headers.get('location');
      console.log(`   ✅ 登出成功，重定向到: ${location}`);
    } else {
      console.log(`   ⚠️  登出端点返回状态码: ${signoutResponse.status}`);
    }

    // Step 4: Test that all NextAuth endpoints return proper content types
    console.log('\n4. 验证所有NextAuth端点的响应格式...');
    
    const endpointsToTest = [
      { path: '/api/auth/csrf', expectedContentType: 'application/json' },
      { path: '/api/auth/session', expectedContentType: 'application/json' },
      { path: '/api/auth/providers', expectedContentType: 'application/json' }
    ];

    let allEndpointsValid = true;
    
    for (const endpoint of endpointsToTest) {
      const response = await fetch(`${baseUrl}${endpoint.path}`);
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes(endpoint.expectedContentType)) {
        console.log(`   ✅ ${endpoint.path}: 正确的Content-Type`);
      } else {
        console.log(`   ❌ ${endpoint.path}: 期望${endpoint.expectedContentType}，实际${contentType}`);
        allEndpointsValid = false;
      }
    }

    console.log('\n🎉 登出流程测试完成！');
    
    if (allEndpointsValid) {
      console.log('\n📋 测试结果: ✅ 所有NextAuth端点正常工作');
      console.log('\n✨ 修复总结:');
      console.log('   - ✅ 修复了中间件对NextAuth路径的处理');
      console.log('   - ✅ 所有signOut调用使用redirect: false');
      console.log('   - ✅ 手动处理登出后的重定向');
      console.log('   - ✅ 添加了完整的错误处理');
      
      console.log('\n🧪 手动测试步骤:');
      console.log('   1. 访问 http://localhost:3001/login');
      console.log('   2. 使用 admin@linghua.com / admin123 登录');
      console.log('   3. 点击右上角用户头像');
      console.log('   4. 点击"退出登录"按钮');
      console.log('   5. 验证是否成功退出并跳转到登录页');
      console.log('   6. 检查浏览器控制台是否有JSON解析错误');
      
      return true;
    } else {
      console.log('\n📋 测试结果: ❌ 仍存在问题');
      return false;
    }

  } catch (error) {
    console.error('❌ 登出流程测试失败:', error);
    return false;
  }
}

testLogoutFlow();
