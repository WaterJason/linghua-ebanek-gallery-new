'use server'

import { runFullDatabaseDiagnostic, quickHealthCheck } from '@/lib/database-diagnostics-controller'

export async function runDatabaseDiagnosticAction() {
  try {
    const report = await runFullDatabaseDiagnostic()
    return {
      success: true,
      data: report
    }
  } catch (error) {
    console.error('数据库诊断失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

export async function runQuickHealthCheckAction() {
  try {
    const status = await quickHealthCheck()
    return {
      success: true,
      data: status
    }
  } catch (error) {
    console.error('快速健康检查失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
