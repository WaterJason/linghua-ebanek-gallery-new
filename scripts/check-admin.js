// 检查超级管理员账户状态的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminAccount() {
  try {
    console.log('检查超级管理员账户状态...');

    // 查找管理员账户
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
      console.log('未找到超级管理员账户！');
      return;
    }

    console.log('超级管理员账户信息:');
    console.log(`ID: ${adminUser.id}`);
    console.log(`名称: ${adminUser.name}`);
    console.log(`邮箱: ${adminUser.email}`);
    console.log(`角色: ${adminUser.role}`);
    console.log(`创建时间: ${adminUser.createdAt}`);
    console.log(`最后更新: ${adminUser.updatedAt}`);
    console.log(`最后登录: ${adminUser.lastLogin || '从未登录'}`);
    
    console.log('\n分配的角色:');
    if (adminUser.userRoles && adminUser.userRoles.length > 0) {
      adminUser.userRoles.forEach(userRole => {
        console.log(`- ${userRole.role.name} (${userRole.role.code})`);
      });
    } else {
      console.log('未分配任何角色！');
    }

    // 检查是否有超级管理员角色
    const hasSuperAdminRole = adminUser.userRoles.some(ur => ur.role.code === 'super_admin');
    
    if (!hasSuperAdminRole) {
      console.log('\n警告: 该账户没有超级管理员角色！');
    } else {
      console.log('\n该账户具有超级管理员权限。');
    }

  } catch (error) {
    console.error('检查超级管理员账户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行检查超级管理员账户函数
checkAdminAccount();
