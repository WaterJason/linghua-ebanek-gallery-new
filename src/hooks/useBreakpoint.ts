import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointValues: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * 用于检测当前视口是否小于指定断点的Hook
 * @param breakpoint 断点名称（sm, md, lg, xl, 2xl）
 * @returns 当前视口宽度是否小于指定断点
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  // 默认为false以避免服务器渲染不匹配
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState<boolean>(false);

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpointValues[breakpoint]);
    };

    // 初始检查
    checkBreakpoint();

    // 监听窗口大小变化
    window.addEventListener('resize', checkBreakpoint);
    
    // 清除事件监听器
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isBelowBreakpoint;
}

/**
 * 检测当前视口是否匹配指定断点范围的Hook
 * @returns 包含各断点匹配状态的对象
 */
export function useBreakpoints() {
  const [breakpoints, setBreakpoints] = useState({
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
  });

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isSm: width >= breakpointValues.sm && width < breakpointValues.md,
        isMd: width >= breakpointValues.md && width < breakpointValues.lg,
        isLg: width >= breakpointValues.lg && width < breakpointValues.xl,
        isXl: width >= breakpointValues.xl && width < breakpointValues['2xl'],
        is2xl: width >= breakpointValues['2xl'],
      });
    };

    // 初始检查
    checkBreakpoints();

    // 监听窗口大小变化
    window.addEventListener('resize', checkBreakpoints);
    
    // 清除事件监听器
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  return breakpoints;
} 