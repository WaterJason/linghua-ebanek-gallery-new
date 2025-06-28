"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, RefreshCwIcon } from "lucide-react"
import { UndoRedoControls } from "@/components/undo-redo-controls"
import { GlobalProgressMonitor } from "@/components/progress-indicators"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface ModernPageContainerProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  favoriteButton?: ReactNode
  children: ReactNode
  className?: string
  onRefresh?: () => void
  isLoading?: boolean
  showUndoRedo?: boolean // 是否显示撤销/重做控件
  showProgressMonitor?: boolean // 是否显示进度监控
}

export function ModernPageContainer({
  title,
  description,
  breadcrumbs,
  actions,
  favoriteButton,
  children,
  className,
  onRefresh,
  isLoading = false,
  showUndoRedo = true,
  showProgressMonitor = true
}: ModernPageContainerProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* 面包屑导航 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <BreadcrumbSeparator>
                    <ChevronRightIcon className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href} className="text-muted-foreground hover:text-foreground">
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="font-medium">
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* 页面标题和操作区域 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {favoriteButton}
          </div>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {(actions || onRefresh || showUndoRedo) && (
          <div className="flex items-center gap-2">
            {showUndoRedo && (
              <UndoRedoControls size="sm" />
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
                刷新
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>

      <Separator />

      {/* 页面内容 */}
      <div className="space-y-6">
        {children}
      </div>

      {/* 全局进度监控 */}
      {showProgressMonitor && <GlobalProgressMonitor />}
    </div>
  )
}

// 现代化的空状态组件
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// 现代化的加载状态组件
interface LoadingStateProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingState({
  title = "加载中...",
  description,
  className
}: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          {description}
        </p>
      )}
    </div>
  )
}

// 现代化的错误状态组件
interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "出现错误",
  description = "加载数据时出现问题，请稍后重试。",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <span className="text-red-600 dark:text-red-400 text-xl">⚠</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          重试
        </Button>
      )}
    </div>
  )
}
