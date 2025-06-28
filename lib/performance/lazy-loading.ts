/**
 * 懒加载管理器
 * 
 * 提供组件和模块的懒加载功能，支持：
 * - 动态导入
 * - 预加载策略
 * - 加载状态管理
 * - 错误处理
 */

import { ComponentType, lazy, Suspense, ReactNode } from 'react'

interface LazyComponentOptions {
  fallback?: ReactNode
  preload?: boolean
  retryCount?: number
  timeout?: number
}

interface LoadableComponent<T = {}> {
  Component: ComponentType<T>
  preload: () => Promise<void>
  isLoaded: boolean
  isLoading: boolean
  error: Error | null
}

class LazyLoadingManager {
  private loadedComponents = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()
  private preloadQueue = new Set<string>()
  private intersectionObserver?: IntersectionObserver

  constructor() {
    this.setupIntersectionObserver()
    this.setupPreloadScheduler()
  }

  /**
   * 创建懒加载组件
   */
  createLazyComponent<T = {}>(
    importFn: () => Promise<{ default: ComponentType<T> }>,
    options: LazyComponentOptions = {}
  ): LoadableComponent<T> {
    const {
      fallback = null,
      preload = false,
      retryCount = 3,
      timeout = 10000
    } = options

    let isLoaded = false
    let isLoading = false
    let error: Error | null = null
    let loadPromise: Promise<void> | null = null

    const LazyComponent = lazy(() => {
      isLoading = true
      error = null

      return this.withRetry(importFn, retryCount, timeout)
        .then(module => {
          isLoaded = true
          isLoading = false
          return module
        })
        .catch(err => {
          isLoading = false
          error = err
          throw err
        })
    })

    const WrappedComponent = (props: T) => (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )

    const preloadFn = async () => {
      if (isLoaded || loadPromise) return loadPromise

      loadPromise = importFn()
        .then(module => {
          isLoaded = true
          this.loadedComponents.set(importFn.toString(), module)
        })
        .catch(err => {
          error = err
          throw err
        })

      return loadPromise
    }

    if (preload) {
      this.schedulePreload(preloadFn)
    }

    return {
      Component: WrappedComponent,
      preload: preloadFn,
      get isLoaded() { return isLoaded },
      get isLoading() { return isLoading },
      get error() { return error }
    }
  }

  /**
   * 批量预加载组件
   */
  async preloadComponents(importFns: Array<() => Promise<any>>) {
    const promises = importFns.map(fn => this.preloadComponent(fn))
    return Promise.allSettled(promises)
  }

  /**
   * 预加载单个组件
   */
  async preloadComponent(importFn: () => Promise<any>) {
    const key = importFn.toString()
    
    if (this.loadedComponents.has(key)) {
      return this.loadedComponents.get(key)
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)
    }

    const promise = importFn().then(module => {
      this.loadedComponents.set(key, module)
      this.loadingPromises.delete(key)
      return module
    }).catch(error => {
      this.loadingPromises.delete(key)
      throw error
    })

