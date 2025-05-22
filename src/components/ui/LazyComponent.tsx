import { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';

interface LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * 加载占位符组件
 */
const DefaultLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
  </div>
);

/**
 * 错误边界组件
 */
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('组件加载失败:', error);
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        组件加载失败，请刷新页面重试。
      </div>
    );
  }
};

/**
 * 懒加载组件，用于代码分割和动态导入
 * 
 * @example
 * ```tsx
 * <LazyComponent
 *   component={() => import('@/features/inventory/InventoryDashboard')}
 *   fallback={<CustomLoading />}
 *   props={{ filters: activeFilters }}
 * />
 * ```
 */
export function LazyComponent({
  component,
  fallback = <DefaultLoading />,
  props = {},
}: LazyComponentProps) {
  const LazyComponent = lazy(component);
  
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * 创建可复用的懒加载组件
 * 
 * @example
 * ```tsx
 * const LazyInventoryDashboard = createLazyComponent(() => 
 *   import('@/features/inventory/InventoryDashboard')
 * );
 * 
 * // 使用时：
 * <LazyInventoryDashboard filters={activeFilters} />
 * ```
 */
export function createLazyComponent<T = any>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
): React.FC<T> {
  const LazyComponentWithFallback: React.FC<T> = (props) => (
    <LazyComponent
      component={componentImport}
      fallback={fallback}
      props={props as Record<string, any>}
    />
  );
  
  return LazyComponentWithFallback;
} 