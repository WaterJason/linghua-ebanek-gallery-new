import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// 限流配置类型
interface RateLimitConfig {
  limit: number // 时间窗口内允许的请求数
  windowMs: number // 时间窗口（毫秒）
  keyGenerator?: (req: NextRequest, session: any) => string // 自定义键生成器
}

// 默认限流配置
const defaultRateLimitConfig: RateLimitConfig = {
  limit: 100, // 默认每个IP每分钟100个请求
  windowMs: 60 * 1000, // 1分钟
}

// 限流记录类型
interface RateLimitRecord {
  count: number
  resetTime: number
}

// 内存存储
const memoryStore = new Map<string, RateLimitRecord>()

// 默认键生成器
function defaultKeyGenerator(req: NextRequest, session: any): string {
  // 优先使用用户ID
  if (session?.user?.id) {
    return `user:${session.user.id}`
  }
  
  // 回退到IP地址
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
  return `ip:${ip}`
}

// 清理过期记录
function cleanupExpiredRecords(): void {
  const now = Date.now()
  
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetTime <= now) {
      memoryStore.delete(key)
    }
  }
}

// 定期清理过期记录
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredRecords, 60 * 1000) // 每分钟清理一次
}

// API限流中间件
export async function withApiRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config: Partial<RateLimitConfig> = {}
): Promise<NextResponse> {
  // 合并配置
  const rateLimitConfig: RateLimitConfig = {
    ...defaultRateLimitConfig,
    ...config,
    keyGenerator: config.keyGenerator || defaultKeyGenerator
  }
  
  // 获取会话
  const session = await getServerSession(authOptions)
  
  // 生成键
  const key = rateLimitConfig.keyGenerator(request, session)
  
  // 获取当前时间
  const now = Date.now()
  
  // 获取或创建限流记录
  let record = memoryStore.get(key)
  
  if (!record || record.resetTime <= now) {
    // 创建新记录
    record = {
      count: 0,
      resetTime: now + rateLimitConfig.windowMs
    }
    memoryStore.set(key, record)
  }
  
  // 增加计数
  record.count++
  
  // 检查是否超过限制
  if (record.count > rateLimitConfig.limit) {
    // 计算重置时间
    const resetAfter = Math.ceil((record.resetTime - now) / 1000)
    
    // 返回429状态码
    return NextResponse.json(
      { error: "Too Many Requests", message: "请求频率过高，请稍后再试" },
      {
        status: 429,
        headers: {
          "Retry-After": resetAfter.toString(),
          "X-RateLimit-Limit": rateLimitConfig.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(record.resetTime / 1000).toString()
        }
      }
    )
  }
  
  // 未超过限制，执行处理程序
  const response = await handler()
  
  // 添加限流相关头信息
  response.headers.set("X-RateLimit-Limit", rateLimitConfig.limit.toString())
  response.headers.set("X-RateLimit-Remaining", (rateLimitConfig.limit - record.count).toString())
  response.headers.set("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000).toString())
  
  return response
}

// 获取限流统计信息
export function getRateLimitStats(): {
  size: number;
  records: Record<string, { count: number; resetTime: number }>;
} {
  const records: Record<string, { count: number; resetTime: number }> = {}
  
  for (const [key, record] of memoryStore.entries()) {
    records[key] = {
      count: record.count,
      resetTime: record.resetTime
    }
  }
  
  return {
    size: memoryStore.size,
    records
  }
}

// 重置特定键的限流记录
export function resetRateLimit(key: string): boolean {
  return memoryStore.delete(key)
}

// 重置所有限流记录
export function resetAllRateLimits(): void {
  memoryStore.clear()
}
