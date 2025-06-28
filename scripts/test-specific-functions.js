#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSpecificFunctions() {
  console.log('🧪 测试特定函数...');
  
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 测试 getSchedulesByDate 函数逻辑
    console.log('\n🔍 测试 getSchedulesByDate 函数逻辑...');
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    try {
      const schedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });
      
      console.log(`✅ getSchedulesByDate 逻辑测试成功，今日排班 ${schedules.length} 条`);
      if (schedules.length > 0) {
        console.log('   示例排班:', {
          id: schedules[0].id,
          employeeName: schedules[0].employee?.name,
          date: schedules[0].date.toISOString().split('T')[0],
          startTime: schedules[0].startTime,
          endTime: schedules[0].endTime
        });
      }
    } catch (error) {
      console.error('❌ getSchedulesByDate 逻辑测试失败:', error.message);
    }
    
    // 测试 getCustomers 函数逻辑
    console.log('\n🔍 测试 getCustomers 函数逻辑...');
    
    try {
      const customers = await prisma.customer.findMany({
        where: {},
        orderBy: {
          id: "asc",
        },
      });
      
      console.log(`✅ getCustomers 逻辑测试成功，客户总数 ${customers.length} 条`);
      if (customers.length > 0) {
        console.log('   示例客户:', {
          id: customers[0].id,
          name: customers[0].name,
          phone: customers[0].phone,
          type: customers[0].type,
          isActive: customers[0].isActive
        });
      }
    } catch (error) {
      console.error('❌ getCustomers 逻辑测试失败:', error.message);
    }
    
    // 测试带搜索条件的客户查询
    console.log('\n🔍 测试带搜索条件的客户查询...');
    
    try {
      const searchCustomers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: "", mode: "insensitive" } },
            { phone: { contains: "", mode: "insensitive" } },
            { email: { contains: "", mode: "insensitive" } },
          ],
        },
        orderBy: {
          id: "asc",
        },
      });
      
      console.log(`✅ 带搜索条件的客户查询成功，结果 ${searchCustomers.length} 条`);
    } catch (error) {
      console.error('❌ 带搜索条件的客户查询失败:', error.message);
    }
    
    // 测试不同日期的排班查询
    console.log('\n🔍 测试不同日期的排班查询...');
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      const yesterdaySchedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: startOfYesterday,
            lte: endOfYesterday,
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });
      
      console.log(`✅ 昨日排班查询成功，结果 ${yesterdaySchedules.length} 条`);
    } catch (error) {
      console.error('❌ 昨日排班查询失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

// 运行测试
testSpecificFunctions()
  .then(() => {
    console.log('\n✅ 特定函数测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 特定函数测试失败:', error);
    process.exit(1);
  });
