"use client"

import React from 'react'

/**
 * WebSocket 实时推送系统
 * 
 * 提供实时数据推送、通知和协作功能
 */

export interface WebSocketMessage {
  id: string
  type: string
  data: any
  timestamp: number
  userId?: string
  sessionId?: string
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  enableLogging: boolean
}

export interface WebSocketSubscription {
  id: string
  type: string
  handler: (message: WebSocketMessage) => void
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private subscriptions: Map<string, WebSocketSubscription> = new Map()
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private messageQueue: WebSocketMessage[] = []
  private listeners: Set<(status: WebSocketStatus) => void> = new Set()

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      enableLogging: true,
      ...config
    }
  }

  /**
   * 连接 WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      try {
        this.ws = new WebSocket(this.config.url)

        this.ws.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.log('WebSocket 连接成功')
          this.startHeartbeat()
          this.processMessageQueue()
          this.notifyListeners({ connected: true, reconnecting: false })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            this.log('解析消息失败:', error)
          }
        }

        this.ws.onclose = (event) => {
          this.isConnected = false
          this.stopHeartbeat()
          this.log('WebSocket 连接关闭:', event.code, event.reason)
          this.notifyListeners({ connected: false, reconnecting: false })
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          this.log('WebSocket 错误:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, '主动断开')
      this.ws = null
    }

    this.isConnected = false
    this.notifyListeners({ connected: false, reconnecting: false })
  }

  /**
   * 发送消息
   */
  send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...message
    }

    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(fullMessage))
        this.log('发送消息:', fullMessage)
      } catch (error) {
        this.log('发送消息失败:', error)
        this.messageQueue.push(fullMessage)
      }
    } else {
      this.messageQueue.push(fullMessage)
      this.log('连接未建立，消息已加入队列')
    }
  }

  /**
   * 订阅消息类型
   */
  subscribe(type: string, handler: (message: WebSocketMessage) => void): string {
    const subscription: WebSocketSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      handler
    }

    this.subscriptions.set(subscription.id, subscription)
    this.log(`订阅消息类型: ${type}`)
    
    return subscription.id
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      this.subscriptions.delete(subscriptionId)
      this.log(`取消订阅: ${subscription.type}`)
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    this.log('接收消息:', message)

    // 处理心跳响应
    if (message.type === 'pong') {
      return
    }

    // 分发消息给订阅者
    this.subscriptions.forEach(subscription => {
      if (subscription.type === message.type || subscription.type === '*') {
        try {
          subscription.handler(message)
        } catch (error) {
          this.log('处理订阅消息失败:', error)
        }
      }
    })
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message && this.ws) {
        try {
          this.ws.send(JSON.stringify(message))
          this.log('发送队列消息:', message)
        } catch (error) {
          this.log('发送队列消息失败:', error)
          this.messageQueue.unshift(message)
          break
        }
      }
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.config.reconnectInterval * this.reconnectAttempts, 30000)
    
    this.log(`${delay}ms 后尝试重连 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)
    this.notifyListeners({ connected: false, reconnecting: true })

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect().catch(() => {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect()
        } else {
          this.log('达到最大重连次数，停止重连')
          this.notifyListeners({ connected: false, reconnecting: false })
        }
      })
    }, delay)
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({
          type: 'ping',
          data: { timestamp: Date.now() }
        })
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 添加状态监听器
   */
  addStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.listeners.add(listener)
  }

  /**
   * 移除状态监听器
   */
  removeStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.listeners.delete(listener)
  }

  /**
   * 通知状态监听器
   */
  private notifyListeners(status: WebSocketStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        this.log('状态监听器错误:', error)
      }
    })
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[WebSocket]', ...args)
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatus {
    return {
      connected: this.isConnected,
      reconnecting: this.reconnectTimer !== null
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): WebSocketStats {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: this.subscriptions.size,
      queuedMessages: this.messageQueue.length
    }
  }
}

export interface WebSocketStatus {
  connected: boolean
  reconnecting: boolean
}

export interface WebSocketStats {
  connected: boolean
  reconnectAttempts: number
  subscriptions: number
  queuedMessages: number
}

// 创建全局实例
export const webSocketManager = new WebSocketManager()

/**
 * React Hook for WebSocket
 */
export function useWebSocket() {
  const [status, setStatus] = React.useState<WebSocketStatus>({ connected: false, reconnecting: false })
  const [stats, setStats] = React.useState<WebSocketStats>({ connected: false, reconnectAttempts: 0, subscriptions: 0, queuedMessages: 0 })

  React.useEffect(() => {
    const updateStatus = (newStatus: WebSocketStatus) => {
      setStatus(newStatus)
      setStats(webSocketManager.getStats())
    }

    webSocketManager.addStatusListener(updateStatus)
    setStatus(webSocketManager.getStatus())
    setStats(webSocketManager.getStats())

    return () => {
      webSocketManager.removeStatusListener(updateStatus)
    }
  }, [])

  const connect = React.useCallback(() => {
    return webSocketManager.connect()
  }, [])

  const disconnect = React.useCallback(() => {
    webSocketManager.disconnect()
  }, [])

  const send = React.useCallback((message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => {
    webSocketManager.send(message)
  }, [])

  const subscribe = React.useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    return webSocketManager.subscribe(type, handler)
  }, [])

  const unsubscribe = React.useCallback((subscriptionId: string) => {
    webSocketManager.unsubscribe(subscriptionId)
  }, [])

  return {
    status,
    stats,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe
  }
}

/**
 * 便捷的消息发送函数
 */
export const sendMessage = {
  notification: (data: any) => webSocketManager.send({ type: 'notification', data }),
  update: (data: any) => webSocketManager.send({ type: 'update', data }),
  sync: (data: any) => webSocketManager.send({ type: 'sync', data }),
  broadcast: (data: any) => webSocketManager.send({ type: 'broadcast', data })
}

// 自动连接（可选）
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WS_AUTO_CONNECT === 'true') {
  webSocketManager.connect().catch(console.error)
}
