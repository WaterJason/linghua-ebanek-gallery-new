"use client"

// 缓存名称
const CACHE_NAME = 'linghua-erp-cache-v1'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/finance',
  '/inventory',
  '/sales',
  '/employees',
  '/settings',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
]

// API缓存配置
interface ApiCacheConfig {
  url: string | RegExp
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate'
  expiration?: number // 缓存过期时间（毫秒）
}

// API缓存策略配置
const API_CACHE_CONFIGS: ApiCacheConfig[] = [
  {
    url: /\/api\/finance\/summary/,
    strategy: 'network-first',
    expiration: 5 * 60 * 1000 // 5分钟
  },
  {
    url: /\/api\/inventory\/overview/,
    strategy: 'network-first',
    expiration: 10 * 60 * 1000 // 10分钟
  },
  {
    url: /\/api\/sales\/summary/,
    strategy: 'network-first',
    expiration: 5 * 60 * 1000 // 5分钟
  },
  {
    url: /\/api\/employees\/list/,
    strategy: 'cache-first',
    expiration: 30 * 60 * 1000 // 30分钟
  }
]

/**
 * 初始化缓存
 */
export async function initCache(): Promise<void> {
  if (typeof caches === 'undefined') return

  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(STATIC_ASSETS)
    console.log('静态资源缓存成功')
  } catch (error) {
    console.error('缓存初始化失败:', error)
  }
}

/**
 * 清除旧缓存
 */
export async function clearOldCaches(): Promise<void> {
  if (typeof caches === 'undefined') return

  try {
    const cacheNames = await caches.keys()
    const oldCacheNames = cacheNames.filter(name => name !== CACHE_NAME)
    
    await Promise.all(
      oldCacheNames.map(cacheName => caches.delete(cacheName))
    )
    
    console.log('旧缓存清除成功')
  } catch (error) {
    console.error('清除旧缓存失败:', error)
  }
}

/**
 * 根据URL获取缓存策略
 * @param url 请求URL
 * @returns 缓存策略配置
 */
export function getCacheStrategy(url: string): ApiCacheConfig | null {
  return API_CACHE_CONFIGS.find(config => {
    if (typeof config.url === 'string') {
      return url.includes(config.url)
    } else {
      return config.url.test(url)
    }
  }) || null
}

/**
 * 从缓存中获取响应
 * @param request 请求对象
 * @returns 缓存的响应或null
 */
export async function getFromCache(request: Request): Promise<Response | null> {
  if (typeof caches === 'undefined') return null

  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // 检查缓存是否过期
      const cacheStrategy = getCacheStrategy(request.url)
      if (cacheStrategy?.expiration) {
        const cachedAt = cachedResponse.headers.get('x-cached-at')
        if (cachedAt) {
          const cachedTime = parseInt(cachedAt, 10)
          const now = Date.now()
          
          if (now - cachedTime > cacheStrategy.expiration) {
            // 缓存已过期
            return null
          }
        }
      }
      
      return cachedResponse
    }
    
    return null
  } catch (error) {
    console.error('从缓存获取响应失败:', error)
    return null
  }
}

/**
 * 将响应存储到缓存
 * @param request 请求对象
 * @param response 响应对象
 */
export async function putInCache(request: Request, response: Response): Promise<void> {
  if (typeof caches === 'undefined') return

  try {
    const cache = await caches.open(CACHE_NAME)
    
    // 创建一个新的响应对象，添加缓存时间戳
    const headers = new Headers(response.headers)
    headers.set('x-cached-at', Date.now().toString())
    
    const clonedResponse = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers
    })
    
    await cache.put(request, clonedResponse)
  } catch (error) {
    console.error('缓存响应失败:', error)
  }
}

/**
 * 网络优先策略
 * @param request 请求对象
 * @returns 响应对象
 */
export async function networkFirst(request: Request): Promise<Response> {
  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request.clone())
    
    // 将响应存入缓存
    await putInCache(request, networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    // 网络请求失败，尝试从缓存获取
    const cachedResponse = await getFromCache(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 如果缓存也没有，则抛出错误
    throw new Error('网络请求失败且缓存中没有响应')
  }
}

/**
 * 缓存优先策略
 * @param request 请求对象
 * @returns 响应对象
 */
export async function cacheFirst(request: Request): Promise<Response> {
  // 尝试从缓存获取
  const cachedResponse = await getFromCache(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  // 缓存中没有，从网络获取
  try {
    const networkResponse = await fetch(request.clone())
    
    // 将响应存入缓存
    await putInCache(request, networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    throw new Error('网络请求失败且缓存中没有响应')
  }
}

/**
 * 过时时更新策略
 * @param request 请求对象
 * @returns 响应对象
 */
export async function staleWhileRevalidate(request: Request): Promise<Response> {
  // 尝试从缓存获取
  const cachedResponse = await getFromCache(request)
  
  // 无论是否有缓存，都尝试从网络获取新的响应
  const networkResponsePromise = fetch(request.clone())
    .then(async response => {
      await putInCache(request, response.clone())
      return response
    })
    .catch(error => {
      console.error('网络请求失败:', error)
      return null
    })
  
  // 如果有缓存，立即返回缓存的响应
  if (cachedResponse) {
    // 后台更新缓存
    networkResponsePromise
    return cachedResponse
  }
  
  // 如果没有缓存，等待网络响应
  const networkResponse = await networkResponsePromise
  
  if (networkResponse) {
    return networkResponse
  }
  
  throw new Error('网络请求失败且缓存中没有响应')
}
