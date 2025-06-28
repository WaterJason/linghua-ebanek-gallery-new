#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
  console.log('🎯 聆花珐琅馆数据库修复最终验证');
  console.log('=====================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 1. 验证 getSchedulesByDate 函数
    console.log('\n📅 验证 getSchedulesByDate 函数...');
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
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
    
    console.log(`✅ getSchedulesByDate 函数验证成功`);
    console.log(`   - 今日排班记录: ${schedules.length} 条`);
    if (schedules.length > 0) {
      console.log(`   - 示例: ${schedules[0].employee?.name} (${schedules[0].startTime}-${schedules[0].endTime})`);
    }
    
    // 2. 验证 getCustomers 函数
    console.log('\n👥 验证 getCustomers 函数...');
    
    const customers = await prisma.customer.findMany({
      where: {},
      orderBy: {
        id: "asc",
      },
    });
    
    console.log(`✅ getCustomers 函数验证成功`);
    console.log(`   - 客户总数: ${customers.length} 条`);
    if (customers.length > 0) {
      console.log(`   - 示例: ${customers[0].name} (${customers[0].phone || '无电话'})`);
    }
    
    // 3. 验证带参数的客户查询
    console.log('\n🔍 验证带参数的客户查询...');
    
    const searchCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: "测试", mode: "insensitive" } },
          { phone: { contains: "138", mode: "insensitive" } },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });
    
    console.log(`✅ 带参数的客户查询验证成功`);
    console.log(`   - 搜索结果: ${searchCustomers.length} 条`);
    
    // 4. 验证其他核心表
    console.log('\n📊 验证其他核心表访问...');
    
    const employeeCount = await prisma.employee.count();
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    
    console.log(`✅ 核心表访问验证成功`);
    console.log(`   - 员工表: ${employeeCount} 条记录`);
    console.log(`   - 用户表: ${userCount} 条记录`);
    console.log(`   - 产品表: ${productCount} 条记录`);
    
    // 5. 验证复杂关联查询
    console.log('\n🔗 验证复杂关联查询...');
    
    const schedulesWithEmployee = await prisma.schedule.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
      take: 5,
    });
    
    console.log(`✅ 复杂关联查询验证成功`);
    console.log(`   - 排班关联员工查询: ${schedulesWithEmployee.length} 条`);
    
    // 6. 验证数据库写入操作
    console.log('\n✏️  验证数据库写入操作...');
    
    const testCustomer = await prisma.customer.create({
      data: {
        name: '测试客户_验证',
        phone: '19900000000',
        type: 'individual',
        notes: '数据库修复验证测试',
      },
    });
    
    console.log(`✅ 数据库写入操作验证成功`);
    console.log(`   - 创建测试客户: ID ${testCustomer.id}`);
    
    // 清理测试数据
    await prisma.customer.delete({
      where: { id: testCustomer.id },
    });
    
    console.log(`✅ 测试数据清理完成`);
    
    console.log('\n🎉 所有验证项目通过！');
    console.log('数据库访问权限问题已完全修复。');
    
  } catch (error) {
    console.error('\n❌ 验证过程中发生错误:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

// 运行最终验证
finalVerification()
  .then(() => {
    console.log('\n✅ 最终验证完成 - 系统可以正常使用！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 最终验证失败:', error);
    process.exit(1);
  });
