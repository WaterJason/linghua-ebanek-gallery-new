const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');

  try {
    // 测试基本连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 测试查询权限
    console.log('\n🔍 测试查询权限...');

    // 测试 Schedule 表
    try {
      const scheduleCount = await prisma.schedule.count();
      console.log(`✅ Schedule 表访问正常，共有 ${scheduleCount} 条记录`);
    } catch (error) {
      console.error('❌ Schedule 表访问失败:', error);
    }

    // 测试 Customer 表
    try {
      const customerCount = await prisma.customer.count();
      console.log(`✅ Customer 表访问正常，共有 ${customerCount} 条记录`);
    } catch (error) {
      console.error('❌ Customer 表访问失败:', error);
    }

    // 测试 Employee 表
    try {
      const employeeCount = await prisma.employee.count();
      console.log(`✅ Employee 表访问正常，共有 ${employeeCount} 条记录`);
    } catch (error) {
      console.error('❌ Employee 表访问失败:', error);
    }

    // 测试 User 表
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User 表访问正常，共有 ${userCount} 条记录`);
    } catch (error) {
      console.error('❌ User 表访问失败:', error);
    }

    // 测试复杂查询
    console.log('\n🔍 测试复杂查询...');

    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todaySchedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          employee: true,
        },
      });

      console.log(`✅ 今日排班查询成功，共有 ${todaySchedules.length} 条记录`);
    } catch (error) {
      console.error('❌ 今日排班查询失败:', error);
    }

    try {
      const customers = await prisma.customer.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          id: 'asc',
        },
        take: 5,
      });

      console.log(`✅ 客户查询成功，获取到 ${customers.length} 条记录`);
    } catch (error) {
      console.error('❌ 客户查询失败:', error);
    }

  } catch (error) {
    console.error('❌ 数据库连接失败:', error);

    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

// 运行测试
testDatabaseConnection()
  .then(() => {
    console.log('\n✅ 数据库连接测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 数据库连接测试失败:', error);
    process.exit(1);
  });
