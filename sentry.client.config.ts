/**
 * Sentry 客户端配置
 * 
 * 此文件配置 Sentry 在浏览器端的行为。
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
    
    // 会话重放配置（可选）
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
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
    
    // 集成配置
    integrations: [
      new Sentry.BrowserTracing({
        // 设置初始事务名称
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          undefined,
          undefined,
          false
        ),
      }),
      new Sentry.Replay(),
    ],
  });
  
  console.log('Sentry client initialized');
} else {
  console.log('Sentry client disabled or DSN not provided');
}
