// 阶段4操作反馈增强 - 撤销重做管理器
// 提供智能的撤销重做功能，支持批量操作和选择性撤销

import { 
  UndoRedoAction, 
  UndoRedoStack, 
  UndoRedoOptions, 
  UndoRedoEvent 
} from '@/lib/types/feedback-types'

export class UndoRedoManager {
  private stack: UndoRedoStack
  private subscribers: Set<(event: UndoRedoEvent) => void>
  private options: Required<UndoRedoOptions>
  private cleanupTimer?: NodeJS.Timeout

  constructor(options: UndoRedoOptions = {}) {
    this.options = {
      maxStackSize: options.maxStackSize ?? 50,
      autoCleanup: options.autoCleanup ?? true,
      cleanupInterval: options.cleanupInterval ?? 300000, // 5分钟
      excludeTypes: options.excludeTypes ?? []
    }

    this.stack = {
      actions: [],
      currentIndex: -1,
      maxSize: this.options.maxStackSize
    }

    this.subscribers = new Set()

    if (this.options.autoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 执行操作并记录到撤销栈
   */
  async execute(action: UndoRedoAction): Promise<void> {
    try {
      // 检查是否为排除类型
      if (this.options.excludeTypes.includes(action.type)) {
        return
      }

      // 清除当前索引之后的所有操作（因为执行了新操作）
      if (this.stack.currentIndex < this.stack.actions.length - 1) {
        this.stack.actions = this.stack.actions.slice(0, this.stack.currentIndex + 1)
      }

      // 添加新操作
      this.stack.actions.push({
        ...action,
        timestamp: Date.now(),
        canUndo: true,
        canRedo: false
      })

      // 更新当前索引
      this.stack.currentIndex = this.stack.actions.length - 1

      // 检查栈大小限制
      if (this.stack.actions.length > this.stack.maxSize) {
        const removeCount = this.stack.actions.length - this.stack.maxSize
        this.stack.actions.splice(0, removeCount)
        this.stack.currentIndex -= removeCount
      }

      this.notifySubscribers({
        type: 'execute',
        actionId: action.id,
        timestamp: Date.now(),
        success: true
      })

    } catch (error) {
      this.notifySubscribers({
        type: 'execute',
        actionId: action.id,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 撤销操作
   */
  async undo(): Promise<boolean> {
    if (!this.canUndo()) {
      return false
    }

    try {
      const action = this.stack.actions[this.stack.currentIndex]
      
      // 执行撤销逻辑（这里需要根据具体业务实现）
      await this.executeUndo(action)

      // 更新索引
      this.stack.currentIndex--

      this.notifySubscribers({
        type: 'undo',
        actionId: action.id,
        timestamp: Date.now(),
        success: true
      })

      return true
    } catch (error) {
      this.notifySubscribers({
        type: 'undo',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 重做操作
   */
  async redo(): Promise<boolean> {
    if (!this.canRedo()) {
      return false
    }

    try {
      const action = this.stack.actions[this.stack.currentIndex + 1]
      
      // 执行重做逻辑
      await this.executeRedo(action)

      // 更新索引
      this.stack.currentIndex++

      this.notifySubscribers({
        type: 'redo',
        actionId: action.id,
        timestamp: Date.now(),
        success: true
      })

      return true
    } catch (error) {
      this.notifySubscribers({
        type: 'redo',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.stack.currentIndex >= 0
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.stack.currentIndex < this.stack.actions.length - 1
  }

  /**
   * 获取操作历史
   */
  getHistory(): UndoRedoAction[] {
    return [...this.stack.actions]
  }

  /**
   * 清空撤销栈
   */
  clear(): void {
    this.stack.actions = []
    this.stack.currentIndex = -1
    
    this.notifySubscribers({
      type: 'clear',
      timestamp: Date.now(),
      success: true
    })
  }

  /**
   * 订阅事件
   */
  subscribe(callback: (event: UndoRedoEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.stack.actions.length,
      currentIndex: this.stack.currentIndex
    }
  }

  /**
   * 批量撤销
   */
  async undoBatch(count: number): Promise<number> {
    let undoCount = 0
    for (let i = 0; i < count && this.canUndo(); i++) {
      if (await this.undo()) {
        undoCount++
      } else {
        break
      }
    }
    return undoCount
  }

  /**
   * 选择性撤销（撤销特定操作）
   */
  async undoSpecific(actionId: string): Promise<boolean> {
    const actionIndex = this.stack.actions.findIndex(action => action.id === actionId)
    if (actionIndex === -1 || actionIndex > this.stack.currentIndex) {
      return false
    }

    // 这是一个复杂的操作，需要撤销从当前位置到目标操作的所有操作
    // 然后重新应用不需要撤销的操作
    // 为简化实现，这里只处理最近的操作
    if (actionIndex === this.stack.currentIndex) {
      return await this.undo()
    }

    // 对于更复杂的选择性撤销，需要更复杂的逻辑
    return false
  }

  /**
   * 执行撤销逻辑（需要根据具体业务实现）
   */
  private async executeUndo(action: UndoRedoAction): Promise<void> {
    // 这里需要根据action.type和action.data.before来恢复数据
    // 具体实现需要与业务逻辑集成
    console.log('Executing undo for action:', action.type, action.id)
  }

  /**
   * 执行重做逻辑
   */
  private async executeRedo(action: UndoRedoAction): Promise<void> {
    // 这里需要根据action.type和action.data.after来重新应用数据
    console.log('Executing redo for action:', action.type, action.id)
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(event: UndoRedoEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in undo-redo subscriber:', error)
      }
    })
  }

  /**
   * 开始自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.options.cleanupInterval)
  }

  /**
   * 清理过期操作
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时

    const validActions = this.stack.actions.filter(action => 
      now - action.timestamp < maxAge
    )

    if (validActions.length !== this.stack.actions.length) {
      const removedCount = this.stack.actions.length - validActions.length
      this.stack.actions = validActions
      this.stack.currentIndex = Math.max(-1, this.stack.currentIndex - removedCount)
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.subscribers.clear()
    this.clear()
  }
}

// 全局实例
export const undoRedoManager = new UndoRedoManager()
