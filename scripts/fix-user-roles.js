const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('开始修复用户角色分配...');

    // 1. 获取所有用户
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`找到 ${users.length} 个用户`);

    // 2. 获取所有角色
    const roles = await prisma.role.findMany();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.code] = role;
    });

    // 3. 为每个用户分配对应的角色
    for (const user of users) {
      console.log(`\n处理用户: ${user.name} (${user.email})`);
      console.log(`当前系统角色: ${user.role}`);
      console.log(`当前分配的角色: ${user.userRoles.map(ur => ur.role.name).join(', ') || '无'}`);

      // 根据用户的 role 字段分配对应的角色
      let targetRoleCode = null;
      
      switch (user.role) {
        case 'admin':
          targetRoleCode = user.email === 'admin@linghua.com' ? 'super_admin' : 'admin';
          break;
        case 'manager':
          targetRoleCode = 'manager';
          break;
        case 'employee':
          targetRoleCode = 'employee';
          break;
        case 'finance':
          targetRoleCode = 'finance';
          break;
        case 'sales':
          targetRoleCode = 'sales';
          break;
        case 'inventory':
          targetRoleCode = 'inventory';
          break;
        default:
          targetRoleCode = 'employee'; // 默认为员工角色
      }

      const targetRole = roleMap[targetRoleCode];
      if (!targetRole) {
        console.log(`❌ 找不到角色: ${targetRoleCode}`);
        continue;
      }

      // 检查用户是否已有此角色
      const hasRole = user.userRoles.some(ur => ur.role.code === targetRoleCode);
      
      if (!hasRole) {
        console.log(`分配角色: ${targetRole.name} (${targetRole.code})`);
        
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: targetRole.id,
          },
        });
        
        console.log(`✅ 已为用户分配角色: ${targetRole.name}`);
      } else {
        console.log(`✅ 用户已拥有角色: ${targetRole.name}`);
      }
    }

    console.log('\n角色分配修复完成！');

  } catch (error) {
    console.error('修复用户角色时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行修复
fixUserRoles();
