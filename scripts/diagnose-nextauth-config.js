const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseNextAuthConfig() {
  try {
    console.log('=== NextAuth配置诊断 ===\n');

    // 1. 检查环境变量
    console.log('1. 检查环境变量...');
    const requiredEnvVars = {
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
      'DATABASE_URL': process.env.DATABASE_URL,
      'NODE_ENV': process.env.NODE_ENV
    };

    let envVarsOk = true;
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: ${key === 'NEXTAUTH_SECRET' || key === 'DATABASE_URL' ? '已设置' : value}`);
      } else {
        console.log(`   ❌ ${key}: 未设置`);
        envVarsOk = false;
      }
    });

    // 2. 检查NextAuth URL是否匹配当前端口
    console.log('\n2. 检查NextAuth URL配置...');
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl) {
      console.log(`   配置的URL: ${nextAuthUrl}`);
      
      // 检查是否匹配当前运行的端口
      if (nextAuthUrl.includes('localhost:3002')) {
        console.log('   ✅ URL配置正确，匹配当前端口3002');
      } else if (nextAuthUrl.includes('localhost:3001')) {
        console.log('   ⚠️  URL配置为端口3001，但当前可能运行在3002');
      } else if (nextAuthUrl.includes('localhost:3000')) {
        console.log('   ⚠️  URL配置为端口3000，但当前可能运行在3002');
      } else {
        console.log('   ❌ URL配置可能不正确');
      }
    }

    // 3. 测试数据库连接
    console.log('\n3. 测试数据库连接...');
    try {
      await prisma.$connect();
      console.log('   ✅ 数据库连接正常');
      
      // 测试用户查询
      const userCount = await prisma.user.count();
      console.log(`   ✅ 用户表查询正常，共 ${userCount} 个用户`);
    } catch (error) {
      console.log(`   ❌ 数据库连接失败: ${error.message}`);
      envVarsOk = false;
    }

    // 4. 检查NextAuth API端点
    console.log('\n4. 检查NextAuth API端点...');
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    
    try {
      // 检查providers端点
      const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
      if (providersResponse.ok) {
        const providers = await providersResponse.json();
        console.log('   ✅ Providers端点正常');
        console.log(`   配置的providers: ${Object.keys(providers).join(', ')}`);
      } else {
        console.log(`   ❌ Providers端点错误: ${providersResponse.status}`);
      }

      // 检查CSRF端点
      const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
      if (csrfResponse.ok) {
        const csrf = await csrfResponse.json();
        console.log('   ✅ CSRF端点正常');
        console.log(`   CSRF Token: ${csrf.csrfToken ? '已生成' : '未生成'}`);
      } else {
        console.log(`   ❌ CSRF端点错误: ${csrfResponse.status}`);
      }

      // 检查session端点
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('   ✅ Session端点正常');
        console.log(`   当前会话: ${session.user ? '已登录' : '未登录'}`);
      } else {
        console.log(`   ❌ Session端点错误: ${sessionResponse.status}`);
      }

    } catch (error) {
      console.log(`   ❌ API端点测试失败: ${error.message}`);
    }

    // 5. 生成诊断报告
    console.log('\n=== 诊断报告 ===');
    
    if (envVarsOk) {
      console.log('✅ 基础配置正常');
    } else {
      console.log('❌ 基础配置存在问题');
    }

    console.log('\n🔧 可能的"Configuration"错误原因:');
    console.log('   1. NEXTAUTH_URL与实际运行端口不匹配');
    console.log('   2. NEXTAUTH_SECRET未设置或过短');
    console.log('   3. 数据库连接问题');
    console.log('   4. NextAuth API路由问题');
    console.log('   5. 中间件配置冲突');

    console.log('\n🚀 建议的修复步骤:');
    console.log('   1. 确保NEXTAUTH_URL正确设置为当前运行端口');
    console.log('   2. 重启开发服务器以应用环境变量更改');
    console.log('   3. 清理浏览器缓存和Cookie');
    console.log('   4. 检查中间件是否正确处理NextAuth路径');

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行诊断
diagnoseNextAuthConfig();
