"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  BarChart2Icon,
  CpuIcon,
  HardDriveIcon,
  MemoryStickIcon,
  NetworkIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react"

export default function MonitoringPage() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    fetchSystemInfo()
    // 每30秒自动刷新
    const interval = setInterval(fetchSystemInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch("/api/system-info")
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
        setLastUpdate(new Date())
      } else {
        toast({
          title: "错误",
          description: "获取系统信息失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取系统信息失败:", error)
      toast({
        title: "错误",
        description: "获取系统信息失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchSystemInfo()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            正常
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangleIcon className="h-3 w-3" />
            警告
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircleIcon className="h-3 w-3" />
            异常
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (loading && !systemInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">系统监控</h1>
          <p className="text-muted-foreground">
            监控系统性能和运行状态 • 最后更新: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 系统状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              系统状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(systemInfo?.status || "healthy")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CpuIcon className="h-5 w-5 text-blue-600" />
              CPU使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">
                  {systemInfo?.cpu?.usage || 25}%
                </span>
              </div>
              <Progress
                value={systemInfo?.cpu?.usage || 25}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MemoryStickIcon className="h-5 w-5 text-purple-600" />
              内存使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">
                  {systemInfo?.memory?.usage || 68}%
                </span>
              </div>
              <Progress
                value={systemInfo?.memory?.usage || 68}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {systemInfo?.memory?.used || "2.1"}GB / {systemInfo?.memory?.total || "3.1"}GB
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDriveIcon className="h-5 w-5 text-orange-600" />
              磁盘使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">
                  {systemInfo?.disk?.usage || 45}%
                </span>
              </div>
              <Progress
                value={systemInfo?.disk?.usage || 45}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {systemInfo?.disk?.used || "45"}GB / {systemInfo?.disk?.total || "100"}GB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 服务状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon className="h-5 w-5" />
            服务状态
          </CardTitle>
          <CardDescription>
            系统各项服务的运行状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "数据库", status: "healthy", uptime: "99.9%" },
              { name: "Web服务", status: "healthy", uptime: "99.8%" },
              { name: "文件存储", status: "healthy", uptime: "99.7%" },
              { name: "邮件服务", status: "warning", uptime: "98.5%" },
              { name: "备份服务", status: "healthy", uptime: "99.2%" },
              { name: "监控服务", status: "healthy", uptime: "99.6%" },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    运行时间: {service.uptime}
                  </p>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 性能指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>数据库性能</CardTitle>
            <CardDescription>数据库连接和查询性能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>活跃连接数</span>
                <span className="font-bold">{systemInfo?.database?.connections || 12}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>平均查询时间</span>
                <span className="font-bold">{systemInfo?.database?.avgQueryTime || "15"}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span>慢查询数量</span>
                <span className="font-bold">{systemInfo?.database?.slowQueries || 3}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>应用性能</CardTitle>
            <CardDescription>应用程序运行性能指标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>平均响应时间</span>
                <span className="font-bold">{systemInfo?.app?.responseTime || "120"}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span>每分钟请求数</span>
                <span className="font-bold">{systemInfo?.app?.requestsPerMinute || 45}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>错误率</span>
                <span className="font-bold">{systemInfo?.app?.errorRate || "0.1"}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近警告 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5" />
            最近警告
          </CardTitle>
          <CardDescription>
            系统最近的警告和异常记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { time: "2024-12-19 14:30", message: "内存使用率超过70%", level: "warning" },
              { time: "2024-12-19 13:15", message: "数据库连接数较高", level: "warning" },
              { time: "2024-12-19 12:00", message: "磁盘空间不足警告", level: "error" },
            ].map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.time}</p>
                </div>
                {getStatusBadge(alert.level)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
