/**
 * Sentry Edge 配置
 * 
 * 此文件配置 Sentry 在 Edge 运行时的行为。
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENABLED = process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

if (SENTRY_ENABLED && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // 性能监控配置
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
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
    
    // 在开发环境中禁用一些功能，以减少控制台噪音
    enabled: ENVIRONMENT === 'production' || ENVIRONMENT === 'staging',
    
    // 设置应用版本
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  });
  
  console.log('Sentry edge initialized');
} else {
  console.log('Sentry edge disabled or DSN not provided');
}
