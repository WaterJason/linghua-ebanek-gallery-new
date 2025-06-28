async function testLoginAPI() {
  try {
    console.log('=== 详细登录API测试 ===\n');

    const baseUrl = 'http://localhost:3001';

    // 测试用户列表
    const testUsers = [
      { name: "超级管理员", identifier: "admin@linghua.com", password: "Admin123456" },
      { name: "经理账号", identifier: "simon@linghuaart.com", password: "Manager123456" },
    ];

    for (const user of testUsers) {
      console.log(`\n=== 测试 ${user.name} ===`);
      console.log(`邮箱: ${user.identifier}`);
      console.log(`密码: ${user.password}`);

      try {
        // 1. 获取CSRF Token
        console.log('\n1. 获取CSRF Token...');
        const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
        const csrfData = await csrfResponse.json();
        console.log(`CSRF Token: ${csrfData.csrfToken ? '已获取' : '获取失败'}`);

        if (!csrfData.csrfToken) {
          console.log('❌ 无法获取CSRF Token，跳过此用户');
          continue;
        }

        // 2. 发送登录请求
        console.log('\n2. 发送登录请求...');
        const loginData = new URLSearchParams({
          identifier: user.identifier,
          password: user.password,
          csrfToken: csrfData.csrfToken,
          callbackUrl: '/dashboard',
          redirect: 'false'
        });

        console.log('请求数据:', {
          identifier: user.identifier,
          hasPassword: !!user.password,
          hasCsrfToken: !!csrfData.csrfToken,
          csrfTokenLength: csrfData.csrfToken?.length
        });

        const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          body: loginData.toString(),
          redirect: 'manual'
        });

        console.log(`响应状态: ${loginResponse.status}`);
        console.log(`响应状态文本: ${loginResponse.statusText}`);

        // 3. 解析响应
        const responseText = await loginResponse.text();
        console.log('\n3. 响应内容:');

        try {
          const responseJson = JSON.parse(responseText);
          console.log('JSON响应:', responseJson);

          if (responseJson.url) {
            console.log(`✅ 登录成功，重定向URL: ${responseJson.url}`);
          } else if (responseJson.error) {
            console.log(`❌ 登录失败，错误: ${responseJson.error}`);
          } else {
            console.log('⚠️ 响应格式异常');
          }
        } catch (parseError) {
          console.log('响应不是JSON格式:');
          console.log(responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        }

        // 4. 检查Set-Cookie头
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        if (setCookieHeader) {
          console.log('\n4. Cookie设置:');
          console.log('Set-Cookie头存在，会话应该已建立');
        } else {
          console.log('\n4. ❌ 未设置Cookie，会话可能未建立');
        }

        // 5. 测试会话
        console.log('\n5. 测试会话...');
        const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
          headers: {
            'Cookie': setCookieHeader || ''
          }
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.user) {
            console.log(`✅ 会话有效，用户: ${sessionData.user.name} (${sessionData.user.email})`);
          } else {
            console.log('❌ 会话无效，用户未登录');
          }
        } else {
          console.log(`❌ 会话检查失败: ${sessionResponse.status}`);
        }

      } catch (error) {
        console.log(`❌ 测试 ${user.name} 时发生错误:`, error.message);
      }

      console.log('\n' + '='.repeat(50));
    }

    console.log('\n=== 测试完成 ===');
    console.log('请检查服务器日志中的NextAuth详细日志');
    console.log('查找以下标记的日志:');
    console.log('🔐 [NextAuth] - 认证流程日志');
    console.log('🚪 [NextAuth] - signIn回调日志');
    console.log('🎫 [NextAuth] - JWT回调日志');
    console.log('📋 [NextAuth] - Session回调日志');

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
testLoginAPI();
