const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseAuthSystem() {
  try {
    console.log('=== 认证系统诊断报告 ===\n');

    // 1. 检查用户表
    console.log('1. 检查用户表:');
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`   总用户数: ${users.length}`);
    
    if (users.length === 0) {
      console.log('   ❌ 没有找到任何用户！');
    } else {
      console.log('   用户列表:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || '未设置'} (${user.email || '未设置'})`);
        console.log(`      - ID: ${user.id}`);
        console.log(`      - 角色: ${user.role || '未设置'}`);
        console.log(`      - 密码: ${user.password ? '已设置' : '❌ 未设置'}`);
        console.log(`      - 创建时间: ${user.createdAt}`);
        console.log(`      - 最后登录: ${user.lastLogin || '从未登录'}`);
        if (user.userRoles && user.userRoles.length > 0) {
          console.log(`      - 分配的角色: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
        } else {
          console.log(`      - 分配的角色: 无`);
        }
        console.log('');
      });
    }

    // 2. 检查超级管理员账号
    console.log('2. 检查超级管理员账号:');
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
      console.log('   ❌ 超级管理员账号 (admin@linghua.com) 不存在！');
    } else {
      console.log('   ✅ 找到超级管理员账号:');
      console.log(`      - 姓名: ${adminUser.name}`);
      console.log(`      - 邮箱: ${adminUser.email}`);
      console.log(`      - 角色: ${adminUser.role}`);
      console.log(`      - 密码: ${adminUser.password ? '已设置' : '❌ 未设置'}`);
      console.log(`      - 创建时间: ${adminUser.createdAt}`);
      console.log(`      - 最后登录: ${adminUser.lastLogin || '从未登录'}`);
      
      if (adminUser.userRoles && adminUser.userRoles.length > 0) {
        console.log(`      - 分配的角色: ${adminUser.userRoles.map(ur => ur.role.name).join(', ')}`);
      } else {
        console.log(`      - 分配的角色: 无`);
      }
    }

    // 3. 检查角色表
    console.log('\n3. 检查角色表:');
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    console.log(`   总角色数: ${roles.length}`);
    if (roles.length === 0) {
      console.log('   ❌ 没有找到任何角色！');
    } else {
      console.log('   角色列表:');
      roles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.name} (${role.code})`);
        console.log(`      - 描述: ${role.description || '无'}`);
        console.log(`      - 系统角色: ${role.isSystem ? '是' : '否'}`);
        console.log(`      - 用户数: ${role._count.userRoles}`);
        console.log(`      - 权限数: ${role._count.rolePermissions}`);
        console.log('');
      });
    }

    // 4. 检查权限表
    console.log('4. 检查权限表:');
    const permissions = await prisma.permission.findMany();
    console.log(`   总权限数: ${permissions.length}`);
    
    if (permissions.length === 0) {
      console.log('   ❌ 没有找到任何权限！');
    } else {
      const moduleGroups = {};
      permissions.forEach(permission => {
        if (!moduleGroups[permission.module]) {
          moduleGroups[permission.module] = [];
        }
        moduleGroups[permission.module].push(permission);
      });

      console.log('   权限模块分布:');
      Object.keys(moduleGroups).forEach(module => {
        console.log(`   - ${module}: ${moduleGroups[module].length} 个权限`);
      });
    }

    // 5. 检查超级管理员权限
    console.log('\n5. 检查超级管理员权限:');
    const superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!superAdminRole) {
      console.log('   ❌ 超级管理员角色不存在！');
    } else {
      console.log(`   ✅ 超级管理员角色存在，拥有 ${superAdminRole.rolePermissions.length} 个权限`);
      console.log(`   总权限数: ${permissions.length}`);
      
      if (superAdminRole.rolePermissions.length < permissions.length) {
        console.log(`   ⚠️  缺少 ${permissions.length - superAdminRole.rolePermissions.length} 个权限`);
      } else {
        console.log('   ✅ 拥有所有权限');
      }
    }

    // 6. 测试密码验证
    console.log('\n6. 测试密码验证:');
    if (adminUser && adminUser.password) {
      // 测试常见密码
      const testPasswords = ['Admin123456', 'admin123', 'password', '123456', 'admin'];
      
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, adminUser.password);
          if (isMatch) {
            console.log(`   ✅ 密码匹配: "${testPassword}"`);
            break;
          }
        } catch (error) {
          console.log(`   ❌ 密码验证错误: ${error.message}`);
        }
      }
    } else {
      console.log('   ❌ 无法测试密码，用户不存在或密码未设置');
    }

    console.log('\n=== 诊断完成 ===');

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行诊断
diagnoseAuthSystem();
