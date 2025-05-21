// 创建超级管理员账户脚本
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('开始创建超级管理员账户...');

    // 检查是否已存在超级管理员角色
    let superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' },
    });

    // 如果不存在超级管理员角色，创建一个
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

    // 设置管理员信息
    const adminEmail = 'admin@linghua.com';
    const adminName = '超级管理员';
    const adminPassword = 'Admin123456'; // 默认密码，建议创建后立即修改

    // 检查是否已存在此邮箱的用户
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log('已存在相同邮箱的用户，更新为超级管理员...');
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // 更新用户信息
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          name: adminName,
          password: hashedPassword,
          role: 'admin', // 保持兼容性
        },
      });

      // 检查用户是否已有超级管理员角色
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId: updatedUser.id,
          roleId: superAdminRole.id,
        },
      });

      // 如果没有超级管理员角色，添加该角色
      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId: updatedUser.id,
            roleId: superAdminRole.id,
          },
        });
      }

      console.log(`用户 ${adminEmail} 已更新为超级管理员`);
      console.log('密码已重置为: ' + adminPassword);
    } else {
      console.log('创建新的超级管理员账户...');
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin', // 保持兼容性
        },
      });

      // 为用户分配超级管理员角色
      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: superAdminRole.id,
        },
      });

      console.log(`超级管理员账户创建成功！`);
      console.log(`邮箱: ${adminEmail}`);
      console.log(`密码: ${adminPassword}`);
    }

    console.log('操作完成！');
  } catch (error) {
    console.error('创建超级管理员账户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行创建超级管理员函数
createSuperAdmin();
