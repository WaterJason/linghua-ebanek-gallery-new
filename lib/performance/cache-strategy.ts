/**
 * 缓存策略管理器
 * 
 * 提供智能缓存管理功能，支持：
 * - 多级缓存策略
 * - LRU缓存算法
 * - 缓存预热
 * - 性能监控
 */

interface CacheItem<T = any> {
  key: string
  value: T
  timestamp: number
  expiry: number
  accessCount: number
  lastAccess: number
  size: number
}

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalSize: number
  itemCount: number
  evictions: number
}

interface CacheOptions {
  maxSize?: number // 最大缓存大小（字节）
  maxItems?: number // 最大缓存项数
  defaultTTL?: number // 默认过期时间（毫秒）
  enableStats?: boolean // 是否启用统计
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private accessOrder: string[] = [] // LRU访问顺序
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    itemCount: 0,
    evictions: 0
  }

  private readonly maxSize: number
  private readonly maxItems: number
  private readonly defaultTTL: number
  private readonly enableStats: boolean

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 50 * 1024 * 1024 // 50MB
    this.maxItems = options.maxItems || 1000
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000 // 30分钟
    this.enableStats = options.enableStats !== false

    this.startCleanupTimer()
  }

  /**
   * 设置缓存项
   */
  set(key: string, value: T, ttl?: number): boolean {
    try {
      const size = this.calculateSize(value)
      const expiry = Date.now() + (ttl || this.defaultTTL)
      
      // 检查是否需要清理空间
      if (this.needsEviction(size)) {
        this.evictItems(size)
      }

      const item: CacheItem<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiry,
        accessCount: 0,
        lastAccess: Date.now(),
        size
      }

      // 如果键已存在，先移除旧项
      if (this.cache.has(key)) {
        this.removeFromAccessOrder(key)
        const oldItem = this.cache.get(key)!
        this.stats.totalSize -= oldItem.size
      }

      this.cache.set(key, item)
      this.addToAccessOrder(key)
      
      if (this.enableStats) {
        this.stats.totalSize += size
        this.stats.itemCount = this.cache.size
      }

      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * 获取缓存项
   */
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      if (this.enableStats) {
        this.stats.misses++
        this.updateHitRate()
      }
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key)
      if (this.enableStats) {
        this.stats.misses++
        this.updateHitRate()
      }
      return null
    }

    // 更新访问信息
    item.accessCount++
    item.lastAccess = Date.now()
    this.updateAccessOrder(key)

    if (this.enableStats) {
      this.stats.hits++
      this.updateHitRate()
    }

    return item.value
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    this.cache.delete(key)
    this.removeFromAccessOrder(key)
    
    if (this.enableStats) {
      this.stats.totalSize -= item.size
      this.stats.itemCount = this.cache.size
    }

    return true
  }

  /**
   * 检查缓存项是否存在
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    
    if (this.enableStats) {
      this.stats.totalSize = 0
      this.stats.itemCount = 0
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 预热缓存
   */
  async warmup(entries: Array<{ key: string; value: T; ttl?: number }>) {
    const promises = entries.map(entry => 
      Promise.resolve(this.set(entry.key, entry.value, entry.ttl))
    )
    
    await Promise.all(promises)
  }

  /**
   * 批量设置
   */
  setMany(entries: Array<{ key: string; value: T; ttl?: number }>): boolean[] {
    return entries.map(entry => this.set(entry.key, entry.value, entry.ttl))
  }

  /**
   * 批量获取
   */
  getMany(keys: string[]): Array<T | null> {
    return keys.map(key => this.get(key))
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 计算值的大小
   */
  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2 // 粗略估算（UTF-16）
    } catch {
      return 1024 // 默认1KB
    }
  }

  /**
   * 检查是否需要清理
   */
  private needsEviction(newItemSize: number): boolean {
    return (
      this.stats.totalSize + newItemSize > this.maxSize ||
      this.cache.size >= this.maxItems
    )
  }

  /**
   * 清理缓存项
   */
  private evictItems(requiredSpace: number): void {
    let freedSpace = 0
    
    // 首先清理过期项
    this.cleanupExpired()
    
    // 如果还需要空间，使用LRU策略清理
    while (
      (this.stats.totalSize + requiredSpace > this.maxSize || 
       this.cache.size >= this.maxItems) &&
      this.accessOrder.length > 0
    ) {
      const oldestKey = this.accessOrder[0]
      const item = this.cache.get(oldestKey)
      
      if (item) {
        freedSpace += item.size
        this.delete(oldestKey)
        
        if (this.enableStats) {
          this.stats.evictions++
        }
      } else {
        this.accessOrder.shift()
      }
    }
  }

  /**
   * 清理过期项
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.delete(key))
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.addToAccessOrder(key)
  }

  /**
   * 添加到访问顺序
   */
  private addToAccessOrder(key: string): void {
    this.accessOrder.push(key)
  }

  /**
   * 从访问顺序中移除
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupExpired()
      }, 5 * 60 * 1000) // 每5分钟清理一次
    }
  }
}

/**
 * 多级缓存管理器
 */
