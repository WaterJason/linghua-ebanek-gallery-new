/**
 * 通过API验证经理账号登录
 * 使用正确的邮箱 simon@linghuaart.com
 */

const https = require('http');
const { URLSearchParams } = require('url');

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testManagerLoginAPI() {
  try {
    console.log('=== 通过API验证经理账号登录 ===\n');

    const baseUrl = 'localhost';
    const port = 3001;

    // 1. 获取CSRF Token
    console.log('1. 获取CSRF Token...');
    const csrfOptions = {
      hostname: baseUrl,
      port: port,
      path: '/api/auth/csrf',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const csrfResponse = await makeRequest(csrfOptions);
    console.log(`CSRF响应状态: ${csrfResponse.statusCode}`);

    if (csrfResponse.statusCode !== 200) {
      console.log('❌ 无法获取CSRF Token');
      return false;
    }

    const csrfData = JSON.parse(csrfResponse.body);
    const csrfToken = csrfData.csrfToken;
    console.log(`✅ CSRF Token获取成功: ${csrfToken ? '已获取' : '未获取'}`);

    if (!csrfToken) {
      console.log('❌ CSRF Token为空');
      return false;
    }

    // 2. 测试经理账号登录
    console.log('\n2. 测试经理账号登录...');
    
    const credentials = {
      identifier: 'simon@linghuaart.com', // 正确的邮箱
      password: 'Manager123456',
      csrfToken: csrfToken,
      callbackUrl: '/dashboard',
      redirect: 'false'
    };

    console.log('使用凭据:');
    console.log(`   邮箱: ${credentials.identifier}`);
    console.log(`   密码: ${credentials.password}`);

    const loginData = new URLSearchParams(credentials).toString();

    const loginOptions = {
      hostname: baseUrl,
      port: port,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    console.log('\n发送登录请求...');
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log(`登录响应状态: ${loginResponse.statusCode}`);
    console.log(`响应头: ${JSON.stringify(loginResponse.headers, null, 2)}`);

    // 检查响应
    if (loginResponse.statusCode === 200) {
      console.log('✅ 登录请求成功');
      
      // 检查响应内容
      try {
        const responseData = JSON.parse(loginResponse.body);
        console.log(`响应数据: ${JSON.stringify(responseData, null, 2)}`);
        
        if (responseData.url && responseData.url.includes('/dashboard')) {
          console.log('✅ 登录成功，应该重定向到dashboard');
          return true;
        } else if (responseData.error) {
          console.log(`❌ 登录失败: ${responseData.error}`);
          return false;
        }
      } catch (parseError) {
        console.log('响应不是JSON格式，检查原始响应:');
        console.log(loginResponse.body.substring(0, 500));
      }
    } else if (loginResponse.statusCode === 302) {
      console.log('✅ 登录成功（重定向响应）');
      const location = loginResponse.headers.location;
      console.log(`重定向到: ${location}`);
      
      if (location && location.includes('/dashboard')) {
        console.log('✅ 重定向到dashboard，登录成功');
        return true;
      } else if (location && location.includes('error=')) {
        console.log(`❌ 重定向到错误页面: ${location}`);
        return false;
      }
    } else {
      console.log(`❌ 登录失败，状态码: ${loginResponse.statusCode}`);
      console.log(`响应内容: ${loginResponse.body.substring(0, 500)}`);
      return false;
    }

    return false;

  } catch (error) {
    console.error('API测试过程中发生错误:', error);
    return false;
  }
}

// 主函数
async function main() {
  const success = await testManagerLoginAPI();
  
  console.log('\n=== API测试结果 ===');
  if (success) {
    console.log('🎉 经理账号API登录测试成功！');
    console.log('✅ 问题已解决：经理账号可以通过API正常登录');
    console.log('✅ 使用正确邮箱: simon@linghuaart.com');
    console.log('✅ 密码验证通过: Manager123456');
    console.log('✅ NextAuth认证流程正常');
  } else {
    console.log('❌ 经理账号API登录测试失败');
    console.log('需要检查服务器日志中的详细错误信息');
  }
  
  console.log('\n=== 重要提醒 ===');
  console.log('📧 正确的经理邮箱: simon@linghuaart.com');
  console.log('❌ 错误的邮箱: simon@linghua.com');
  console.log('🔑 密码: Manager123456');
  console.log('');
  console.log('如果API测试成功但浏览器登录失败，请检查:');
  console.log('1. 浏览器中输入的邮箱是否正确');
  console.log('2. 是否有JavaScript错误');
  console.log('3. 网络请求是否正常');
  
  console.log('\n=== 手动测试步骤 ===');
  console.log('1. 打开浏览器访问: http://localhost:3001/login');
  console.log('2. 确保输入正确邮箱: simon@linghuaart.com');
  console.log('3. 输入密码: Manager123456');
  console.log('4. 点击登录按钮');
  console.log('5. 检查服务器日志中的认证流程');
}

// 执行测试
main().catch(console.error);
