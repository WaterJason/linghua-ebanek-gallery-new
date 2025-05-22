import React, { useRef, useState, useEffect, ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  height: number | string;
  itemHeight: number;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * 虚拟列表组件，用于高效渲染大量数据
 * 
 * @example
 * ```tsx
 * <VirtualList
 *   items={products}
 *   height={500}
 *   itemHeight={80}
 *   renderItem={(product, index) => (
 *     <ProductCard key={product.id} product={product} />
 *   )}
 *   onEndReached={loadMoreProducts}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  renderItem,
  height,
  itemHeight,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // 计算可见区域
  const totalHeight = items.length * itemHeight;
  const containerHeight = typeof height === 'number' ? height : 500;
  
  // 计算可见的开始和结束索引
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItemCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length - 1, startIndex + visibleItemCount);
  
  // 处理滚动事件
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      
      // 检查是否到达底部
      if (onEndReached) {
        const scrollPosition = containerRef.current.scrollTop + containerRef.current.clientHeight;
        const threshold = totalHeight * endReachedThreshold;
        
        if (scrollPosition >= threshold) {
          onEndReached();
        }
      }
    }
  };
  
  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [items.length, onEndReached, endReachedThreshold]);
  
  // 渲染可见项
  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => {
    const actualIndex = startIndex + index;
    const top = actualIndex * itemHeight;
    
    return (
      <div
        key={actualIndex}
        style={{
          position: 'absolute',
          top,
          left: 0,
          width: '100%',
          height: itemHeight,
        }}
      >
        {renderItem(item, actualIndex)}
      </div>
    );
  });
  
  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        className="virtual-list-content"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
} 