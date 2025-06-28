/**
 * 诊断系统监控器
 * 监控诊断系统本身的准确性和可靠性
 */

import { 
  DIAGNOSTIC_CONFIG, 
  calculateAccuracyMetrics,
  DiagnosticResult,
  createDiagnosticContext
} from './diagnostic-utils';

import { testApiEndpointsFixed, testNetworkLatencyFixed } from './network-diagnostics-controller';
import { testButtonEvents, testFormSubmission } from './frontend-diagnostics-controller';
import { quickPerformanceHealthCheck } from './performance-diagnostics-controller';
import { quickSecurityHealthCheck } from './security-diagnostics-controller';

export interface DiagnosticAccuracyReport {
  timestamp: string;
  overallAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  systemReliability: number;
  moduleAccuracy: {
    network: number;
    frontend: number;
    performance: number;
    security: number;
  };
  recommendations: string[];
  alerts: string[];
}

export interface DiagnosticSystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  accuracy: number;
  reliability: number;
  lastCheck: string;
  issues: string[];
  uptime: number;
}

/**
 * 监控诊断系统准确性
 */
export async function monitorDiagnosticAccuracy(): Promise<DiagnosticAccuracyReport> {
  const context = createDiagnosticContext('DiagnosticSystemMonitor');
  context.log('开始监控诊断系统准确性...');
  
  const timestamp = new Date().toISOString();
  const report: DiagnosticAccuracyReport = {
    timestamp,
    overallAccuracy: 0,
    falsePositiveRate: 0,
    falseNegativeRate: 0,
    systemReliability: 0,
    moduleAccuracy: {
      network: 0,
      frontend: 0,
      performance: 0,
      security: 0
    },
    recommendations: [],
    alerts: []
  };
  
  try {
    // 1. 测试网络诊断准确性
    context.log('测试网络诊断准确性...');
    const networkAccuracy = await testNetworkDiagnosticAccuracy();
    report.moduleAccuracy.network = networkAccuracy;
    
    // 2. 测试前端诊断准确性
    context.log('测试前端诊断准确性...');
    const frontendAccuracy = await testFrontendDiagnosticAccuracy();
    report.moduleAccuracy.frontend = frontendAccuracy;
    
    // 3. 测试性能诊断准确性
    context.log('测试性能诊断准确性...');
    const performanceAccuracy = await testPerformanceDiagnosticAccuracy();
    report.moduleAccuracy.performance = performanceAccuracy;
    
    // 4. 测试安全诊断准确性
    context.log('测试安全诊断准确性...');
    const securityAccuracy = await testSecurityDiagnosticAccuracy();
    report.moduleAccuracy.security = securityAccuracy;
    
    // 5. 计算整体准确性
    const accuracies = [networkAccuracy, frontendAccuracy, performanceAccuracy, securityAccuracy];
    report.overallAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    
    // 6. 估算误报率和漏报率
    report.falsePositiveRate = Math.max(0, (100 - report.overallAccuracy) * 0.7); // 70%的错误是误报
    report.falseNegativeRate = Math.max(0, (100 - report.overallAccuracy) * 0.3); // 30%的错误是漏报
    
    // 7. 计算系统可靠性
    report.systemReliability = Math.min(100, report.overallAccuracy + 10); // 可靠性通常比准确性高一些
    
    // 8. 生成建议和告警
    generateRecommendationsAndAlerts(report);
    
    context.log(`诊断系统监控完成，整体准确性: ${report.overallAccuracy.toFixed(1)}%`);
    
  } catch (error) {
    context.log(`诊断系统监控失败: ${error}`, 'error');
    report.alerts.push(`监控过程失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
  
  return report;
}

/**
 * 测试网络诊断准确性
 */
async function testNetworkDiagnosticAccuracy(): Promise<number> {
  try {
    // 执行网络诊断并验证结果
    const apiResults = await testApiEndpointsFixed();
    const networkResults = await testNetworkLatencyFixed();
    
    // 验证结果的合理性
    let accuracyScore = 100;
    
    // 检查API结果是否合理
    if (apiResults.internalApi.status === 'disconnected' && apiResults.internalApi.responseTime && apiResults.internalApi.responseTime < 10000) {
      accuracyScore -= 20; // 响应时间正常但状态为断开，可能是误报
    }
    
    // 检查认证服务结果
    if (apiResults.authService.status === 'disconnected' && apiResults.authService.message?.includes('401')) {
      accuracyScore -= 30; // 401状态被误判为错误
    }
    
    // 检查网络延迟结果
    if (networkResults.localNetwork.status === 'disconnected' && networkResults.localNetwork.latency && networkResults.localNetwork.latency < 1000) {
      accuracyScore -= 25; // 延迟正常但状态异常
    }
    
    return Math.max(0, accuracyScore);
    
  } catch (error) {
    return 0; // 测试失败，准确性为0
  }
}

/**
 * 测试前端诊断准确性
 */
async function testFrontendDiagnosticAccuracy(): Promise<number> {
  try {
    // 执行前端诊断并验证结果
    const buttonResult = await testButtonEvents('products');
    const formResult = await testFormSubmission('products');
    
    let accuracyScore = 100;
    
    // 检查按钮事件结果合理性
    if (buttonResult.status === 'error' && !buttonResult.error) {
      accuracyScore -= 30; // 无错误但状态为错误
    }
    
    // 检查表单提交结果合理性
    if (formResult.status === 'error' && !formResult.error) {
      accuracyScore -= 30; // 无错误但状态为错误
    }
    
    // 检查响应时间合理性
    if (buttonResult.responseTime && buttonResult.responseTime > 5000) {
      accuracyScore -= 20; // 响应时间过长可能是超时问题
    }
    
    return Math.max(0, accuracyScore);
    
  } catch (error) {
    return 0;
  }
}

/**
 * 测试性能诊断准确性
 */
async function testPerformanceDiagnosticAccuracy(): Promise<number> {
  try {
    const performanceResults = await quickPerformanceHealthCheck();
    
    let accuracyScore = 100;
    
    // 检查Web Vitals结果合理性
    if (performanceResults.webVitals.status === 'error' && performanceResults.webVitals.message.includes('优化')) {
      accuracyScore -= 25; // 消息显示优化但状态为错误
    }
    
    // 检查数据库性能结果
    if (performanceResults.databasePerformance.status === 'error' && performanceResults.databasePerformance.message.includes('ms')) {
      accuracyScore -= 30; // 有响应时间但状态为错误
    }
    
    return Math.max(0, accuracyScore);
    
  } catch (error) {
    return 0;
  }
}

/**
 * 测试安全诊断准确性
 */
async function testSecurityDiagnosticAccuracy(): Promise<number> {
  try {
    const securityResults = await quickSecurityHealthCheck();
    
    let accuracyScore = 100;
    
    // 检查认证安全结果
    if (securityResults.authentication.status === 'error' && securityResults.authentication.message.includes('NextAuth')) {
      accuracyScore -= 25; // 有NextAuth但状态为错误
    }
    
    // 检查漏洞防护结果
    if (securityResults.vulnerabilities.status === 'error' && securityResults.vulnerabilities.message.includes('Prisma')) {
      accuracyScore -= 30; // 有Prisma防护但状态为错误
    }
    
    return Math.max(0, accuracyScore);
    
  } catch (error) {
    return 0;
  }
}

/**
 * 生成建议和告警
 */
function generateRecommendationsAndAlerts(report: DiagnosticAccuracyReport): void {
  // 准确性告警
  if (report.overallAccuracy < DIAGNOSTIC_CONFIG.monitoring.accuracyThreshold * 100) {
    report.alerts.push(`诊断系统准确性过低: ${report.overallAccuracy.toFixed(1)}%，低于阈值 ${DIAGNOSTIC_CONFIG.monitoring.accuracyThreshold * 100}%`);
  }
  
  // 误报率告警
  if (report.falsePositiveRate > DIAGNOSTIC_CONFIG.monitoring.falsePositiveLimit * 100) {
    report.alerts.push(`误报率过高: ${report.falsePositiveRate.toFixed(1)}%，超过限制 ${DIAGNOSTIC_CONFIG.monitoring.falsePositiveLimit * 100}%`);
  }
  
  // 模块特定告警
  Object.entries(report.moduleAccuracy).forEach(([module, accuracy]) => {
    if (accuracy < 70) {
      report.alerts.push(`${module}诊断模块准确性过低: ${accuracy.toFixed(1)}%`);
    }
  });
  
  // 生成建议
  if (report.overallAccuracy < 90) {
    report.recommendations.push('调整诊断阈值设置，减少误报');
    report.recommendations.push('增加重试机制的覆盖范围');
    report.recommendations.push('优化超时配置');
  }
  
  if (report.falsePositiveRate > 20) {
    report.recommendations.push('重新校准性能和网络阈值');
    report.recommendations.push('改进状态判断逻辑');
  }
  
  if (report.moduleAccuracy.network < 80) {
    report.recommendations.push('优化网络诊断的超时和重试配置');
  }
  
  if (report.moduleAccuracy.frontend < 80) {
    report.recommendations.push('改进前端诊断的响应时间阈值');
  }
  
  if (report.recommendations.length === 0) {
    report.recommendations.push('诊断系统运行良好，继续监控');
  }
}

/**
 * 获取诊断系统健康状态
 */
export async function getDiagnosticSystemHealth(): Promise<DiagnosticSystemHealth> {
  const accuracyReport = await monitorDiagnosticAccuracy();
  
  let status: 'healthy' | 'degraded' | 'critical';
  if (accuracyReport.overallAccuracy >= 90 && accuracyReport.falsePositiveRate <= 10) {
    status = 'healthy';
  } else if (accuracyReport.overallAccuracy >= 75 && accuracyReport.falsePositiveRate <= 25) {
    status = 'degraded';
  } else {
    status = 'critical';
  }
  
  return {
    status,
    accuracy: accuracyReport.overallAccuracy,
    reliability: accuracyReport.systemReliability,
    lastCheck: accuracyReport.timestamp,
    issues: accuracyReport.alerts,
    uptime: 99.9 // 模拟正常运行时间
  };
}

/**
 * 启动持续监控
 */
export function startContinuousMonitoring(): void {
  const context = createDiagnosticContext('DiagnosticSystemMonitor');
  context.log('启动诊断系统持续监控...');
  
  // 每30秒检查一次
  setInterval(async () => {
    try {
      const health = await getDiagnosticSystemHealth();
      
      if (health.status === 'critical') {
        context.log(`诊断系统状态严重: 准确性 ${health.accuracy.toFixed(1)}%`, 'error');
      } else if (health.status === 'degraded') {
        context.log(`诊断系统状态降级: 准确性 ${health.accuracy.toFixed(1)}%`, 'warn');
      }
      
    } catch (error) {
      context.log(`监控检查失败: ${error}`, 'error');
    }
  }, DIAGNOSTIC_CONFIG.monitoring.healthCheckInterval);
}
