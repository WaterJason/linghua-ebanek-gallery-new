"use client";

import React, { ReactNode } from 'react';
import { useBreakpoint } from '@/src/hooks/use-responsive';

type BreakpointKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveContainerProps<T extends object = {}> {
  mobile: React.ComponentType<T>;
  desktop: React.ComponentType<T>;
  breakpoint?: BreakpointKey;
  fallback?: ReactNode;
  props?: T;
}

/**
 * 响应式容器组件
 *
 * 根据屏幕断点显示不同的组件
 *
 * @example
 * ```tsx
 * <ResponsiveContainer
 *   mobile={MobileInventory}
 *   desktop={DesktopInventory}
 *   breakpoint="lg"
 *   props={{ data, onRefresh }}
 * />
 * ```
 */
export function ResponsiveContainer<T extends object>({
  mobile: MobileComponent,
  desktop: DesktopComponent,
  breakpoint = 'md',
  fallback = null,
  props,
}: ResponsiveContainerProps<T>) {
  // 在服务器端渲染时使用fallback
  if (typeof window === 'undefined') {
    return <>{fallback}</>;
  }

  const { isSmaller } = useBreakpoint();
  const isMobile = isSmaller(breakpoint);

  return isMobile
    ? <MobileComponent {...props as T} />
    : <DesktopComponent {...props as T} />;
}
