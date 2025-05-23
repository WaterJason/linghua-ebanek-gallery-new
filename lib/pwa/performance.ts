"use client"

/**
 * 性能监控工具
 * 用于收集和分析应用性能指标
 */

// 定义性能指标类型
interface PerformanceMetrics {
  // 页面加载时间
  pageLoadTime?: number;
  // 首次内容绘制时间
  firstContentfulPaint?: number;
  // 最大内容绘制时间
  largestContentfulPaint?: number;
  // 首次输入延迟
  firstInputDelay?: number;
  // 累积布局偏移
  cumulativeLayoutShift?: number;
  // 首次可交互时间
  timeToInteractive?: number;
  // 总阻塞时间
  totalBlockingTime?: number;
  // 自定义指标
  custom?: Record<string, number>;
}

// 定义用户交互事件类型
interface UserInteractionEvent {
  // 事件类型
  type: string;
  // 事件目标
  target: string;
  // 事件时间戳
  timestamp: number;
  // 事件处理时间
  processingTime?: number;
  // 事件延迟时间
  delay?: number;
}

// 性能数据存储
let performanceData: {
  metrics: PerformanceMetrics;
  interactions: UserInteractionEvent[];
  errors: any[];
  resources: any[];
} = {
  metrics: {},
  interactions: [],
  errors: [],
  resources: []
};

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // 监听页面加载完成事件
  window.addEventListener('load', collectPageLoadMetrics);
  
  // 监听用户交互事件
  monitorUserInteractions();
  
  // 监听资源加载
  monitorResourceLoading();
  
  // 监听错误
  monitorErrors();
  
  // 监听导航事件
  monitorNavigation();
}

/**
 * 收集页面加载性能指标
 */
function collectPageLoadMetrics() {
  if (typeof window === 'undefined' || !window.performance) return;
  
  // 基本导航计时
  const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationTiming) {
    performanceData.metrics.pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.startTime;
  }
  
  // 绘制计时
  const paintEntries = performance.getEntriesByType('paint');
  for (const entry of paintEntries) {
    const paintEntry = entry as PerformancePaintTiming;
    if (paintEntry.name === 'first-contentful-paint') {
      performanceData.metrics.firstContentfulPaint = paintEntry.startTime;
    }
  }
  
  // Web Vitals 指标
  if ('PerformanceObserver' in window) {
    // 最大内容绘制
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceData.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.error('LCP monitoring error:', e);
    }
    
    // 首次输入延迟
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          const firstInputEntry = entry as any;
          performanceData.metrics.firstInputDelay = firstInputEntry.processingStart - firstInputEntry.startTime;
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.error('FID monitoring error:', e);
    }
    
    // 累积布局偏移
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        performanceData.metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.error('CLS monitoring error:', e);
    }
  }
  
  // 发送收集的指标
  setTimeout(() => {
    sendPerformanceData();
  }, 5000);
}

/**
 * 监控用户交互
 */
function monitorUserInteractions() {
  if (typeof window === 'undefined') return;
  
  const interactionEvents = ['click', 'keydown', 'scroll', 'touchstart'];
  
  interactionEvents.forEach(eventType => {
    window.addEventListener(eventType, (event) => {
      const target = event.target as HTMLElement;
      const targetInfo = target.tagName + (target.id ? `#${target.id}` : '') + 
                        (target.className ? `.${target.className.replace(/\s+/g, '.')}` : '');
      
      const startTime = performance.now();
      
      // 使用 requestAnimationFrame 来测量事件处理时间
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          performanceData.interactions.push({
            type: eventType,
            target: targetInfo,
            timestamp: startTime,
            processingTime: processingTime,
            delay: 0 // 这里简化处理，实际应该计算事件队列延迟
          });
          
          // 如果处理时间过长，记录为潜在问题
          if (processingTime > 50) {
            console.warn(`Slow ${eventType} event on ${targetInfo}: ${processingTime.toFixed(2)}ms`);
          }
        });
      });
    }, { passive: true });
  });
}

/**
 * 监控资源加载
 */
function monitorResourceLoading() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
  
  try {
    const resourceObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // 只关注慢资源
        if (resourceEntry.duration > 1000) {
          performanceData.resources.push({
            name: resourceEntry.name,
            type: resourceEntry.initiatorType,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
            timestamp: resourceEntry.startTime
          });
        }
      }
    });
    
    resourceObserver.observe({ type: 'resource', buffered: true });
  } catch (e) {
    console.error('Resource monitoring error:', e);
  }
}

/**
 * 监控错误
 */
function monitorErrors() {
  if (typeof window === 'undefined') return;
  
  // 监听全局错误
  window.addEventListener('error', (event) => {
    performanceData.errors.push({
      type: 'error',
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: performance.now()
    });
  });
  
  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    performanceData.errors.push({
      type: 'unhandledrejection',
      message: event.reason?.message || String(event.reason),
      timestamp: performance.now()
    });
  });
}

/**
 * 监控导航事件
 */
function monitorNavigation() {
  if (typeof window === 'undefined') return;
  
  let navigationStartTime = performance.now();
  
  // 在单页应用中，可以监听路由变化
  // 这里使用一个简单的方法来检测URL变化
  let lastUrl = window.location.href;
  
  // 定期检查URL是否变化
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      // URL已变化，记录导航时间
      const navigationTime = performance.now() - navigationStartTime;
      
      // 记录自定义指标
      if (!performanceData.metrics.custom) {
        performanceData.metrics.custom = {};
      }
      performanceData.metrics.custom[`navigation_${lastUrl}_to_${currentUrl}`] = navigationTime;
      
      // 重置计时器
      navigationStartTime = performance.now();
      lastUrl = currentUrl;
    }
  }, 500);
}

/**
 * 发送性能数据到服务器
 */
function sendPerformanceData() {
  // 在实际应用中，这里应该将数据发送到分析服务器
  console.log('Performance data collected:', performanceData);
  
  // 可以使用 fetch API 发送数据
  /*
  fetch('/api/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(performanceData),
  }).catch(error => {
    console.error('Failed to send performance data:', error);
  });
  */
  
  // 重置收集的数据
  performanceData = {
    metrics: {},
    interactions: [],
    errors: [],
    resources: []
  };
}

/**
 * 记录自定义性能指标
 * @param name 指标名称
 * @param value 指标值
 */
export function recordCustomMetric(name: string, value: number) {
  if (!performanceData.metrics.custom) {
    performanceData.metrics.custom = {};
  }
  performanceData.metrics.custom[name] = value;
}

/**
 * 开始测量自定义操作
 * @param operationName 操作名称
 * @returns 测量ID
 */
export function startMeasure(operationName: string): string {
  if (typeof performance === 'undefined') return '';
  
  const measureId = `${operationName}_${Date.now()}`;
  performance.mark(`${measureId}_start`);
  return measureId;
}

/**
 * 结束测量自定义操作并记录结果
 * @param measureId 测量ID
 */
export function endMeasure(measureId: string) {
  if (typeof performance === 'undefined' || !measureId) return;
  
  try {
    performance.mark(`${measureId}_end`);
    performance.measure(measureId, `${measureId}_start`, `${measureId}_end`);
    
    const entries = performance.getEntriesByName(measureId, 'measure');
    if (entries.length > 0) {
      recordCustomMetric(measureId, entries[0].duration);
    }
    
    // 清理标记
    performance.clearMarks(`${measureId}_start`);
    performance.clearMarks(`${measureId}_end`);
    performance.clearMeasures(measureId);
  } catch (e) {
    console.error('Error measuring operation:', e);
  }
}
