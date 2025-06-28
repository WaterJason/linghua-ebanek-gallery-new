/**
 * 诊断经理账号登录问题
 * 详细检查simon@linghuaart.com账号的状态
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseManagerLogin() {
  try {
    console.log('=== 诊断经理账号登录问题 ===\n');

    // 1. 检查经理账号数据
    console.log('1. 检查经理账号数据...');
    const managerUser = await prisma.user.findFirst({
      where: {
        email: 'simon@linghuaart.com'
      },
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!managerUser) {
      console.log('❌ 经理账号不存在！');
      return;
    }

    console.log('✅ 经理账号找到:');
    console.log('   ID:', managerUser.id);
    console.log('   姓名:', managerUser.name);
    console.log('   邮箱:', managerUser.email);
    console.log('   角色:', managerUser.role);
    console.log('   员工ID:', managerUser.employeeId);
    console.log('   密码哈希:', managerUser.password ? '已设置' : '❌ 未设置');
    console.log('   创建时间:', managerUser.createdAt);
    console.log('   最后登录:', managerUser.lastLogin || '从未登录');

    if (managerUser.employee) {
      console.log('   关联员工:', managerUser.employee.name, '(' + managerUser.employee.position + ')');
    } else {
      console.log('   关联员工: 无');
    }

    console.log('   分配的角色:');
    if (managerUser.userRoles && managerUser.userRoles.length > 0) {
      managerUser.userRoles.forEach(userRole => {
        console.log(`     - ${userRole.role.name} (${userRole.role.code})`);
      });
    } else {
      console.log('     ❌ 未分配任何角色');
    }

    // 2. 测试密码验证
    console.log('\n2. 测试密码验证...');
    const testPassword = 'Manager123456';
    
    if (!managerUser.password) {
      console.log('❌ 用户密码未设置，无法验证');
      
      // 重新设置密码
      console.log('正在重新设置密码...');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await prisma.user.update({
        where: { id: managerUser.id },
        data: { password: hashedPassword }
      });
      console.log('✅ 密码已重新设置');
      
      // 重新获取用户数据
      const updatedUser = await prisma.user.findUnique({
        where: { id: managerUser.id }
      });
      managerUser.password = updatedUser.password;
    }

    const isPasswordMatch = await bcrypt.compare(testPassword, managerUser.password);
    console.log(`密码验证结果: ${isPasswordMatch ? '✅ 成功' : '❌ 失败'}`);
    
    if (!isPasswordMatch) {
      console.log('密码不匹配，正在重新设置...');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await prisma.user.update({
        where: { id: managerUser.id },
        data: { password: hashedPassword }
      });
      console.log('✅ 密码已重新设置为:', testPassword);
    }

    // 3. 对比超级管理员账号
    console.log('\n3. 对比超级管理员账号...');
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@linghua.com'
      },
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (adminUser) {
      console.log('超级管理员账号:');
      console.log('   ID:', adminUser.id);
      console.log('   姓名:', adminUser.name);
      console.log('   邮箱:', adminUser.email);
      console.log('   角色:', adminUser.role);
      console.log('   员工ID:', adminUser.employeeId);
      console.log('   密码哈希:', adminUser.password ? '已设置' : '❌ 未设置');
      
      // 测试管理员密码
      const adminPasswordMatch = await bcrypt.compare('Admin123456', adminUser.password);
      console.log(`   密码验证: ${adminPasswordMatch ? '✅ 成功' : '❌ 失败'}`);
      
      console.log('   分配的角色:');
      if (adminUser.userRoles && adminUser.userRoles.length > 0) {
        adminUser.userRoles.forEach(userRole => {
          console.log(`     - ${userRole.role.name} (${userRole.role.code})`);
        });
      } else {
        console.log('     ❌ 未分配任何角色');
      }
    }

    // 4. 检查数据差异
    console.log('\n4. 检查数据差异...');
    const differences = [];
    
    if (managerUser.role !== adminUser.role) {
      differences.push(`角色不同: 经理(${managerUser.role}) vs 管理员(${adminUser.role})`);
    }
    
    if ((managerUser.employeeId === null) !== (adminUser.employeeId === null)) {
      differences.push(`员工关联不同: 经理(${managerUser.employeeId}) vs 管理员(${adminUser.employeeId})`);
    }
    
    if (managerUser.userRoles.length !== adminUser.userRoles.length) {
      differences.push(`角色数量不同: 经理(${managerUser.userRoles.length}) vs 管理员(${adminUser.userRoles.length})`);
    }

    if (differences.length > 0) {
      console.log('发现的差异:');
      differences.forEach(diff => console.log(`   - ${diff}`));
    } else {
      console.log('✅ 两个账号的基本结构相同');
    }

    // 5. 模拟NextAuth认证流程
    console.log('\n5. 模拟NextAuth认证流程...');
    
    const credentials = {
      identifier: 'simon@linghuaart.com',
      password: 'Manager123456'
    };

    console.log('模拟认证输入:');
    console.log('   identifier:', credentials.identifier);
    console.log('   password:', credentials.password);

    // 模拟查找用户
    const foundUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: credentials.identifier },
          { name: credentials.identifier }
        ]
      },
      include: {
        employee: true,
      },
    });

    if (!foundUser) {
      console.log('❌ 模拟认证: 用户未找到');
      return;
    }

    console.log('✅ 模拟认证: 用户找到');

    if (!foundUser.password) {
      console.log('❌ 模拟认证: 密码未设置');
      return;
    }

    console.log('✅ 模拟认证: 密码已设置');

    const passwordMatch = await bcrypt.compare(credentials.password, foundUser.password);
    if (!passwordMatch) {
      console.log('❌ 模拟认证: 密码验证失败');
      return;
    }

    console.log('✅ 模拟认证: 密码验证成功');

    // 构建返回对象
    const authUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      employeeId: foundUser.employeeId,
      employeeName: foundUser.employee?.name || null,
      employeePosition: foundUser.employee?.position || null,
    };

    console.log('✅ 模拟认证: 应该返回的用户对象:');
    console.log(JSON.stringify(authUser, null, 2));

    console.log('\n=== 诊断结论 ===');
    console.log('经理账号数据完整，密码正确，模拟认证应该成功。');
    console.log('如果仍然出现CredentialsSignin错误，问题可能在于:');
    console.log('1. NextAuth配置中的特殊验证逻辑');
    console.log('2. 中间件或其他认证拦截');
    console.log('3. 会话管理问题');
    console.log('4. CSRF Token验证问题');

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行诊断
diagnoseManagerLogin();
