'use server'

import { runFullSecurityDiagnostic, quickSecurityHealthCheck } from '@/lib/security-diagnostics-controller'

export async function runSecurityDiagnosticAction() {
  try {
    const report = await runFullSecurityDiagnostic()
    return {
      success: true,
      data: report
    }
  } catch (error) {
    console.error('安全诊断失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

export async function runQuickSecurityCheckAction() {
  try {
    const status = await quickSecurityHealthCheck()
    return {
      success: true,
      data: status
    }
  } catch (error) {
    console.error('快速安全检查失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
