/**
 * 完整的登录测试脚本
 * 彻底解决CredentialsSignin问题
 */

async function testLoginComplete() {
  try {
    console.log('=== 完整登录测试 ===\n');

    const baseUrl = 'http://localhost:3000';
    
    // 1. 清除所有会话
    console.log('1. 清除所有会话...');
    try {
      await fetch(`${baseUrl}/api/auth/signout`, { method: 'POST' });
      console.log('   ✅ 会话已清除');
    } catch (error) {
      console.log('   ⚠️ 清除会话失败:', error.message);
    }

    // 2. 测试CSRF调试端点
    console.log('\n2. 测试CSRF调试端点...');
    try {
      const debugResponse = await fetch(`${baseUrl}/api/auth/debug-csrf`);
      const debugData = await debugResponse.json();
      console.log('   ✅ CSRF调试端点正常');
      console.log('   环境变量:', debugData.debug.envVars);
    } catch (error) {
      console.log('   ❌ CSRF调试端点失败:', error.message);
    }

    // 3. 获取CSRF Token
    console.log('\n3. 获取CSRF Token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log(`   CSRF Token: ${csrfData.csrfToken ? '✅ 已获取' : '❌ 获取失败'}`);
    console.log(`   Token长度: ${csrfData.csrfToken?.length || 0}`);

    if (!csrfData.csrfToken) {
      console.log('❌ 无法获取CSRF Token，停止测试');
      return;
    }

    // 4. 测试用户登录
    console.log('\n4. 测试用户登录...');
    
    const testUsers = [
      { name: "超级管理员", email: "admin@linghua.com", password: "Admin123456" },
      { name: "经理账号", email: "simon@linghuaart.com", password: "Manager123456" },
    ];

    for (const user of testUsers) {
      console.log(`\n   === 测试 ${user.name} (${user.email}) ===`);
      
      try {
        // 准备登录数据
        const loginData = new URLSearchParams({
          identifier: user.email,
          password: user.password,
          csrfToken: csrfData.csrfToken,
          callbackUrl: '/dashboard',
          redirect: 'false'
        });

        console.log('   发送登录请求...');
        console.log('   请求数据:', {
          identifier: user.email,
          hasPassword: !!user.password,
          hasCsrfToken: !!csrfData.csrfToken,
          csrfTokenLength: csrfData.csrfToken.length
        });

        // 发送登录请求
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

        console.log(`   响应状态: ${loginResponse.status} ${loginResponse.statusText}`);
        
        // 检查响应头
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        console.log(`   Set-Cookie: ${setCookieHeader ? '✅ 已设置' : '❌ 未设置'}`);
        
        // 检查重定向
        const locationHeader = loginResponse.headers.get('location');
        console.log(`   重定向到: ${locationHeader || '无'}`);
        
        // 解析响应
        const responseText = await loginResponse.text();
        console.log(`   响应长度: ${responseText.length} 字符`);
        
        if (loginResponse.status === 302) {
          console.log('   ✅ 登录请求成功（重定向）');
          
          // 检查会话
          console.log('   检查会话...');
          const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
            headers: {
              'Cookie': setCookieHeader || ''
            }
          });
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData.user) {
              console.log(`   ✅ 会话建立成功: ${sessionData.user.name} (${sessionData.user.email})`);
              console.log(`   用户角色: ${sessionData.user.role}`);
              
              // 登出以便测试下一个用户
              await fetch(`${baseUrl}/api/auth/signout`, { 
                method: 'POST',
                headers: {
                  'Cookie': setCookieHeader || ''
                }
              });
              console.log('   ✅ 已登出，准备测试下一个用户');
            } else {
              console.log('   ❌ 会话未建立，用户未登录');
            }
          } else {
            console.log(`   ❌ 会话检查失败: ${sessionResponse.status}`);
          }
        } else {
          console.log(`   ❌ 登录失败: ${loginResponse.status}`);
          if (responseText.includes('MissingCSRF')) {
            console.log('   ❌ CSRF Token验证失败');
          } else if (responseText.includes('CredentialsSignin')) {
            console.log('   ❌ 凭证验证失败');
          }
          console.log(`   响应内容: ${responseText.substring(0, 200)}...`);
        }

      } catch (error) {
        console.log(`   ❌ 测试异常: ${error.message}`);
      }
    }

    // 5. 生成测试报告
    console.log('\n=== 测试完成报告 ===');
    console.log('🔧 修复内容:');
    console.log('   1. ✅ 优化了NextAuth v5配置');
    console.log('   2. ✅ 添加了详细的认证日志');
    console.log('   3. ✅ 配置了正确的Cookie设置');
    console.log('   4. ✅ 添加了CSRF调试端点');
    console.log('   5. ✅ 设置了正确的环境变量');
    
    console.log('\n🎯 下一步操作:');
    console.log('   1. 查看服务器日志中的NextAuth详细日志');
    console.log('   2. 在浏览器中测试登录: http://localhost:3000/login');
    console.log('   3. 使用以下凭据:');
    console.log('      - 超级管理员: admin@linghua.com / Admin123456');
    console.log('      - 经理账号: simon@linghuaart.com / Manager123456');
    
    console.log('\n💡 如果仍有问题:');
    console.log('   - 检查服务器日志中的🔐 [NextAuth]标记');
    console.log('   - 确认CSRF Token是否正确传递');
    console.log('   - 验证Cookie设置是否正确');

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
testLoginComplete();
