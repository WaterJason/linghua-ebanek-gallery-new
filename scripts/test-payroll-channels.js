const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPayrollModule() {
  console.log('🧪 测试 Payroll 模块...')
  
  try {
    // 确保有员工
    let testEmployee = await prisma.employee.findFirst() || 
      await prisma.employee.create({
        data: {
          name: `测试员工_${Date.now()}`,
          position: '测试职位',
          dailySalary: 200.0,
          status: 'active'
        }
      })

    // 测试创建薪资记录
    const currentDate = new Date()
    const salaryRecord = await prisma.salaryRecord.create({
      data: {
        employeeId: testEmployee.id,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        baseSalary: 5000.0,
        scheduleSalary: 0.0,
        salesCommission: 0.0,
        pieceWorkIncome: 0.0,
        workshopIncome: 0.0,
        coffeeShiftCommission: 0.0,
        overtimePay: 0.0,
        bonus: 0.0,
        deductions: 0.0,
        socialInsurance: 0.0,
        tax: 0.0,
        totalIncome: 5000.0,
        netIncome: 5000.0,
        status: 'draft'
      }
    })
    console.log('  ✅ 薪资记录创建成功')

    // 测试查询
    const records = await prisma.salaryRecord.findMany({
      take: 5,
      include: { employee: true }
    })
    console.log(`  ✅ 薪资记录查询成功，共 ${records.length} 条记录`)

    // 测试更新
    await prisma.salaryRecord.update({
      where: { id: salaryRecord.id },
      data: { 
        totalIncome: 5500.0,
        netIncome: 5500.0
      }
    })
    console.log('  ✅ 薪资记录更新成功')

    // 测试删除
    await prisma.salaryRecord.delete({
      where: { id: salaryRecord.id }
    })
    console.log('  ✅ 薪资记录删除成功')

    return true
  } catch (error) {
    console.log('  ❌ Payroll 模块测试失败:', error.message)
    return false
  }
}

async function testChannelsModule() {
  console.log('🧪 测试 Channels 模块...')
  
  try {
    // 测试创建渠道
    const channel = await prisma.channel.create({
      data: {
        name: `测试渠道_${Date.now()}`,
        code: `TEST_${Date.now()}`,
        description: '测试渠道描述',
        contactName: '李四',
        contactPhone: '13800138001',
        status: 'active'
      }
    })
    console.log('  ✅ 渠道创建成功')

    // 测试查询
    const channels = await prisma.channel.findMany({
      take: 5,
      include: {
        sales: true,
        inventory: true
      }
    })
    console.log(`  ✅ 渠道查询成功，共 ${channels.length} 条记录`)

    // 测试更新
    await prisma.channel.update({
      where: { id: channel.id },
      data: { status: 'inactive' }
    })
    console.log('  ✅ 渠道更新成功')

    // 测试删除
    await prisma.channel.delete({
      where: { id: channel.id }
    })
    console.log('  ✅ 渠道删除成功')

    return true
  } catch (error) {
    console.log('  ❌ Channels 模块测试失败:', error.message)
    return false
  }
}

async function main() {
  console.log('🔍 开始测试 Payroll 和 Channels 模块修复效果...\n')
  
  try {
    await prisma.$connect()
    
    const payrollResult = await testPayrollModule()
    console.log('')
    const channelsResult = await testChannelsModule()
    
    console.log('\n📊 测试结果摘要:')
    console.log('=' .repeat(40))
    console.log(`Payroll 模块: ${payrollResult ? '✅ 通过' : '❌ 失败'}`)
    console.log(`Channels 模块: ${channelsResult ? '✅ 通过' : '❌ 失败'}`)
    
    if (payrollResult && channelsResult) {
      console.log('\n🎉 所有模块修复成功！')
      process.exit(0)
    } else {
      console.log('\n⚠️ 部分模块仍有问题')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
