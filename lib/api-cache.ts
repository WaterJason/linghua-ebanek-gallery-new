import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
// 缓存配置类型
interface CacheConfig {
  maxAge: number // 缓存有效期（秒）
  staleWhileRevalidate?: number // 过期后仍可使用的时间（秒）
  varyByUser?: boolean // 是否按用户缓存
  varyByQuery?: boolean // 是否按查询参数缓存
}

// 默认缓存配置
const defaultCacheConfig: CacheConfig = {
  maxAge: 60, // 默认缓存60秒
  staleWhileRevalidate: 600, // 过期后可使用10分钟
  varyByUser: false,
  varyByQuery: true
}

// 内存缓存
const memoryCache = new Map<string, { data: any; timestamp: number }>()

// 生成缓存键
function generateCacheKey(
  request: NextRequest,
  session: any,
  config: CacheConfig
): string {
  const url = new URL(request.url)
  const path = url.pathname
  
  let key = path
  
  // 按查询参数缓存
  if (config.varyByQuery) {
    key += url.search
  }
  
  // 按用户缓存
  if (config.varyByUser && session?.user?.id) {
    key += `:user:${session.user.id}`
  }
  
  return key
}

// 检查缓存是否有效
function isCacheValid(
  cachedData: { data: any; timestamp: number },
  config: CacheConfig
): boolean {
  const now = Date.now()
  const age = (now - cachedData.timestamp) / 1000
  
  // 缓存仍然新鲜
  if (age < config.maxAge) {
    return true
  }
  
  // 缓存过期但在staleWhileRevalidate期内
  if (config.staleWhileRevalidate && age < config.maxAge + config.staleWhileRevalidate) {
    return true
  }
  
  return false
}

// API缓存中间件
export async function withApiCache(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config: Partial<CacheConfig> = {}
): Promise<NextResponse> {
  // 合并配置
  const cacheConfig: CacheConfig = { ...defaultCacheConfig, ...config }
  
  // 只缓存GET请求
  if (request.method !== "GET") {
    return handler()
  }
  
  // 获取会话
  const session = await getServerSession()
  
  // 生成缓存键
  const cacheKey = generateCacheKey(request, session, cacheConfig)
  
  // 检查缓存
  const cachedData = memoryCache.get(cacheKey)
  
  if (cachedData && isCacheValid(cachedData, cacheConfig)) {
    // 使用缓存数据
    const response = NextResponse.json(cachedData.data)
    
    // 添加缓存相关头信息
    const age = Math.floor((Date.now() - cachedData.timestamp) / 1000)
    response.headers.set("X-Cache", "HIT")
    response.headers.set("X-Cache-Age", age.toString())
    
    return response
  }
  
  // 缓存未命中或已过期，执行处理程序
  const response = await handler()
  
  try {
    // 获取响应数据
    const clonedResponse = response.clone()
    const data = await clonedResponse.json()
    
    // 缓存响应数据
    memoryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    
    // 添加缓存相关头信息
    response.headers.set("X-Cache", "MISS")
    response.headers.set("Cache-Control", `max-age=${cacheConfig.maxAge}, stale-while-revalidate=${cacheConfig.staleWhileRevalidate}`)
  } catch (error) {
    console.error("Failed to cache API response:", error)
  }
  
  return response
}

// 清除缓存
export function clearApiCache(pattern?: string): void {
  if (!pattern) {
    // 清除所有缓存
    memoryCache.clear()
    return
  }
  
  // 清除匹配模式的缓存
  const regex = new RegExp(pattern)
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key)
    }
  }
}

// 获取缓存统计信息
export function getApiCacheStats(): {
  size: number;
  keys: string[];
  totalSize: number;
} {
  const keys = Array.from(memoryCache.keys())
  
  // 估计缓存大小（粗略估计）
  let totalSize = 0
  for (const [key, value] of memoryCache.entries()) {
    // 键的大小
    totalSize += key.length * 2
    
    // 值的大小（粗略估计）
    totalSize += JSON.stringify(value.data).length * 2
  }
  
  return {
    size: memoryCache.size,
    keys,
    totalSize
  }
}

// 定期清理过期缓存
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    
    for (const [key, value] of memoryCache.entries()) {
      const age = (now - value.timestamp) / 1000
      
      // 如果缓存已过期且超过staleWhileRevalidate期，则删除
      if (age > defaultCacheConfig.maxAge + (defaultCacheConfig.staleWhileRevalidate || 0)) {
        memoryCache.delete(key)
      }
    }
  }, 60000) // 每分钟清理一次
}
