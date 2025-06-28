const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    console.log('开始重置用户密码...');

    const userEmail = 'simon@linghuaart.com';
    const newPassword = 'Manager123456'; // 新密码

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log(`❌ 用户不存在: ${userEmail}`);
      return;
    }

    console.log(`找到用户: ${user.name} (${user.email})`);

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新用户密码
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        password: hashedPassword,
        passwordLastChanged: new Date(),
      },
    });

    console.log(`✅ 密码重置成功！`);
    console.log(`用户: ${userEmail}`);
    console.log(`新密码: ${newPassword}`);
    console.log('请提醒用户在首次登录后修改密码。');

  } catch (error) {
    console.error('重置密码时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行重置
resetUserPassword();
