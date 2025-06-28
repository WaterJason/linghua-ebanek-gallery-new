/**
 * 系统日志工具
 * 提供简单的接口用于记录系统日志
 */

// 暂时注释掉，避免导入错误
// import { createLog } from './actions'

// 日志级别类型
export type LogLevel = 'info' | 'warning' | 'error' | 'debug'

// 日志数据接口
export interface LogData {
  module: string
  message: string
  details?: string
  userId?: string
  timestamp?: Date
}

/**
 * 记录系统日志
 * @param level 日志级别
 * @param data 日志数据
 */
export async function log(level: LogLevel, data: LogData) {
  try {
    // 暂时只输出到控制台，不记录到系统日志
    console.log(`[${level.toUpperCase()}][${data.module}] ${data.message}${data.details ? ': ' + data.details : ''}${data.userId ? ' (User: ' + data.userId + ')' : ''}`)

    // 返回模拟的日志对象
    return {
      id: `log-${Date.now()}`,
      level,
      ...data,
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Failed to create log:', error)
    // 即使日志记录失败，也不抛出异常，避免影响主要业务流程
    return null
  }
}

/**
 * 记录信息级别日志
 */
export async function logInfo(data: LogData) {
  return log('info', data)
}

/**
 * 记录警告级别日志
 */
export async function logWarning(data: LogData) {
  return log('warning', data)
}

/**
 * 记录错误级别日志
 */
export async function logError(data: LogData) {
  return log('error', data)
}

/**
 * 记录调试级别日志
 */
export async function logDebug(data: LogData) {
  return log('debug', data)
}

/**
 * 创建特定模块的日志记录器
 * @param module 模块名称
 */
export function createLogger(module: string) {
  return {
    info: (message: string, details?: string, userId?: string) =>
      logInfo({ module, message, details, userId }),

    warning: (message: string, details?: string, userId?: string) =>
      logWarning({ module, message, details, userId }),

    error: (message: string, details?: string, userId?: string) =>
      logError({ module, message, details, userId }),

    debug: (message: string, details?: string, userId?: string) =>
      logDebug({ module, message, details, userId })
  }
}

// 默认导出
export default {
  log,
  info: logInfo,
  warning: logWarning,
  error: logError,
  debug: logDebug,
  createLogger
}
