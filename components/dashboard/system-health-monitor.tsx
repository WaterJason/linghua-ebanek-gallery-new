"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ActivityIcon,
  ServerIcon,
  DatabaseIcon,
  WifiIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  TrendingUpIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SystemStatus {
  name: string
  status: "healthy" | "warning" | "error"
  value: number
  unit: string
  icon: React.ElementType
  description: string
}

export function SystemHealthMonitor() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadSystemStatus()
    
    // 每30秒刷新一次系统状态
    const interval = setInterval(loadSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSystemStatus = async () => {
    setIsLoading(true)
    try {
      // 模拟系统状态检查
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const status: SystemStatus[] = [
        {
          name: "数据库连接",
          status: "healthy",
          value: 98,
          unit: "%",
          icon: DatabaseIcon,
          description: "PostgreSQL连接正常"
        },
        {
          name: "服务器性能",
          status: "healthy",
          value: 85,
          unit: "%",
          icon: ServerIcon,
          description: "CPU和内存使用正常"
        },
        {
          name: "网络状态",
          status: "healthy",
          value: 95,
          unit: "%",
          icon: WifiIcon,
          description: "网络连接稳定"
        },
        {
          name: "系统响应",
          status: "warning",
          value: 72,
          unit: "ms",
          icon: ActivityIcon,
          description: "平均响应时间略高"
        }
      ]
      
      setSystemStatus(status)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to load system status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOverallHealth = () => {
    if (systemStatus.length === 0) return 0
    
    const healthyCount = systemStatus.filter(s => s.status === "healthy").length
    const warningCount = systemStatus.filter(s => s.status === "warning").length
    const errorCount = systemStatus.filter(s => s.status === "error").length
    
    if (errorCount > 0) return "error"
    if (warningCount > 0) return "warning"
    return "healthy"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100"
      case "warning":
        return "text-yellow-600 bg-yellow-100"
      case "error":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircleIcon className="w-4 h-4" />
      case "warning":
      case "error":
        return <AlertTriangleIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const overallHealth = getOverallHealth()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            系统监控
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={overallHealth === "healthy" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                overallHealth === "healthy" ? "bg-green-100 text-green-800" :
                overallHealth === "warning" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              )}
            >
              {overallHealth === "healthy" ? "正常" :
               overallHealth === "warning" ? "警告" : "异常"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadSystemStatus}
              disabled={isLoading}
              className="h-6 w-6"
            >
              <RefreshCwIcon className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 系统状态列表 */}
        <div className="space-y-3">
          {systemStatus.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1 rounded-full",
                    getStatusColor(item.status)
                  )}>
                    <item.icon className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-semibold">
                    {item.value}{item.unit}
                  </span>
                </div>
              </div>
              
              {/* 进度条 */}
              {item.unit === "%" && (
                <Progress 
                  value={item.value} 
                  className={cn(
                    "h-1.5",
                    item.status === "healthy" ? "bg-green-100" :
                    item.status === "warning" ? "bg-yellow-100" :
                    "bg-red-100"
                  )}
                />
              )}
              
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* 最后更新时间 */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>最后更新</span>
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* 系统建议 */}
        {overallHealth !== "healthy" && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">系统建议</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {systemStatus.filter(s => s.status !== "healthy").map((item, index) => (
                    <div key={index}>
                      • {item.name}: {getSystemAdvice(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 获取系统建议
function getSystemAdvice(status: SystemStatus): string {
  switch (status.name) {
    case "数据库连接":
      return status.status === "warning" ? "检查数据库连接池配置" : "重启数据库服务"
    case "服务器性能":
      return status.status === "warning" ? "监控资源使用情况" : "考虑扩容服务器"
    case "网络状态":
      return status.status === "warning" ? "检查网络配置" : "联系网络服务商"
    case "系统响应":
      return status.status === "warning" ? "优化数据库查询" : "检查系统负载"
    default:
      return "请联系技术支持"
  }
}
