/**
 * 健康检查 API 路由
 * 
 * 提供系统健康状态检查的 API 端点
 */

import { NextResponse } from 'next/server';
import { checkSystemHealth, HealthStatus } from '@/lib/monitoring';
import { handleError, formatErrorResponse } from '@/lib/error-handler';

/**
 * GET 处理函数
 * 
 * 获取系统健康状态
 */
export async function GET() {
  try {
    // 检查系统健康状态
    const healthStatus = await checkSystemHealth();
    
    // 根据健康状态设置 HTTP 状态码
    let statusCode = 200;
    if (healthStatus.status === HealthStatus.DEGRADED) {
      statusCode = 200; // 仍然返回 200，但包含降级状态
    } else if (healthStatus.status === HealthStatus.UNHEALTHY) {
      statusCode = 503; // Service Unavailable
    }
    
    // 返回健康状态
    return NextResponse.json(
      { 
        success: true, 
        data: healthStatus 
      },
      { status: statusCode }
    );
  } catch (error) {
    // 处理错误
    const appError = await handleError(error, 'health-api');
    
    // 返回错误响应
    return NextResponse.json(
      formatErrorResponse(appError),
      { status: 500 }
    );
  }
}
