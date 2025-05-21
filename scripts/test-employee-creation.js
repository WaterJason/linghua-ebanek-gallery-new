/**
 * 测试员工创建功能
 * 
 * 这个脚本用于测试员工创建功能是否正常工作
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateEmployee() {
  try {
    console.log('开始测试员工创建功能...');
    
    // 创建测试员工数据
    const testEmployee = {
      name: '测试员工',
      position: '测试职位',
      dailySalary: 200,
      status: 'active',
      phone: '13800138000',
      email: 'test@example.com',
    };
    
    console.log('创建员工数据:', testEmployee);
    
    // 直接使用 Prisma 客户端创建员工
    const employee = await prisma.employee.create({
      data: testEmployee
    });
    
    console.log('员工创建成功:', employee);
    
    // 删除测试数据
    await prisma.employee.delete({
      where: { id: employee.id }
    });
    
    console.log('测试数据已清理');
    console.log('测试完成: 成功');
    
    return { success: true, employee };
  } catch (error) {
    console.error('测试失败:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testCreateEmployee()
  .then(result => {
    if (result.success) {
      console.log('员工创建功能测试通过');
      process.exit(0);
    } else {
      console.error('员工创建功能测试失败');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('测试执行出错:', error);
    process.exit(1);
  });
