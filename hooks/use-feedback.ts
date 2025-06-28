// 阶段4操作反馈增强 - React Hooks
// 提供便捷的React Hook接口来使用反馈系统

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  UseFeedbackReturn,
  UseUndoRedoReturn,
  UseProgressReturn,
  UseAnimationReturn,
  FeedbackMessage,
  FeedbackOptions,
  UndoRedoAction,
  ProgressOptions,
  ProgressUpdate,
  ProgressInfo,
  AnimationConfig,
  AnimationPreset
} from '@/lib/types/feedback-types'
import { feedbackSystem } from '@/lib/feedback/feedback-system'
import { undoRedoManager } from '@/lib/feedback/undo-redo-manager'
import { progressMonitor } from '@/lib/feedback/progress-monitor'
import { animationManager } from '@/lib/feedback/animation-manager'
import { operationTracker } from '@/lib/feedback/operation-tracker'

/**
 * 反馈系统Hook
 */
export function useFeedback(): UseFeedbackReturn {
  const [messages, setMessages] = useState<FeedbackMessage[]>([])

  useEffect(() => {
    const unsubscribe = feedbackSystem.subscribe((event) => {
      if (event.type === 'show') {
        setMessages(feedbackSystem.getMessages())
      } else if (event.type === 'hide') {
        setMessages(feedbackSystem.getMessages())
      }
    })

    // 初始化消息列表
    setMessages(feedbackSystem.getMessages())

    return unsubscribe
  }, [])

  const showSuccess = useCallback((message: string, options?: FeedbackOptions) => {
    return feedbackSystem.showSuccess(message, options)
  }, [])

  const showError = useCallback((message: string, options?: FeedbackOptions) => {
    return feedbackSystem.showError(message, options)
  }, [])

  const showWarning = useCallback((message: string, options?: FeedbackOptions) => {
    return feedbackSystem.showWarning(message, options)
  }, [])

  const showInfo = useCallback((message: string, options?: FeedbackOptions) => {
    return feedbackSystem.showInfo(message, options)
  }, [])

  const showLoading = useCallback((message: string, options?: FeedbackOptions) => {
    return feedbackSystem.showLoading(message, options)
  }, [])

  const dismiss = useCallback((id: string) => {
    feedbackSystem.dismiss(id)
  }, [])

  const dismissAll = useCallback(() => {
    feedbackSystem.dismissAll()
  }, [])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    dismissAll,
    messages
  }
}

/**
 * 撤销重做Hook
 */
export function useUndoRedo(): UseUndoRedoReturn {
  const [state, setState] = useState(() => undoRedoManager.getState())

  useEffect(() => {
    const unsubscribe = undoRedoManager.subscribe(() => {
      setState(undoRedoManager.getState())
    })

    return unsubscribe
  }, [])

  const undo = useCallback(async () => {
    return await undoRedoManager.undo()
  }, [])

  const redo = useCallback(async () => {
    return await undoRedoManager.redo()
  }, [])

  const execute = useCallback(async (action: UndoRedoAction) => {
    await undoRedoManager.execute(action)
  }, [])

  const clear = useCallback(() => {
    undoRedoManager.clear()
  }, [])

  const history = useCallback(() => {
    return undoRedoManager.getHistory()
  }, [])

  return {
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undo,
    redo,
    execute,
    clear,
    history: history()
  }
}

/**
 * 进度监控Hook
 */
export function useProgress(): UseProgressReturn {
  const [activeProgress, setActiveProgress] = useState<ProgressInfo[]>([])

  useEffect(() => {
    const unsubscribe = progressMonitor.subscribe(() => {
      setActiveProgress(progressMonitor.getActiveProgress())
    })

    // 初始化活跃进度列表
    setActiveProgress(progressMonitor.getActiveProgress())

    return unsubscribe
  }, [])

  const start = useCallback((options: ProgressOptions) => {
    return progressMonitor.startProgress(options)
  }, [])

  const update = useCallback((id: string, update: ProgressUpdate) => {
    progressMonitor.updateProgress(id, update)
  }, [])

  const complete = useCallback((id: string, message?: string) => {
    progressMonitor.completeProgress(id, message)
  }, [])

  const cancel = useCallback((id: string) => {
    progressMonitor.cancelProgress(id)
  }, [])

  const getProgress = useCallback((id: string) => {
    return progressMonitor.getProgress(id)
  }, [])

  return {
    start,
    update,
    complete,
    cancel,
    getProgress,
    activeProgress
  }
}

/**
 * 动画Hook
 */
export function useAnimation(): UseAnimationReturn {
  const [enabled, setEnabled] = useState(() => animationManager.isGlobalAnimationEnabled())

  useEffect(() => {
    const unsubscribe = animationManager.subscribe(() => {
      setEnabled(animationManager.isGlobalAnimationEnabled())
    })

    return unsubscribe
  }, [])

  const play = useCallback(async (element: HTMLElement, animation: string | AnimationConfig) => {
    await animationManager.playAnimation(element, animation)
  }, [])

  const stop = useCallback((element: HTMLElement) => {
    animationManager.stopAnimation(element)
  }, [])

  const isPlaying = useCallback((element: HTMLElement) => {
    return animationManager.isPlaying(element)
  }, [])

  const registerPreset = useCallback((preset: AnimationPreset) => {
    animationManager.registerPreset(preset)
  }, [])

  const setEnabledCallback = useCallback((enabled: boolean) => {
    animationManager.setGlobalAnimationEnabled(enabled)
    setEnabled(enabled)
  }, [])

  return {
    play,
    stop,
    isPlaying,
    registerPreset,
    enabled,
    setEnabled: setEnabledCallback
  }
}

