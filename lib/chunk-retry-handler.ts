'use client'

import React from 'react'

/**
 * Chunk 重试处理器
 * 用于处理动态导入失败和 ChunkLoadError
 */

interface RetryConfig {
  maxRetries: number
  retryDelay: number
  exponentialBackoff: boolean
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true
}

class ChunkRetryHandler {
  private retryCount = new Map<string, number>()
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * 带重试的动态导入
   */
  async importWithRetry<T>(
    importFn: () => Promise<T>,
    chunkName: string = 'unknown'
  ): Promise<T> {
    const currentRetries = this.retryCount.get(chunkName) || 0

    try {
      const result = await importFn()
      // 成功后重置重试计数
      this.retryCount.delete(chunkName)
      return result
    } catch (error) {
      console.error(`Chunk import failed for ${chunkName}:`, error)

      if (this.isChunkLoadError(error) && currentRetries < this.config.maxRetries) {
        const nextRetryCount = currentRetries + 1
        this.retryCount.set(chunkName, nextRetryCount)

        const delay = this.config.exponentialBackoff
          ? this.config.retryDelay * Math.pow(2, currentRetries)
          : this.config.retryDelay

        console.log(`Retrying chunk import for ${chunkName} (attempt ${nextRetryCount}/${this.config.maxRetries}) after ${delay}ms`)

        // 清除相关缓存
        await this.clearChunkCache(chunkName)

        // 等待后重试
        await this.delay(delay)
        return this.importWithRetry(importFn, chunkName)
      }

      // 重试次数用完或非 chunk 错误，抛出原始错误
      throw error
    }
  }

  /**
   * 检查是否是 ChunkLoadError
   */
  private isChunkLoadError(error: any): boolean {
    if (!error) return false

    const errorMessage = error.message || ''
    const errorName = error.name || ''
    const errorStack = error.stack || ''

    return (
      errorName === 'ChunkLoadError' ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('ChunkLoadError') ||
      errorStack.includes('__webpack_require__') ||
      errorStack.includes('webpackChunkName') ||
      errorMessage.includes('Loading CSS chunk')
    )
  }

  /**
   * 清除 chunk 相关缓存
   */
  private async clearChunkCache(chunkName: string): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // 清除 Service Worker 缓存
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const chunkCaches = cacheNames.filter(name =>
          name.includes('next-static') ||
          name.includes('webpack') ||
          name.includes(chunkName)
        )

        await Promise.all(chunkCaches.map(name => caches.delete(name)))
      }

      // 清除可能的模块缓存
      if (window.__webpack_require__ && window.__webpack_require__.cache) {
        const cache = window.__webpack_require__.cache
        Object.keys(cache).forEach(key => {
          if (key.includes(chunkName)) {
            delete cache[key]
          }
        })
      }
    } catch (error) {
      console.warn('Failed to clear chunk cache:', error)
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 重置所有重试计数
   */
  resetRetryCount(): void {
    this.retryCount.clear()
  }

  /**
   * 获取重试统计
   */
  getRetryStats(): Record<string, number> {
    return Object.fromEntries(this.retryCount)
  }
}

// 全局实例
const chunkRetryHandler = new ChunkRetryHandler()

/**
 * 创建带重试的动态导入函数
 */
export function createRetryableImport<T>(
  importFn: () => Promise<T>,
  chunkName?: string
): () => Promise<T> {
  return () => chunkRetryHandler.importWithRetry(importFn, chunkName)
}

/**
 * 直接使用的重试导入函数
 */
export function retryableImport<T>(
  importFn: () => Promise<T>,
  chunkName?: string
): Promise<T> {
  return chunkRetryHandler.importWithRetry(importFn, chunkName)
}

/**
 * 为 React.lazy 创建带重试的组件
 */
export function createRetryableLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName?: string
): React.LazyExoticComponent<T> {
  return React.lazy(() => chunkRetryHandler.importWithRetry(importFn, chunkName))
}

// 全局错误处理
if (typeof window !== 'undefined') {
  // 监听全局错误
  window.addEventListener('error', (event) => {
    if (chunkRetryHandler.isChunkLoadError(event.error)) {
      console.log('Global ChunkLoadError detected, attempting recovery...')
      event.preventDefault()

      // 尝试重新加载页面
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })

  // 监听未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (chunkRetryHandler.isChunkLoadError(event.reason)) {
      console.log('Unhandled ChunkLoadError detected, attempting recovery...')
      event.preventDefault()

      // 尝试重新加载页面
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })
}

export default chunkRetryHandler

// 类型声明
declare global {
  interface Window {
    __webpack_require__?: {
      cache?: Record<string, any>
    }
  }
}

export type { RetryConfig }
