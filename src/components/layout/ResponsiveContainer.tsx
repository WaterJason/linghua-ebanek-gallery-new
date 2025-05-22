import { ReactNode } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveContainerProps<T extends object> {
  mobile: React.ComponentType<T>;
  desktop: React.ComponentType<T>;
  breakpoint?: Breakpoint;
  fallback?: ReactNode;
  props: T;
}

/**
 * 响应式容器组件，根据断点渲染不同的组件
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

  const isMobile = useBreakpoint(breakpoint);
  
  return isMobile 
    ? <MobileComponent {...props} /> 
    : <DesktopComponent {...props} />;
} 