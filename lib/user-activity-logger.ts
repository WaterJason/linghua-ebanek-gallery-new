"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect } from "react"

// 活动类型
export type ActivityType = 
  | "page_view"
  | "product_view"
  | "product_create"
  | "product_update"
  | "product_delete"
  | "category_view"
  | "category_create"
  | "category_update"
  | "category_delete"
  | "search"
  | "filter"
  | "export"
  | "import"
  | "batch_edit"
  | "login"
  | "logout"
  | "error"

// 活动数据
export interface ActivityData {
  type: ActivityType
  timestamp: string
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  path: string
  details?: Record<string, any>
  sessionId: string
  deviceInfo: {
    userAgent: string
    screenWidth: number
    screenHeight: number
    language: string
    platform: string
  }
}

// 本地存储键
const STORAGE_KEY = "user_activity_log"
const SESSION_ID_KEY = "session_id"

// 获取或创建会话ID
const getSessionId = (): string => {
  if (typeof window === "undefined") return ""
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  
  return sessionId
}

// 获取设备信息
const getDeviceInfo = (): ActivityData["deviceInfo"] => {
  if (typeof window === "undefined") {
    return {
      userAgent: "",
      screenWidth: 0,
      screenHeight: 0,
      language: "",
      platform: ""
    }
  }
  
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    platform: navigator.platform
  }
}

// 记录活动
export const logActivity = (
  type: ActivityType,
  details?: Record<string, any>,
  userId?: string,
  userName?: string,
  userEmail?: string
): void => {
  if (typeof window === "undefined") return
  
  try {
    const sessionId = getSessionId()
    const deviceInfo = getDeviceInfo()
    
    const activity: ActivityData = {
      type,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userEmail,
      path: window.location.pathname,
      details,
      sessionId,
      deviceInfo
    }
    
    // 获取现有日志
    const existingLogs = localStorage.getItem(STORAGE_KEY)
    const logs: ActivityData[] = existingLogs ? JSON.parse(existingLogs) : []
    
    // 添加新日志
    logs.push(activity)
    
    // 限制日志数量，保留最新的1000条
    const trimmedLogs = logs.slice(-1000)
    
    // 保存日志
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs))
    
    // 如果配置了服务器端日志记录，也发送到服务器
    if (process.env.NEXT_PUBLIC_ENABLE_SERVER_LOGGING === "true") {
      sendLogToServer(activity).catch(console.error)
    }
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

// 发送日志到服务器
const sendLogToServer = async (activity: ActivityData): Promise<void> => {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(activity)
    })
  } catch (error) {
    console.error("Failed to send log to server:", error)
  }
}

// 获取所有日志
export const getAllLogs = (): ActivityData[] => {
  if (typeof window === "undefined") return []
  
  try {
    const logs = localStorage.getItem(STORAGE_KEY)
    return logs ? JSON.parse(logs) : []
  } catch (error) {
    console.error("Failed to get logs:", error)
    return []
  }
}

// 清除所有日志
export const clearAllLogs = (): void => {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear logs:", error)
  }
}

// 导出日志为JSON
export const exportLogsAsJson = (): string => {
  const logs = getAllLogs()
  return JSON.stringify(logs, null, 2)
}

// 导出日志为CSV
export const exportLogsAsCsv = (): string => {
  const logs = getAllLogs()
  
  if (logs.length === 0) {
    return ""
  }
  
  // 获取所有可能的列
  const allColumns = new Set<string>()
  logs.forEach(log => {
    Object.keys(log).forEach(key => {
      if (key !== "details" && key !== "deviceInfo") {
        allColumns.add(key)
      }
    })
    
    if (log.details) {
      Object.keys(log.details).forEach(key => {
        allColumns.add(`details.${key}`)
      })
    }
    
    if (log.deviceInfo) {
      Object.keys(log.deviceInfo).forEach(key => {
        allColumns.add(`deviceInfo.${key}`)
      })
    }
  })
  
  const columns = Array.from(allColumns)
  
  // 创建CSV标题行
  const header = columns.join(",")
  
  // 创建CSV数据行
  const rows = logs.map(log => {
    return columns.map(column => {
      if (column.startsWith("details.")) {
        const detailKey = column.replace("details.", "")
        const value = log.details?.[detailKey]
        return formatCsvValue(value)
      } else if (column.startsWith("deviceInfo.")) {
        const infoKey = column.replace("deviceInfo.", "")
        const value = log.deviceInfo?.[infoKey as keyof ActivityData["deviceInfo"]]
        return formatCsvValue(value)
      } else {
        const value = log[column as keyof ActivityData]
        return formatCsvValue(value)
      }
    }).join(",")
  })
  
  return [header, ...rows].join("\n")
}

// 格式化CSV值
const formatCsvValue = (value: any): string => {
  if (value === null || value === undefined) {
    return ""
  }
  
  if (typeof value === "object") {
    value = JSON.stringify(value)
  }
  
  value = String(value)
  
  // 如果值包含逗号、双引号或换行符，则用双引号括起来
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    // 将双引号替换为两个双引号
    value = value.replace(/"/g, "\"\"")
    value = `"${value}"`
  }
  
  return value
}

// React钩子，用于记录页面浏览
export const usePageViewLogger = (pageName: string) => {
  const { data: session } = useSession()
  
  useEffect(() => {
    logActivity(
      "page_view",
      { pageName },
      session?.user?.id as string,
      session?.user?.name as string,
      session?.user?.email as string
    )
  }, [pageName, session])
}

// React钩子，用于记录产品浏览
export const useProductViewLogger = (productId: number, productName: string) => {
  const { data: session } = useSession()
  
  useEffect(() => {
    logActivity(
      "product_view",
      { productId, productName },
      session?.user?.id as string,
      session?.user?.name as string,
      session?.user?.email as string
    )
  }, [productId, productName, session])
}

// React钩子，用于记录搜索活动
export const useSearchLogger = () => {
  const { data: session } = useSession()
  
  const logSearch = useCallback((searchQuery: string, filters?: Record<string, any>) => {
    logActivity(
      "search",
      { searchQuery, filters },
      session?.user?.id as string,
      session?.user?.name as string,
      session?.user?.email as string
    )
  }, [session])
  
  return logSearch
}

// React钩子，用于记录错误
export const useErrorLogger = () => {
  const { data: session } = useSession()
  
  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    logActivity(
      "error",
      { 
        errorMessage: error.message, 
        errorStack: error.stack,
        ...context
      },
      session?.user?.id as string,
      session?.user?.name as string,
      session?.user?.email as string
    )
  }, [session])
  
  return logError
}
