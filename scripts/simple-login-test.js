const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginFlow() {
  try {
    console.log('=== 登录流程测试 ===\n');

    // 1. 验证用户数据
    console.log('1. 验证用户数据...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@linghua.com' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!adminUser) {
      console.log('❌ 超级管理员用户不存在');
      return;
    }

    console.log('✅ 找到超级管理员用户:', adminUser.name);
    console.log('   邮箱:', adminUser.email);
    console.log('   角色:', adminUser.role);
    console.log('   分配的角色:', adminUser.userRoles.map(ur => ur.role.name).join(', '));

    // 2. 验证密码
    console.log('\n2. 验证密码...');
    const testPassword = 'Admin123456';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
    
    if (isPasswordValid) {
      console.log('✅ 密码验证成功');
    } else {
      console.log('❌ 密码验证失败');
      return;
    }

    // 3. 模拟登录流程
    console.log('\n3. 模拟登录流程...');
    
    // 更新最后登录时间
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() }
    });

    // 记录登录历史
    await prisma.userLoginHistory.create({
      data: {
        userId: adminUser.id,
        ipAddress: "127.0.0.1",
        userAgent: "Test Script",
        loginTime: new Date(),
        status: "success"
      }
    });

    console.log('✅ 登录流程模拟成功');

    // 4. 检查权限
    console.log('\n4. 检查权限...');
    const userRoles = await prisma.userRole.findMany({
      where: { userId: adminUser.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    let totalPermissions = 0;
    userRoles.forEach(userRole => {
      totalPermissions += userRole.role.rolePermissions.length;
      console.log(`   角色 "${userRole.role.name}" 拥有 ${userRole.role.rolePermissions.length} 个权限`);
    });

    console.log(`   总权限数: ${totalPermissions}`);

    // 5. 生成登录指南
    console.log('\n=== 登录指南 ===');
    console.log('✅ 所有验证通过，登录功能应该正常工作');
    console.log('');
    console.log('请按以下步骤测试登录:');
    console.log('1. 打开浏览器访问: http://localhost:3001/login');
    console.log('2. 输入以下凭据:');
    console.log('   邮箱: admin@linghua.com');
    console.log('   密码: Admin123456');
    console.log('3. 点击登录按钮');
    console.log('4. 如果登录成功，应该会跳转到 /dashboard 页面');
    console.log('');
    console.log('如果仍然无法登录，请检查:');
    console.log('- 浏览器控制台是否有JavaScript错误');
    console.log('- 网络请求是否正常发送');
    console.log('- 开发服务器是否正常运行');

  } catch (error) {
    console.error('测试登录流程时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testLoginFlow();
