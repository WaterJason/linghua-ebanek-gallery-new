/**
 * 虚拟滚动管理器
 * 
 * 提供大量数据列表的虚拟滚动功能，支持：
 * - 动态高度计算
 * - 缓冲区管理
 * - 滚动性能优化
 * - 内存管理
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VirtualScrollOptions {
  itemHeight?: number | ((index: number) => number)
  overscan?: number
  scrollingDelay?: number
  getItemKey?: (index: number, item: any) => string | number
}

interface VirtualScrollState {
  scrollTop: number
  isScrolling: boolean
  startIndex: number
  endIndex: number
  visibleItems: any[]
  totalHeight: number
}

interface VirtualScrollItem {
  index: number
  item: any
  style: React.CSSProperties
  key: string | number
}

class VirtualScrollManager {
  private itemHeights = new Map<number, number>()
  private measuredItems = new Set<number>()
  private scrollElement: HTMLElement | null = null
  private resizeObserver?: ResizeObserver

  /**
   * 计算可见项目范围
   */
  calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemCount: number,
    itemHeight: number | ((index: number) => number),
    overscan = 5
  ): { startIndex: number; endIndex: number } {
    if (typeof itemHeight === 'number') {
      // 固定高度
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const endIndex = Math.min(
        itemCount - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      )
      return { startIndex, endIndex }
    } else {
      // 动态高度
      return this.calculateDynamicVisibleRange(
        scrollTop,
        containerHeight,
        itemCount,
        itemHeight,
        overscan
      )
    }
  }

  /**
   * 计算动态高度的可见范围
   */
  private calculateDynamicVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemCount: number,
    getItemHeight: (index: number) => number,
    overscan: number
  ): { startIndex: number; endIndex: number } {
    let startIndex = 0
    let endIndex = 0
    let currentTop = 0

    // 找到开始索引
    for (let i = 0; i < itemCount; i++) {
      const height = this.getItemHeight(i, getItemHeight)
      if (currentTop + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      currentTop += height
    }

    // 找到结束索引
    currentTop = this.getOffsetForIndex(startIndex, getItemHeight)
    for (let i = startIndex; i < itemCount; i++) {
      const height = this.getItemHeight(i, getItemHeight)
      if (currentTop > scrollTop + containerHeight) {
        endIndex = Math.min(itemCount - 1, i + overscan)
        break
      }
      currentTop += height
      endIndex = i
    }

    return { startIndex, endIndex }
  }

  /**
   * 获取项目高度
   */
  private getItemHeight(index: number, getItemHeight: (index: number) => number): number {
    if (this.itemHeights.has(index)) {
      return this.itemHeights.get(index)!
    }
    
    const height = getItemHeight(index)
    this.itemHeights.set(index, height)
    return height
  }

  /**
   * 获取指定索引的偏移量
   */
  getOffsetForIndex(index: number, getItemHeight: (index: number) => number): number {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += this.getItemHeight(i, getItemHeight)
    }
    return offset
  }

  /**
   * 计算总高度
   */
  calculateTotalHeight(
    itemCount: number,
    itemHeight: number | ((index: number) => number)
  ): number {
    if (typeof itemHeight === 'number') {
      return itemCount * itemHeight
    } else {
      let totalHeight = 0
      for (let i = 0; i < itemCount; i++) {
        totalHeight += this.getItemHeight(i, itemHeight)
      }
      return totalHeight
    }
  }

  /**
   * 测量项目高度
   */
  measureItem(index: number, element: HTMLElement) {
    const height = element.getBoundingClientRect().height
    this.itemHeights.set(index, height)
    this.measuredItems.add(index)
  }

  /**
   * 设置滚动元素
   */
  setScrollElement(element: HTMLElement | null) {
    if (this.scrollElement && this.resizeObserver) {
      this.resizeObserver.unobserve(this.scrollElement)
    }

    this.scrollElement = element

    if (element && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        // 容器大小变化时重新计算
        this.invalidateCache()
      })
      this.resizeObserver.observe(element)
    }
  }

  /**
   * 清除缓存
   */
  invalidateCache() {
    this.itemHeights.clear()
    this.measuredItems.clear()
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    this.invalidateCache()
  }
}

// 创建单例实例
const virtualScrollManager = new VirtualScrollManager()

