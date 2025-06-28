// 阶段4操作反馈增强 - 进度指示器组件
// 显示各种类型的进度信息

'use client'

import React, { useState, useEffect } from 'react'
import { X, Clock, Zap, Pause, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { useProgress } from '@/hooks/use-feedback'
import { ProgressInfo } from '@/lib/types/feedback-types'
import { formatTime, formatSpeed, formatFileSize } from '@/lib/feedback/progress-monitor'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  progress: ProgressInfo
  onCancel?: (id: string) => void
  compact?: boolean
  showDetails?: boolean
}

export function ProgressIndicator({ 
  progress, 
  onCancel, 
  compact = false,
  showDetails = true 
}: ProgressIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: ProgressInfo['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: ProgressInfo['status']) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'running': return '进行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
        <div className={cn('w-2 h-2 rounded-full', getStatusColor(progress.status))} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{progress.title}</div>
          <Progress value={progress.percentage} className="h-1 mt-1" />
        </div>
        <div className="text-xs text-muted-foreground">
          {Math.round(progress.percentage)}%
        </div>
        {onCancel && progress.status === 'running' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(progress.id)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{progress.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor(progress.status)}>
              {getStatusText(progress.status)}
            </Badge>
            {onCancel && progress.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(progress.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.current} / {progress.total}</span>
            <span className="font-medium">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress 
            value={progress.percentage} 
            className="h-2"
          />
        </div>

        {/* 状态消息 */}
        {progress.message && (
          <div className="text-sm text-muted-foreground">
            {progress.message}
          </div>
        )}

        {/* 详细信息 */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* 预估时间 */}
            {progress.remainingTime && progress.status === 'running' && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">剩余时间</div>
                  <div className="font-medium">
                    {formatTime(progress.remainingTime)}
                  </div>
                </div>
              </div>
            )}

            {/* 处理速度 */}
            {progress.speed && progress.status === 'running' && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">处理速度</div>
                  <div className="font-medium">
                    {formatSpeed(progress.speed)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 详细信息展开 */}
        {progress.details && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? '收起详情' : '查看详情'}
            </Button>
            {isExpanded && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(progress.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 进度指示器容器
 */
export function ProgressIndicatorContainer() {
  const { activeProgress, cancel } = useProgress()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 当有活跃进度时自动打开对话框
  useEffect(() => {
    if (activeProgress.length > 0 && !isDialogOpen) {
      setIsDialogOpen(true)
    } else if (activeProgress.length === 0 && isDialogOpen) {
      // 延迟关闭，让用户看到完成状态
      setTimeout(() => setIsDialogOpen(false), 2000)
    }
  }, [activeProgress.length, isDialogOpen])

  if (activeProgress.length === 0) {
    return null
  }

  return (
    <>
      {/* 浮动进度指示器 */}
      <div className="fixed bottom-4 left-4 z-40 space-y-2">
        {activeProgress.slice(0, 3).map((progress) => (
          <ProgressIndicator
            key={progress.id}
            progress={progress}
            onCancel={cancel}
            compact
          />
        ))}
        {activeProgress.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="w-full"
          >
            查看全部 ({activeProgress.length})
          </Button>
        )}
      </div>

      {/* 详细进度对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>进度监控</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto">
            {activeProgress.map((progress) => (
              <ProgressIndicator
                key={progress.id}
                progress={progress}
                onCancel={cancel}
                showDetails
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 简单的线性进度条
 */
export function LinearProgress({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  className 
}: {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span>{label}</span>}
          {showPercentage && (
            <span className="font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

/**
 * 圆形进度指示器
 */
export function CircularProgress({ 
  value, 
  max = 100, 
  size = 64, 
  strokeWidth = 4,
  className 
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      {/* 百分比文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}

/**
 * 步骤进度指示器
 */
export function StepProgress({ 
  steps, 
  currentStep, 
  className 
}: {
  steps: string[]
  currentStep: number
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-16 mx-2',
                  index < currentStep ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">{steps[currentStep]}</div>
        <div className="text-xs text-muted-foreground">
          步骤 {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  )
}