class MultiLevelCacheManager {
  private l1Cache: CacheManager // 内存缓存
  private l2Cache: CacheManager // 本地存储缓存

  constructor() {
    this.l1Cache = new CacheManager({
      maxSize: 10 * 1024 * 1024, // 10MB
      maxItems: 500,
      defaultTTL: 5 * 60 * 1000 // 5分钟
    })

    this.l2Cache = new CacheManager({
      maxSize: 50 * 1024 * 1024, // 50MB
      maxItems: 2000,
      defaultTTL: 30 * 60 * 1000 // 30分钟
    })
  }

  /**
   * 获取缓存项（多级查找）
   */
  async get<T>(key: string): Promise<T | null> {
    // 先从L1缓存查找
    let value = this.l1Cache.get<T>(key)
    if (value !== null) {
      return value
    }

    // 再从L2缓存查找
    value = this.l2Cache.get<T>(key)
    if (value !== null) {
      // 提升到L1缓存
      this.l1Cache.set(key, value)
      return value
    }

    return null
  }

  /**
   * 设置缓存项（写入所有级别）
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const l1Success = this.l1Cache.set(key, value, ttl)
    const l2Success = this.l2Cache.set(key, value, ttl)
    
    return l1Success && l2Success
  }

  /**
   * 删除缓存项
   */
  async delete(key: string): Promise<boolean> {
    const l1Success = this.l1Cache.delete(key)
    const l2Success = this.l2Cache.delete(key)
    
    return l1Success || l2Success
  }

  /**
   * 获取综合统计
   */
  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats()
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.l1Cache.clear()
    this.l2Cache.clear()
  }
}

// 创建全局缓存实例
export const globalCache = new MultiLevelCacheManager()

// 专用缓存实例
export const caches = {
  // 用户数据缓存
  userData: new CacheManager({
    maxSize: 5 * 1024 * 1024,
    maxItems: 100,
    defaultTTL: 15 * 60 * 1000
  }),

  // API响应缓存
  apiResponse: new CacheManager({
    maxSize: 20 * 1024 * 1024,
    maxItems: 500,
    defaultTTL: 5 * 60 * 1000
  }),

  // 静态资源缓存
  staticAssets: new CacheManager({
    maxSize: 100 * 1024 * 1024,
    maxItems: 1000,
    defaultTTL: 60 * 60 * 1000
  }),

  // 计算结果缓存
  computedResults: new CacheManager({
    maxSize: 10 * 1024 * 1024,
    maxItems: 200,
    defaultTTL: 10 * 60 * 1000
  })
}

// 导出类型
export type { CacheItem, CacheStats, CacheOptions }
export { CacheManager, MultiLevelCacheManager }
