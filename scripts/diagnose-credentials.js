const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseCredentials() {
  try {
    console.log('=== 用户凭证诊断 ===\n');

    // 1. 获取所有用户
    console.log('1. 获取所有用户数据...');
    const users = await prisma.user.findMany({
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`找到 ${users.length} 个用户:\n`);

    // 2. 测试每个用户的认证
    const testCredentials = [
      { identifier: 'admin@linghua.com', password: 'Admin123456' },
      { identifier: 'simon@linghuaart.com', password: 'Manager123456' },
    ];

    for (const testCred of testCredentials) {
      console.log(`\n=== 测试用户: ${testCred.identifier} ===`);
      
      // 查找用户（模拟NextAuth的查找逻辑）
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: testCred.identifier },
            { name: testCred.identifier }
          ]
        },
        include: {
          employee: true,
        },
      });

      if (!user) {
        console.log('❌ 用户不存在');
        continue;
      }

      console.log('✅ 用户找到:');
      console.log(`   ID: ${user.id}`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   员工ID: ${user.employeeId || '无'}`);
      console.log(`   密码哈希: ${user.password ? '已设置' : '❌ 未设置'}`);
      console.log(`   创建时间: ${user.createdAt}`);
      console.log(`   最后登录: ${user.lastLogin || '从未登录'}`);

      if (user.employee) {
        console.log(`   关联员工: ${user.employee.name} (${user.employee.position})`);
      } else {
        console.log(`   关联员工: 无`);
      }

      // 测试密码验证
      if (!user.password) {
        console.log('❌ 密码未设置，无法验证');
        continue;
      }

      console.log('\n密码验证测试:');
      try {
        const isPasswordMatch = await bcrypt.compare(testCred.password, user.password);
        
        if (isPasswordMatch) {
          console.log(`✅ 密码验证成功 (${testCred.password})`);
          
          // 模拟NextAuth返回的用户对象
          const authUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            employeeName: user.employee?.name || null,
            employeePosition: user.employee?.position || null,
          };
          
          console.log('NextAuth返回对象:');
          console.log(JSON.stringify(authUser, null, 2));
          
        } else {
          console.log(`❌ 密码验证失败 (尝试密码: ${testCred.password})`);
          
          // 尝试其他可能的密码
          const otherPasswords = ['password123', 'admin123', '123456', 'manager123'];
          console.log('尝试其他可能的密码:');
          
          for (const otherPassword of otherPasswords) {
            const otherMatch = await bcrypt.compare(otherPassword, user.password);
            if (otherMatch) {
              console.log(`✅ 找到正确密码: ${otherPassword}`);
              break;
            }
          }
        }
      } catch (error) {
        console.log(`❌ 密码验证过程出错: ${error.message}`);
      }

      // 检查用户角色权限
      console.log('\n用户角色权限:');
      if (user.userRoles && user.userRoles.length > 0) {
        user.userRoles.forEach(userRole => {
          console.log(`   - ${userRole.role.name} (${userRole.role.code})`);
        });
      } else {
        console.log('   ❌ 未分配任何角色');
      }
    }

    // 3. 检查密码哈希格式
    console.log('\n\n=== 密码哈希格式检查 ===');
    for (const user of users) {
      console.log(`\n用户: ${user.name} (${user.email})`);
      if (user.password) {
        console.log(`   密码哈希长度: ${user.password.length}`);
        console.log(`   哈希前缀: ${user.password.substring(0, 10)}...`);
        console.log(`   是否为bcrypt格式: ${user.password.startsWith('$2') ? '✅ 是' : '❌ 否'}`);
      } else {
        console.log('   ❌ 密码未设置');
      }
    }

    // 4. 生成诊断报告
    console.log('\n\n=== 诊断报告 ===');
    console.log('🔍 可能的问题原因:');
    console.log('   1. 密码哈希格式不正确');
    console.log('   2. 密码不匹配（用户使用了错误的密码）');
    console.log('   3. 用户数据不完整（缺少必要字段）');
    console.log('   4. bcrypt比较过程中出现错误');
    console.log('   5. NextAuth回调函数中的验证逻辑问题');
    
    console.log('\n💡 建议的修复步骤:');
    console.log('   1. 验证所有用户的密码哈希格式');
    console.log('   2. 重置有问题用户的密码');
    console.log('   3. 添加详细的认证日志');
    console.log('   4. 测试修复后的登录功能');

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行诊断
diagnoseCredentials();
