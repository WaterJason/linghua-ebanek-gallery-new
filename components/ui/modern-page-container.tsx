'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ModernPageContainerProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  showSeparator?: boolean
}

export function ModernPageContainer({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  showSeparator = true
}: ModernPageContainerProps) {
  return (
    <div className={cn('container mx-auto py-6 space-y-6', className)}>
      {/* 页面头部 */}
      <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4', headerClassName)}>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>

      {/* 分隔线 */}
      {showSeparator && <Separator />}

      {/* 主要内容 */}
      <div className={cn('space-y-6', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

interface ModernPageCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function ModernPageCard({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName
}: ModernPageCardProps) {
  return (
    <Card className={cn('w-full', className)}>
      {(title || description || actions) && (
        <CardHeader className={cn('pb-4', headerClassName)}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              {title && <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            
            {actions && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn('pt-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

interface ModernPageSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function ModernPageSection({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName
}: ModernPageSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className={cn('space-y-1', headerClassName)}>
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      <div className={cn('', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

interface ModernPageGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 2 | 4 | 6 | 8
  className?: string
}

export function ModernPageGrid({
  children,
  cols = 1,
  gap = 4,
  className
}: ModernPageGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  const gridGap = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div className={cn('grid', gridCols[cols], gridGap[gap], className)}>
      {children}
    </div>
  )
}

interface ModernPageStatsProps {
  stats: Array<{
    title: string
    value: string | number
    description?: string
    icon?: ReactNode
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
  className?: string
}

export function ModernPageStats({ stats, className }: ModernPageStatsProps) {
  return (
    <ModernPageGrid cols={stats.length <= 4 ? stats.length as 1 | 2 | 3 | 4 : 4} className={className}>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            )}
            {stat.trend && (
              <div className={cn(
                'text-xs flex items-center gap-1 mt-1',
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                <span>{stat.trend.isPositive ? '↗' : '↘'}</span>
                <span>{Math.abs(stat.trend.value)}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </ModernPageGrid>
  )
}
