/**
 * 性能优化模块统一入口
 * 
 * 整合所有性能优化功能：
 * - 数据持久化
 * - 懒加载
 * - 虚拟滚动
 * - 缓存策略
 * - 性能监控
 */

// 存储相关
export { storage, localStorageManager } from '../storage/local-storage'
export { databaseStorage } from '../storage/database-storage'
export { cloudSync, syncManager } from '../storage/cloud-sync'

// 懒加载相关
export { 
  lazyLoadingManager, 
  createLazyComponent, 
  LazyComponents,
  type LazyComponentOptions,
  type LoadableComponent 
} from './lazy-loading'

// 虚拟滚动相关
export { 
  useVirtualScroll, 
  VirtualScroll, 
  virtualScrollManager,
  type VirtualScrollProps 
} from './virtual-scroll'

// 缓存相关
export { 
  globalCache, 
  caches, 
  CacheManager, 
  MultiLevelCacheManager,
  type CacheItem,
  type CacheStats,
  type CacheOptions 
} from './cache-strategy'

// 性能监控相关
export { 
  performanceMonitor, 
  usePerformanceMonitor,
  type PerformanceMetric,
  type PageLoadMetrics,
  type ComponentMetrics,
  type APIMetrics,
  type MemoryMetrics 
} from './performance-monitor'

/**
 * 性能优化管理器
 * 统一管理所有性能优化功能
 */
class PerformanceManager {
  private initialized = false

  /**
   * 初始化性能优化
   */
  async initialize() {
    if (this.initialized) return

    try {
      // 1. 初始化缓存预热
      await this.warmupCaches()

      // 2. 启动性能监控
      this.startPerformanceMonitoring()

      // 3. 预加载关键组件
      await this.preloadCriticalComponents()

      // 4. 设置存储优化
      this.setupStorageOptimization()

      this.initialized = true
      console.log('Performance optimization initialized successfully')
    } catch (error) {
      console.error('Failed to initialize performance optimization:', error)
    }
  }

  /**
   * 缓存预热
   */
  private async warmupCaches() {
    // 预热用户数据缓存
    const userPrefs = storage.getUserPreference('theme', 'light')
    if (userPrefs) {
      caches.userData.set('user_theme', userPrefs)
    }

    // 预热API响应缓存
    const commonEndpoints = [
      '/api/dashboard',
      '/api/notifications',
      '/api/user/profile'
    ]

    for (const endpoint of commonEndpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          caches.apiResponse.set(endpoint, data, 5 * 60 * 1000) // 5分钟
        }
      } catch (error) {
        console.warn(`Failed to warmup cache for ${endpoint}:`, error)
      }
    }
  }

  /**
   * 启动性能监控
   */
  private startPerformanceMonitoring() {
    // 监控页面加载性能
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const metrics = performanceMonitor.getPageLoadMetrics()
        if (metrics) {
          console.log('Page load metrics:', metrics)
        }
      })

      // 监控内存使用
      setInterval(() => {
        const memoryMetrics = performanceMonitor.getMemoryMetrics()
        const latest = memoryMetrics[memoryMetrics.length - 1]
        
        if (latest && latest.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
          console.warn('High memory usage detected:', latest)
          this.optimizeMemoryUsage()
        }
      }, 60000) // 每分钟检查一次
    }
  }

  /**
   * 预加载关键组件
   */
  private async preloadCriticalComponents() {
    const criticalComponents = [
      LazyComponents.DashboardPage,
      LazyComponents.NotificationCenter,
      LazyComponents.FavoritesManager
    ]

    const preloadPromises = criticalComponents.map(component => 
      component.preload().catch(error => 
        console.warn('Failed to preload component:', error)
      )
    )

    await Promise.allSettled(preloadPromises)
  }

  /**
   * 设置存储优化
   */
  private setupStorageOptimization() {
    // 定期清理本地存储
    setInterval(() => {
      storage.cleanup()
    }, 60 * 60 * 1000) // 每小时清理一次

    // 定期同步数据
    setInterval(() => {
      if (navigator.onLine) {
        cloudSync.forceSync().catch(error => 
          console.warn('Sync failed:', error)
        )
      }
    }, 5 * 60 * 1000) // 每5分钟同步一次
  }

  /**
   * 优化内存使用
   */
  private optimizeMemoryUsage() {
    // 清理缓存
    Object.values(caches).forEach(cache => {
      const stats = cache.getStats()
      if (stats.hitRate < 0.5) { // 命中率低于50%
        cache.clear()
      }
    })

    // 清理虚拟滚动缓存
    virtualScrollManager.cleanup()

    // 强制垃圾回收（如果可用）
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc()
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      cacheStats: {
        userData: caches.userData.getStats(),
        apiResponse: caches.apiResponse.getStats(),
        staticAssets: caches.staticAssets.getStats(),
        computedResults: caches.computedResults.getStats()
      },
      loadingStats: lazyLoadingManager.getLoadingStats(),
      syncStatus: cloudSync.getSyncStatus(),
      storageInfo: storage.getInfo(),
      performanceMetrics: performanceMonitor.generateReport()
    }
  }

  /**
   * 清理所有资源
   */
  cleanup() {
    performanceMonitor.cleanup()
    virtualScrollManager.cleanup()
    Object.values(caches).forEach(cache => cache.clear())
    storage.clear()
    this.initialized = false
  }
}

// 创建全局性能管理器实例
export const performanceManager = new PerformanceManager()

/**
 * React Hook for performance optimization
 */
export function usePerformanceOptimization() {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [performanceReport, setPerformanceReport] = React.useState<any>(null)

  React.useEffect(() => {
    performanceManager.initialize().then(() => {
      setIsInitialized(true)
    })

    return () => {
      // 组件卸载时不清理全局资源
    }
  }, [])

  const getReport = React.useCallback(() => {
    const report = performanceManager.getPerformanceReport()
    setPerformanceReport(report)
    return report
  }, [])

  const optimizeMemory = React.useCallback(() => {
    performanceManager['optimizeMemoryUsage']()
  }, [])

  return {
    isInitialized,
    performanceReport,
    getReport,
    optimizeMemory
  }
}

/**
 * 便捷的性能优化工具函数
 */
export const performanceUtils = {
  // 缓存API响应
  cacheAPIResponse: (url: string, data: any, ttl = 5 * 60 * 1000) => {
    caches.apiResponse.set(url, data, ttl)
  },

  // 获取缓存的API响应
  getCachedAPIResponse: <T>(url: string): T | null => {
    return caches.apiResponse.get<T>(url)
  },

  // 预加载组件
  preloadComponent: (importFn: () => Promise<any>) => {
    return lazyLoadingManager.preloadComponent(importFn)
  },

  // 测量函数性能
  measureFunction: <T>(name: string, fn: () => T): T => {
    return performanceMonitor.measureFunction(name, fn)
  },

  // 测量异步函数性能
  measureAsyncFunction: <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsyncFunction(name, fn)
  },

  // 记录自定义指标
  recordMetric: (name: string, value: number, type?: 'timing' | 'counter' | 'gauge') => {
    performanceMonitor.recordMetric(name, value, type)
  },

  // 获取性能统计
  getStats: () => ({
    cache: Object.fromEntries(
      Object.entries(caches).map(([key, cache]) => [key, cache.getStats()])
    ),
    loading: lazyLoadingManager.getLoadingStats(),
    sync: cloudSync.getSyncStatus(),
    storage: storage.getInfo()
  })
}

// 自动初始化（在浏览器环境中）
if (typeof window !== 'undefined') {
  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceManager.initialize()
    })
  } else {
    performanceManager.initialize()
  }
}
