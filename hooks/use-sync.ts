"use client"

import { useState, useEffect, useCallback } from "react"
import { useOffline } from "@/hooks/use-offline"
import { syncData } from "@/lib/pwa/sync"
import { toast } from "@/components/ui/use-toast"

/**
 * 自定义钩子，用于管理数据同步状态
 * @returns 一个包含同步状态和函数的对象
 */
export function useSync() {
  const { isOnline, needsSync, resetSyncState } = useOffline()
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  /**
   * 执行数据同步
   */
  const performSync = useCallback(async () => {
    if (!isOnline) {
      setSyncError("无网络连接，无法同步数据")
      return false
    }

    if (isSyncing) {
      return false
    }

    try {
      setIsSyncing(true)
      setSyncError(null)

      const result = await syncData()

      if (result.success) {
        setLastSyncTime(new Date())
        resetSyncState()
        toast({
          title: "数据同步成功",
          description: result.message,
        })
        return true
      } else {
        setSyncError(result.message)
        toast({
          title: "数据同步失败",
          description: result.message,
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setSyncError(errorMessage)
      toast({
        title: "数据同步出错",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, resetSyncState])

  /**
   * 当网络状态变化且需要同步时，自动执行同步
   */
  useEffect(() => {
    if (isOnline && needsSync() && !isSyncing) {
      performSync()
    }
  }, [isOnline, needsSync, isSyncing, performSync])

  /**
   * 获取上次同步时间的友好显示
   */
  const getLastSyncTimeDisplay = useCallback(() => {
    if (!lastSyncTime) {
      return "从未同步"
    }

    const now = new Date()
    const diffMs = now.getTime() - lastSyncTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return "刚刚同步"
    } else if (diffMins < 60) {
      return `${diffMins}分钟前同步`
    } else if (diffHours < 24) {
      return `${diffHours}小时前同步`
    } else {
      return `${diffDays}天前同步`
    }
  }, [lastSyncTime])

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    performSync,
    getLastSyncTimeDisplay,
    needsSync: needsSync,
  }
}

export default useSync
