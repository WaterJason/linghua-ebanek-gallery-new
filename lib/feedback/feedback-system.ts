// 阶段4操作反馈增强 - 反馈系统
// 提供丰富的操作反馈，包括成功、错误、警告、信息等多种类型

import {
  FeedbackMessage,
  FeedbackOptions,
  FeedbackConfig,
  FeedbackEvent,
  FeedbackType
} from '@/lib/types/feedback-types'
import { soundManager } from './sound-manager'

export class FeedbackSystem {
  private messages: Map<string, FeedbackMessage>
  private subscribers: Set<(event: FeedbackEvent) => void>
  private config: FeedbackConfig
  private messageQueue: FeedbackMessage[]
  private isProcessingQueue: boolean

  constructor(config: Partial<FeedbackConfig> = {}) {
    this.config = {
      defaultDuration: config.defaultDuration ?? 5000,
      maxMessages: config.maxMessages ?? 5,
      enableSound: config.enableSound ?? false,
      enableAnimation: config.enableAnimation ?? true,
      position: config.position ?? 'top-right'
    }

    this.messages = new Map()
    this.subscribers = new Set()
    this.messageQueue = []
    this.isProcessingQueue = false
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string, options: FeedbackOptions = {}): string {
    return this.show('success', '操作成功', message, options)
  }

  /**
   * 显示错误消息
   */
  showError(message: string, options: FeedbackOptions = {}): string {
    return this.show('error', '操作失败', message, {
      ...options,
      duration: options.duration ?? 8000, // 错误消息显示更久
      persistent: options.persistent ?? false
    })
  }

  /**
   * 显示警告消息
   */
  showWarning(message: string, options: FeedbackOptions = {}): string {
    return this.show('warning', '注意', message, options)
  }

  /**
   * 显示信息消息
   */
  showInfo(message: string, options: FeedbackOptions = {}): string {
    return this.show('info', '提示', message, options)
  }

  /**
   * 显示加载消息
   */
  showLoading(message: string, options: FeedbackOptions = {}): string {
    return this.show('loading', '处理中', message, {
      ...options,
      persistent: true, // 加载消息默认持久化
      showProgress: options.showProgress ?? true
    })
  }

  /**
   * 显示进度消息
   */
  showProgress(operation: string, progress: number, options: FeedbackOptions = {}): string {
    const message = `${operation} (${Math.round(progress)}%)`
    return this.show('loading', '进度', message, {
      ...options,
      persistent: true,
      showProgress: true,
      details: { progress }
    })
  }

  /**
   * 核心显示方法
   */
  private show(
    type: FeedbackType,
    title: string,
    message: string,
    options: FeedbackOptions = {}
  ): string {
    const id = this.generateId()
    const feedbackMessage: FeedbackMessage = {
      id,
      type,
      title,
      message,
      duration: options.persistent ? undefined : (options.duration ?? this.config.defaultDuration),
      actions: options.actions,
      timestamp: Date.now(),
      persistent: options.persistent ?? false,
      details: options.details
    }

    // 检查消息数量限制
    if (this.messages.size >= this.config.maxMessages) {
      this.removeOldestMessage()
    }

    this.messages.set(id, feedbackMessage)
    this.queueMessage(feedbackMessage)

    // 设置自动移除定时器（如果不是持久化消息）
    if (!feedbackMessage.persistent && feedbackMessage.duration) {
      setTimeout(() => {
        this.dismiss(id)
      }, feedbackMessage.duration)
    }

    return id
  }

  /**
   * 移除消息
   */
  dismiss(id: string): void {
    const message = this.messages.get(id)
    if (message) {
      this.messages.delete(id)
      this.notifySubscribers({
        type: 'hide',
        messageId: id,
        timestamp: Date.now()
      })
    }
  }

  /**
   * 移除所有消息
   */
  dismissAll(): void {
    const messageIds = Array.from(this.messages.keys())
    this.messages.clear()

    messageIds.forEach(id => {
      this.notifySubscribers({
        type: 'hide',
        messageId: id,
        timestamp: Date.now()
      })
    })
  }

  /**
   * 更新消息
   */
  updateMessage(id: string, updates: Partial<FeedbackMessage>): boolean {
    const message = this.messages.get(id)
    if (!message) {
      return false
    }

    const updatedMessage = { ...message, ...updates }
    this.messages.set(id, updatedMessage)

    this.notifySubscribers({
      type: 'show',
      messageId: id,
      timestamp: Date.now(),
      data: updatedMessage
    })

    return true
  }

