"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  height: string | number;
  itemHeight: number;
  renderItem: (item: T) => React.ReactNode;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  isLoading?: boolean;
  loadingIndicator?: React.ReactNode;
}

/**
 * 虚拟列表组件
 * 
 * 用于高效渲染大量数据的列表，只渲染可见区域的项目
 * 支持无限滚动加载更多数据
 * 
 * @example
 * ```tsx
 * <VirtualList
 *   items={transactions}
 *   height="calc(100vh - 200px)"
 *   itemHeight={80}
 *   onEndReached={loadMore}
 *   renderItem={(item) => <TransactionItem transaction={item} />}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  onEndReached,
  endReachedThreshold = 0.8,
  isLoading = false,
  loadingIndicator = <div className="py-4 text-center">加载中...</div>,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [hasCalledEndReached, setHasCalledEndReached] = useState(false);
  
  // 创建虚拟列表
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });
  
  // 监听滚动位置，触发加载更多
  useEffect(() => {
    if (!onEndReached || isLoading || hasCalledEndReached) return;
    
    const scrollElement = parentRef.current;
    if (!scrollElement) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      
      if (scrollPercentage > endReachedThreshold) {
        setHasCalledEndReached(true);
        onEndReached();
      }
    };
    
    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [onEndReached, isLoading, hasCalledEndReached, endReachedThreshold]);
  
  // 重置加载更多状态
  useEffect(() => {
    if (!isLoading) {
      setHasCalledEndReached(false);
    }
  }, [isLoading]);
  
  return (
    <div
      ref={parentRef}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index])}
          </div>
        ))}
      </div>
      
      {isLoading && items.length > 0 && (
        <div className="py-2">{loadingIndicator}</div>
      )}
    </div>
  );
}
