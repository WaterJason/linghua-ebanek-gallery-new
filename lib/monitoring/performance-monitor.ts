/**
 * 客户端性能监控工具
 * 
 * 提供客户端性能监控相关的功能，包括页面加载时间、组件渲染时间、用户交互响应时间等数据收集和分析。
 * 
 * @module 性能监控
 * @category 监控工具
 */

import { captureError } from './sentry';

// 性能指标类型
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

// 性能标记类型
export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
}

// 用户交互类型
export interface UserInteraction {
  type: string;
  target: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  tags?: Record<string, string>;
}

// 存储配置
const STORAGE_KEY = 'performance-metrics';
const MAX_METRICS_COUNT = 1000;
const MAX_STORAGE_AGE_DAYS = 7;

// 是否启用性能监控
const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';

// 当前活动的性能标记
const activeMarks: Record<string, PerformanceMark> = {};

// 当前活动的用户交互
const activeInteractions: Record<string, UserInteraction> = {};

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring(): void {
  if (!isEnabled) return;
  
  try {
    // 清理过期的性能数据
    cleanupOldMetrics();
    
    // 监听页面加载性能
    if (typeof window !== 'undefined') {
      window.addEventListener('load', capturePageLoadMetrics);
    }
    
    console.log('Performance monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

/**
 * 清理过期的性能数据
 */
function cleanupOldMetrics(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return;
    
    const metrics = JSON.parse(storedData) as PerformanceMetric[];
    const now = Date.now();
    const maxAge = MAX_STORAGE_AGE_DAYS * 24 * 60 * 60 * 1000;
    
    // 过滤掉过期的指标
    const filteredMetrics = metrics.filter(metric => 
      now - metric.timestamp < maxAge
    );
    
    // 保存过滤后的指标
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMetrics));
  } catch (error) {
    console.error('Failed to cleanup old metrics:', error);
  }
}

/**
 * 捕获页面加载性能指标
 */
function capturePageLoadMetrics(): void {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    const perfEntries = window.performance.getEntriesByType('navigation');
    if (perfEntries.length === 0) return;
    
    const navigationEntry = perfEntries[0] as PerformanceNavigationTiming;
    
    // 收集关键性能指标
    const metrics: PerformanceMetric[] = [
      {
        name: 'page_load_time',
        value: navigationEntry.loadEventEnd - navigationEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { page: window.location.pathname }
      },
      {
        name: 'dom_content_loaded',
        value: navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { page: window.location.pathname }
      },
      {
        name: 'first_paint',
        value: navigationEntry.responseEnd - navigationEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { page: window.location.pathname }
      },
      {
        name: 'ttfb',
        value: navigationEntry.responseStart - navigationEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { page: window.location.pathname }
      }
    ];
    
    // 保存指标
    saveMetrics(metrics);
    
    // 如果启用了 Web Vitals，收集 Web Vitals 指标
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
        getCLS(metric => saveMetric({
          name: 'cls',
          value: metric.value,
          unit: 'count',
          timestamp: Date.now(),
          tags: { page: window.location.pathname }
        }));
        
        getFID(metric => saveMetric({
          name: 'fid',
          value: metric.value,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { page: window.location.pathname }
        }));
        
        getLCP(metric => saveMetric({
          name: 'lcp',
          value: metric.value,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { page: window.location.pathname }
        }));
      });
    }
  } catch (error) {
    console.error('Failed to capture page load metrics:', error);
  }
}

/**
 * 保存性能指标
 * @param metrics 性能指标数组
 */
function saveMetrics(metrics: PerformanceMetric[]): void {
  if (typeof window === 'undefined' || !isEnabled) return;
  
  try {
    // 获取现有指标
    const storedData = localStorage.getItem(STORAGE_KEY);
    const existingMetrics = storedData ? JSON.parse(storedData) as PerformanceMetric[] : [];
    
    // 添加新指标
    const allMetrics = [...existingMetrics, ...metrics];
    
    // 限制指标数量
    const trimmedMetrics = allMetrics.slice(-MAX_METRICS_COUNT);
    
    // 保存指标
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedMetrics));
    
    // 如果配置了服务器端日志记录，也发送到服务器
    if (process.env.NEXT_PUBLIC_ENABLE_SERVER_LOGGING === 'true') {
      sendMetricsToServer(metrics).catch(console.error);
    }
  } catch (error) {
    console.error('Failed to save metrics:', error);
  }
}

