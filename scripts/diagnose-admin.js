const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnoseAdmin() {
  try {
    console.log('🔍 开始诊断超级管理员账号状态...\n');

    // 1. 检查admin@linghua.com用户是否存在
    console.log('1. 检查用户账号状态:');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@linghua.com' },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        employee: true
      }
    });

    if (!adminUser) {
      console.log('❌ 用户不存在: admin@linghua.com');
      return { userExists: false };
    }

    console.log('✅ 用户存在:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      hasPassword: !!adminUser.password,
      passwordLength: adminUser.password?.length || 0,
      lastLogin: adminUser.lastLogin,
      employeeId: adminUser.employeeId,
      createdAt: adminUser.createdAt
    });

    // 2. 验证密码哈希
    console.log('\n2. 验证密码状态:');
    if (!adminUser.password) {
      console.log('❌ 密码未设置');
      return { userExists: true, passwordSet: false };
    }

    // 测试密码 Admin123456
    const testPassword = 'Admin123456';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
    console.log(`密码验证 (${testPassword}):`, isPasswordValid ? '✅ 正确' : '❌ 错误');

    // 3. 检查角色分配
    console.log('\n3. 检查角色分配:');
    console.log('用户角色数量:', adminUser.userRoles.length);
    
    if (adminUser.userRoles.length === 0) {
      console.log('❌ 用户没有分配任何角色');
    } else {
      adminUser.userRoles.forEach((userRole, index) => {
        console.log(`角色 ${index + 1}:`, {
          roleId: userRole.role.id,
          roleName: userRole.role.name,
          roleCode: userRole.role.code,
          isSystem: userRole.role.isSystem,
          permissionCount: userRole.role.rolePermissions.length
        });
      });
    }

    // 4. 检查权限
    console.log('\n4. 检查权限状态:');
    const allPermissions = [];
    adminUser.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => {
        allPermissions.push(rp.permission);
      });
    });

    console.log('总权限数量:', allPermissions.length);
    const hasSuperPermission = allPermissions.some(p => p.code === '*');
    console.log('是否有超级权限 (*):', hasSuperPermission ? '✅ 是' : '❌ 否');

    // 5. 检查系统角色
    console.log('\n5. 检查系统角色状态:');
    const systemRoles = await prisma.role.findMany({
      where: { isSystem: true },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log('系统角色数量:', systemRoles.length);
    systemRoles.forEach(role => {
      console.log(`- ${role.name} (${role.code}): ${role.rolePermissions.length} 权限`);
    });

    // 6. 检查权限表
    console.log('\n6. 检查权限表状态:');
    const permissionCount = await prisma.permission.count();
    console.log('权限总数:', permissionCount);

    const superPermission = await prisma.permission.findUnique({
      where: { code: '*' }
    });
    console.log('超级权限 (*) 存在:', superPermission ? '✅ 是' : '❌ 否');

    return {
      userExists: true,
      passwordSet: true,
      passwordValid: isPasswordValid,
      rolesCount: adminUser.userRoles.length,
      permissionsCount: allPermissions.length,
      hasSuperPermission,
      systemRolesCount: systemRoles.length,
      totalPermissions: permissionCount
    };

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
    return { error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// 执行诊断
diagnoseAdmin().then(result => {
  console.log('\n📊 诊断结果摘要:', result);
});
