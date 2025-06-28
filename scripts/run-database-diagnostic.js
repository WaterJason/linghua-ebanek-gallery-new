const { runFullDatabaseDiagnostic, formatDiagnosticReport } = require('../lib/database-diagnostics-controller')

async function main() {
  console.log('🔍 开始数据库系统诊断...')
  
  try {
    const report = await runFullDatabaseDiagnostic()
    
    console.log('\n' + formatDiagnosticReport(report))
    
    // 输出 JSON 格式的详细报告
    console.log('\n📄 详细报告 (JSON):')
    console.log(JSON.stringify(report, null, 2))
    
    // 根据结果设置退出码
    if (report.overall === 'critical') {
      process.exit(1)
    } else if (report.overall === 'warning') {
      process.exit(2)
    } else {
      process.exit(0)
    }
    
  } catch (error) {
    console.error('❌ 诊断失败:', error)
    process.exit(1)
  }
}

main()
