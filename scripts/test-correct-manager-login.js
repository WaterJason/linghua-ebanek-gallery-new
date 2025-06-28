/**
 * 测试正确的经理账号登录
 * 使用正确的邮箱 simon@linghuaart.com
 */

async function testCorrectManagerLogin() {
  try {
    console.log('=== 测试正确的经理账号登录 ===\n');

    const baseUrl = 'http://localhost:3001';
    
    // 1. 清除会话
    console.log('1. 清除当前会话...');
    await fetch(`${baseUrl}/api/auth/signout`, { method: 'POST' });
    console.log('   ✅ 会话已清除');

    // 2. 获取CSRF Token
    console.log('\n2. 获取CSRF Token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log(`   CSRF Token: ${csrfData.csrfToken ? '✅ 已获取' : '❌ 获取失败'}`);

    if (!csrfData.csrfToken) {
      console.log('❌ 无法获取CSRF Token，停止测试');
      return;
    }

    // 3. 测试正确的经理账号登录
    console.log('\n3. 测试经理账号登录...');
    
    const credentials = {
      identifier: 'simon@linghuaart.com', // 正确的邮箱
      password: 'Manager123456'
    };

    console.log('使用凭据:');
    console.log(`   邮箱: ${credentials.identifier}`);
    console.log(`   密码: ${credentials.password}`);

    const loginData = new URLSearchParams({
      identifier: credentials.identifier,
      password: credentials.password,
      csrfToken: csrfData.csrfToken,
      callbackUrl: '/dashboard',
      redirect: 'false'
    });

    console.log('\n发送登录请求...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: loginData.toString(),
      redirect: 'manual'
    });

    console.log(`响应状态: ${loginResponse.status} ${loginResponse.statusText}`);

    // 检查Set-Cookie头
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log(`Set-Cookie: ${setCookieHeader ? '✅ 已设置' : '❌ 未设置'}`);

    // 检查重定向
    const locationHeader = loginResponse.headers.get('location');
    console.log(`重定向到: ${locationHeader || '无'}`);

    if (loginResponse.status === 302) {
      console.log('✅ 登录请求成功（重定向）');
      
      // 检查会话
      console.log('\n4. 检查会话...');
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          'Cookie': setCookieHeader || ''
        }
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.user) {
          console.log(`✅ 会话建立成功: ${sessionData.user.name} (${sessionData.user.email})`);
          console.log(`用户角色: ${sessionData.user.role}`);
          console.log(`员工ID: ${sessionData.user.employeeId}`);
          console.log(`员工姓名: ${sessionData.user.employeeName}`);
          console.log(`员工职位: ${sessionData.user.employeePosition}`);
          
          console.log('\n🎉 经理账号登录测试成功！');
          
        } else {
          console.log('❌ 会话未建立，用户未登录');
        }
      } else {
        console.log(`❌ 会话检查失败: ${sessionResponse.status}`);
      }
    } else {
      console.log(`❌ 登录失败: ${loginResponse.status}`);
      const responseText = await loginResponse.text();
      console.log(`响应内容: ${responseText.substring(0, 200)}...`);
    }

    console.log('\n=== 测试结论 ===');
    console.log('如果看到"经理账号登录测试成功"，说明问题已解决。');
    console.log('如果仍然失败，请检查服务器日志中的NextAuth详细日志。');

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
testCorrectManagerLogin();
