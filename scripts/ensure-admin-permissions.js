// 确保超级管理员拥有所有权限的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureAdminPermissions() {
  try {
    console.log('开始检查超级管理员权限...');

    // 获取超级管理员角色
    const superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' },
    });

    if (!superAdminRole) {
      console.error('未找到超级管理员角色！');
      return;
    }

    // 获取所有权限
    const allPermissions = await prisma.permission.findMany();
    
    if (allPermissions.length === 0) {
      console.log('系统中没有定义任何权限，尝试初始化权限...');
      
      // 如果需要，可以在这里添加初始化权限的代码
      // 但这通常应该由系统启动时的 initAccountSystem 函数处理
      
      console.log('请确保系统正常启动一次，以初始化所有权限');
      return;
    }

    console.log(`系统中共有 ${allPermissions.length} 个权限`);

    // 获取超级管理员当前拥有的权限
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { roleId: superAdminRole.id },
    });

    console.log(`超级管理员当前拥有 ${existingPermissions.length} 个权限`);

    // 找出缺少的权限
    const existingPermissionIds = existingPermissions.map(p => p.permissionId);
    const missingPermissions = allPermissions.filter(p => !existingPermissionIds.includes(p.id));

    if (missingPermissions.length === 0) {
      console.log('超级管理员已拥有所有权限，无需更新');
      return;
    }

    console.log(`需要添加 ${missingPermissions.length} 个权限`);

    // 为超级管理员添加缺少的权限
    const permissionsToAdd = missingPermissions.map(permission => ({
      roleId: superAdminRole.id,
      permissionId: permission.id,
    }));

    await prisma.rolePermission.createMany({
      data: permissionsToAdd,
      skipDuplicates: true,
    });

    console.log(`已成功为超级管理员添加 ${missingPermissions.length} 个权限`);
    console.log('超级管理员权限更新完成！');
  } catch (error) {
    console.error('更新超级管理员权限时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行确保超级管理员权限的函数
ensureAdminPermissions();
