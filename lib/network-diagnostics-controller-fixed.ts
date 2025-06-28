/**
 * 修复后的网络诊断控制器
 * 解决了原始版本中的关键问题：
 * 1. 添加了统一的超时处理
 * 2. 修复了状态判断逻辑
 * 3. 调整了性能阈值
 * 4. 实施了重试机制
 * 5. 统一了错误处理
 */

// 配置常量
const DIAGNOSTIC_CONFIG = {
  timeouts: {
    internal: 8000,    // 内部API超时 8秒
    external: 10000,   // 外部API超时 10秒
    upload: 15000,     // 文件上传超时 15秒
    network: 5000      // 网络测试超时 5秒
  },
  thresholds: {
    internal: {
      excellent: 200,  // 200ms以下为优秀
      good: 500,       // 500ms以下为良好
      acceptable: 1000 // 1000ms以下为可接受
    },
    network: {
      excellent: 50,   // 50ms以下为优秀
      good: 150,       // 150ms以下为良好
      acceptable: 300  // 300ms以下为可接受
    },
    external: {
      excellent: 500,  // 500ms以下为优秀
      good: 1500,      // 1500ms以下为良好
      acceptable: 3000 // 3000ms以下为可接受
    }
  },
  retry: {
    maxAttempts: 3,
    delayMs: 1000
  }
};

