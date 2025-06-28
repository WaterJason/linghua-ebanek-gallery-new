'use server'

import { runFullFrontendDiagnostic, quickFrontendHealthCheck } from '@/lib/frontend-diagnostics-controller'

export async function runFrontendDiagnosticAction() {
  try {
    const report = await runFullFrontendDiagnostic()
    return {
      success: true,
      data: report
    }
  } catch (error) {
    console.error('前端诊断失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

export async function runQuickFrontendHealthCheckAction() {
  try {
    const status = await quickFrontendHealthCheck()
    return {
      success: true,
      data: status
    }
  } catch (error) {
    console.error('快速前端检查失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
