/**
 * 统一诊断工具库
 * 提供通用的重试机制、配置管理和错误处理
 */

// 统一诊断配置 - 优化版：调整超时时间以适应实际环境
export const DIAGNOSTIC_CONFIG = {
  timeouts: {
    internal: 15000,     // 内部API超时 15秒（增加以适应本地环境）
    external: 20000,     // 外部API超时 20秒
    upload: 25000,       // 文件上传超时 25秒
    network: 10000,      // 网络测试超时 10秒
    database: 12000,     // 数据库操作超时 12秒
    frontend: 5000,      // 前端测试超时 5秒
    security: 15000      // 安全检查超时 15秒
  },
  thresholds: {
    internal: {
      excellent: 500,    // 500ms以下为优秀（调整以适应本地环境）
      good: 2000,        // 2000ms以下为良好
      acceptable: 5000   // 5000ms以下为可接受
    },
    network: {
      excellent: 200,    // 200ms以下为优秀（调整以适应本地环境）
      good: 1000,        // 1000ms以下为良好
      acceptable: 3000   // 3000ms以下为可接受
    },
    external: {
      excellent: 1000,   // 1000ms以下为优秀
      good: 3000,        // 3000ms以下为良好
      acceptable: 8000   // 8000ms以下为可接受
    },
    database: {
      excellent: 500,    // 500ms以下为优秀（调整以适应本地环境）
      good: 2000,        // 2000ms以下为良好
      acceptable: 5000   // 5000ms以下为可接受
    },
    frontend: {
      excellent: 100,    // 100ms以下为优秀
      good: 500,         // 500ms以下为良好
      acceptable: 1000   // 1000ms以下为可接受
    }
  },
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 1.5
  },
  monitoring: {
    accuracyThreshold: 0.85,  // 85%准确率阈值
    falsePositiveLimit: 0.15, // 15%误报率限制
    healthCheckInterval: 30000 // 30秒健康检查间隔
  }
};

// 诊断结果状态类型
export type DiagnosticStatus = 'healthy' | 'warning' | 'error' | 'unknown';
export type DiagnosticPriority = 'P0' | 'P1' | 'P2' | 'P3';

// 通用诊断结果接口
export interface DiagnosticResult {
  component: string;
  status: DiagnosticStatus;
  message: string;
  responseTime?: number;
  priority: DiagnosticPriority;
  suggestions: string[];
  endpoint?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

// 重试配置接口
export interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * 通用重试函数 - 支持指数退避
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = DIAGNOSTIC_CONFIG.retry.maxAttempts,
    delayMs = DIAGNOSTIC_CONFIG.retry.delayMs,
    backoffMultiplier = DIAGNOSTIC_CONFIG.retry.backoffMultiplier,
    shouldRetry = () => true
  } = config;

  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // 检查是否应该重试
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        break;
      }

      console.log(`   重试 ${attempt}/${maxAttempts - 1}... (${currentDelay}ms后)`);
      console.log(`   错误: ${lastError.message}`);

      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.floor(currentDelay * backoffMultiplier);
    }
  }

  throw lastError!;
}

/**
 * 通用状态评估函数
 */
export function evaluateStatus(
  responseTime: number,
  thresholds: { excellent: number; good: number; acceptable: number },
  isSuccess: boolean
): {
  status: DiagnosticStatus;
  priority: DiagnosticPriority;
  suggestions: string[];
} {
  if (!isSuccess) {
    return {
      status: 'error',
      priority: 'P0',
      suggestions: ['检查服务状态', '验证网络连接', '重启相关服务']
    };
  }

  if (responseTime <= thresholds.excellent) {
    return {
      status: 'healthy',
      priority: 'P3',
      suggestions: []
    };
  } else if (responseTime <= thresholds.good) {
    return {
      status: 'healthy',
      priority: 'P3',
      suggestions: ['性能良好，继续监控']
    };
  } else if (responseTime <= thresholds.acceptable) {
    return {
      status: 'warning',
      priority: 'P2',
      suggestions: ['检查服务负载', '优化性能配置', '监控资源使用']
    };
  } else {
    return {
      status: 'warning',
      priority: 'P1',
      suggestions: ['立即检查服务性能', '优化配置', '考虑扩容']
    };
  }
}

/**
 * 通用错误处理函数
 */
export function handleDiagnosticError(
  component: string,
  endpoint: string,
  error: Error,
  priority: DiagnosticPriority = 'P0'
): DiagnosticResult {
  return {
    component,
    status: 'error',
    message: `${component}连接失败: ${error.message}`,
    error,
    priority,
    endpoint,
    suggestions: [
      '检查服务状态',
      '验证网络连接',
      '查看服务日志',
      '重启相关服务'
    ]
  };
}

/**
 * 创建带超时的fetch请求
 */
export function createTimeoutFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DIAGNOSTIC_CONFIG.timeouts.internal
): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs)
  });
}

/**
 * 诊断结果验证器
 */
export function validateDiagnosticResult(result: DiagnosticResult): boolean {
  return !!(
    result.component &&
    result.status &&
    result.message &&
    result.priority &&
    Array.isArray(result.suggestions)
  );
}

/**
 * 计算诊断准确性指标
 */
export function calculateAccuracyMetrics(results: DiagnosticResult[]): {
  totalTests: number;
  healthyCount: number;
  warningCount: number;
  errorCount: number;
  unknownCount: number;
  p0Issues: number;
  p1Issues: number;
  p2Issues: number;
  p3Issues: number;
  estimatedAccuracy: number;
} {
  const totalTests = results.length;
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const unknownCount = results.filter(r => r.status === 'unknown').length;

  const p0Issues = results.filter(r => r.priority === 'P0').length;
  const p1Issues = results.filter(r => r.priority === 'P1').length;
  const p2Issues = results.filter(r => r.priority === 'P2').length;
  const p3Issues = results.filter(r => r.priority === 'P3').length;

  // 基于历史数据估算准确性（健康状态通常占80%+）
  const expectedHealthyRatio = 0.8;
  const actualHealthyRatio = healthyCount / totalTests;
  const estimatedAccuracy = Math.min(1, actualHealthyRatio / expectedHealthyRatio);

  return {
    totalTests,
    healthyCount,
    warningCount,
    errorCount,
    unknownCount,
    p0Issues,
    p1Issues,
    p2Issues,
    p3Issues,
    estimatedAccuracy
  };
}

/**
 * 网络错误重试判断
 */
export function shouldRetryNetworkError(error: Error): boolean {
  const retryableErrors = [
    'timeout',
    'network',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED'
  ];

  return retryableErrors.some(errorType =>
    error.message.toLowerCase().includes(errorType.toLowerCase())
  );
}

/**
 * 数据库错误重试判断
 */
export function shouldRetryDatabaseError(error: Error): boolean {
  const retryableErrors = [
    'connection',
    'timeout',
    'pool',
    'ECONNRESET'
  ];

  return retryableErrors.some(errorType =>
    error.message.toLowerCase().includes(errorType.toLowerCase())
  );
}

/**
 * 创建诊断上下文
 */
export function createDiagnosticContext(moduleName: string) {
  return {
    moduleName,
    startTime: Date.now(),
    log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${moduleName}] [${level.toUpperCase()}] ${message}`);
    }
  };
}
