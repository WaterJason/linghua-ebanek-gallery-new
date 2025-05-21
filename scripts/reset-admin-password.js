// 重置超级管理员密码的脚本
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入新密码或使用默认密码
function promptForPassword() {
  return new Promise((resolve) => {
    rl.question('请输入新密码 (直接回车使用默认密码 "Admin123456"): ', (answer) => {
      const password = answer.trim() || 'Admin123456';
      resolve(password);
    });
  });
}

async function resetAdminPassword() {
  try {
    console.log('开始重置超级管理员密码...');

    // 查找管理员账户
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@linghua.com' },
    });

    if (!adminUser) {
      console.log('未找到超级管理员账户！');
      rl.close();
      return;
    }

    // 获取新密码
    const newPassword = await promptForPassword();
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
      },
    });

    console.log(`超级管理员 (${adminUser.email}) 的密码已成功重置！`);
    console.log(`新密码: ${newPassword}`);
    console.log('请记住这个密码，并在首次登录后修改它。');

  } catch (error) {
    console.error('重置超级管理员密码时出错:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// 执行重置超级管理员密码函数
resetAdminPassword();