  /**
   * 获取所有消息
   */
  getMessages(): FeedbackMessage[] {
    return Array.from(this.messages.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 获取特定消息
   */
  getMessage(id: string): FeedbackMessage | undefined {
    return this.messages.get(id)
  }

  /**
   * 订阅事件
   */
  subscribe(callback: (event: FeedbackEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 智能反馈内容生成
   */
  generateSmartFeedback(
    operation: string,
    result: 'success' | 'error',
    context?: any
  ): { title: string; message: string; actions?: any[] } {
    const templates = {
      success: {
        create: { title: '创建成功', message: `${operation}已成功创建` },
        update: { title: '更新成功', message: `${operation}已成功更新` },
        delete: { title: '删除成功', message: `${operation}已成功删除` },
        import: { title: '导入成功', message: `${operation}导入完成` },
        export: { title: '导出成功', message: `${operation}导出完成` },
        default: { title: '操作成功', message: `${operation}执行成功` }
      },
      error: {
        create: { title: '创建失败', message: `${operation}创建失败，请检查输入信息` },
        update: { title: '更新失败', message: `${operation}更新失败，请重试` },
        delete: { title: '删除失败', message: `${operation}删除失败，可能存在关联数据` },
        import: { title: '导入失败', message: `${operation}导入失败，请检查文件格式` },
        export: { title: '导出失败', message: `${operation}导出失败，请重试` },
        network: { title: '网络错误', message: '网络连接异常，请检查网络设置' },
        permission: { title: '权限不足', message: '您没有执行此操作的权限' },
        validation: { title: '数据验证失败', message: '请检查输入的数据格式' },
        default: { title: '操作失败', message: `${operation}执行失败` }
      }
    }

    const operationType = this.detectOperationType(operation)
    const template = templates[result][operationType] || templates[result].default

    // 添加建议性操作
    const actions = result === 'error' ? this.generateErrorActions(operationType, context) : []

    return {
      ...template,
      actions
    }
  }

  /**
   * 检测操作类型
   */
  private detectOperationType(operation: string): string {
    const lowerOp = operation.toLowerCase()
    if (lowerOp.includes('创建') || lowerOp.includes('新增') || lowerOp.includes('添加')) return 'create'
    if (lowerOp.includes('更新') || lowerOp.includes('修改') || lowerOp.includes('编辑')) return 'update'
    if (lowerOp.includes('删除') || lowerOp.includes('移除')) return 'delete'
    if (lowerOp.includes('导入')) return 'import'
    if (lowerOp.includes('导出')) return 'export'
    if (lowerOp.includes('网络') || lowerOp.includes('连接')) return 'network'
    if (lowerOp.includes('权限')) return 'permission'
    if (lowerOp.includes('验证') || lowerOp.includes('格式')) return 'validation'
    return 'default'
  }

  /**
   * 生成错误操作建议
   */
  private generateErrorActions(operationType: string, context?: any): any[] {
    const actions = []

    switch (operationType) {
      case 'network':
        actions.push({ label: '重试', action: () => window.location.reload() })
        break
      case 'validation':
        actions.push({ label: '查看详情', action: () => console.log('Validation details:', context) })
        break
      case 'permission':
        actions.push({ label: '联系管理员', action: () => console.log('Contact admin') })
        break
      default:
        actions.push({ label: '重试', action: () => console.log('Retry operation') })
    }

    return actions
  }

  /**
   * 队列处理
   */
  private queueMessage(message: FeedbackMessage): void {
    this.messageQueue.push(message)
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
  }

  /**
   * 处理消息队列
   */
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!

      this.notifySubscribers({
        type: 'show',
        messageId: message.id,
        timestamp: Date.now(),
        data: message
      })

      // 播放声音（如果启用）
      if (this.config.enableSound) {
        soundManager.playFeedbackSound(message.type)
      }

      // 短暂延迟避免消息过于密集
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isProcessingQueue = false
  }



  /**
   * 移除最旧的消息
   */
  private removeOldestMessage(): void {
    const messages = this.getMessages()
    if (messages.length > 0) {
      const oldest = messages[messages.length - 1]
      this.dismiss(oldest.id)
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(event: FeedbackEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in feedback subscriber:', error)
      }
    })
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取配置
   */
  getConfig(): FeedbackConfig {
    return { ...this.config }
  }
}

// 全局实例
export const feedbackSystem = new FeedbackSystem()
