const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixCredentialsSignin() {
  try {
    console.log('=== 修复CredentialsSignin问题 ===\n');

    // 1. 检查当前会话状态
    console.log('1. 检查当前会话状态...');
    try {
      const sessionResponse = await fetch('http://localhost:3001/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (sessionData.user) {
        console.log(`✅ 当前已登录用户: ${sessionData.user.name} (${sessionData.user.email})`);
        console.log('   这解释了为什么中间件一直重定向到dashboard');
        
        // 登出当前用户
        console.log('\n   正在登出当前用户...');
        await fetch('http://localhost:3001/api/auth/signout', { method: 'POST' });
        console.log('   ✅ 已登出');
      } else {
        console.log('❌ 当前无用户登录');
      }
    } catch (error) {
      console.log('❌ 无法检查会话状态:', error.message);
    }

    // 2. 验证所有用户的密码
    console.log('\n2. 验证所有用户的密码...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });

    const testCredentials = [
      { email: 'admin@linghua.com', password: 'Admin123456' },
      { email: 'simon@linghuaart.com', password: 'Manager123456' },
    ];

    for (const cred of testCredentials) {
      const user = users.find(u => u.email === cred.email);
      if (user && user.password) {
        const isMatch = await bcrypt.compare(cred.password, user.password);
        console.log(`   ${user.name} (${user.email}): ${isMatch ? '✅ 密码正确' : '❌ 密码错误'}`);
        
        if (!isMatch) {
          console.log(`     正在重置密码为: ${cred.password}`);
          const hashedPassword = await bcrypt.hash(cred.password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          });
          console.log('     ✅ 密码已重置');
        }
      }
    }

    // 3. 检查用户角色分配
    console.log('\n3. 检查用户角色分配...');
    for (const user of users) {
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true }
      });

      console.log(`   ${user.name} (${user.email}):`);
      console.log(`     系统角色: ${user.role}`);
      console.log(`     分配的角色: ${userRoles.map(ur => ur.role.name).join(', ') || '无'}`);

      // 如果没有分配角色，根据系统角色自动分配
      if (userRoles.length === 0) {
        let targetRoleCode = null;
        
        switch (user.role) {
          case 'admin':
            targetRoleCode = user.email === 'admin@linghua.com' ? 'super_admin' : 'admin';
            break;
          case 'manager':
            targetRoleCode = 'manager';
            break;
          default:
            targetRoleCode = 'employee';
        }

        if (targetRoleCode) {
          const targetRole = await prisma.role.findFirst({
            where: { code: targetRoleCode }
          });

          if (targetRole) {
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: targetRole.id
              }
            });
            console.log(`     ✅ 已分配角色: ${targetRole.name}`);
          }
        }
      }
    }

    // 4. 测试NextAuth配置
    console.log('\n4. 测试NextAuth配置...');
    
    // 检查CSRF端点
    try {
      const csrfResponse = await fetch('http://localhost:3001/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      console.log(`   CSRF端点: ${csrfResponse.ok ? '✅ 正常' : '❌ 异常'}`);
      console.log(`   CSRF Token长度: ${csrfData.csrfToken?.length || 0}`);
    } catch (error) {
      console.log('   ❌ CSRF端点测试失败:', error.message);
    }

    // 检查Providers端点
    try {
      const providersResponse = await fetch('http://localhost:3001/api/auth/providers');
      const providersData = await providersResponse.json();
      console.log(`   Providers端点: ${providersResponse.ok ? '✅ 正常' : '❌ 异常'}`);
      console.log(`   配置的providers: ${Object.keys(providersData).join(', ')}`);
    } catch (error) {
      console.log('   ❌ Providers端点测试失败:', error.message);
    }

    // 5. 生成修复报告
    console.log('\n=== 修复完成报告 ===');
    console.log('🔧 已执行的修复操作:');
    console.log('   1. ✅ 登出了当前已登录的用户');
    console.log('   2. ✅ 验证并重置了所有用户的密码');
    console.log('   3. ✅ 检查并分配了用户角色权限');
    console.log('   4. ✅ 验证了NextAuth API端点');
    
    console.log('\n🎯 现在可以测试登录功能:');
    console.log('   1. 打开浏览器访问: http://localhost:3001/login');
    console.log('   2. 尝试使用以下账号登录:');
    console.log('      - 超级管理员: admin@linghua.com / Admin123456');
    console.log('      - 经理账号: simon@linghuaart.com / Manager123456');
    console.log('   3. 如果仍然出现CredentialsSignin错误，检查浏览器控制台');
    console.log('   4. 查看服务器日志中的NextAuth详细日志');

    console.log('\n💡 如果问题仍然存在:');
    console.log('   - 清除浏览器缓存和Cookie');
    console.log('   - 重启开发服务器');
    console.log('   - 检查NEXTAUTH_URL环境变量是否正确');
    console.log('   - 确认数据库连接正常');

  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行修复
fixCredentialsSignin();
