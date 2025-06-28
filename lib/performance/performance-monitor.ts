/**
 * 性能监控管理器
 * 
 * 提供全面的性能监控功能，支持：
 * - 页面加载性能
 * - 组件渲染性能
 * - API请求性能
 * - 内存使用监控
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'timing' | 'counter' | 'gauge'
  tags?: Record<string, string>
}

interface PageLoadMetrics {
  domContentLoaded: number
  loadComplete: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
}

interface ComponentMetrics {
  name: string
  renderTime: number
  mountTime: number
  updateCount: number
  errorCount: number
}

interface APIMetrics {
  url: string
  method: string
  duration: number
  status: number
  size: number
  timestamp: number
}

interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private componentMetrics = new Map<string, ComponentMetrics>()
  private apiMetrics: APIMetrics[] = []
  private memoryMetrics: MemoryMetrics[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.setupPerformanceObservers()
    this.startMemoryMonitoring()
  }

  /**
   * 记录自定义指标
   */
  recordMetric(name: string, value: number, type: 'timing' | 'counter' | 'gauge' = 'gauge', tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags
    }

    this.metrics.push(metric)
    
    // 保持最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * 开始计时
   */
  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, 'timing')
    }
  }

  /**
   * 测量函数执行时间
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const endTiming = this.startTiming(name)
    try {
      const result = fn()
      endTiming()
      return result
    } catch (error) {
      endTiming()
      this.recordMetric(`${name}_error`, 1, 'counter')
      throw error
    }
  }

  /**
   * 测量异步函数执行时间
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endTiming = this.startTiming(name)
    try {
      const result = await fn()
      endTiming()
      return result
    } catch (error) {
      endTiming()
      this.recordMetric(`${name}_error`, 1, 'counter')
      throw error
    }
  }

  /**
   * 记录组件性能
   */
  recordComponentMetric(name: string, type: 'render' | 'mount' | 'update' | 'error', duration?: number) {
    let metric = this.componentMetrics.get(name)
    
    if (!metric) {
      metric = {
        name,
        renderTime: 0,
        mountTime: 0,
        updateCount: 0,
        errorCount: 0
      }
      this.componentMetrics.set(name, metric)
    }

    switch (type) {
      case 'render':
        metric.renderTime = duration || 0
        break
      case 'mount':
        metric.mountTime = duration || 0
        break
      case 'update':
        metric.updateCount++
        break
      case 'error':
        metric.errorCount++
        break
    }
  }

  /**
   * 记录API请求性能
   */
  recordAPIMetric(url: string, method: string, duration: number, status: number, size: number = 0) {
    const metric: APIMetrics = {
      url,
      method,
      duration,
      status,
      size,
      timestamp: Date.now()
    }

    this.apiMetrics.push(metric)
    
    // 保持最近500条记录
    if (this.apiMetrics.length > 500) {
      this.apiMetrics = this.apiMetrics.slice(-500)
    }

    // 记录到通用指标
    this.recordMetric('api_request_duration', duration, 'timing', {
      url: url.split('?')[0], // 移除查询参数
      method,
      status: status.toString()
    })
  }

  /**
   * 获取页面加载性能指标
   */
  getPageLoadMetrics(): PageLoadMetrics | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    if (!navigation) return null

    const firstPaint = paint.find(entry => entry.name === 'first-paint')?.startTime || 0
    const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint: this.getLargestContentfulPaint(),
      firstInputDelay: this.getFirstInputDelay(),
      cumulativeLayoutShift: this.getCumulativeLayoutShift()
    }
  }

  /**
   * 获取组件性能指标
   */
  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values())
  }

  /**
   * 获取API性能指标
   */
  getAPIMetrics(): APIMetrics[] {
    return [...this.apiMetrics]
  }

  /**
   * 获取内存使用指标
   */
  getMemoryMetrics(): MemoryMetrics[] {
    return [...this.memoryMetrics]
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * 获取指标统计
   */
  getMetricStats(name: string): { count: number; avg: number; min: number; max: number } | null {
    const filteredMetrics = this.metrics.filter(m => m.name === name)
    
    if (filteredMetrics.length === 0) return null

    const values = filteredMetrics.map(m => m.value)
    
    return {
      count: values.length,
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // 观察导航时间
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.navigationStart, 'timing')
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // 观察资源加载
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.recordMetric('resource_load_time', resourceEntry.duration, 'timing', {
              type: resourceEntry.initiatorType,
              name: resourceEntry.name.split('/').pop() || 'unknown'
            })
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)

      // 观察长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long_task_duration', entry.duration, 'timing')
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)

    } catch (error) {
      console.warn('Failed to setup performance observers:', error)
    }
  }

  /**
   * 获取最大内容绘制时间
   */
  private getLargestContentfulPaint(): number {
    if (typeof window === 'undefined') return 0
    
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
      return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0
    } catch {
      return 0
    }
  }

  /**
   * 获取首次输入延迟
   */
  private getFirstInputDelay(): number {
    if (typeof window === 'undefined') return 0
    
    try {
      const fidEntries = performance.getEntriesByType('first-input')
      return fidEntries.length > 0 ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : 0
    } catch {
      return 0
    }
  }

  /**
   * 获取累积布局偏移
   */
  private getCumulativeLayoutShift(): number {
    if (typeof window === 'undefined') return 0
    
    try {
      const clsEntries = performance.getEntriesByType('layout-shift')
      return clsEntries.reduce((sum, entry) => sum + (entry as any).value, 0)
    } catch {
      return 0
    }
  }

  /**
   * 开始内存监控
   */
  private startMemoryMonitoring() {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return
    }

    const collectMemoryMetrics = () => {
      const memory = (performance as any).memory
      const metric: MemoryMetrics = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      }

      this.memoryMetrics.push(metric)
      
      // 保持最近100条记录
      if (this.memoryMetrics.length > 100) {
        this.memoryMetrics = this.memoryMetrics.slice(-100)
      }

      // 记录到通用指标
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'gauge')
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'gauge')
    }

    // 立即收集一次
    collectMemoryMetrics()
    
    // 每30秒收集一次
    setInterval(collectMemoryMetrics, 30000)
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const pageLoad = this.getPageLoadMetrics()
    const components = this.getComponentMetrics()
    const apis = this.getAPIMetrics()
    const memory = this.getMemoryMetrics()

    const report = {
      timestamp: new Date().toISOString(),
      pageLoad,
      components: components.slice(0, 10), // 前10个组件
      apis: apis.slice(-10), // 最近10个API请求
      memory: memory.slice(-5), // 最近5次内存快照
      customMetrics: this.metrics.slice(-20) // 最近20个自定义指标
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
    this.componentMetrics.clear()
    this.apiMetrics = []
    this.memoryMetrics = []
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// React Hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now()

  // 记录组件挂载时间
  React.useEffect(() => {
    const mountTime = performance.now() - startTime
    performanceMonitor.recordComponentMetric(componentName, 'mount', mountTime)
    
    return () => {
      // 组件卸载时的清理
    }
  }, [componentName])

  // 记录组件更新
  React.useEffect(() => {
    performanceMonitor.recordComponentMetric(componentName, 'update')
  })

  // 记录渲染时间
  const recordRender = React.useCallback(() => {
    const renderTime = performance.now() - startTime
    performanceMonitor.recordComponentMetric(componentName, 'render', renderTime)
  }, [componentName])

  // 记录错误
  const recordError = React.useCallback(() => {
    performanceMonitor.recordComponentMetric(componentName, 'error')
  }, [componentName])

  return { recordRender, recordError }
}

// 导出类型
export type { PerformanceMetric, PageLoadMetrics, ComponentMetrics, APIMetrics, MemoryMetrics }
