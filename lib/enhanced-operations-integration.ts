"use client"

import React from 'react'
import { audioFeedbackManager, playSound } from './audio-feedback-system'
import { operationRecordingManager } from './operation-recording-system'
import { webSocketManager, sendMessage } from './websocket-system'
import { advancedUndoManager, createAdvancedAction } from './advanced-undo-system'
import { undoRedoManager, createFormAction, createBatchAction } from './undo-redo-system'
import { feedbackManager } from './feedback-system'
import { progressManager } from './progress-system'
import { toast } from "@/hooks/use-toast"

/**
 * 增强操作系统集成
 *
 * 统一集成所有增强功能：音效反馈、操作录制、WebSocket推送、高级撤销等
 *
 * @description 该系统提供以下核心功能：
 * - 统一的操作执行接口
 * - 音效反馈集成
 * - 操作录制和回放
 * - WebSocket实时推送
 * - 高级撤销/重做功能
 * - 进度显示和用户反馈
 * - 批量操作支持
 * - 表单操作优化
 *
 * @example
 * ```typescript
 * import { useEnhancedOperations } from './enhanced-operations-integration'
 *
 * const { executeOperation, executeFormOperation, executeBatchOperation } = useEnhancedOperations()
 *
 * // 执行基础操作
 * await executeOperation(
 *   async () => { /* 操作逻辑 *\/ },
 *   {
 *     playSound: true,
 *     soundType: 'success',
 *     enableUndo: true,
 *     undoTags: ['delete', 'product']
 *   }
 * )
 * ```
 */

/**
 * 增强操作选项接口
 *
 * @interface EnhancedOperationOptions
 */
export interface EnhancedOperationOptions {
  // 音效选项
  /** 是否播放音效 */
  playSound?: boolean
  /** 音效类型 */
  soundType?: 'success' | 'error' | 'warning' | 'info' | 'click' | 'notification'

  // 录制选项
  /** 是否录制操作 */
  recordOperation?: boolean
  /** 录制名称 */
  recordingName?: string

  // WebSocket推送选项
  /** 是否广播更新 */
  broadcastUpdate?: boolean
  /** 通知的用户列表 */
  notifyUsers?: string[]

  // 撤销选项
  /** 是否启用撤销功能 */
  enableUndo?: boolean
  /** 撤销标签 */
  undoTags?: string[]
  /** 撤销优先级 (1-10) */
  undoPriority?: number
  /** 撤销组ID */
  undoGroupId?: string

  // 进度选项
  /** 是否显示进度 */
  showProgress?: boolean
  /** 进度标题 */
  progressTitle?: string

  // 反馈选项
  /** 是否显示反馈 */
  showFeedback?: boolean
  /** 反馈消息 */
  feedbackMessage?: string
}

export interface EnhancedOperationResult {
  success: boolean
  data?: any
  error?: string
  operationId?: string
  undoActionId?: string
}

class EnhancedOperationsManager {
  private isInitialized = false

  /**
   * 初始化所有增强功能
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 初始化音效系统
      await audioFeedbackManager.initialize()

      // 初始化WebSocket连接（如果配置了）
      if (process.env.NEXT_PUBLIC_WS_AUTO_CONNECT === 'true') {
        await webSocketManager.connect()
      }

      this.isInitialized = true
      console.log('[EnhancedOperations] 增强操作系统初始化完成')
    } catch (error) {
      console.error('[EnhancedOperations] 初始化失败:', error)
    }
  }

  /**
   * 执行增强操作
   */
  async executeOperation<T = any>(
    operation: () => Promise<T>,
    options: EnhancedOperationOptions = {}
  ): Promise<EnhancedOperationResult> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // 开始录制（如果启用）
      if (options.recordOperation && options.recordingName) {
        operationRecordingManager.startRecording(options.recordingName)
      }

      // 显示进度（如果启用）
      let progressId: string | undefined
      if (options.showProgress) {
        progressId = progressManager.start(options.progressTitle || '执行操作中...')
      }

      // 播放开始音效
      if (options.playSound) {
        await playSound.click()
      }

      // 执行操作
      const result = await operation()

      // 播放成功音效
      if (options.playSound) {
        await playSound[options.soundType || 'success']()
      }

      // 显示反馈
      if (options.showFeedback !== false) {
        toast({
          title: "操作成功",
          description: options.feedbackMessage || "操作已成功完成",
        })
      }

      // WebSocket广播更新
      if (options.broadcastUpdate) {
        sendMessage.update({
          operationId,
          type: 'operation_completed',
          data: result,
          timestamp: Date.now()
        })
      }

      // 通知特定用户
      if (options.notifyUsers && options.notifyUsers.length > 0) {
        sendMessage.notification({
          operationId,
          targetUsers: options.notifyUsers,
          message: options.feedbackMessage || '操作已完成',
          data: result
        })
      }

      // 完成进度
      if (progressId) {
        progressManager.complete(progressId, '操作完成')
      }

      // 停止录制
      if (options.recordOperation) {
        operationRecordingManager.stopRecording()
      }

