// 阶段4操作反馈增强 - 操作跟踪器
// 跟踪用户操作，集成撤销重做、反馈系统和进度监控

import { 
  OperationContext, 
  OperationResult, 
  TrackedOperation,
  UndoRedoAction,
  FeedbackMessage
} from '@/lib/types/feedback-types'
import { undoRedoManager } from './undo-redo-manager'
import { feedbackSystem } from './feedback-system'
import { progressMonitor } from './progress-monitor'
import { animationManager } from './animation-manager'

export class OperationTracker {
  private operations: Map<string, TrackedOperation>
  private maxHistory: number
  private autoCleanup: boolean
  private cleanupTimer?: NodeJS.Timeout

  constructor(maxHistory: number = 1000, autoCleanup: boolean = true) {
    this.operations = new Map()
    this.maxHistory = maxHistory
    this.autoCleanup = autoCleanup

    if (this.autoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 执行操作并跟踪
   */
  async executeOperation<T>(
    context: OperationContext,
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
  ): Promise<T> {
    const operationId = this.generateId()
    const startTime = Date.now()

    // 创建跟踪记录
    const trackedOp: TrackedOperation = {
      id: operationId,
      context,
      startTime
    }

    this.operations.set(operationId, trackedOp)

    // 显示进度（如果启用）
    let progressId: string | undefined
    if (options.showProgress) {
      progressId = progressMonitor.startProgress({
        title: options.progressTitle || `执行${context.action}`,
        total: 100,
        cancellable: false
      })
    }

    // 播放开始动画
    if (options.animateElement) {
      animationManager.animateLoading(options.animateElement)
    }

    try {
      // 更新进度
      if (progressId) {
        progressMonitor.updateProgress(progressId, { current: 30, message: '处理中...' })
      }

      // 执行实际操作
      const result = await operation()
      const endTime = Date.now()

      // 创建操作结果
      const operationResult: OperationResult = {
        success: true,
        data: result,
        duration: endTime - startTime,
        timestamp: endTime
      }

      // 更新跟踪记录
      trackedOp.endTime = endTime
      trackedOp.result = operationResult

      // 完成进度
      if (progressId) {
        progressMonitor.updateProgress(progressId, { current: 100, message: '完成' })
        progressMonitor.completeProgress(progressId, '操作成功完成')
      }

      // 显示成功反馈
      if (options.showFeedback) {
        const feedback = feedbackSystem.generateSmartFeedback(context.action, 'success')
        const messageId = feedbackSystem.showSuccess(
          options.successMessage || feedback.message,
          { actions: feedback.actions }
        )
        trackedOp.feedbackMessage = feedbackSystem.getMessage(messageId)
      }

      // 创建撤销操作（如果启用）
      if (options.enableUndo && this.canCreateUndoAction(context)) {
        const undoAction = await this.createUndoAction(context, result)
        if (undoAction) {
          trackedOp.undoAction = undoAction
          await undoRedoManager.execute(undoAction)
        }
      }

      // 播放成功动画
      if (options.animateElement) {
        animationManager.stopAnimation(options.animateElement)
        animationManager.animateSuccess(options.animateElement)
      }

      this.operations.set(operationId, trackedOp)
      this.cleanupIfNeeded()

      return result

    } catch (error) {
      const endTime = Date.now()

      // 创建错误结果
      const operationResult: OperationResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: endTime - startTime,
        timestamp: endTime
      }

      // 更新跟踪记录
      trackedOp.endTime = endTime
      trackedOp.result = operationResult

      // 失败进度
      if (progressId) {
        progressMonitor.failProgress(progressId, operationResult.error.toString())
      }

      // 显示错误反馈
      if (options.showFeedback) {
        const feedback = feedbackSystem.generateSmartFeedback(context.action, 'error', error)
        const messageId = feedbackSystem.showError(
          options.errorMessage || feedback.message,
          { 
            actions: feedback.actions,
            details: error instanceof Error ? error.stack : error
          }
        )
        trackedOp.feedbackMessage = feedbackSystem.getMessage(messageId)
      }

      // 播放错误动画
      if (options.animateElement) {
        animationManager.stopAnimation(options.animateElement)
        animationManager.animateError(options.animateElement)
      }

      this.operations.set(operationId, trackedOp)
      throw error
    }
  }

  /**
   * 批量操作跟踪
   */
  async executeBatchOperation<T>(
    context: OperationContext,
    items: any[],
    itemProcessor: (item: any, index: number) => Promise<T>,
    options: {
      showProgress?: boolean
      showFeedback?: boolean
      enableUndo?: boolean
      batchSize?: number
      progressTitle?: string
    } = {}
  ): Promise<T[]> {
    const batchSize = options.batchSize || 10
    const results: T[] = []
    
    // 创建批量进度
    let progressId: string | undefined
    if (options.showProgress) {
      progressId = progressMonitor.createBatchProgress(
        options.progressTitle || `批量${context.action}`,
        items
      )
    }

    try {
      // 分批处理
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        
        // 处理当前批次
        const batchResults = await Promise.all(
          batch.map((item, batchIndex) => 
            itemProcessor(item, i + batchIndex)
          )
        )
        
        results.push(...batchResults)

        // 更新进度
        if (progressId) {
          progressMonitor.updateProgress(progressId, {
            current: i + batch.length,
            message: `已处理 ${i + batch.length}/${items.length} 项`
          })
        }

        // 短暂延迟避免阻塞UI
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      // 完成进度
      if (progressId) {
        progressMonitor.completeProgress(progressId, `成功处理 ${items.length} 项`)
      }

      // 显示成功反馈
      if (options.showFeedback) {
        feedbackSystem.showSuccess(`批量${context.action}完成，共处理 ${items.length} 项`)
      }

      return results

    } catch (error) {
      // 失败处理
      if (progressId) {
        progressMonitor.failProgress(progressId, error instanceof Error ? error.message : String(error))
      }

      if (options.showFeedback) {
        feedbackSystem.showError(`批量${context.action}失败: ${error instanceof Error ? error.message : error}`)
      }

      throw error
    }
  }

  /**
   * 文件上传操作跟踪
   */
  async executeFileUpload(
    context: OperationContext,
    file: File,
    uploadFunction: (file: File, onProgress: (progress: number) => void) => Promise<any>,
    options: {
      showFeedback?: boolean
      enableUndo?: boolean
    } = {}
  ): Promise<any> {
    const progressId = progressMonitor.createFileUploadProgress(file.name, file.size)

    try {
      const result = await uploadFunction(file, (progress) => {
        progressMonitor.updateProgress(progressId, {
          current: progress,
          message: `上传中... ${Math.round(progress)}%`
        })
      })

      progressMonitor.completeProgress(progressId, '文件上传成功')

      if (options.showFeedback) {
        feedbackSystem.showSuccess(`文件 "${file.name}" 上传成功`)
      }

      return result

    } catch (error) {
      progressMonitor.failProgress(progressId, error instanceof Error ? error.message : String(error))

      if (options.showFeedback) {
        feedbackSystem.showError(`文件 "${file.name}" 上传失败: ${error instanceof Error ? error.message : error}`)
      }

      throw error
    }
  }

  /**
   * 获取操作历史
   */
  getOperationHistory(filter?: {
    module?: string
    action?: string
    success?: boolean
    timeRange?: { start: number; end: number }
  }): TrackedOperation[] {
    let operations = Array.from(this.operations.values())

    if (filter) {
      if (filter.module) {
        operations = operations.filter(op => op.context.module === filter.module)
      }
      if (filter.action) {
        operations = operations.filter(op => op.context.action === filter.action)
      }
      if (filter.success !== undefined) {
        operations = operations.filter(op => op.result?.success === filter.success)
      }
      if (filter.timeRange) {
        operations = operations.filter(op => 
          op.startTime >= filter.timeRange!.start && 
          op.startTime <= filter.timeRange!.end
        )
      }
    }

    return operations.sort((a, b) => b.startTime - a.startTime)
  }

  /**
   * 获取操作统计
   */
  getOperationStats(timeRange?: { start: number; end: number }) {
    const operations = timeRange 
      ? this.getOperationHistory({ timeRange })
      : Array.from(this.operations.values())

    const stats = {
      total: operations.length,
      successful: operations.filter(op => op.result?.success).length,
      failed: operations.filter(op => op.result?.success === false).length,
      averageDuration: 0,
      moduleStats: new Map<string, number>(),
      actionStats: new Map<string, number>()
    }

    if (operations.length > 0) {
      const totalDuration = operations
        .filter(op => op.result)
        .reduce((sum, op) => sum + op.result!.duration, 0)
      stats.averageDuration = totalDuration / operations.filter(op => op.result).length
    }

    // 模块统计
    operations.forEach(op => {
      const module = op.context.module
      stats.moduleStats.set(module, (stats.moduleStats.get(module) || 0) + 1)
    })

    // 操作统计
    operations.forEach(op => {
      const action = op.context.action
      stats.actionStats.set(action, (stats.actionStats.get(action) || 0) + 1)
    })

    return stats
  }

  /**
   * 清理操作历史
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时

    for (const [id, operation] of this.operations) {
      if (now - operation.startTime > maxAge) {
        this.operations.delete(id)
      }
    }
  }

  /**
   * 检查是否可以创建撤销操作
   */
  private canCreateUndoAction(context: OperationContext): boolean {
    // 只有修改操作才能撤销
    const modifyingActions = ['create', 'update', 'delete', 'import', 'batch']
    return modifyingActions.some(action => 
      context.action.toLowerCase().includes(action)
    )
  }

  /**
   * 创建撤销操作
   */
  private async createUndoAction(context: OperationContext, result: any): Promise<UndoRedoAction | null> {
    // 这里需要根据具体的操作类型和结果创建撤销操作
    // 实际实现需要与业务逻辑集成
    return {
      id: this.generateId(),
      type: context.action,
      timestamp: Date.now(),
      data: {
        before: null, // 需要从上下文获取
        after: result,
        target: context.target || '',
        targetId: context.targetId
      },
      description: `撤销${context.action}`,
      canUndo: true,
      canRedo: false,
      module: context.module,
      userId: context.userId
    }
  }

  /**
   * 检查是否需要清理
   */
  private cleanupIfNeeded(): void {
    if (this.operations.size > this.maxHistory) {
      const operations = Array.from(this.operations.entries())
        .sort(([, a], [, b]) => a.startTime - b.startTime)
      
      const toRemove = operations.slice(0, this.operations.size - this.maxHistory)
      toRemove.forEach(([id]) => this.operations.delete(id))
    }
  }

  /**
   * 开始自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000) // 每小时清理一次
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 销毁跟踪器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.operations.clear()
  }
}

// 全局实例
export const operationTracker = new OperationTracker()