/**
 * 操作跟踪Hook
 */
export function useOperationTracker() {
  const feedback = useFeedback()
  const progress = useProgress()
  const animation = useAnimation()

  const executeOperation = useCallback(async <T>(
    context: {
      module: string
      action: string
      target?: string
      targetId?: string
    },
    operation: () => Promise<T>,
    options: {
      showProgress?: boolean
      showFeedback?: boolean
      enableUndo?: boolean
      progressTitle?: string
      successMessage?: string
      errorMessage?: string
      animateElement?: HTMLElement
    } = {}
  ) => {
    return await operationTracker.executeOperation(
      {
        ...context,
        userId: 'current-user', // 这里应该从认证系统获取
        sessionId: 'current-session'
      },
      operation,
      {
        showProgress: options.showProgress ?? true,
        showFeedback: options.showFeedback ?? true,
        enableUndo: options.enableUndo ?? true,
        ...options
      }
    )
  }, [])

  const executeBatchOperation = useCallback(async <T>(
    context: {
      module: string
      action: string
      target?: string
    },
    items: any[],
    itemProcessor: (item: any, index: number) => Promise<T>,
    options: {
      showProgress?: boolean
      showFeedback?: boolean
      enableUndo?: boolean
      batchSize?: number
      progressTitle?: string
    } = {}
  ) => {
    return await operationTracker.executeBatchOperation(
      {
        ...context,
        userId: 'current-user',
        sessionId: 'current-session'
      },
      items,
      itemProcessor,
      {
        showProgress: options.showProgress ?? true,
        showFeedback: options.showFeedback ?? true,
        enableUndo: options.enableUndo ?? true,
        batchSize: options.batchSize ?? 10,
        ...options
      }
    )
  }, [])

  const executeFileUpload = useCallback(async (
    context: {
      module: string
      action: string
      target?: string
    },
    file: File,
    uploadFunction: (file: File, onProgress: (progress: number) => void) => Promise<any>,
    options: {
      showFeedback?: boolean
      enableUndo?: boolean
    } = {}
  ) => {
    return await operationTracker.executeFileUpload(
      {
        ...context,
        userId: 'current-user',
        sessionId: 'current-session'
      },
      file,
      uploadFunction,
      {
        showFeedback: options.showFeedback ?? true,
        enableUndo: options.enableUndo ?? false, // 文件上传通常不需要撤销
        ...options
      }
    )
  }, [])

  return {
    executeOperation,
    executeBatchOperation,
    executeFileUpload,
    getOperationHistory: operationTracker.getOperationHistory.bind(operationTracker),
    getOperationStats: operationTracker.getOperationStats.bind(operationTracker)
  }
}

/**
 * 智能操作Hook - 结合所有功能的高级Hook
 */
export function useSmartOperation() {
  const feedback = useFeedback()
  const undoRedo = useUndoRedo()
  const progress = useProgress()
  const animation = useAnimation()
  const tracker = useOperationTracker()

  // 智能表单提交
  const submitForm = useCallback(async <T>(
    formData: any,
    submitFunction: (data: any) => Promise<T>,
    options: {
      module: string
      action: string
      successMessage?: string
      errorMessage?: string
      enableUndo?: boolean
      formElement?: HTMLElement
    }
  ) => {
    return await tracker.executeOperation(
      {
        module: options.module,
        action: options.action,
        target: 'form'
      },
      () => submitFunction(formData),
      {
        showProgress: true,
        showFeedback: true,
        enableUndo: options.enableUndo ?? true,
        progressTitle: `提交${options.action}`,
        successMessage: options.successMessage,
        errorMessage: options.errorMessage,
        animateElement: options.formElement
      }
    )
  }, [tracker])

  // 智能数据删除
  const deleteData = useCallback(async <T>(
    deleteFunction: () => Promise<T>,
    options: {
      module: string
      itemName: string
      confirmMessage?: string
      successMessage?: string
      enableUndo?: boolean
    }
  ) => {
    // 这里可以添加确认对话框逻辑
    const confirmed = window.confirm(
      options.confirmMessage || `确定要删除${options.itemName}吗？此操作可以撤销。`
    )

    if (!confirmed) {
      return null
    }

    return await tracker.executeOperation(
      {
        module: options.module,
        action: '删除',
        target: options.itemName
      },
      deleteFunction,
      {
        showProgress: true,
        showFeedback: true,
        enableUndo: options.enableUndo ?? true,
        successMessage: options.successMessage || `${options.itemName}已删除`,
        errorMessage: `删除${options.itemName}失败`
      }
    )
  }, [tracker])

  return {
    ...feedback,
    ...undoRedo,
    ...progress,
    ...animation,
    ...tracker,
    submitForm,
    deleteData
  }
}
