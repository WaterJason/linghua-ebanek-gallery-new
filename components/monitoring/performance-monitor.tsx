"use client"

import React, { useEffect, useState, useRef } from 'react'
import { startMark, endMark, startInteraction, endInteraction } from '@/lib/monitoring/performance-monitor'

interface PerformanceMonitorProps {
  componentName: string
  children: React.ReactNode
  trackInteractions?: boolean
  trackRenders?: boolean
  tags?: Record<string, string>
}

/**
 * 性能监控组件
 * 
 * 用于包装其他组件并监控其性能，包括渲染时间和用户交互时间。
 * 
 * @example
 * ```tsx
 * <PerformanceMonitor componentName="ProductList" trackInteractions>
 *   <ProductList products={products} />
 * </PerformanceMonitor>
 * ```
 */
export function PerformanceMonitor({
  componentName,
  children,
  trackInteractions = false,
  trackRenders = true,
  tags = {}
}: PerformanceMonitorProps) {
  const renderCount = useRef(0)
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
  
  // 监控组件渲染
  useEffect(() => {
    if (!isEnabled || !trackRenders) return
    
    renderCount.current += 1
    const markName = `render_${componentName}_${renderCount.current}`
    
    startMark(markName, {
      ...tags,
      component: componentName,
      renderCount: renderCount.current.toString()
    })
    
    return () => {
      endMark(markName)
    }
  }, [componentName, trackRenders, tags, isEnabled])
  
  // 如果不启用交互监控，直接返回子组件
  if (!isEnabled || !trackInteractions) {
    return <>{children}</>
  }
  
  // 创建一个克隆的子组件，添加交互监控
  return (
    <InteractionMonitor componentName={componentName} tags={tags}>
      {children}
    </InteractionMonitor>
  )
}

interface InteractionMonitorProps {
  componentName: string
  children: React.ReactNode
  tags?: Record<string, string>
}

/**
 * 交互监控组件
 * 
 * 用于监控用户交互，如点击、输入等。
 */
function InteractionMonitor({
  componentName,
  children,
  tags = {}
}: InteractionMonitorProps) {
  // 监控点击事件
  const handleClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const targetType = target.tagName.toLowerCase()
    const targetId = target.id || 'unknown'
    const targetText = target.textContent?.trim().substring(0, 20) || 'unknown'
    
    const interactionId = startInteraction('click', `${targetType}:${targetId}:${targetText}`, {
      ...tags,
      component: componentName,
      targetType,
      targetId,
      targetText
    })
    
    // 在下一个事件循环中结束交互，以便捕获事件处理时间
    setTimeout(() => {
      endInteraction(interactionId, true)
    }, 0)
  }
  
  // 监控输入事件
  const handleInput = (e: React.FormEvent) => {
    const target = e.currentTarget as HTMLElement
    const targetType = target.tagName.toLowerCase()
    const targetId = target.id || 'unknown'
    
    const interactionId = startInteraction('input', `${targetType}:${targetId}`, {
      ...tags,
      component: componentName,
      targetType,
      targetId
    })
    
    // 在下一个事件循环中结束交互，以便捕获事件处理时间
    setTimeout(() => {
      endInteraction(interactionId, true)
    }, 0)
  }
  
  // 递归克隆子组件并添加事件监听器
  const cloneElementWithMonitoring = (element: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(element)) {
      return element
    }
    
    // 获取原始事件处理器
    const originalOnClick = element.props.onClick
    const originalOnChange = element.props.onChange
    const originalOnInput = element.props.onInput
    
    // 创建新的事件处理器
    const newProps: any = { ...element.props }
    
    // 如果有点击事件，包装它
    if (typeof originalOnClick === 'function') {
      newProps.onClick = (e: React.MouseEvent) => {
        handleClick(e)
        originalOnClick(e)
      }
    }
    
    // 如果有输入事件，包装它
    if (typeof originalOnChange === 'function') {
      newProps.onChange = (e: React.FormEvent) => {
        handleInput(e)
        originalOnChange(e)
      }
    }
    
    if (typeof originalOnInput === 'function') {
      newProps.onInput = (e: React.FormEvent) => {
        handleInput(e)
        originalOnInput(e)
      }
    }
    
    // 递归处理子元素
    if (element.props.children) {
      newProps.children = React.Children.map(element.props.children, cloneElementWithMonitoring)
    }
    
    return React.cloneElement(element, newProps)
  }
  
  return <>{React.Children.map(children, cloneElementWithMonitoring)}</>
}

/**
 * 高阶组件，用于监控组件性能
 * 
 * @example
 * ```tsx
 * const MonitoredProductList = withPerformanceMonitoring(ProductList, 'ProductList')
 * ```
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options: {
    trackInteractions?: boolean
    trackRenders?: boolean
    tags?: Record<string, string>
  } = {}
): React.FC<P> {
  const { trackInteractions = false, trackRenders = true, tags = {} } = options
  
  const MonitoredComponent: React.FC<P> = (props) => {
    return (
      <PerformanceMonitor
        componentName={componentName}
        trackInteractions={trackInteractions}
        trackRenders={trackRenders}
        tags={tags}
      >
        <Component {...props} />
      </PerformanceMonitor>
    )
  }
  
  MonitoredComponent.displayName = `Monitored(${componentName})`
  
  return MonitoredComponent
}

/**
 * 性能监控Hook，用于监控函数执行时间
 * 
 * @example
 * ```tsx
 * const { measurePerformance } = usePerformanceMonitor('ProductList')
 * 
 * const handleSearch = measurePerformance('search', async (query) => {
 *   // 搜索逻辑
 * })
 * ```
 */
export function usePerformanceMonitor(componentName: string, tags: Record<string, string> = {}) {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
  
  /**
   * 测量函数执行时间
   * @param operationName 操作名称
   * @param fn 要测量的函数
   * @returns 包装后的函数
   */
  function measurePerformance<T extends (...args: any[]) => any>(
    operationName: string,
    fn: T
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      if (!isEnabled) {
        return fn(...args)
      }
      
      const markName = `${componentName}_${operationName}`
      startMark(markName, {
        ...tags,
        component: componentName,
        operation: operationName
      })
      
      try {
        const result = fn(...args)
        
        // 如果结果是Promise，等待它完成
        if (result instanceof Promise) {
          return result
            .then(value => {
              endMark(markName)
              return value
            })
            .catch(error => {
              endMark(markName)
              throw error
            }) as ReturnType<T>
        }
        
        // 否则，立即结束标记
        endMark(markName)
        return result
      } catch (error) {
        endMark(markName)
        throw error
      }
    }
  }
  
  return { measurePerformance }
}
