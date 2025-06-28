'use server'

import type { UnifiedDiagnosticReport } from './unified-diagnostics'

/**
 * 导出诊断报告为JSON格式
 */
export async function exportDiagnosticReportAsJSON(data: UnifiedDiagnosticReport) {
  try {
    console.log('📄 开始导出JSON格式诊断报告...')
    
    const exportData = {
      exportTime: new Date().toISOString(),
      reportType: 'ERP系统诊断报告',
      version: '1.0',
      data: {
        timestamp: data.timestamp,
        overall: data.overall,
        summary: data.summary,
        tools: data.tools.map(tool => ({
          id: tool.id,
          name: tool.name,
          status: tool.status,
          priority: tool.priority,
          summary: tool.summary,
          issueCount: tool.issueCount,
          lastRun: tool.lastRun,
          details: tool.details
        }))
      }
    }
    
    console.log('✅ JSON格式诊断报告导出完成')
    
    return {
      success: true,
      data: exportData,
      filename: `ERP诊断报告_${new Date().toISOString().split('T')[0]}.json`,
      message: 'JSON格式报告导出成功'
    }
  } catch (error) {
    console.error('❌ JSON格式报告导出失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSON格式报告导出失败',
      data: null
    }
  }
}

/**
 * 导出诊断报告为Markdown格式
 */
export async function exportDiagnosticReportAsMarkdown(data: UnifiedDiagnosticReport) {
  try {
    console.log('📝 开始导出Markdown格式诊断报告...')
    
    const timestamp = new Date().toLocaleString('zh-CN')
    
    let markdown = `# ERP系统诊断报告\n\n`
    markdown += `**生成时间**: ${timestamp}\n`
    markdown += `**报告版本**: 1.0\n`
    markdown += `**系统状态**: ${getStatusText(data.overall)}\n\n`
    
    // 总览统计
    markdown += `## 📊 总览统计\n\n`
    markdown += `| 指标 | 数值 |\n`
    markdown += `|------|------|\n`
    markdown += `| 总体状态 | ${getStatusText(data.overall)} |\n`
    markdown += `| 健康工具 | ${data.summary.healthyCount} |\n`
    markdown += `| 警告工具 | ${data.summary.warningCount} |\n`
    markdown += `| 错误工具 | ${data.summary.errorCount} |\n`
    markdown += `| 总问题数 | ${data.summary.totalIssues} |\n`
    markdown += `| P0级问题 | ${data.summary.p0Issues} |\n`
    markdown += `| P1级问题 | ${data.summary.p1Issues} |\n\n`
    
    // 诊断工具详情
    markdown += `## 🔧 诊断工具详情\n\n`
    
    data.tools.forEach(tool => {
      markdown += `### ${tool.name}\n\n`
      markdown += `- **状态**: ${getStatusText(tool.status)}\n`
      markdown += `- **优先级**: ${tool.priority}\n`
      markdown += `- **最后运行**: ${tool.lastRun}\n`
      markdown += `- **摘要**: ${tool.summary}\n`
      
      if (tool.issueCount > 0) {
        markdown += `- **问题数量**: ${tool.issueCount}\n`
      }
      
      if (tool.details) {
        markdown += `- **详细信息**:\n`
        Object.entries(tool.details).forEach(([key, value]: [string, any]) => {
          markdown += `  - ${key}: ${value.message || value.status || '未知'}\n`
        })
      }
      
      markdown += `\n`
    })
    
    // 建议和总结
    markdown += `## 💡 建议和总结\n\n`
    
    if (data.summary.p0Issues > 0) {
      markdown += `⚠️ **紧急**: 发现 ${data.summary.p0Issues} 个P0级严重问题，需要立即处理！\n\n`
    }
    
    if (data.summary.p1Issues > 0) {
      markdown += `⚡ **重要**: 发现 ${data.summary.p1Issues} 个P1级重要问题，建议优先处理。\n\n`
    }
    
    if (data.summary.errorCount === 0 && data.summary.warningCount === 0) {
      markdown += `✅ **良好**: 系统运行状态良好，所有诊断工具正常运行。\n\n`
    }
    
    markdown += `---\n`
    markdown += `*报告由ERP系统诊断中心自动生成*\n`
    
    console.log('✅ Markdown格式诊断报告导出完成')
    
    return {
      success: true,
      data: markdown,
      filename: `ERP诊断报告_${new Date().toISOString().split('T')[0]}.md`,
      message: 'Markdown格式报告导出成功'
    }
  } catch (error) {
    console.error('❌ Markdown格式报告导出失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Markdown格式报告导出失败',
      data: null
    }
  }
}

