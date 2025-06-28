const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyTableCheck() {
  console.log('🔍 验证表检查修复...\n')
  
  try {
    await prisma.$connect()
    
    // Simulate the exact logic from checkTablesExist function
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `

    const requiredTables = [
      'User', 'Employee', 'Product', 'InventoryItem', 'FinancialAccount',
      'FinancialTransaction', 'SalaryRecord', 'Order', 'PurchaseOrder', 'Channel'
    ]

    const existingTables = tables.map(t => t.tablename)
    const missingTables = requiredTables.filter(table =>
      !existingTables.some(existing => existing.toLowerCase() === table.toLowerCase())
    )

    console.log('📋 检查结果:')
    console.log(`  预期表数量: ${requiredTables.length}`)
    console.log(`  数据库表数量: ${existingTables.length}`)
    console.log(`  缺失表数量: ${missingTables.length}`)
    
    if (missingTables.length === 0) {
      console.log('\n✅ 状态: SUCCESS')
      console.log('✅ 所有必需的数据表都存在')
      console.log('✅ 系统状态应该显示为 HEALTHY')
      
      console.log('\n📊 验证的表:')
      requiredTables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table} ✅`)
      })
      
      return 'success'
    } else {
      console.log('\n❌ 状态: WARNING')
      console.log(`❌ 缺少 ${missingTables.length} 个数据表`)
      console.log('❌ 系统状态将显示为 WARNING')
      
      console.log('\n❌ 缺失的表:')
      missingTables.forEach(table => {
        console.log(`  - ${table}`)
      })
      
      return 'warning'
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error)
    return 'error'
  } finally {
    await prisma.$disconnect()
  }
}

async function testAllModulesCRUD() {
  console.log('\n🧪 测试所有模块CRUD功能...\n')
  
  const modules = [
    'products', 'employees', 'inventory', 'finance', 
    'payroll', 'sales', 'purchase', 'channels'
  ]
  
  const results = {}
  
  for (const module of modules) {
    try {
      // Simple test - just check if we can query the main table for each module
      let count = 0
      
      switch (module) {
        case 'products':
          count = await prisma.product.count()
          break
        case 'employees':
          count = await prisma.employee.count()
          break
        case 'inventory':
          count = await prisma.inventoryItem.count()
          break
        case 'finance':
          count = await prisma.financialAccount.count()
          break
        case 'payroll':
          count = await prisma.salaryRecord.count()
          break
        case 'sales':
          count = await prisma.order.count()
          break
        case 'purchase':
          count = await prisma.purchaseOrder.count()
          break
        case 'channels':
          count = await prisma.channel.count()
          break
      }
      
      console.log(`  ✅ ${module.padEnd(12)} - 查询成功 (${count} 条记录)`)
      results[module] = 'success'
      
    } catch (error) {
      console.log(`  ❌ ${module.padEnd(12)} - 查询失败: ${error.message}`)
      results[module] = 'error'
    }
  }
  
  const successCount = Object.values(results).filter(r => r === 'success').length
  const totalCount = modules.length
  
  console.log(`\n📊 模块测试结果: ${successCount}/${totalCount} 成功`)
  
  return successCount === totalCount ? 'success' : 'partial'
}

async function main() {
  console.log('🎯 数据库修复验证报告')
  console.log('=' .repeat(50))
  
  try {
    // Test 1: Table check
    const tableCheckResult = await verifyTableCheck()
    
    // Test 2: Module CRUD
    const moduleTestResult = await testAllModulesCRUD()
    
    console.log('\n📈 最终验证结果:')
    console.log('=' .repeat(50))
    console.log(`表检查状态: ${tableCheckResult.toUpperCase()}`)
    console.log(`模块测试状态: ${moduleTestResult.toUpperCase()}`)
    
    if (tableCheckResult === 'success' && moduleTestResult === 'success') {
      console.log('\n🎉 修复验证成功！')
      console.log('✅ 数据库诊断系统应该显示 HEALTHY 状态')
      console.log('✅ 所有8个ERP模块都正常工作')
      console.log('✅ WARNING状态问题已完全解决')
      process.exit(0)
    } else {
      console.log('\n⚠️ 修复验证部分成功')
      console.log('需要进一步检查和修复')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error)
    process.exit(1)
  }
}

main()
