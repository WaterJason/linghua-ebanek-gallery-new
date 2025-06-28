// 阶段4操作反馈增强 - WebSocket实时进度推送
// 提供实时的进度更新和多设备同步

import { ProgressUpdate, ProgressEvent } from '@/lib/types/feedback-types'
import { progressMonitor } from './progress-monitor'

interface WebSocketProgressMessage {
  type: 'progress_update' | 'progress_complete' | 'progress_error' | 'progress_cancel'
  progressId: string
  data?: ProgressUpdate | string
  timestamp: number
  userId?: string
  sessionId?: string
}

export class WebSocketProgressManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private messageQueue: WebSocketProgressMessage[] = []
  private subscribers: Set<(message: WebSocketProgressMessage) => void> = new Set()

  constructor(private wsUrl?: string) {
    this.wsUrl = wsUrl || this.getWebSocketUrl()
    this.connect()
  }

  /**
   * 连接WebSocket
   */
  private async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true

    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('📡 WebSocket进度推送连接已建立')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.processMessageQueue()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketProgressMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('WebSocket消息解析失败:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('📡 WebSocket进度推送连接已关闭')
        this.isConnecting = false
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket进度推送连接错误:', error)
        this.isConnecting = false
      }

    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketProgressMessage): void {
    // 通知订阅者
    this.subscribers.forEach(callback => {
      try {
        callback(message)
      } catch (error) {
        console.error('WebSocket消息处理错误:', error)
      }
    })

    // 更新本地进度监控器
    switch (message.type) {
      case 'progress_update':
        if (message.data && typeof message.data === 'object') {
          progressMonitor.updateProgress(message.progressId, message.data as ProgressUpdate)
        }
        break

      case 'progress_complete':
        progressMonitor.completeProgress(
          message.progressId, 
          typeof message.data === 'string' ? message.data : '操作完成'
        )
        break

      case 'progress_error':
        progressMonitor.failProgress(
          message.progressId,
          typeof message.data === 'string' ? message.data : '操作失败'
        )
        break

      case 'progress_cancel':
        progressMonitor.cancelProgress(message.progressId)
        break
    }
  }

  /**
   * 发送进度更新
   */
  sendProgressUpdate(progressId: string, update: ProgressUpdate): void {
    const message: WebSocketProgressMessage = {
      type: 'progress_update',
      progressId,
      data: update,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId()
    }

    this.sendMessage(message)
  }

  /**
   * 发送进度完成
   */
  sendProgressComplete(progressId: string, message?: string): void {
    const wsMessage: WebSocketProgressMessage = {
      type: 'progress_complete',
      progressId,
      data: message,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId()
    }

    this.sendMessage(wsMessage)
  }

  /**
   * 发送进度错误
   */
  sendProgressError(progressId: string, error: string): void {
    const message: WebSocketProgressMessage = {
      type: 'progress_error',
      progressId,
      data: error,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId()
    }

    this.sendMessage(message)
  }

  /**
   * 发送消息
   */
  private sendMessage(message: WebSocketProgressMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // 连接未就绪，加入队列
      this.messageQueue.push(message)
      if (!this.isConnecting) {
        this.connect()
      }
    }
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`📡 ${delay}ms后尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error('📡 WebSocket重连次数已达上限，停止重连')
    }
  }

  /**
   * 订阅消息
   */
  subscribe(callback: (message: WebSocketProgressMessage) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 获取WebSocket URL
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/api/ws/progress`
  }

  /**
   * 获取当前用户ID
   */
  private getCurrentUserId(): string {
    // 这里应该从认证系统获取当前用户ID
    return 'current-user'
  }

  /**
   * 获取当前会话ID
   */
  private getCurrentSessionId(): string {
    // 这里应该从会话管理获取当前会话ID
    return 'current-session'
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * 手动重连
   */
  reconnect(): void {
    if (this.ws) {
      this.ws.close()
    }
    this.reconnectAttempts = 0
    this.connect()
  }

  /**
   * 关闭连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscribers.clear()
    this.messageQueue = []
  }

  /**
   * 获取连接状态信息
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      subscribers: this.subscribers.size
    }
  }
}

// 全局实例
export const wsProgressManager = new WebSocketProgressManager()

// 集成到进度监控器
progressMonitor.subscribe((event: ProgressEvent) => {
  switch (event.type) {
    case 'update':
      if (event.data && typeof event.data === 'object') {
        wsProgressManager.sendProgressUpdate(event.progressId, event.data as ProgressUpdate)
      }
      break

    case 'complete':
      wsProgressManager.sendProgressComplete(
        event.progressId,
        typeof event.data === 'string' ? event.data : undefined
      )
      break

    case 'error':
      wsProgressManager.sendProgressError(
        event.progressId,
        typeof event.data === 'string' ? event.data : '操作失败'
      )
      break
  }
})
