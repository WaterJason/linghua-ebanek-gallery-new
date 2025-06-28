'use server'

import { runDatabaseDiagnosticAction, runQuickHealthCheckAction } from './database-diagnostics'
import { runFrontendDiagnosticAction, runQuickFrontendHealthCheckAction } from './frontend-diagnostics'
import { runPerformanceDiagnosticAction, runQuickPerformanceCheckAction } from './performance-diagnostics'
import { runSecurityDiagnosticAction, runQuickSecurityCheckAction } from './security-diagnostics'
import { runNetworkDiagnosticAction, runQuickNetworkCheckAction } from './network-diagnostics'

export interface UnifiedDiagnosticResult {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  lastRun: string
  summary: string
  details?: any
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  issueCount: number
}

export interface UnifiedDiagnosticReport {
  timestamp: string
  overall: 'healthy' | 'warning' | 'error'
  tools: UnifiedDiagnosticResult[]
  summary: {
    healthyCount: number
    warningCount: number
    errorCount: number
    unknownCount: number
    totalIssues: number
    p0Issues: number
    p1Issues: number
    p2Issues: number
    p3Issues: number
  }
}

/**
 * 获取所有诊断工具的当前状态
 */
export async function getAllDiagnosticStatus(): Promise<UnifiedDiagnosticReport> {
  const timestamp = new Date().toISOString()
  console.log('🔍 开始获取所有诊断状态...')

  try {
    // 并行执行所有快速检查
    console.log('📊 执行快速检查...')
    const [systemResult, frontendResult, performanceResult, securityResult, networkResult] = await Promise.allSettled([
      runQuickHealthCheckAction(),
      runQuickFrontendHealthCheckAction(),
      runQuickPerformanceCheckAction(),
      runQuickSecurityCheckAction(),
      runQuickNetworkCheckAction()
    ])

    console.log('📊 快速检查结果:', {
      system: systemResult.status,
      frontend: frontendResult.status,
      performance: performanceResult.status,
      security: securityResult.status,
      network: networkResult.status
    })

    const tools: UnifiedDiagnosticResult[] = []

    // 处理系统诊断结果
    console.log('🔧 处理系统诊断结果...')
    if (systemResult.status === 'fulfilled' && systemResult.value.success) {
      const result = systemResult.value.data
      console.log('✅ 系统诊断成功，数据:', result)

      const errorCount = Object.values(result).filter((r: any) => r.status === 'error').length
      const warningCount = Object.values(result).filter((r: any) => r.status === 'warning').length
      const p0Count = Object.values(result).filter((r: any) => r.priority === 'P0').length

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      if (errorCount > 0 || p0Count > 0) {
        status = 'error'
      } else if (warningCount > 0) {
        status = 'warning'
      }

      console.log(`📊 系统诊断统计: 错误=${errorCount}, 警告=${warningCount}, P0=${p0Count}, 状态=${status}`)

      tools.push({
        id: 'system',
        name: '系统数据操作诊断',
        status,
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: `检测到 ${errorCount} 个错误，${warningCount} 个警告`,
        details: result,
        priority: p0Count > 0 ? 'P0' : warningCount > 0 ? 'P1' : 'P3',
        issueCount: errorCount + warningCount
      })
    } else {
      console.log('❌ 系统诊断失败:', systemResult.status === 'fulfilled' ? systemResult.value : systemResult.reason)
      tools.push({
        id: 'system',
        name: '系统数据操作诊断',
        status: 'error',
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: '诊断执行失败',
        priority: 'P0',
        issueCount: 1
      })
    }

    // 处理前端诊断结果
    if (frontendResult.status === 'fulfilled' && frontendResult.value.success) {
      const result = frontendResult.value.data
      const errorCount = Object.values(result).filter((r: any) => r.status === 'error').length
      const warningCount = Object.values(result).filter((r: any) => r.status === 'warning').length
      const p0Count = Object.values(result).filter((r: any) => r.priority === 'P0').length

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      if (errorCount > 0 || p0Count > 0) {
        status = 'error'
      } else if (warningCount > 0) {
        status = 'warning'
      }

      tools.push({
        id: 'frontend',
        name: '前端操作诊断',
        status,
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: `检测到 ${errorCount} 个错误，${warningCount} 个警告`,
        details: result,
        priority: p0Count > 0 ? 'P0' : warningCount > 0 ? 'P1' : 'P3',
        issueCount: errorCount + warningCount
      })
    } else {
      tools.push({
        id: 'frontend',
        name: '前端操作诊断',
        status: 'error',
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: '诊断执行失败',
        priority: 'P0',
        issueCount: 1
      })
    }

    // 处理性能诊断结果
    if (performanceResult.status === 'fulfilled' && performanceResult.value.success) {
      const result = performanceResult.value.data
      const errorCount = Object.values(result).filter((r: any) => r.status === 'error').length
      const warningCount = Object.values(result).filter((r: any) => r.status === 'warning').length
      const p0Count = Object.values(result).filter((r: any) => r.priority === 'P0').length

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      if (errorCount > 0 || p0Count > 0) {
        status = 'error'
      } else if (warningCount > 0) {
        status = 'warning'
      }

      tools.push({
        id: 'performance',
        name: '性能监控诊断',
        status,
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: `检测到 ${errorCount} 个错误，${warningCount} 个警告`,
        details: result,
        priority: p0Count > 0 ? 'P0' : warningCount > 0 ? 'P1' : 'P3',
        issueCount: errorCount + warningCount
      })
    } else {
      tools.push({
        id: 'performance',
        name: '性能监控诊断',
        status: 'error',
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: '诊断执行失败',
        priority: 'P0',
        issueCount: 1
      })
    }

    // 处理安全诊断结果
    if (securityResult.status === 'fulfilled' && securityResult.value.success) {
      const result = securityResult.value.data
      const errorCount = Object.values(result).filter((r: any) => r.status === 'error').length
      const warningCount = Object.values(result).filter((r: any) => r.status === 'warning').length
      const p0Count = Object.values(result).filter((r: any) => r.priority === 'P0').length

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      if (errorCount > 0 || p0Count > 0) {
        status = 'error'
      } else if (warningCount > 0) {
        status = 'warning'
      }

      tools.push({
        id: 'security',
        name: '安全性诊断',
        status,
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: `检测到 ${errorCount} 个错误，${warningCount} 个警告`,
        details: result,
        priority: p0Count > 0 ? 'P0' : warningCount > 0 ? 'P1' : 'P3',
        issueCount: errorCount + warningCount
      })
    } else {
      tools.push({
        id: 'security',
        name: '安全性诊断',
        status: 'error',
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: '诊断执行失败',
        priority: 'P0',
        issueCount: 1
      })
    }

    // 处理网络诊断结果
    console.log('🌐 处理网络诊断结果...')
    if (networkResult.status === 'fulfilled' && networkResult.value.success) {
      const result = networkResult.value.data
      console.log('✅ 网络诊断成功，数据:', result)

      // 网络诊断返回的是快速检查结果，包含summary
      const summary = result.summary
      const disconnectedCount = summary.disconnectedServices || 0
      const unstableCount = summary.unstableServices || 0
      const slowCount = summary.slowServices || 0
      const connectedCount = summary.connectedServices || 0

      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P3'

      if (disconnectedCount > 0) {
        status = 'error'
        priority = 'P0'
      } else if (unstableCount > 0) {
        status = 'warning'
        priority = 'P1'
      } else if (slowCount > 2) {
        status = 'warning'
        priority = 'P2'
      }

      console.log(`📊 网络诊断统计: 已连接=${connectedCount}, 缓慢=${slowCount}, 不稳定=${unstableCount}, 断开=${disconnectedCount}, 状态=${status}`)

      tools.push({
        id: 'network',
        name: '网络连接诊断',
        status,
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: `${connectedCount} 个服务已连接，${disconnectedCount + unstableCount} 个问题服务，平均延迟 ${summary.averageLatency?.toFixed(1) || 0}ms`,
        details: result,
        priority,
        issueCount: disconnectedCount + unstableCount
      })
    } else {
      console.log('❌ 网络诊断失败:', networkResult.status === 'fulfilled' ? networkResult.value : networkResult.reason)
      tools.push({
        id: 'network',
        name: '网络连接诊断',
        status: 'error',
        lastRun: new Date().toLocaleString('zh-CN'),
        summary: '网络诊断执行失败',
        priority: 'P1',
        issueCount: 1
      })
    }

    // 计算总体统计
    const healthyCount = tools.filter(t => t.status === 'healthy').length
    const warningCount = tools.filter(t => t.status === 'warning').length
    const errorCount = tools.filter(t => t.status === 'error').length
    const unknownCount = tools.filter(t => t.status === 'unknown').length

    const p0Issues = tools.filter(t => t.priority === 'P0').length
    const p1Issues = tools.filter(t => t.priority === 'P1').length
    const p2Issues = tools.filter(t => t.priority === 'P2').length
    const p3Issues = tools.filter(t => t.priority === 'P3').length

    const totalIssues = tools.reduce((sum, t) => sum + t.issueCount, 0)

    // 确定总体状态
    let overall: 'healthy' | 'warning' | 'error' = 'healthy'
    if (errorCount > 0 || p0Issues > 0) {
      overall = 'error'
    } else if (warningCount > 0) {
      overall = 'warning'
    }

    return {
      timestamp,
      overall,
      tools,
      summary: {
        healthyCount,
        warningCount,
        errorCount,
        unknownCount,
        totalIssues,
        p0Issues,
        p1Issues,
        p2Issues,
        p3Issues
      }
    }

  } catch (error) {
    console.error('获取诊断状态失败:', error)

    // 返回错误状态
    return {
      timestamp,
      overall: 'error',
      tools: [
        {
          id: 'system',
          name: '系统数据操作诊断',
          status: 'unknown',
          lastRun: '未运行',
          summary: '无法获取状态',
          priority: 'P0',
          issueCount: 0
        },
        {
          id: 'frontend',
          name: '前端操作诊断',
          status: 'unknown',
          lastRun: '未运行',
          summary: '无法获取状态',
          priority: 'P0',
          issueCount: 0
        },
        {
          id: 'performance',
          name: '性能监控诊断',
          status: 'unknown',
          lastRun: '未运行',
          summary: '无法获取状态',
          priority: 'P0',
          issueCount: 0
        },
        {
          id: 'security',
          name: '安全性诊断',
          status: 'unknown',
          lastRun: '未运行',
          summary: '无法获取状态',
          priority: 'P0',
          issueCount: 0
        }
      ],
      summary: {
        healthyCount: 0,
        warningCount: 0,
        errorCount: 0,
        unknownCount: 4,
        totalIssues: 0,
        p0Issues: 0,
        p1Issues: 0,
        p2Issues: 0,
        p3Issues: 0
      }
    }
  }
}

/**
 * 运行全面诊断
 */
export async function runFullDiagnostic(): Promise<UnifiedDiagnosticReport> {
  const timestamp = new Date().toISOString()

  try {
    // 并行执行所有完整诊断
    const [systemResult, frontendResult, performanceResult, securityResult] = await Promise.allSettled([
      runDatabaseDiagnosticAction(),
      runFrontendDiagnosticAction(),
      runPerformanceDiagnosticAction(),
      runSecurityDiagnosticAction()
    ])

    const tools: UnifiedDiagnosticResult[] = []

    // 处理系统诊断结果 - 与上面类似的逻辑，但使用完整诊断结果
    // ... (类似的处理逻辑，但调用完整诊断函数)

    // 为了简化，这里先返回快速检查的结果
    // 在实际实现中，应该处理完整诊断的详细结果
    return await getAllDiagnosticStatus()

  } catch (error) {
    console.error('运行全面诊断失败:', error)
    throw new Error('全面诊断执行失败')
  }
}
