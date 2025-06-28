// 使用Node.js 18+的内置fetch

async function testLoginAPI() {
  try {
    console.log('=== 测试登录API ===\n');

    const baseUrl = 'http://localhost:3001';

    // 1. 获取CSRF Token
    console.log('1. 获取CSRF Token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token:', csrfData.csrfToken);

    // 2. 测试登录API
    console.log('\n2. 测试登录API...');
    const loginData = {
      identifier: 'admin@linghua.com',
      password: 'Admin123456',
      csrfToken: csrfData.csrfToken,
      callbackUrl: '/dashboard',
      json: true
    };

    console.log('发送登录请求:', {
      identifier: loginData.identifier,
      callbackUrl: loginData.callbackUrl
    });

    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: new URLSearchParams(loginData).toString()
    });

    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应头:', Object.fromEntries(loginResponse.headers.entries()));

    const loginResult = await loginResponse.text();
    console.log('登录响应内容:', loginResult);

    // 3. 检查会话
    console.log('\n3. 检查会话...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });

    const sessionData = await sessionResponse.json();
    console.log('会话数据:', sessionData);

    // 4. 测试受保护的页面
    console.log('\n4. 测试受保护的页面...');
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      },
      redirect: 'manual'
    });

    console.log('Dashboard响应状态:', dashboardResponse.status);
    console.log('Dashboard响应头:', Object.fromEntries(dashboardResponse.headers.entries()));

    if (dashboardResponse.status === 200) {
      console.log('✅ 登录成功，可以访问受保护的页面');
    } else if (dashboardResponse.status === 302) {
      console.log('🔄 重定向到:', dashboardResponse.headers.get('location'));
    } else {
      console.log('❌ 无法访问受保护的页面');
    }

  } catch (error) {
    console.error('测试登录API时发生错误:', error);
  }
}

// 执行测试
testLoginAPI();