    this.loadingPromises.set(key, promise)
    return promise
  }

  /**
   * 带重试的导入
   */
  private async withRetry<T>(
    importFn: () => Promise<T>,
    retryCount: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error

    for (let i = 0; i <= retryCount; i++) {
      try {
        return await Promise.race([
          importFn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Import timeout')), timeout)
          )
        ])
      } catch (error) {
        lastError = error as Error
        
        if (i < retryCount) {
          // 指数退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      }
    }

    throw lastError!
  }

  /**
   * 调度预加载
   */
  private schedulePreload(preloadFn: () => Promise<void>) {
    // 在空闲时间预加载
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadFn().catch(console.error)
      })
    } else {
      // 降级到 setTimeout
      setTimeout(() => {
        preloadFn().catch(console.error)
      }, 100)
    }
  }

  /**
   * 设置交叉观察器用于可视区域预加载
   */
  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const preloadKey = element.dataset.preload
            
            if (preloadKey && this.preloadQueue.has(preloadKey)) {
              this.preloadQueue.delete(preloadKey)
              // 触发预加载
              const preloadFn = (element as any).__preloadFn
              if (preloadFn) {
                preloadFn().catch(console.error)
              }
            }
          }
        })
      },
      {
        rootMargin: '50px' // 提前50px开始预加载
      }
    )
  }

  /**
   * 观察元素进行预加载
   */
  observeForPreload(element: HTMLElement, preloadFn: () => Promise<void>) {
    if (!this.intersectionObserver) return

    const preloadKey = `preload_${Date.now()}_${Math.random()}`
    element.dataset.preload = preloadKey
    ;(element as any).__preloadFn = preloadFn
    
    this.preloadQueue.add(preloadKey)
    this.intersectionObserver.observe(element)
  }

  /**
   * 停止观察元素
   */
  unobserveForPreload(element: HTMLElement) {
    if (!this.intersectionObserver) return

    const preloadKey = element.dataset.preload
    if (preloadKey) {
      this.preloadQueue.delete(preloadKey)
      delete element.dataset.preload
      delete (element as any).__preloadFn
    }
    
    this.intersectionObserver.unobserve(element)
  }

  /**
   * 设置预加载调度器
   */
  private setupPreloadScheduler() {
    if (typeof window === 'undefined') return

    // 在页面加载完成后预加载关键组件
    window.addEventListener('load', () => {
      this.preloadCriticalComponents()
    })

    // 在用户空闲时预加载次要组件
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadSecondaryComponents()
      })
    }
  }

  /**
   * 预加载关键组件
   */
  private async preloadCriticalComponents() {
    const criticalComponents = [
      // 仪表盘组件
      () => import('@/components/dashboard/dashboard-page'),
      // 导航组件
      () => import('@/components/layout/sidebar'),
      // 通知组件
      () => import('@/components/notifications/notification-center')
    ]

    await this.preloadComponents(criticalComponents)
  }

  /**
   * 预加载次要组件
   */
  private async preloadSecondaryComponents() {
    const secondaryComponents = [
      // 报表组件
      () => import('@/components/reports/sales-report-page'),
      () => import('@/components/reports/inventory-report'),
      // 设置组件
      () => import('@/components/settings/user-settings'),
      // 个性化组件
      () => import('@/components/personalization/favorites-manager')
    ]

    await this.preloadComponents(secondaryComponents)
  }

  /**
   * 获取加载统计
   */
  getLoadingStats() {
    return {
      loadedComponents: this.loadedComponents.size,
      loadingComponents: this.loadingPromises.size,
      preloadQueue: this.preloadQueue.size
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    
    this.loadedComponents.clear()
    this.loadingPromises.clear()
    this.preloadQueue.clear()
  }
}

// 创建单例实例
export const lazyLoadingManager = new LazyLoadingManager()

// 便捷方法
export const createLazyComponent = <T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: LazyComponentOptions
) => lazyLoadingManager.createLazyComponent(importFn, options)

// 预定义的懒加载组件
export const LazyComponents = {
  // 仪表盘相关
  DashboardPage: createLazyComponent(() => import('@/components/dashboard/dashboard-page')),
  DashboardCharts: createLazyComponent(() => import('@/components/dashboard/dashboard-charts')),
  
  // 报表相关
  SalesReportPage: createLazyComponent(() => import('@/components/reports/sales-report-page')),
  InventoryReport: createLazyComponent(() => import('@/components/reports/inventory-report')),
  FinanceReport: createLazyComponent(() => import('@/components/reports/finance-report')),
  
  // 管理相关
  EmployeeManagement: createLazyComponent(() => import('@/components/employees/employee-management')),
  ProductManagement: createLazyComponent(() => import('@/components/products/product-management')),
  
  // 个性化相关
  FavoritesManager: createLazyComponent(() => import('@/components/personalization/favorites-manager')),
  UserSettings: createLazyComponent(() => import('@/components/settings/user-settings')),
  
  // 其他
  NotificationCenter: createLazyComponent(() => import('@/components/notifications/notification-center')),
  MessageCenter: createLazyComponent(() => import('@/components/messages/message-center'))
}

// 导出类型
export type { LazyComponentOptions, LoadableComponent }
