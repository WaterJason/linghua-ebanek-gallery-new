/**
 * 系统监控模块
 * 
 * 本模块提供系统健康检查和监控功能，包括数据库连接检查、API响应时间监控、系统资源使用情况监控等。
 * 
 * @module 系统监控
 * @category 核心模块
 */

import prisma from './db';
import { createSystemLog } from './actions/system-actions';
import { AppError, ErrorType, ErrorCode } from './error-handler';

/**
 * 系统健康状态枚举
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * 系统组件枚举
 */
export enum SystemComponent {
  DATABASE = 'database',
  API = 'api',
  CACHE = 'cache',
  STORAGE = 'storage',
  AUTHENTICATION = 'authentication',
  SYSTEM = 'system',
}

/**
 * 健康检查结果接口
 */
export interface HealthCheckResult {
  status: HealthStatus;
  component: SystemComponent;
  details?: any;
  timestamp: Date;
}

/**
 * 系统健康状态接口
 */
export interface SystemHealthStatus {
  status: HealthStatus;
  components: HealthCheckResult[];
  timestamp: Date;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  responseTime: number;
  databaseQueryTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
}

/**
 * 检查数据库连接
 * @returns 健康检查结果
 */
export async function checkDatabaseConnection(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    // 执行简单查询检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    // 如果响应时间超过1秒，认为性能下降
    const status = responseTime > 1000 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;
    
    return {
      status,
      component: SystemComponent.DATABASE,
      details: { responseTime },
      timestamp: new Date(),
    };
  } catch (error) {
    // 记录错误日志
    await createSystemLog({
      level: 'error',
      module: 'monitoring',
      message: '数据库连接检查失败',
      details: JSON.stringify(error),
    });
    
    return {
      status: HealthStatus.UNHEALTHY,
      component: SystemComponent.DATABASE,
      details: { error: error instanceof Error ? error.message : String(error) },
      timestamp: new Date(),
    };
  }
}

/**
 * 检查系统健康状态
 * @returns 系统健康状态
 */
export async function checkSystemHealth(): Promise<SystemHealthStatus> {
  // 执行各组件的健康检查
  const databaseHealth = await checkDatabaseConnection();
  
  // 汇总健康状态
  const components = [databaseHealth];
  
  // 确定整体系统状态
  let overallStatus = HealthStatus.HEALTHY;
  
  // 如果有任何组件不健康，系统状态为不健康
  if (components.some(c => c.status === HealthStatus.UNHEALTHY)) {
    overallStatus = HealthStatus.UNHEALTHY;
  } 
  // 如果有任何组件性能下降，系统状态为性能下降
  else if (components.some(c => c.status === HealthStatus.DEGRADED)) {
    overallStatus = HealthStatus.DEGRADED;
  }
  
  return {
    status: overallStatus,
    components,
    timestamp: new Date(),
  };
}

/**
 * 收集性能指标
 * @returns 性能指标
 */
export async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  // 测量数据库查询时间
  const dbStartTime = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const databaseQueryTime = Date.now() - dbStartTime;
  
  // 获取内存使用情况
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
  
  // 获取CPU使用情况（这里只是一个占位符，实际实现可能需要使用外部库）
  const cpuUsage = 0;
  
  // 获取活跃连接数（这里只是一个占位符，实际实现可能需要使用外部库）
  const activeConnections = 0;
  
  return {
    responseTime: 0, // 这个值应该在API中间件中计算
    databaseQueryTime,
    memoryUsage,
    cpuUsage,
    activeConnections,
    timestamp: new Date(),
  };
}

/**
 * 监控中间件
 * 用于测量API响应时间并记录性能指标
 */
export function monitoringMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // 保存原始的 end 方法
    const originalEnd = res.end;
    
    // 重写 end 方法
    res.end = function(...args: any[]) {
      // 计算响应时间
      const responseTime = Date.now() - startTime;
      
      // 记录性能指标
      logPerformanceMetrics(req.path, responseTime)
        .catch(error => console.error('Failed to log performance metrics:', error));
      
      // 调用原始的 end 方法
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}

/**
 * 记录性能指标
 * @param path API路径
 * @param responseTime 响应时间
 */
async function logPerformanceMetrics(path: string, responseTime: number): Promise<void> {
  try {
    // 如果响应时间超过阈值，记录警告日志
    if (responseTime > 1000) {
      await createSystemLog({
        level: 'warning',
        module: 'monitoring',
        message: `API响应时间过长: ${path}`,
        details: JSON.stringify({ path, responseTime }),
      });
    }
    
    // 这里可以添加将性能指标保存到数据库或发送到监控系统的逻辑
  } catch (error) {
    console.error('Failed to log performance metrics:', error);
  }
}

/**
 * 系统监控错误
 */
export class MonitoringError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.SYSTEM, ErrorCode.SYSTEM_ERROR, details, 'monitoring');
    this.name = 'MonitoringError';
  }
}