/**
 * 虚拟滚动 Hook
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions = {}
) {
  const {
    itemHeight = 50,
    overscan = 5,
    scrollingDelay = 150,
    getItemKey = (index: number) => index
  } = options

  const [state, setState] = useState<VirtualScrollState>({
    scrollTop: 0,
    isScrolling: false,
    startIndex: 0,
    endIndex: Math.min(items.length - 1, overscan * 2),
    visibleItems: [],
    totalHeight: 0
  })

  const scrollElementRef = useRef<HTMLElement>(null)
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>()

  // 计算总高度
  const totalHeight = useMemo(() => {
    return virtualScrollManager.calculateTotalHeight(items.length, itemHeight)
  }, [items.length, itemHeight])

  // 计算可见项目
  const visibleItems = useMemo(() => {
    const result: VirtualScrollItem[] = []
    
    for (let i = state.startIndex; i <= state.endIndex; i++) {
      if (i >= items.length) break

      const item = items[i]
      const key = getItemKey(i, item)
      
      let top: number
      if (typeof itemHeight === 'number') {
        top = i * itemHeight
      } else {
        top = virtualScrollManager.getOffsetForIndex(i, itemHeight)
      }

      const height = typeof itemHeight === 'number' ? itemHeight : itemHeight(i)

      result.push({
        index: i,
        item,
        key,
        style: {
          position: 'absolute',
          top,
          left: 0,
          right: 0,
          height
        }
      })
    }

    return result
  }, [items, state.startIndex, state.endIndex, itemHeight, getItemKey])

  // 处理滚动事件
  const handleScroll = useCallback((event: Event) => {
    const element = event.target as HTMLElement
    const scrollTop = element.scrollTop
    const containerHeight = element.clientHeight

    // 计算可见范围
    const { startIndex, endIndex } = virtualScrollManager.calculateVisibleRange(
      scrollTop,
      containerHeight,
      items.length,
      itemHeight,
      overscan
    )

    setState(prev => ({
      ...prev,
      scrollTop,
      isScrolling: true,
      startIndex,
      endIndex
    }))

    // 设置滚动结束定时器
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current)
    }

    scrollingTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isScrolling: false }))
    }, scrollingDelay)
  }, [items.length, itemHeight, overscan, scrollingDelay])

  // 设置滚动元素
  useEffect(() => {
    const element = scrollElementRef.current
    if (!element) return

    virtualScrollManager.setScrollElement(element)
    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }
    }
  }, [handleScroll])

  // 更新总高度
  useEffect(() => {
    setState(prev => ({ ...prev, totalHeight }))
  }, [totalHeight])

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const element = scrollElementRef.current
    if (!element) return

    let scrollTop: number
    if (typeof itemHeight === 'number') {
      scrollTop = index * itemHeight
      
      if (align === 'center') {
        scrollTop -= element.clientHeight / 2 - itemHeight / 2
      } else if (align === 'end') {
        scrollTop -= element.clientHeight - itemHeight
      }
    } else {
      scrollTop = virtualScrollManager.getOffsetForIndex(index, itemHeight)
      
      if (align === 'center') {
        const height = itemHeight(index)
        scrollTop -= element.clientHeight / 2 - height / 2
      } else if (align === 'end') {
        const height = itemHeight(index)
        scrollTop -= element.clientHeight - height
      }
    }

    element.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
  }, [itemHeight])

  // 测量项目高度（用于动态高度）
  const measureItem = useCallback((index: number, element: HTMLElement) => {
    virtualScrollManager.measureItem(index, element)
  }, [])

  return {
    scrollElementRef,
    visibleItems,
    totalHeight: state.totalHeight,
    isScrolling: state.isScrolling,
    scrollToIndex,
    measureItem
  }
}

/**
 * 虚拟滚动组件
 */
export interface VirtualScrollProps<T> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  renderItem: (item: VirtualScrollItem) => React.ReactNode
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
}

export function VirtualScroll<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll
}: VirtualScrollProps<T>) {
  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    isScrolling
  } = useVirtualScroll(items, { itemHeight, overscan })

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    onScroll?.(scrollTop)
  }, [onScroll])

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div
        className="virtual-scroll-content"
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map(renderItem)}
      </div>
      
      {isScrolling && (
        <div className="virtual-scroll-indicator">
          滚动中...
        </div>
      )}
    </div>
  )
}

// 导出管理器实例
export { virtualScrollManager }
