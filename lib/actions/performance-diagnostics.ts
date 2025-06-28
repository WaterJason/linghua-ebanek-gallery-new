'use server'

import { runFullPerformanceDiagnostic, quickPerformanceHealthCheck } from '@/lib/performance-diagnostics-controller'

export async function runPerformanceDiagnosticAction() {
  try {
    const report = await runFullPerformanceDiagnostic()
    return {
      success: true,
      data: report
    }
  } catch (error) {
    console.error('性能诊断失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

export async function runQuickPerformanceCheckAction() {
  try {
    const status = await quickPerformanceHealthCheck()
    return {
      success: true,
      data: status
    }
  } catch (error) {
    console.error('快速性能检查失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
