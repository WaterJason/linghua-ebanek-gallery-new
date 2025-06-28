/**
 * Sentry 错误监控集成
 *
 * 提供 Sentry 错误监控相关的功能，包括初始化、错误捕获、性能监控等。
 *
 * @module Sentry监控
 * @category 监控工具
 */

import * as Sentry from '@sentry/nextjs';
import { ErrorResponse } from '@/lib/client/error-handler';
import { AppError } from '@/lib/error-handler';

/**
 * 环境配置
 */
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const SENTRY_ENABLED = process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true';

/**
 * 初始化 Sentry
 *
 * 在应用启动时调用此函数初始化 Sentry
 */
export function initSentry(): void {
  if (!SENTRY_ENABLED || !SENTRY_DSN) {
    console.log('Sentry is disabled or DSN is not provided');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // 在开发环境中禁用性能监控，以减少控制台噪音
    enableTracing: ENVIRONMENT === 'production',
    // 忽略一些常见的错误
    ignoreErrors: [
      // 网络错误
      'Network Error',
      'Failed to fetch',
      'NetworkError',
      // 取消请求
      'AbortError',
      'The operation was aborted',
      // 用户相关错误
      'User cancelled',
      'User denied',
      // 第三方扩展或脚本错误
      'Extension context invalidated',
      'ResizeObserver loop',
      'Script error',
    ],
  });

  // 设置用户信息
  Sentry.setTag('app.version', process.env.NEXT_PUBLIC_APP_VERSION || 'unknown');

  console.log('Sentry initialized');
}

/**
 * 设置用户信息
 * @param user 用户信息
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!SENTRY_ENABLED) return;

  Sentry.setUser(user);
}

/**
 * 捕获错误
 * @param error 错误对象
 * @param context 错误上下文
 */
export function captureError(error: Error | AppError | ErrorResponse | unknown, context?: Record<string, any>): string {
  if (!SENTRY_ENABLED) return 'sentry-disabled';

  // 处理 AppError
  if (error instanceof AppError) {
    return Sentry.captureException(error, {
      tags: {
        errorType: error.type,
        errorCode: error.code,
        errorModule: error.module,
      },
      extra: {
        details: error.details,
        timestamp: error.timestamp,
        ...context,
      },
    });
  }

  // 处理 ErrorResponse
  if (typeof error === 'object' && error !== null && 'success' in error && error.success === false && 'error' in error) {
    const errorResponse = error as ErrorResponse;
    return Sentry.captureException(new Error(errorResponse.error.message), {
      tags: {
        errorType: errorResponse.error.type,
        errorCode: errorResponse.error.code,
        errorModule: errorResponse.error.module,
      },
      extra: {
        ...context,
      },
    });
  }

  // 处理普通 Error
  if (error instanceof Error) {
    return Sentry.captureException(error, {
      extra: {
        ...context,
      },
    });
  }

  // 处理未知类型的错误
  return Sentry.captureException(new Error(String(error)), {
    extra: {
      originalError: error,
      ...context,
    },
  });
}

/**
 * 捕获消息
 * @param message 消息内容
 * @param level 消息级别
 * @param context 消息上下文
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  if (!SENTRY_ENABLED) return 'sentry-disabled';

  return Sentry.captureMessage(message, {
    level,
    extra: {
      ...context,
    },
  });
}

/**
 * 开始性能监控事务
 * @param name 事务名称
 * @param options 事务选项
 */
export function startTransaction(
  name: string,
  options?: any
): any {
  if (!SENTRY_ENABLED) return {
    finish: () => {},
    setTag: () => {},
    setData: () => {},
  };

  // 使用新的 Sentry API
  return Sentry.startSpan({ name, ...options }, (span) => {
    return {
      finish: () => span?.end(),
      setTag: (key: string, value: string) => span?.setTag(key, value),
      setData: (key: string, value: any) => span?.setData(key, value),
    };
  });
}

/**
 * 设置面包屑
 * @param breadcrumb 面包屑信息
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!SENTRY_ENABLED) return;

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * 刷新 Sentry 事件
 *
 * 在应用关闭前调用此函数，确保所有事件都被发送
 */
export function flush(timeout?: number): Promise<boolean> {
  if (!SENTRY_ENABLED) return Promise.resolve(true);

  return Sentry.flush(timeout);
}

/**
 * 关闭 Sentry SDK
 */
export function close(): Promise<boolean> {
  if (!SENTRY_ENABLED) return Promise.resolve(true);

  return Sentry.close();
}

/**
 * 创建性能监控包装器
 * @param fn 要监控的函数
 * @param name 事务名称
 * @returns 包装后的函数
 */
export function withPerformanceMonitoring<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  name: string
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    if (!SENTRY_ENABLED) return fn(...args);

    const transaction = startTransaction(name);

    try {
      const result = await fn(...args);
      transaction?.finish();
      return result;
    } catch (error) {
      transaction?.finish();
      throw error;
    }
  };
}
