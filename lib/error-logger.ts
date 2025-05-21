/**
 * 全局错误日志记录器
 * 用于捕获和记录系统中的错误
 */

import { createLogger } from './logger'

// 创建错误日志记录器
const errorLogger = createLogger('错误处理')

/**
 * 记录错误
 * @param error 错误对象
 * @param context 错误上下文
 * @param userId 用户ID（可选）
 */
export async function logError(error: unknown, context: string, userId?: string) {
  try {
    // 提取错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 记录错误日志
    await errorLogger.error(
      `${context}: ${errorMessage}`,
      errorStack,
      userId
    )
  } catch (logError) {
    // 如果日志记录失败，至少在控制台输出
    console.error('Failed to log error:', logError)
    console.error('Original error:', error)
    console.error('Context:', context)
  }
}

/**
 * 全局错误处理函数
 * 可以在应用的入口点设置为全局错误处理器
 */
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    // 客户端错误处理
    window.onerror = (message, source, lineno, colno, error) => {
      logError(
        error || message, 
        `客户端错误 [${source}:${lineno}:${colno}]`
      )
      return false // 允许默认错误处理继续执行
    }
    
    // 未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      logError(
        event.reason, 
        '未处理的Promise拒绝'
      )
    })
  } else {
    // 服务器端错误处理
    process.on('uncaughtException', (error) => {
      logError(error, '未捕获的异常')
      // 严重错误，应该退出进程
      console.error('未捕获的异常，进程将退出')
      process.exit(1)
    })
    
    process.on('unhandledRejection', (reason) => {
      logError(reason, '未处理的Promise拒绝')
    })
  }
}

// 导出默认对象
export default {
  logError,
  setupGlobalErrorHandler
}
