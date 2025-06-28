const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginCredentials() {
  try {
    console.log('=== 登录功能测试 ===\n');

    // 测试用户列表
    const testUsers = [
      {
        identifier: 'admin@linghua.com',
        password: 'Admin123456',
        description: '超级管理员账号'
      },
      {
        identifier: 'simon@linghuaart.com',
        password: 'Manager123456', // 重置后的密码
        description: '经理账号'
      }
    ];

    for (const testUser of testUsers) {
      console.log(`测试 ${testUser.description}: ${testUser.identifier}`);

      // 查找用户
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: testUser.identifier },
            { name: testUser.identifier }
          ]
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        console.log(`❌ 用户不存在: ${testUser.identifier}\n`);
        continue;
      }

      if (!user.password) {
        console.log(`❌ 用户密码未设置: ${testUser.identifier}\n`);
        continue;
      }

      // 测试密码
      try {
        const isPasswordMatch = await bcrypt.compare(testUser.password, user.password);

        if (isPasswordMatch) {
          console.log(`✅ 密码验证成功`);
          console.log(`   用户名: ${user.name}`);
          console.log(`   邮箱: ${user.email}`);
          console.log(`   角色: ${user.role}`);
          console.log(`   分配的角色: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
          console.log(`   登录状态: 可以正常登录\n`);
        } else {
          console.log(`❌ 密码验证失败`);
          console.log(`   尝试的密码: ${testUser.password}`);
          console.log(`   建议: 请检查密码是否正确或重置密码\n`);
        }
      } catch (error) {
        console.log(`❌ 密码验证过程出错: ${error.message}\n`);
      }
    }

    // 显示登录指南
    console.log('=== 登录指南 ===');
    console.log('1. 打开浏览器访问: http://localhost:3001/login');
    console.log('2. 使用以下凭据登录:');
    console.log('   超级管理员:');
    console.log('   - 邮箱: admin@linghua.com');
    console.log('   - 密码: Admin123456');
    console.log('');
    console.log('   经理账号:');
    console.log('   - 邮箱: simon@linghuaart.com');
    console.log('   - 密码: Manager123456');
    console.log('');
    console.log('3. 登录成功后将跳转到系统主页');
    console.log('4. 超级管理员拥有所有权限，可以管理整个系统');

  } catch (error) {
    console.error('测试登录功能时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testLoginCredentials();
