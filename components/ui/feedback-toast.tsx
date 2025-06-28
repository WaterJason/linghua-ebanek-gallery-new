// 阶段4操作反馈增强 - 反馈Toast组件
// 显示各种类型的反馈消息

'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FeedbackMessage, FeedbackType } from '@/lib/types/feedback-types'
import { useFeedback } from '@/hooks/use-feedback'

interface FeedbackToastProps {
  message: FeedbackMessage
  onDismiss: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
}

const typeConfig: Record<FeedbackType, {
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  borderColor: string
  iconColor: string
}> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  loading: {
    icon: Loader2,
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400'
  }
}

export function FeedbackToast({ message, onDismiss, position = 'top-right' }: FeedbackToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)
  const config = typeConfig[message.type]
  const Icon = config.icon

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (message.duration && !message.persistent) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (message.duration! / 100))
          if (newProgress <= 0) {
            clearInterval(interval)
            handleDismiss()
            return 0
          }
          return newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [message.duration, message.persistent])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(message.id), 300) // 等待退场动画
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  return (
    <div
      className={cn(
        'fixed z-50 w-full max-w-sm transition-all duration-300 ease-in-out',
        positionClasses[position],
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-2 scale-95'
      )}
    >
      <div
        className={cn(
          'relative rounded-lg border p-4 shadow-lg backdrop-blur-sm',
          config.bgColor,
          config.borderColor,
          'animate-in slide-in-from-top-2 duration-300'
        )}
      >
        {/* 进度条 */}
        {message.duration && !message.persistent && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
            <div 
              className="h-full bg-current transition-all duration-100 ease-linear"
              style={{ 
                width: `${progress}%`,
                color: config.iconColor.includes('green') ? '#10b981' :
                       config.iconColor.includes('red') ? '#ef4444' :
                       config.iconColor.includes('yellow') ? '#f59e0b' :
                       config.iconColor.includes('blue') ? '#3b82f6' : '#6b7280'
              }}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* 图标 */}
          <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
            <Icon 
              className={cn(
                'h-5 w-5',
                message.type === 'loading' && 'animate-spin'
              )} 
            />
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message.title}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {message.message}
            </div>

            {/* 进度详情 */}
            {message.details?.progress !== undefined && (
              <div className="mt-2">
                <Progress 
                  value={message.details.progress} 
                  className="h-2"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(message.details.progress)}% 完成
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            {message.actions && message.actions.length > 0 && (
              <div className="mt-3 flex gap-2">
                {message.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => {
                      action.action()
                      if (action.variant !== 'outline') {
                        handleDismiss()
                      }
                    }}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * 反馈Toast容器组件
 */
export function FeedbackToastContainer() {
  const { messages, dismiss } = useFeedback()

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 80}px)` // 堆叠效果
          }}
        >
          <FeedbackToast
            message={message}
            onDismiss={dismiss}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * 简化的Toast通知函数
 */
export function showToast(
  type: FeedbackType,
  title: string,
  message: string,
  options?: {
    duration?: number
    actions?: Array<{ label: string; action: () => void; variant?: 'default' | 'destructive' | 'outline' }>
  }
) {
  const { showSuccess, showError, showWarning, showInfo, showLoading } = useFeedback()

  const toastOptions = {
    duration: options?.duration,
    actions: options?.actions
  }

  switch (type) {
    case 'success':
      return showSuccess(message, toastOptions)
    case 'error':
      return showError(message, toastOptions)
    case 'warning':
      return showWarning(message, toastOptions)
    case 'info':
      return showInfo(message, toastOptions)
    case 'loading':
      return showLoading(message, toastOptions)
    default:
      return showInfo(message, toastOptions)
  }
}

/**
 * 便捷的Toast Hook
 */
export function useToast() {
  const feedback = useFeedback()

  const toast = {
    success: (message: string, options?: { duration?: number }) => 
      feedback.showSuccess('成功', message, options),
    error: (message: string, options?: { duration?: number }) => 
      feedback.showError('错误', message, options),
    warning: (message: string, options?: { duration?: number }) => 
      feedback.showWarning('警告', message, options),
    info: (message: string, options?: { duration?: number }) => 
      feedback.showInfo('提示', message, options),
    loading: (message: string) => 
      feedback.showLoading('加载中', message, { persistent: true }),
    dismiss: feedback.dismiss,
    dismissAll: feedback.dismissAll
  }

  return { toast }
}
