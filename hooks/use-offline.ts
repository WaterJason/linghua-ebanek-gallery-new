"use client"

import { useState, useEffect } from "react"

/**
 * 自定义钩子，用于检测网络连接状态
 * @returns 一个包含在线状态和相关函数的对象
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [wasOffline, setWasOffline] = useState<boolean>(false)

  useEffect(() => {
    // 初始化检查
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      setIsOnline(navigator.onLine)
      setWasOffline(!navigator.onLine)
    }

    // 在线状态变化处理函数
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true) // 标记曾经离线
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // 添加事件监听器
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 清理函数
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * 检查是否需要同步数据
   * @returns 如果曾经离线现在在线，返回true
   */
  const needsSync = () => {
    return wasOffline && isOnline
  }

  /**
   * 重置同步状态
   */
  const resetSyncState = () => {
    setWasOffline(false)
  }

  return {
    isOnline,
    wasOffline,
    needsSync,
    resetSyncState
  }
}

export default useOffline
