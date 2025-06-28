#!/usr/bin/env node

/**
 * 系统诊断工具测试脚本
 * 
 * 用于验证系统诊断功能是否正常工作
 */

const { runFullDatabaseDiagnostic, quickHealthCheck, formatDiagnosticReport } = require('../lib/database-diagnostics-controller')

async function testQuickHealthCheck() {
  console.log('🔍 测试快速健康检查...')
  
  try {
    const result = await quickHealthCheck()
    console.log('✅ 快速健康检查结果:')
    console.log(`   状态: ${result.status}`)
    console.log(`   消息: ${result.message}`)
    if (result.details) {
      console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`)
    }
    return true
  } catch (error) {
    console.error('❌ 快速健康检查失败:', error.message)
    return false
  }
}

async function testFullDiagnostic() {
  console.log('\n🔍 测试完整系统诊断...')
  
  try {
    const report = await runFullDatabaseDiagnostic()
    
    console.log('✅ 完整诊断结果:')
    console.log(`   总体状态: ${report.overall}`)
    console.log(`   检测模块数: ${report.summary.total}`)
    console.log(`   健康模块: ${report.summary.healthy}`)
    console.log(`   警告模块: ${report.summary.warning}`)
    console.log(`   异常模块: ${report.summary.critical}`)
    
    console.log('\n📋 模块详情:')
    report.modules.forEach(module => {
      console.log(`   ${module.module}: ${module.overall}`)
      if (module.overall !== 'healthy') {
        console.log(`     - 创建: ${module.crud.create.status}`)
        console.log(`     - 查询: ${module.crud.read.status}`)
        console.log(`     - 更新: ${module.crud.update.status}`)
        console.log(`     - 删除: ${module.crud.delete.status}`)
      }
    })
    
    console.log('\n🔧 系统状态:')
    console.log(`   Server Actions: ${report.serverActions.status} - ${report.serverActions.message}`)
    console.log(`   增强操作系统: ${report.enhancedOperations.status} - ${report.enhancedOperations.message}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:')
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`)
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ 完整诊断失败:', error.message)
    console.error('错误详情:', error)
    return false
  }
}

async function main() {
  console.log('🚀 开始系统诊断工具测试\n')
  
  let allPassed = true
  
  // 测试快速健康检查
  const quickCheckPassed = await testQuickHealthCheck()
  allPassed = allPassed && quickCheckPassed
  
  // 测试完整诊断
  const fullDiagnosticPassed = await testFullDiagnostic()
  allPassed = allPassed && fullDiagnosticPassed
  
  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('✅ 所有测试通过！系统诊断工具工作正常。')
    process.exit(0)
  } else {
    console.log('❌ 部分测试失败！请检查系统配置。')
    process.exit(1)
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
  process.exit(1)
})

// 运行测试
main().catch(error => {
  console.error('❌ 测试脚本执行失败:', error)
  process.exit(1)
})
