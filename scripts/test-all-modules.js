const { runFullDatabaseDiagnostic, formatDiagnosticReport } = require('../lib/database-diagnostics-controller')

async function testAllModules() {
  console.log('🔍 开始测试所有8个核心模块...\n')
  
  try {
    const report = await runFullDatabaseDiagnostic()
    
    console.log('📊 诊断结果摘要:')
    console.log('=' .repeat(50))
    console.log(`总模块数: ${report.summary.total}`)
    console.log(`健康模块: ${report.summary.healthy}`)
    console.log(`警告模块: ${report.summary.warning}`)
    console.log(`异常模块: ${report.summary.critical}`)
    console.log(`总体状态: ${report.overall.toUpperCase()}`)
    console.log('')
    
    console.log('📦 各模块详细状态:')
    console.log('-' .repeat(50))
    
    const expectedModules = ['products', 'employees', 'inventory', 'finance', 'payroll', 'sales', 'purchase', 'channels']
    
    expectedModules.forEach(moduleName => {
      const module = report.modules.find(m => m.module === moduleName)
      if (module) {
        const statusIcon = module.overall === 'healthy' ? '✅' : 
                          module.overall === 'warning' ? '⚠️' : '❌'
        console.log(`${statusIcon} ${moduleName.padEnd(12)} - ${module.overall.toUpperCase()}`)
        
        // 显示CRUD操作详情
        const operations = ['create', 'read', 'update', 'delete']
        operations.forEach(op => {
          const result = module.crud[op]
          const opIcon = result.status === 'success' ? '✅' : '❌'
          console.log(`    ${opIcon} ${op.padEnd(8)} - ${result.message}`)
        })
        console.log('')
      } else {
        console.log(`❌ ${moduleName.padEnd(12)} - 未找到测试结果`)
      }
    })
    
    console.log('💡 建议措施:')
    console.log('-' .repeat(50))
    report.recommendations.forEach(rec => {
      console.log(`  ${rec}`)
    })
    
    // 验证是否所有8个模块都被测试
    if (report.modules.length === 8) {
      console.log('\n🎉 成功！所有8个核心模块都已测试')
    } else {
      console.log(`\n⚠️ 警告：只测试了 ${report.modules.length}/8 个模块`)
      const testedModules = report.modules.map(m => m.module)
      const missingModules = expectedModules.filter(m => !testedModules.includes(m))
      console.log(`缺失模块: ${missingModules.join(', ')}`)
    }
    
    // 根据结果设置退出码
    if (report.overall === 'healthy' && report.modules.length === 8) {
      console.log('\n✅ 所有模块测试通过！')
      process.exit(0)
    } else if (report.overall === 'warning') {
      console.log('\n⚠️ 部分模块存在警告')
      process.exit(1)
    } else {
      console.log('\n❌ 存在严重问题需要修复')
      process.exit(2)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('错误详情:', error.stack)
    process.exit(1)
  }
}

testAllModules()