// 通用重试函数
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = DIAGNOSTIC_CONFIG.retry.maxAttempts,
  delay: number = DIAGNOSTIC_CONFIG.retry.delayMs
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxAttempts) {
        console.log(`   重试 ${attempt}/${maxAttempts - 1}... (${delay}ms后)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// 通用状态评估函数
function evaluateStatus(
  responseTime: number,
  thresholds: { excellent: number; good: number; acceptable: number },
  isSuccess: boolean
): {
  status: 'connected' | 'slow' | 'unstable' | 'disconnected';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  suggestions: string[];
} {
  if (!isSuccess) {
    return {
      status: 'disconnected',
      priority: 'P0',
      suggestions: ['检查服务状态', '验证网络连接', '重启相关服务']
    };
  }
  
  if (responseTime <= thresholds.excellent) {
    return {
      status: 'connected',
      priority: 'P3',
      suggestions: []
    };
  } else if (responseTime <= thresholds.good) {
    return {
      status: 'connected',
      priority: 'P3',
      suggestions: ['性能良好，继续监控']
    };
  } else if (responseTime <= thresholds.acceptable) {
    return {
      status: 'slow',
      priority: 'P2',
      suggestions: ['检查服务负载', '优化性能配置', '监控资源使用']
    };
  } else {
    return {
      status: 'unstable',
      priority: 'P1',
      suggestions: ['立即检查服务性能', '优化配置', '考虑扩容']
    };
  }
}

// 通用错误处理函数
function handleDiagnosticError(
  component: string,
  endpoint: string,
  error: Error,
  priority: 'P0' | 'P1' | 'P2' = 'P0'
) {
  return {
    component,
    status: 'disconnected' as const,
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
 * 修复后的API端点测试
 */
export async function testApiEndpointsFixed() {
  console.log('🌐 测试API端点可用性 (修复版)...');
  
  // 内部API测试 - 修复了超时和重试问题
  const internalApi = await retryOperation(async () => {
    const startTime = Date.now();
    
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.internal)
    });
    
    const responseTime = Date.now() - startTime;
    const evaluation = evaluateStatus(responseTime, DIAGNOSTIC_CONFIG.thresholds.internal, response.ok);
    
    return {
      component: '内部API端点',
      status: evaluation.status,
      message: `响应时间: ${responseTime}ms, 状态: ${response.status}`,
      responseTime,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions,
      endpoint: '/api/health'
    };
  }).catch(error => handleDiagnosticError('内部API端点', '/api/health', error));
  
  // 外部API测试 - 调整了阈值
  const externalApi = await retryOperation(async () => {
    const startTime = Date.now();
    
    const response = await fetch('https://httpbin.org/status/200', {
      method: 'GET',
      signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.external)
    });
    
    const responseTime = Date.now() - startTime;
    const evaluation = evaluateStatus(responseTime, DIAGNOSTIC_CONFIG.thresholds.external, response.ok);
    
    return {
      component: '外部API端点',
      status: evaluation.status,
      message: `响应时间: ${responseTime}ms, 状态: ${response.status}`,
      responseTime,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions,
      endpoint: 'https://httpbin.org/status/200'
    };
  }).catch(error => handleDiagnosticError('外部API端点', 'https://httpbin.org/status/200', error, 'P1'));
  
  // 数据库连接测试
  const databaseConnection = await retryOperation(async () => {
    const startTime = Date.now();
    
    const response = await fetch('/api/system-info', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.internal)
    });
    
    const responseTime = Date.now() - startTime;
    const evaluation = evaluateStatus(responseTime, DIAGNOSTIC_CONFIG.thresholds.internal, response.ok);
    
    return {
      component: '数据库连接',
      status: evaluation.status,
      message: `连接时间: ${responseTime}ms, 状态: ${response.status}`,
      responseTime,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions,
      endpoint: '/api/system-info'
    };
  }).catch(error => handleDiagnosticError('数据库连接', '/api/system-info', error));
  
  // 文件存储测试
  const fileStorage = await retryOperation(async () => {
    const startTime = Date.now();
    
    const testBlob = new Blob(['diagnostic-test'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testBlob, 'diagnostic-test.txt');
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.upload)
    });
    
    const responseTime = Date.now() - startTime;
    const evaluation = evaluateStatus(responseTime, DIAGNOSTIC_CONFIG.thresholds.internal, response.ok);
    
    return {
      component: '文件存储服务',
      status: evaluation.status,
      message: `上传测试时间: ${responseTime}ms, 状态: ${response.status}`,
      responseTime,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions,
      endpoint: '/api/upload'
    };
  }).catch(error => handleDiagnosticError('文件存储服务', '/api/upload', error, 'P1'));
  
  // 认证服务测试 - 修复了状态判断逻辑
  const authService = await retryOperation(async () => {
    const startTime = Date.now();
    
    const response = await fetch('/api/auth/check-permissions', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.internal)
    });
    
    const responseTime = Date.now() - startTime;
    
    // 修复：明确定义401为正常状态
    const isSuccess = response.ok || response.status === 401;
    const evaluation = evaluateStatus(responseTime, DIAGNOSTIC_CONFIG.thresholds.internal, isSuccess);
    
    // 如果是401，调整消息说明这是正常的
    const message = response.status === 401 
      ? `认证检查正常: ${responseTime}ms, 状态: ${response.status} (未认证)`
      : `认证检查时间: ${responseTime}ms, 状态: ${response.status}`;
    
    return {
      component: '认证服务',
      status: evaluation.status,
      message,
      responseTime,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions,
      endpoint: '/api/auth/check-permissions'
    };
  }).catch(error => handleDiagnosticError('认证服务', '/api/auth/check-permissions', error));
  
  return { internalApi, externalApi, databaseConnection, fileStorage, authService };
}

/**
 * 修复后的网络延迟测试
 */
export async function testNetworkLatencyFixed() {
  console.log('⚡ 测试网络延迟 (修复版)...');
  
  // 本地网络测试 - 调整了阈值
  const localNetwork = await retryOperation(async () => {
    const startTime = Date.now();
    
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.network)
    });
    
    const latency = Date.now() - startTime;
    const evaluation = evaluateStatus(latency, DIAGNOSTIC_CONFIG.thresholds.network, response.ok);
    
    return {
      component: '本地网络延迟',
      status: evaluation.status,
      message: `延迟: ${latency}ms`,
      latency,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions
    };
  }).catch(error => handleDiagnosticError('本地网络延迟', '/api/health', error));
  
  // 互联网连接测试 - 改进了多URL测试逻辑
  const internetConnection = await retryOperation(async () => {
    const testUrls = [
      'https://www.google.com/favicon.ico',
      'https://httpbin.org/status/200'
    ];
    
    let bestLatency = Infinity;
    let successCount = 0;
    const startTime = Date.now();
    
    for (const url of testUrls) {
      try {
        const testStart = Date.now();
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(DIAGNOSTIC_CONFIG.timeouts.network)
        });
        
        if (response.ok) {
          const testLatency = Date.now() - testStart;
          bestLatency = Math.min(bestLatency, testLatency);
          successCount++;
        }
      } catch (e) {
        // 忽略单个测试失败
      }
    }
    
    const latency = bestLatency === Infinity ? Date.now() - startTime : bestLatency;
    const isSuccess = successCount > 0;
    const evaluation = evaluateStatus(latency, DIAGNOSTIC_CONFIG.thresholds.external, isSuccess);
    
    return {
      component: '互联网连接',
      status: evaluation.status,
      message: `延迟: ${latency}ms (成功测试: ${successCount}/${testUrls.length})`,
      latency,
      priority: evaluation.priority,
      suggestions: evaluation.suggestions
    };
  }).catch(error => handleDiagnosticError('互联网连接', 'external-urls', error));
  
  return { localNetwork, internetConnection };
}

// 导出配置供其他模块使用
export { DIAGNOSTIC_CONFIG };
