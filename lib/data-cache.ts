"use client"

/**
 * 数据缓存工具
 * 
 * 用于缓存API请求结果，减少重复请求，提高性能
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

class DataCache {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultExpiry: number = 5 * 60 * 1000 // 默认缓存5分钟
  
  /**
   * 获取缓存数据
   * 
   * @param key 缓存键
   * @returns 缓存数据或undefined
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key)
    
    if (!item) return undefined
    
    // 检查缓存是否过期
    if (Date.now() > item.timestamp + item.expiry) {
      this.cache.delete(key)
      return undefined
    }
    
    return item.data as T
  }
  
  /**
   * 设置缓存数据
   * 
   * @param key 缓存键
   * @param data 缓存数据
   * @param expiry 过期时间（毫秒），默认为5分钟
   */
  set<T>(key: string, data: T, expiry: number = this.defaultExpiry): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
    })
  }
  
  /**
   * 删除缓存数据
   * 
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.expiry) {
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * 获取缓存数据，如果不存在则获取并缓存
   * 
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param expiry 过期时间（毫秒），默认为5分钟
   * @returns 缓存数据或获取的数据
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    expiry: number = this.defaultExpiry
  ): Promise<T> {
    const cachedData = this.get<T>(key)
    
    if (cachedData !== undefined) {
      return cachedData
    }
    
    const data = await fetcher()
    this.set(key, data, expiry)
    return data
  }
  
  /**
   * 设置默认过期时间
   * 
   * @param expiry 过期时间（毫秒）
   */
  setDefaultExpiry(expiry: number): void {
    this.defaultExpiry = expiry
  }
  
  /**
   * 获取缓存项数量
   */
  size(): number {
    return this.cache.size
  }
  
  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// 创建全局单例实例
const dataCache = new DataCache()

export default dataCache
