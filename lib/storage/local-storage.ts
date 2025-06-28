/**
 * 本地存储管理器
 *
 * 提供统一的本地存储接口，支持：
 * - 临时偏好缓存
 * - 用户配置缓存
 * - 数据过期管理
 * - 存储容量监控
 */

interface StorageItem<T = any> {
  value: T
  timestamp: number
  expiry?: number // 过期时间（毫秒）
  version?: string // 数据版本
}

interface CacheConfig {
  maxAge?: number // 最大缓存时间（毫秒）
  maxSize?: number // 最大缓存大小（字节）
  version?: string // 缓存版本
}

class LocalStorageManager {
  private readonly prefix = 'linghua_erp_'
  private readonly defaultMaxAge = 24 * 60 * 60 * 1000 // 24小时
  private readonly maxStorageSize = 5 * 1024 * 1024 // 5MB

  /**
   * 设置缓存项
   */
  set<T>(key: string, value: T, config?: CacheConfig): boolean {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false
      }

      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: config?.maxAge ? Date.now() + config.maxAge : Date.now() + this.defaultMaxAge,
        version: config?.version || '1.0.0'
      }

      const serialized = JSON.stringify(item)

      // 检查存储大小
      if (this.getStorageSize() + serialized.length > this.maxStorageSize) {
        this.cleanup()
      }

      localStorage.setItem(this.prefix + key, serialized)
      return true
    } catch (error) {
      console.error('LocalStorage set error:', error)
      return false
    }
  }

  /**
   * 获取缓存项
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return defaultValue || null
      }

      const item = localStorage.getItem(this.prefix + key)
      if (!item) return defaultValue || null

      const parsed: StorageItem<T> = JSON.parse(item)

      // 检查是否过期
      if (parsed.expiry && Date.now() > parsed.expiry) {
        this.remove(key)
        return defaultValue || null
      }

      return parsed.value
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return defaultValue || null
    }
  }

  /**
   * 移除缓存项
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch (error) {
      console.error('LocalStorage remove error:', error)
      return false
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))

      for (const key of keys) {
        const item = localStorage.getItem(key)
        if (item) {
          try {
            const parsed: StorageItem = JSON.parse(item)
            if (parsed.expiry && Date.now() > parsed.expiry) {
              localStorage.removeItem(key)
            }
          } catch {
            // 无效数据，直接删除
            localStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.error('LocalStorage cleanup error:', error)
    }
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo(): { used: number; available: number; total: number } {
    try {
      const used = this.getStorageSize()
      const total = this.maxStorageSize
      const available = total - used

      return { used, available, total }
    } catch (error) {
      console.error('Get storage info error:', error)
      return { used: 0, available: this.maxStorageSize, total: this.maxStorageSize }
    }
  }

  /**
   * 获取当前存储大小
   */
  private getStorageSize(): number {
    let total = 0
    for (const key in localStorage) {
      if (key.startsWith(this.prefix)) {
        total += localStorage[key].length
      }
    }
    return total
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      keys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('LocalStorage clear error:', error)
    }
  }

  /**
   * 检查是否支持本地存储
   */
  isSupported(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}

// 创建单例实例
export const localStorageManager = new LocalStorageManager()

// 便捷方法
export const storage = {
  // 用户偏好缓存
  setUserPreference: (key: string, value: any) =>
    localStorageManager.set(`user_pref_${key}`, value, { maxAge: 7 * 24 * 60 * 60 * 1000 }), // 7天

  getUserPreference: <T>(key: string, defaultValue?: T) =>
    localStorageManager.get<T>(`user_pref_${key}`, defaultValue),

  // 仪表盘布局缓存
  setDashboardLayout: (layoutId: string, layout: any) =>
    localStorageManager.set(`dashboard_${layoutId}`, layout, { maxAge: 30 * 24 * 60 * 60 * 1000 }), // 30天

  getDashboardLayout: (layoutId: string) =>
    localStorageManager.get(`dashboard_${layoutId}`),

  // 收藏项缓存
  setFavoritesCache: (favorites: any[]) =>
    localStorageManager.set('favorites_cache', favorites, { maxAge: 60 * 60 * 1000 }), // 1小时

  getFavoritesCache: () =>
    localStorageManager.get('favorites_cache'),

  // 临时数据缓存
  setTempData: (key: string, value: any, maxAge = 60 * 60 * 1000) => // 默认1小时
    localStorageManager.set(`temp_${key}`, value, { maxAge }),

  getTempData: <T>(key: string, defaultValue?: T) =>
    localStorageManager.get<T>(`temp_${key}`, defaultValue),

  // 清理方法
  cleanup: () => localStorageManager.cleanup(),
  clear: () => localStorageManager.clear(),
  getInfo: () => localStorageManager.getStorageInfo()
}

// 自动清理定时器
if (typeof window !== 'undefined') {
  // 每小时清理一次过期缓存
  setInterval(() => {
    localStorageManager.cleanup()
  }, 60 * 60 * 1000)
}
