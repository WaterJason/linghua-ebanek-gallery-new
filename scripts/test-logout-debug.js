// Debug logout functionality issues

async function testLogoutDebug() {
  console.log('🔍 开始调试登出功能...\n');

  const baseUrl = 'http://localhost:3001';
  
  try {
    // 1. Test if we can get a session first
    console.log('1. 检查当前会话状态...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    const sessionData = await sessionResponse.json();
    console.log(`   会话状态: ${sessionData ? '已登录' : '未登录'}`);
    if (sessionData) {
      console.log(`   用户信息: ${JSON.stringify(sessionData)}`);
    }

    // 2. Test CSRF token endpoint
    console.log('\n2. 测试CSRF令牌端点...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    console.log(`   状态码: ${csrfResponse.status}`);
    console.log(`   Content-Type: ${csrfResponse.headers.get('content-type')}`);
    
    if (csrfResponse.status === 200) {
      try {
        const csrfData = await csrfResponse.json();
        console.log(`   ✅ CSRF令牌: ${csrfData.csrfToken ? '获取成功' : '获取失败'}`);
        
        // 3. Test signout endpoint with proper CSRF token
        console.log('\n3. 测试登出端点...');
        const signoutResponse = await fetch(`${baseUrl}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            csrfToken: csrfData.csrfToken,
            callbackUrl: `${baseUrl}/login`,
            json: 'true'
          }),
          redirect: 'manual'
        });

        console.log(`   登出状态码: ${signoutResponse.status}`);
        console.log(`   Content-Type: ${signoutResponse.headers.get('content-type')}`);
        
        if (signoutResponse.status === 200) {
          try {
            const signoutData = await signoutResponse.json();
            console.log(`   ✅ 登出响应: ${JSON.stringify(signoutData)}`);
          } catch (error) {
            console.log(`   ⚠️  登出响应不是JSON格式`);
          }
        } else if (signoutResponse.status === 302 || signoutResponse.status === 307) {
          const location = signoutResponse.headers.get('location');
          console.log(`   ✅ 登出重定向到: ${location}`);
        }

      } catch (error) {
        console.log(`   ❌ CSRF令牌解析失败: ${error.message}`);
      }
    }

    // 4. Test NextAuth providers endpoint
    console.log('\n4. 测试NextAuth提供者端点...');
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    console.log(`   状态码: ${providersResponse.status}`);
    if (providersResponse.status === 200) {
      const providersData = await providersResponse.json();
      console.log(`   ✅ 提供者配置: ${Object.keys(providersData).join(', ')}`);
    }

    // 5. Test if middleware is interfering
    console.log('\n5. 测试中间件干扰...');
    const authPaths = [
      '/api/auth/session',
      '/api/auth/csrf',
      '/api/auth/signout',
      '/api/auth/providers'
    ];

    for (const path of authPaths) {
      const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
      if (response.status === 302 || response.status === 307) {
        console.log(`   ❌ ${path} 被中间件重定向`);
      } else {
        console.log(`   ✅ ${path} 正常访问 (${response.status})`);
      }
    }

    // 6. Test profile page
    console.log('\n6. 测试个人资料页面...');
    const profileResponse = await fetch(`${baseUrl}/profile`, { redirect: 'manual' });
    console.log(`   个人资料页面状态码: ${profileResponse.status}`);
    if (profileResponse.status === 404) {
      console.log(`   ❌ 个人资料页面不存在 (404)`);
    } else if (profileResponse.status === 302 || profileResponse.status === 307) {
      const location = profileResponse.headers.get('location');
      console.log(`   ⚠️  个人资料页面重定向到: ${location}`);
    } else {
      console.log(`   ✅ 个人资料页面存在`);
    }

    console.log('\n🎉 登出功能调试完成！');
    
    console.log('\n📋 问题诊断:');
    console.log('   1. 检查浏览器控制台是否有JavaScript错误');
    console.log('   2. 验证NextAuth配置是否正确');
    console.log('   3. 确认中间件没有干扰NextAuth路径');
    console.log('   4. 检查个人资料页面是否存在');
    
    console.log('\n🔧 建议修复步骤:');
    console.log('   1. 创建缺失的个人资料页面');
    console.log('   2. 检查登出按钮的事件绑定');
    console.log('   3. 验证signOut函数调用是否正确');
    console.log('   4. 测试不同组件中的登出功能');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

testLogoutDebug();