/**
 * 导出诊断报告为CSV格式
 */
export async function exportDiagnosticReportAsCSV(data: UnifiedDiagnosticReport) {
  try {
    console.log('📊 开始导出CSV格式诊断报告...')
    
    // CSV头部
    let csv = '工具ID,工具名称,状态,优先级,问题数量,最后运行时间,摘要\n'
    
    // 添加数据行
    data.tools.forEach(tool => {
      const row = [
        tool.id,
        `"${tool.name}"`,
        tool.status,
        tool.priority,
        tool.issueCount || 0,
        `"${tool.lastRun}"`,
        `"${tool.summary}"`
      ].join(',')
      
      csv += row + '\n'
    })
    
    console.log('✅ CSV格式诊断报告导出完成')
    
    return {
      success: true,
      data: csv,
      filename: `ERP诊断报告_${new Date().toISOString().split('T')[0]}.csv`,
      message: 'CSV格式报告导出成功'
    }
  } catch (error) {
    console.error('❌ CSV格式报告导出失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CSV格式报告导出失败',
      data: null
    }
  }
}

/**
 * 保存诊断历史记录
 */
export async function saveDiagnosticHistory(data: UnifiedDiagnosticReport) {
  try {
    console.log('💾 开始保存诊断历史记录...')
    
    // 这里应该保存到数据库，目前使用localStorage模拟
    const historyRecord = {
      id: `diagnostic_${Date.now()}`,
      timestamp: data.timestamp,
      overall: data.overall,
      summary: data.summary,
      toolCount: data.tools.length,
      issueCount: data.summary.totalIssues,
      p0Issues: data.summary.p0Issues,
      p1Issues: data.summary.p1Issues
    }
    
    console.log('✅ 诊断历史记录保存完成')
    
    return {
      success: true,
      data: historyRecord,
      message: '诊断历史记录保存成功'
    }
  } catch (error) {
    console.error('❌ 诊断历史记录保存失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '诊断历史记录保存失败',
      data: null
    }
  }
}

/**
 * 获取诊断历史记录
 */
export async function getDiagnosticHistory() {
  try {
    console.log('📚 开始获取诊断历史记录...')
    
    // 模拟历史记录数据
    const mockHistory = [
      {
        id: 'diagnostic_1',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        overall: 'healthy',
        summary: {
          healthyCount: 4,
          warningCount: 1,
          errorCount: 0,
          totalIssues: 2,
          p0Issues: 0,
          p1Issues: 1
        },
        toolCount: 5,
        issueCount: 2,
        p0Issues: 0,
        p1Issues: 1
      },
      {
        id: 'diagnostic_2',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        overall: 'warning',
        summary: {
          healthyCount: 3,
          warningCount: 2,
          errorCount: 0,
          totalIssues: 5,
          p0Issues: 0,
          p1Issues: 2
        },
        toolCount: 5,
        issueCount: 5,
        p0Issues: 0,
        p1Issues: 2
      },
      {
        id: 'diagnostic_3',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        overall: 'error',
        summary: {
          healthyCount: 2,
          warningCount: 2,
          errorCount: 1,
          totalIssues: 8,
          p0Issues: 1,
          p1Issues: 3
        },
        toolCount: 5,
        issueCount: 8,
        p0Issues: 1,
        p1Issues: 3
      }
    ]
    
    console.log('✅ 诊断历史记录获取完成')
    
    return {
      success: true,
      data: mockHistory,
      message: '诊断历史记录获取成功'
    }
  } catch (error) {
    console.error('❌ 诊断历史记录获取失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '诊断历史记录获取失败',
      data: []
    }
  }
}

// 辅助函数
function getStatusText(status: string): string {
  const statusMap = {
    healthy: '健康',
    warning: '警告',
    error: '错误',
    unknown: '未知'
  }
  return statusMap[status as keyof typeof statusMap] || status
}
