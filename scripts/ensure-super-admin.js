// 确保超级管理员拥有所有权限的脚本
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureSuperAdmin() {
  try {
    console.log('开始确保超级管理员拥有所有权限...');

    // 1. 查找 admin@linghua.com 用户
    let adminUser = await prisma.user.findUnique({
      where: {
        email: "admin@linghua.com",
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // 如果用户不存在，创建用户
    if (!adminUser) {
      console.log('未找到 admin@linghua.com 用户，创建新用户...');
      
      // 生成随机密码
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      adminUser = await prisma.user.create({
        data: {
          name: '超级管理员',
          email: 'admin@linghua.com',
          password: hashedPassword,
          role: 'admin',
        },
        include: {
          userRoles: true,
        },
      });
      
      console.log(`已创建超级管理员账户，密码: ${password}`);
    } else {
      console.log(`找到用户: ${adminUser.name} (${adminUser.email})`);
    }

    // 2. 确保用户的 role 字段为 admin
    if (adminUser.role !== 'admin') {
      console.log('更新用户角色为 admin...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: 'admin' },
      });
    }

    // 3. 查找或创建超级管理员角色
    let superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' },
    });

    if (!superAdminRole) {
      console.log('创建超级管理员角色...');
      superAdminRole = await prisma.role.create({
        data: {
          name: '超级管理员',
          code: 'super_admin',
          description: '系统超级管理员，拥有所有权限',
          isSystem: true,
        },
      });
    }

    // 4. 确保用户拥有超级管理员角色
    const hasSuperAdminRole = adminUser.userRoles.some(ur => 
      ur.role && ur.role.code === 'super_admin'
    );

    if (!hasSuperAdminRole) {
      console.log('为用户分配超级管理员角色...');
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      });
    }

    // 5. 获取所有权限
    const allPermissions = await prisma.permission.findMany();
    
    if (allPermissions.length === 0) {
      console.log('系统中没有定义任何权限，请确保系统正常启动一次，以初始化所有权限');
    } else {
      console.log(`系统中共有 ${allPermissions.length} 个权限`);
      
      // 6. 获取超级管理员当前拥有的权限
      const existingPermissions = await prisma.rolePermission.findMany({
        where: { roleId: superAdminRole.id },
      });
      
      console.log(`超级管理员当前拥有 ${existingPermissions.length} 个权限`);
      
      // 7. 找出缺少的权限
      const existingPermissionIds = existingPermissions.map(p => p.permissionId);
      const missingPermissions = allPermissions.filter(p => !existingPermissionIds.includes(p.id));
      
      if (missingPermissions.length === 0) {
        console.log('超级管理员已拥有所有权限，无需更新');
      } else {
        console.log(`需要添加 ${missingPermissions.length} 个权限`);
        
        // 8. 为超级管理员添加缺少的权限
        const permissionsToAdd = missingPermissions.map(permission => ({
          roleId: superAdminRole.id,
          permissionId: permission.id,
        }));
        
        await prisma.rolePermission.createMany({
          data: permissionsToAdd,
          skipDuplicates: true,
        });
        
        console.log('已成功添加缺少的权限');
      }
    }

    // 9. 更新用户的 roles 数组（兼容旧版本）
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        roles: [superAdminRole.id],
      },
    });

    console.log('操作完成！admin@linghua.com 现在拥有超级管理员权限和所有系统权限');
  } catch (error) {
    console.error('确保超级管理员权限时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行函数
ensureSuperAdmin();
