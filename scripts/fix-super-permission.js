const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSuperPermission() {
  try {
    console.log('🔧 开始修复超级权限...\n');

    // 1. 检查是否存在超级权限 *
    let superPermission = await prisma.permission.findUnique({
      where: { code: '*' }
    });

    if (!superPermission) {
      console.log('创建超级权限 (*)...');
      superPermission = await prisma.permission.create({
        data: {
          name: '所有权限',
          code: '*',
          module: 'system',
          description: '拥有系统所有权限的超级权限'
        }
      });
      console.log('✅ 超级权限创建成功');
    } else {
      console.log('✅ 超级权限已存在');
    }

    // 2. 查找超级管理员角色
    const superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('❌ 未找到超级管理员角色');
      return;
    }

    // 3. 检查超级管理员角色是否有超级权限
    const existingRolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: superAdminRole.id,
        permissionId: superPermission.id
      }
    });

    if (!existingRolePermission) {
      console.log('为超级管理员角色分配超级权限...');
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: superPermission.id
        }
      });
      console.log('✅ 超级权限已分配给超级管理员角色');
    } else {
      console.log('✅ 超级管理员角色已有超级权限');
    }

    // 4. 验证admin@linghua.com用户现在的权限
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
        }
      }
    });

    if (adminUser) {
      const allPermissions = [];
      adminUser.userRoles.forEach(userRole => {
        userRole.role.rolePermissions.forEach(rp => {
          allPermissions.push(rp.permission);
        });
      });

      const hasSuperPermission = allPermissions.some(p => p.code === '*');
      console.log('\n📊 验证结果:');
      console.log('用户权限总数:', allPermissions.length);
      console.log('是否有超级权限 (*):', hasSuperPermission ? '✅ 是' : '❌ 否');
      
      if (hasSuperPermission) {
        console.log('🎉 超级管理员账号修复完成！');
      }
    }

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行修复
fixSuperPermission();
