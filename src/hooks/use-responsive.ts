"use client";

import { useState, useEffect } from 'react';

type BreakpointKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface UseBreakpointReturn {
  isSmaller: (breakpoint: BreakpointKey) => boolean;
  isLarger: (breakpoint: BreakpointKey) => boolean;
  isEqual: (breakpoint: BreakpointKey) => boolean;
  isBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
  screenWidth: number;
  screenHeight: number;
  currentBreakpoint: BreakpointKey;
}

/**
 * 响应式断点钩子
 * 
 * 提供检测当前屏幕尺寸相对于断点的方法
 * 
 * @example
 * ```tsx
 * const { isSmaller, isLarger, currentBreakpoint } = useBreakpoint();
 * 
 * // 检查是否小于md断点
 * const isMobile = isSmaller('md');
 * 
 * // 检查是否大于等于lg断点
 * const isDesktop = isLarger('lg') || isEqual('lg');
 * ```
 */
export function useBreakpoint(): UseBreakpointReturn {
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [screenHeight, setScreenHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 获取当前断点
  const getCurrentBreakpoint = (): BreakpointKey => {
    if (screenWidth < breakpoints.sm) return 'sm';
    if (screenWidth < breakpoints.md) return 'md';
    if (screenWidth < breakpoints.lg) return 'lg';
    if (screenWidth < breakpoints.xl) return 'xl';
    return '2xl';
  };

  // 检查是否小于指定断点
  const isSmaller = (breakpoint: BreakpointKey): boolean => {
    return screenWidth < breakpoints[breakpoint];
  };

  // 检查是否大于指定断点
  const isLarger = (breakpoint: BreakpointKey): boolean => {
    return screenWidth > breakpoints[breakpoint];
  };

  // 检查是否等于指定断点
  const isEqual = (breakpoint: BreakpointKey): boolean => {
    const nextBreakpoint = getNextBreakpoint(breakpoint);
    return screenWidth >= breakpoints[breakpoint] && 
           (nextBreakpoint ? screenWidth < breakpoints[nextBreakpoint] : true);
  };

  // 检查是否在两个断点之间
  const isBetween = (min: BreakpointKey, max: BreakpointKey): boolean => {
    return screenWidth >= breakpoints[min] && screenWidth < breakpoints[max];
  };

  // 获取下一个断点
  const getNextBreakpoint = (breakpoint: BreakpointKey): BreakpointKey | null => {
    const keys = Object.keys(breakpoints) as BreakpointKey[];
    const index = keys.indexOf(breakpoint);
    return index < keys.length - 1 ? keys[index + 1] : null;
  };

  return {
    isSmaller,
    isLarger,
    isEqual,
    isBetween,
    screenWidth,
    screenHeight,
    currentBreakpoint: getCurrentBreakpoint(),
  };
}
