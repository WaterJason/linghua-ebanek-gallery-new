"use client"

import React from 'react'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  XIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  LoaderIcon,
  ActivityIcon,
  PauseIcon,
  PlayIcon
} from "lucide-react"
import { progressManager, ProgressState, useProgress, useGlobalProgress } from "@/lib/progress-system"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

// 单个进度指示器组件
interface ProgressIndicatorProps {
  progressId: string
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function ProgressIndicator({ 
  progressId, 
  className, 
  showDetails = true,
  compact = false 
}: ProgressIndicatorProps) {
  const progress = useProgress(progressId)

  if (!progress) return null

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'running':
        return <LoaderIcon className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <PauseIcon className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (progress.status) {
      case 'running': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'cancelled': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeRemaining = () => {
    if (!progress.estimatedEndTime || progress.status !== 'running') return null
    
    const remaining = progress.estimatedEndTime.getTime() - Date.now()
    if (remaining <= 0) return '即将完成'
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    if (minutes > 0) {
      return `预计 ${minutes}分${seconds}秒`
    }
    return `预计 ${seconds}秒`
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 p-2 bg-gray-50 rounded-lg", className)}>
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{progress.title}</div>
          <Progress value={progress.progress} className="h-1 mt-1" />
        </div>
        <div className="text-xs text-muted-foreground">
          {progress.progress}%
        </div>
        {progress.canCancel && progress.status === 'running' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => progressManager.cancelProgress(progress.id)}
            className="h-6 w-6 p-0"
          >
            <XIcon className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-base">{progress.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor()}>
              {progress.status === 'running' ? '进行中' : 
               progress.status === 'completed' ? '已完成' :
               progress.status === 'cancelled' ? '已取消' : '错误'}
            </Badge>
            {progress.canCancel && progress.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => progressManager.cancelProgress(progress.id)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {progress.description && (
          <CardDescription>{progress.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>进度</span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        {/* 阶段信息 */}
        {progress.stages && showDetails && (
          <div className="space-y-2">
            <div className="text-sm font-medium">当前阶段</div>
            <div className="flex items-center gap-2">
              {progress.stages.map((stage, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    index < (progress.currentStage || 0) ? "bg-green-500" :
                    index === (progress.currentStage || 0) ? "bg-blue-500" :
                    "bg-gray-300"
                  )} />
                  <span className={cn(
                    "text-xs",
                    index === (progress.currentStage || 0) ? "font-medium" : "text-muted-foreground"
                  )}>
                    {stage}
                  </span>
                  {index < progress.stages.length - 1 && (
                    <div className="h-px w-4 bg-gray-300 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数量信息 */}
        {progress.total && showDetails && (
          <div className="flex justify-between text-sm">
            <span>已处理</span>
            <span>{progress.processed || 0} / {progress.total}</span>
          </div>
        )}

        {/* 时间信息 */}
        {showDetails && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              <span>开始时间：{format(progress.startTime, "HH:mm:ss", { locale: zhCN })}</span>
            </div>
            {formatTimeRemaining() && (
              <span>{formatTimeRemaining()}</span>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {progress.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {progress.error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 全局进度监控器
interface GlobalProgressMonitorProps {
  className?: string
  maxVisible?: number
}

export function GlobalProgressMonitor({ 
  className, 
  maxVisible = 3 
}: GlobalProgressMonitorProps) {
  const progresses = useGlobalProgress()
  const activeProgresses = progresses.filter(p => p.status === 'running')
  const visibleProgresses = activeProgresses.slice(0, maxVisible)
  const hiddenCount = Math.max(0, activeProgresses.length - maxVisible)

  if (activeProgresses.length === 0) return null

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 space-y-2", className)}>
      {visibleProgresses.map(progress => (
        <ProgressIndicator
          key={progress.id}
          progressId={progress.id}
          compact
          className="w-80 shadow-lg border"
        />
      ))}
      
      {hiddenCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-80">
              还有 {hiddenCount} 个任务正在进行...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="p-4">
              <h4 className="font-medium text-sm mb-3">所有进行中的任务</h4>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {activeProgresses.map(progress => (
                    <ProgressIndicator
                      key={progress.id}
                      progressId={progress.id}
                      compact
                      showDetails={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// 进度按钮组件（带内置进度显示）
interface ProgressButtonProps {
  progressId?: string
  onClick: () => void
  children: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
}

export function ProgressButton({ 
  progressId, 
  onClick, 
  children, 
  className,
  variant = "default",
  size = "default",
  disabled = false,
  ...props 
}: ProgressButtonProps) {
  const progress = progressId ? useProgress(progressId) : undefined
  const isLoading = progress?.status === 'running'

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {isLoading && progress && (
        <div 
          className="absolute inset-0 bg-blue-500/20 transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {isLoading && <LoaderIcon className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </Button>
  )
}
