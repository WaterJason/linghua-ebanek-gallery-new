const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  try {
    console.log('开始修复权限问题...');

    // 1. 检查是否有admin用户
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@linghua.com' }
    });

    if (!adminUser) {
      console.log('未找到admin@linghua.com用户，请先创建该用户');
      return;
    }

    console.log(`找到用户: ${adminUser.email}`);

    // 2. 确保管理员角色存在
    const adminRole = await prisma.role.upsert({
      where: { code: 'admin' },
      update: {},
      create: {
        name: '超级管理员',
        code: 'admin',
        description: '拥有所有权限的超级管理员',
        isSystem: true
      }
    });

    // 3. 确保employees.create权限存在
    const employeesCreatePermission = await prisma.permission.upsert({
      where: { code: 'employees.create' },
      update: {},
      create: {
        name: '创建员工',
        code: 'employees.create',
        module: 'employees',
        description: '创建新员工的权限'
      }
    });

    // 4. 为管理员角色分配employees.create权限
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: employeesCreatePermission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: employeesCreatePermission.id
      }
    });

    // 5. 为admin用户分配管理员角色
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });

    // 6. 检查结果
    const userWithRoles = await prisma.user.findUnique({
      where: { id: adminUser.id },
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

    console.log(`用户: ${userWithRoles.email}`);
    console.log('角色:');
    userWithRoles.userRoles.forEach(ur => {
      console.log(`  - ${ur.role.name} (${ur.role.code})`);
      console.log(`    权限数量: ${ur.role.rolePermissions.length}`);
      const hasEmployeesCreate = ur.role.rolePermissions.some(rp => rp.permission.code === 'employees.create');
      console.log(`    包含employees.create权限: ${hasEmployeesCreate ? '是' : '否'}`);
    });

    console.log('权限修复完成!');

  } catch (error) {
    console.error('权限修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermissions();
