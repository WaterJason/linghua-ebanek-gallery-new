'use server'

import { runNetworkDiagnostic, runQuickNetworkCheck } from '../network-diagnostics-controller'

/**
 * 运行网络连接诊断 Action
 */
export async function runNetworkDiagnosticAction() {
  try {
    console.log('🌐 开始执行网络连接诊断...')
    
    const result = await runNetworkDiagnostic()
    
    console.log('✅ 网络连接诊断完成')
    
    return {
      success: true,
      data: result,
      message: '网络连接诊断完成'
    }
  } catch (error) {
    console.error('❌ 网络连接诊断失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络连接诊断失败',
      data: null
    }
  }
}

/**
 * 运行快速网络检查 Action
 */
export async function runQuickNetworkCheckAction() {
  try {
    console.log('⚡ 开始执行快速网络检查...')
    
    const result = await runQuickNetworkCheck()
    
    console.log('✅ 快速网络检查完成')
    
    return {
      success: true,
      data: result,
      message: '快速网络检查完成'
    }
  } catch (error) {
    console.error('❌ 快速网络检查失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '快速网络检查失败',
      data: null
    }
  }
}