/**
 * 保存单个性能指标
 * @param metric 性能指标
 */
function saveMetric(metric: PerformanceMetric): void {
  saveMetrics([metric]);
}

/**
 * 发送指标到服务器
 * @param metrics 性能指标数组
 */
async function sendMetricsToServer(metrics: PerformanceMetric[]): Promise<void> {
  try {
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metrics }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send metrics to server: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send metrics to server:', error);
    captureError(error);
  }
}

/**
 * 开始性能标记
 * @param name 标记名称
 * @param tags 标记标签
 */
export function startMark(name: string, tags?: Record<string, string>): void {
  if (!isEnabled) return;
  
  try {
    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      tags
    };
    
    activeMarks[name] = mark;
    
    // 如果支持 Performance API，也使用它
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}_start`);
    }
  } catch (error) {
    console.error(`Failed to start mark ${name}:`, error);
  }
}

/**
 * 结束性能标记
 * @param name 标记名称
 */
export function endMark(name: string): PerformanceMark | null {
  if (!isEnabled) return null;
  
  try {
    const mark = activeMarks[name];
    if (!mark) {
      console.warn(`Mark ${name} not found`);
      return null;
    }
    
    mark.endTime = performance.now();
    mark.duration = mark.endTime - mark.startTime;
    
    // 如果支持 Performance API，也使用它
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
    }
    
    // 保存为指标
    saveMetric({
      name: `mark_${name}`,
      value: mark.duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: mark.tags
    });
    
    // 从活动标记中删除
    delete activeMarks[name];
    
    return mark;
  } catch (error) {
    console.error(`Failed to end mark ${name}:`, error);
    return null;
  }
}

/**
 * 开始用户交互监控
 * @param type 交互类型
 * @param target 交互目标
 * @param tags 交互标签
 */
export function startInteraction(type: string, target: string, tags?: Record<string, string>): string {
  if (!isEnabled) return '';
  
  try {
    const id = `${type}_${target}_${Date.now()}`;
    const interaction: UserInteraction = {
      type,
      target,
      startTime: performance.now(),
      success: false,
      tags
    };
    
    activeInteractions[id] = interaction;
    
    return id;
  } catch (error) {
    console.error(`Failed to start interaction ${type} on ${target}:`, error);
    return '';
  }
}

/**
 * 结束用户交互监控
 * @param id 交互ID
 * @param success 是否成功
 */
export function endInteraction(id: string, success: boolean = true): UserInteraction | null {
  if (!isEnabled || !id) return null;
  
  try {
    const interaction = activeInteractions[id];
    if (!interaction) {
      console.warn(`Interaction ${id} not found`);
      return null;
    }
    
    interaction.endTime = performance.now();
    interaction.duration = interaction.endTime - interaction.startTime;
    interaction.success = success;
    
    // 保存为指标
    saveMetric({
      name: `interaction_${interaction.type}`,
      value: interaction.duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        ...interaction.tags,
        target: interaction.target,
        success: success.toString()
      }
    });
    
    // 从活动交互中删除
    delete activeInteractions[id];
    
    return interaction;
  } catch (error) {
    console.error(`Failed to end interaction ${id}:`, error);
    return null;
  }
}

/**
 * 获取所有性能指标
 */
export function getAllMetrics(): PerformanceMetric[] {
  if (typeof window === 'undefined' || !isEnabled) return [];
  
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) as PerformanceMetric[] : [];
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return [];
  }
}

/**
 * 清除所有性能指标
 */
export function clearAllMetrics(): void {
  if (typeof window === 'undefined' || !isEnabled) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear metrics:', error);
  }
}

// 初始化性能监控
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}
