'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface OperationOptions {
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  showToast?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

interface OperationState {
  isLoading: boolean
  error: Error | null
  lastOperation: string | null
}

export function useEnhancedOperations() {
  const [state, setState] = useState<OperationState>({
    isLoading: false,
    error: null,
    lastOperation: null
  })
  
  const { toast } = useToast()

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: OperationOptions = {}
  ): Promise<T | null> => {
    const {
      loadingMessage = '正在处理...',
      successMessage = '操作成功',
      errorMessage = '操作失败',
      showToast = true,
      onSuccess,
      onError
    } = options

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        lastOperation: loadingMessage
      }))

      if (showToast && loadingMessage) {
        toast({
          title: loadingMessage,
          description: '请稍候...'
        })
      }

      const result = await operation()

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastOperation: successMessage
      }))

      if (showToast && successMessage) {
        toast({
          title: successMessage,
          description: '操作已完成',
          variant: 'default'
        })
      }

      onSuccess?.()
      return result

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorObj,
        lastOperation: errorMessage
      }))

      if (showToast) {
        toast({
          title: errorMessage,
          description: errorObj.message,
          variant: 'destructive'
        })
      }

      onError?.(errorObj)
      return null
    }
  }, [toast])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastOperation: null
    })
  }, [])

  return {
    ...state,
    executeOperation,
    clearError,
    reset,
    isOperationInProgress: state.isLoading
  }
}
