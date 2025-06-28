/**
 * 自动化测试经理账号登录
 * 使用正确的邮箱 simon@linghuaart.com
 */

const { chromium } = require('playwright');

async function testManagerLogin() {
  let browser;
  let page;
  
  try {
    console.log('=== 自动化测试经理账号登录 ===\n');

    // 启动浏览器
    console.log('1. 启动浏览器...');
    browser = await chromium.launch({ 
      headless: false, // 显示浏览器窗口
      slowMo: 1000 // 减慢操作速度以便观察
    });
    page = await browser.newPage();

    // 监听控制台日志
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ 浏览器错误: ${msg.text()}`);
      }
    });

    // 2. 访问登录页面
    console.log('2. 访问登录页面...');
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    // 3. 填写正确的登录信息
    console.log('3. 填写登录信息...');
    console.log('   邮箱: simon@linghuaart.com');
    console.log('   密码: Manager123456');

    // 等待表单元素加载
    await page.waitForSelector('input[name="identifier"]');
    await page.waitForSelector('input[name="password"]');

    // 清空并填写邮箱
    await page.fill('input[name="identifier"]', '');
    await page.fill('input[name="identifier"]', 'simon@linghuaart.com');

    // 清空并填写密码
    await page.fill('input[name="password"]', '');
    await page.fill('input[name="password"]', 'Manager123456');

    // 4. 提交登录表单
    console.log('4. 提交登录表单...');
    await page.click('button[type="submit"]');

    // 5. 等待登录结果
    console.log('5. 等待登录结果...');
    
    try {
      // 等待页面跳转或错误消息
      await page.waitForFunction(
        () => {
          // 检查是否跳转到dashboard
          if (window.location.pathname === '/dashboard') {
            return 'success';
          }
          // 检查是否有错误消息
          const errorElement = document.querySelector('[role="alert"]');
          if (errorElement) {
            return 'error';
          }
          // 检查是否仍在登录页面
          if (window.location.pathname === '/login') {
            return 'login';
          }
          return false;
        },
        { timeout: 10000 }
      );

      const currentUrl = page.url();
      console.log(`当前页面: ${currentUrl}`);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ 登录成功！已跳转到dashboard');
        
        // 检查用户信息
        await page.waitForSelector('body', { timeout: 5000 });
        const pageContent = await page.content();
        
        if (pageContent.includes('Simon') || pageContent.includes('经理')) {
          console.log('✅ 用户信息显示正确');
        } else {
          console.log('⚠️ 用户信息可能不正确');
        }
        
        return true;
      } else {
        console.log('❌ 登录失败，未跳转到dashboard');
        
        // 检查错误消息
        const errorElement = await page.$('[role="alert"]');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          console.log(`错误消息: ${errorText}`);
        }
        
        return false;
      }
    } catch (error) {
      console.log(`❌ 登录超时或出现错误: ${error.message}`);
      
      // 截图保存错误状态
      await page.screenshot({ path: 'login-error.png' });
      console.log('已保存错误截图: login-error.png');
      
      return false;
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 检查是否安装了playwright
async function checkPlaywright() {
  try {
    require('playwright');
    return true;
  } catch (error) {
    console.log('❌ 未安装 Playwright');
    console.log('请运行: npm install playwright');
    console.log('然后运行: npx playwright install');
    return false;
  }
}

// 主函数
async function main() {
  const hasPlaywright = await checkPlaywright();
  if (!hasPlaywright) {
    console.log('\n使用手动测试方法:');
    console.log('1. 打开浏览器访问: http://localhost:3001/login');
    console.log('2. 输入邮箱: simon@linghuaart.com');
    console.log('3. 输入密码: Manager123456');
    console.log('4. 点击登录按钮');
    console.log('5. 检查是否成功跳转到dashboard');
    return;
  }

  const success = await testManagerLogin();
  
  console.log('\n=== 测试结果 ===');
  if (success) {
    console.log('🎉 经理账号登录测试成功！');
    console.log('✅ 问题已解决：经理账号可以正常登录');
    console.log('✅ 使用正确邮箱: simon@linghuaart.com');
    console.log('✅ 密码验证通过: Manager123456');
  } else {
    console.log('❌ 经理账号登录测试失败');
    console.log('需要进一步调查问题原因');
  }
  
  console.log('\n=== 重要提醒 ===');
  console.log('📧 正确的经理邮箱: simon@linghuaart.com');
  console.log('❌ 错误的邮箱: simon@linghua.com');
  console.log('🔑 密码: Manager123456');
  console.log('请确保使用正确的邮箱地址进行登录！');
}

// 执行测试
main().catch(console.error);