      return {
        success: true,
        data: result,
        operationId
      }

    } catch (error) {
      // 播放错误音效
      if (options.playSound) {
        await playSound.error()
      }

      // 显示错误反馈
      const errorMessage = error instanceof Error ? error.message : '操作失败'

      if (options.showFeedback !== false) {
        toast({
          title: "操作失败",
          description: errorMessage,
          variant: "destructive",
        })
      }

      // 广播错误
      if (options.broadcastUpdate) {
        sendMessage.update({
          operationId,
          type: 'operation_failed',
          error: errorMessage,
          timestamp: Date.now()
        })
      }

      // 停止录制
      if (options.recordOperation) {
        operationRecordingManager.stopRecording()
      }

      return {
        success: false,
        error: errorMessage,
        operationId
      }
    }
  }

  /**
   * 执行带撤销功能的操作
   */
  async executeUndoableOperation<T = any>(
    operation: () => Promise<T>,
    undoOperation: () => Promise<void>,
    redoOperation: () => Promise<void>,
    description: string,
    module: string,
    options: EnhancedOperationOptions = {}
  ): Promise<EnhancedOperationResult> {
    const result = await this.executeOperation(operation, options)

    if (result.success && options.enableUndo !== false) {
      // 创建撤销操作
      const undoAction = createAdvancedAction({
        type: 'update',
        module,
        description,
        data: {
          before: null, // 这里应该传入操作前的数据
          after: result.data,
        },
        undoFunction: undoOperation,
        redoFunction: redoOperation,
        canUndo: true,
      }, {
        tags: options.undoTags,
        priority: options.undoPriority,
        groupId: options.undoGroupId
      })

      undoRedoManager.addAction(undoAction)
      result.undoActionId = undoAction.id
    }

    return result
  }

  /**
   * 执行表单操作
   */
  async executeFormOperation<T = any>(
    operation: () => Promise<T>,
    beforeData: any,
    afterData: any,
    description: string,
    module: string,
    options: EnhancedOperationOptions = {}
  ): Promise<EnhancedOperationResult> {
    return this.executeUndoableOperation(
      operation,
      async () => {
        // 这里应该实现具体的撤销逻辑
        console.log('撤销表单操作:', description)
      },
      async () => {
        // 这里应该实现具体的重做逻辑
        console.log('重做表单操作:', description)
      },
      description,
      module,
      {
        soundType: 'success',
        showProgress: true,
        progressTitle: `${description}中...`,
        ...options
      }
    )
  }

  /**
   * 执行批量操作
   */
  async executeBatchOperation<T = any>(
    items: any[],
    operation: (item: any, index: number) => Promise<T>,
    description: string,
    module: string,
    options: EnhancedOperationOptions = {}
  ): Promise<EnhancedOperationResult> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const results: T[] = []

    try {
      // 开始批量进度
      const progressId = progressManager.start(`${description} (0/${items.length})`)

      // 播放开始音效
      if (options.playSound !== false) {
        await playSound.info()
      }

      // 执行批量操作
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        try {
          const result = await operation(item, i)
          results.push(result)

          // 更新进度
          progressManager.update(progressId, {
            progress: ((i + 1) / items.length) * 100,
            message: `${description} (${i + 1}/${items.length})`
          })

        } catch (error) {
          console.error(`批量操作第 ${i + 1} 项失败:`, error)
          // 继续处理其他项目
        }
      }

      // 完成进度
      progressManager.complete(progressId, `${description}完成`)

      // 播放成功音效
      if (options.playSound !== false) {
        await playSound.success()
      }

      // 显示反馈
      toast({
        title: "批量操作完成",
        description: `成功处理 ${results.length}/${items.length} 项`,
      })

      // 创建批量撤销操作
      if (options.enableUndo !== false) {
        const batchAction = createBatchAction(
          module,
          `${description} (${results.length}项)`,
          items,
          async () => {
            console.log('撤销批量操作:', description)
          },
          async () => {
            console.log('重做批量操作:', description)
          }
        )

        undoRedoManager.addAction(batchAction)
      }

      return {
        success: true,
        data: results,
        operationId: batchId
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量操作失败'

      // 播放错误音效
      if (options.playSound !== false) {
        await playSound.error()
      }

      toast({
        title: "批量操作失败",
        description: errorMessage,
        variant: "destructive",
      })

      return {
        success: false,
        error: errorMessage,
        operationId: batchId
      }
    }
  }

  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      audio: audioFeedbackManager.getConfig(),
      websocket: webSocketManager.getStatus(),
      recording: operationRecordingManager.getRecordingStatus(),
      undo: {
        canUndo: undoRedoManager.canUndo(),
        canRedo: undoRedoManager.canRedo(),
        undoStackSize: undoRedoManager.getUndoStack().length,
        redoStackSize: undoRedoManager.getRedoStack().length
      },
      branches: advancedUndoManager.getBranches().length
    }
  }
}

// 创建全局实例
export const enhancedOperationsManager = new EnhancedOperationsManager()

// React Hook for enhanced operations
export function useEnhancedOperations() {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [systemStatus, setSystemStatus] = React.useState(enhancedOperationsManager.getSystemStatus())

  React.useEffect(() => {
    enhancedOperationsManager.initialize().then(() => {
      setIsInitialized(true)
      setSystemStatus(enhancedOperationsManager.getSystemStatus())
    })
  }, [])

  const executeOperation = React.useCallback(
    (operation: () => Promise<any>, options?: EnhancedOperationOptions) => {
      return enhancedOperationsManager.executeOperation(operation, options)
    },
    []
  )

  const executeFormOperation = React.useCallback(
    (operation: () => Promise<any>, beforeData: any, afterData: any, description: string, module: string, options?: EnhancedOperationOptions) => {
      return enhancedOperationsManager.executeFormOperation(operation, beforeData, afterData, description, module, options)
    },
    []
  )

  const executeBatchOperation = React.useCallback(
    (items: any[], operation: (item: any, index: number) => Promise<any>, description: string, module: string, options?: EnhancedOperationOptions) => {
      return enhancedOperationsManager.executeBatchOperation(items, operation, description, module, options)
    },
    []
  )

  return {
    isInitialized,
    systemStatus,
    executeOperation,
    executeFormOperation,
    executeBatchOperation,
    refreshStatus: () => setSystemStatus(enhancedOperationsManager.getSystemStatus())
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  enhancedOperationsManager.initialize()
}
