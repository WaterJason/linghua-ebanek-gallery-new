"use client"

/**
 * 操作反馈系统
 * 
 * 为ERP系统提供统一的操作反馈机制
 * 包括成功/失败提示、加载状态、确认对话框等
 */

import { toast } from "@/hooks/use-toast"

// 反馈类型定义
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading'

// 操作状态
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error'

// 反馈配置
export interface FeedbackConfig {
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// 操作反馈管理器
class FeedbackManager {
  private activeOperations: Map<string, OperationStatus> = new Map()
  private listeners: Map<string, Set<(status: OperationStatus) => void>> = new Map()

  // 显示成功反馈
  showSuccess(config: FeedbackConfig) {
    toast({
      title: config.title,
      description: config.description,
      duration: config.duration || 3000,
      className: "border-green-200 bg-green-50 text-green-900",
    })
  }

  // 显示错误反馈
  showError(config: FeedbackConfig & { error?: Error }) {
    const description = config.error 
      ? `${config.description || ''}\n错误详情：${config.error.message}`
      : config.description

    toast({
      title: config.title,
      description,
      duration: config.duration || 5000,
      variant: "destructive",
    })
  }

  // 显示警告反馈
  showWarning(config: FeedbackConfig) {
    toast({
      title: config.title,
      description: config.description,
      duration: config.duration || 4000,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    })
  }

  // 显示信息反馈
  showInfo(config: FeedbackConfig) {
    toast({
      title: config.title,
      description: config.description,
      duration: config.duration || 3000,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    })
  }

  // 开始操作（显示加载状态）
  startOperation(operationId: string, title: string) {
    this.activeOperations.set(operationId, 'loading')
    this.notifyListeners(operationId, 'loading')
    
    toast({
      title,
      description: "正在处理，请稍候...",
      duration: 0, // 不自动消失
      className: "border-blue-200 bg-blue-50 text-blue-900",
    })
  }

  // 完成操作（成功）
  completeOperation(operationId: string, config: FeedbackConfig) {
    this.activeOperations.set(operationId, 'success')
    this.notifyListeners(operationId, 'success')
    this.showSuccess(config)
    
    // 清理操作状态
    setTimeout(() => {
      this.activeOperations.delete(operationId)
    }, 1000)
  }

  // 操作失败
  failOperation(operationId: string, config: FeedbackConfig & { error?: Error }) {
    this.activeOperations.set(operationId, 'error')
    this.notifyListeners(operationId, 'error')
    this.showError(config)
    
    // 清理操作状态
    setTimeout(() => {
      this.activeOperations.delete(operationId)
    }, 1000)
  }

  // 获取操作状态
  getOperationStatus(operationId: string): OperationStatus {
    return this.activeOperations.get(operationId) || 'idle'
  }

  // 监听操作状态变化
  onOperationStatusChange(operationId: string, callback: (status: OperationStatus) => void) {
    if (!this.listeners.has(operationId)) {
      this.listeners.set(operationId, new Set())
    }
    this.listeners.get(operationId)!.add(callback)
    
    // 返回取消监听的函数
    return () => {
      this.listeners.get(operationId)?.delete(callback)
    }
  }

  // 通知监听器
  private notifyListeners(operationId: string, status: OperationStatus) {
    this.listeners.get(operationId)?.forEach(callback => callback(status))
  }

  // 显示确认对话框
  async showConfirmDialog(config: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
  }): Promise<boolean> {
    return new Promise((resolve) => {
      // 这里应该显示一个自定义确认对话框
      // 暂时使用浏览器原生确认框
      const result = confirm(`${config.title}\n\n${config.description}`)
      resolve(result)
    })
  }
}

// 创建全局实例
export const feedbackManager = new FeedbackManager()

// 便捷函数：包装异步操作
export async function withFeedback<T>(
  operationId: string,
  operation: () => Promise<T>,
  config: {
    loadingTitle: string
    successTitle: string
    successDescription?: string
    errorTitle: string
    errorDescription?: string
  }
): Promise<T> {
  try {
    feedbackManager.startOperation(operationId, config.loadingTitle)
    const result = await operation()
    
    feedbackManager.completeOperation(operationId, {
      title: config.successTitle,
      description: config.successDescription,
    })
    
    return result
  } catch (error) {
    feedbackManager.failOperation(operationId, {
      title: config.errorTitle,
      description: config.errorDescription,
      error: error instanceof Error ? error : new Error(String(error)),
    })
    throw error
  }
}

// 便捷函数：表单提交反馈
export async function withFormFeedback<T>(
  formName: string,
  operation: () => Promise<T>,
  itemName?: string
): Promise<T> {
  const operationId = `form_${formName}_${Date.now()}`
  
  return withFeedback(operationId, operation, {
    loadingTitle: `正在保存${itemName || '数据'}`,
    successTitle: "保存成功",
    successDescription: `${itemName || '数据'}已成功保存`,
    errorTitle: "保存失败",
    errorDescription: `保存${itemName || '数据'}时发生错误，请检查输入信息后重试`,
  })
}

// 便捷函数：删除操作反馈
export async function withDeleteFeedback<T>(
  operation: () => Promise<T>,
  itemName: string,
  requireConfirm: boolean = true
): Promise<T> {
  if (requireConfirm) {
    const confirmed = await feedbackManager.showConfirmDialog({
      title: `确认删除${itemName}？`,
      description: `此操作将永久删除${itemName}，无法恢复。请确认是否继续？`,
      type: 'danger',
    })
    
    if (!confirmed) {
      throw new Error('用户取消操作')
    }
  }

  const operationId = `delete_${Date.now()}`
  
  return withFeedback(operationId, operation, {
    loadingTitle: `正在删除${itemName}`,
    successTitle: "删除成功",
    successDescription: `${itemName}已成功删除`,
    errorTitle: "删除失败",
    errorDescription: `删除${itemName}时发生错误，请稍后重试`,
  })
}

// 便捷函数：批量操作反馈
export async function withBatchFeedback<T>(
  operation: () => Promise<T>,
  operationName: string,
  itemCount: number
): Promise<T> {
  const operationId = `batch_${operationName}_${Date.now()}`
  
  return withFeedback(operationId, operation, {
    loadingTitle: `正在${operationName}`,
    successTitle: `${operationName}完成`,
    successDescription: `已成功${operationName} ${itemCount} 项`,
    errorTitle: `${operationName}失败`,
    errorDescription: `${operationName}过程中发生错误，请检查后重试`,
  })
}

// React Hook：使用操作状态
export function useOperationStatus(operationId: string) {
  const [status, setStatus] = React.useState<OperationStatus>('idle')
  
  React.useEffect(() => {
    const unsubscribe = feedbackManager.onOperationStatusChange(operationId, setStatus)
    setStatus(feedbackManager.getOperationStatus(operationId))
    return unsubscribe
  }, [operationId])
  
  return {
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
  }
}

// 导入React（用于Hook）
import React from 'react'
