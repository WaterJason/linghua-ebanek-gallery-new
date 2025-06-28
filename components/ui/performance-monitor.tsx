"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Activity, Clock, Zap, AlertTriangle, CheckCircle } from "lucide-react"

interface PerformanceMetrics {
  pageLoadTime: number
  renderTime: number
  memoryUsage: number
  networkRequests: number
  errorCount: number
  timestamp: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<PerformanceMetrics[]>([])

  // 收集性能指标
  const collectMetrics = () => {
    if (typeof window === "undefined") return

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    const memory = (performance as any).memory

    const newMetrics: PerformanceMetrics = {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
      networkRequests: performance.getEntriesByType("resource").length,
      errorCount: 0, // 这里可以集成错误监控
      timestamp: Date.now()
    }

    setMetrics(newMetrics)
    
    // 保存到历史记录
    setHistory(prev => {
      const updated = [newMetrics, ...prev].slice(0, 10) // 保留最近10条记录
      // 保存到localStorage
      try {
        localStorage.setItem("performance-history", JSON.stringify(updated))
      } catch (error) {
        console.warn("无法保存性能历史记录:", error)
      }
      return updated
    })
  }

  // 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem("performance-history")
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.warn("无法加载性能历史记录:", error)
    }

    // 初始收集
    setTimeout(collectMetrics, 1000)

    // 定期收集（每30秒）
    const interval = setInterval(collectMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  // 性能评级
  const getPerformanceGrade = (loadTime: number) => {
    if (loadTime < 1000) return { grade: "优秀", color: "bg-green-500", icon: CheckCircle }
    if (loadTime < 3000) return { grade: "良好", color: "bg-blue-500", icon: CheckCircle }
    if (loadTime < 5000) return { grade: "一般", color: "bg-yellow-500", icon: AlertTriangle }
    return { grade: "需优化", color: "bg-red-500", icon: AlertTriangle }
  }

  // 内存使用评级
  const getMemoryGrade = (memory: number) => {
    if (memory < 50) return { grade: "优秀", color: "bg-green-500" }
    if (memory < 100) return { grade: "良好", color: "bg-blue-500" }
    if (memory < 200) return { grade: "一般", color: "bg-yellow-500" }
    return { grade: "需优化", color: "bg-red-500" }
  }

  if (!metrics) return null

  const performanceGrade = getPerformanceGrade(metrics.pageLoadTime)
  const memoryGrade = getMemoryGrade(metrics.memoryUsage)
  const PerformanceIcon = performanceGrade.icon

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-4 left-4 z-50 p-2 bg-background border shadow-lg hover:shadow-xl transition-shadow"
          title="性能监控"
        >
          <Activity className="h-4 w-4 mr-1" />
          <Badge variant="outline" className={`${performanceGrade.color} text-white border-none`}>
            {performanceGrade.grade}
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            性能监控
          </DialogTitle>
          <DialogDescription>
            实时监控系统性能指标，帮助优化用户体验
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前性能指标 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  页面加载时间
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {(metrics.pageLoadTime / 1000).toFixed(2)}s
                  </span>
                  <Badge className={`${performanceGrade.color} text-white border-none`}>
                    {performanceGrade.grade}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((metrics.pageLoadTime / 5000) * 100, 100)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  内存使用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metrics.memoryUsage.toFixed(1)}MB
                  </span>
                  <Badge className={`${memoryGrade.color} text-white border-none`}>
                    {memoryGrade.grade}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((metrics.memoryUsage / 200) * 100, 100)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* 详细指标 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(metrics.renderTime / 1000).toFixed(2)}s
              </div>
              <div className="text-sm text-muted-foreground">DOM渲染时间</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.networkRequests}
              </div>
              <div className="text-sm text-muted-foreground">网络请求数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.errorCount}
              </div>
              <div className="text-sm text-muted-foreground">错误数量</div>
            </div>
          </div>

          {/* 历史趋势 */}
          {history.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">性能趋势</CardTitle>
                <CardDescription>最近10次页面加载性能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.slice(0, 5).map((record, index) => {
                    const grade = getPerformanceGrade(record.pageLoadTime)
                    return (
                      <div key={record.timestamp} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{(record.pageLoadTime / 1000).toFixed(2)}s</span>
                          <Badge variant="outline" className={`${grade.color} text-white border-none text-xs`}>
                            {grade.grade}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 优化建议 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">优化建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {metrics.pageLoadTime > 3000 && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    页面加载时间较长，建议优化图片和资源加载
                  </div>
                )}
                {metrics.memoryUsage > 100 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    内存使用较高，建议检查是否有内存泄漏
                  </div>
                )}
                {metrics.networkRequests > 50 && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <AlertTriangle className="h-4 w-4" />
                    网络请求较多，建议合并资源或使用缓存
                  </div>
                )}
                {metrics.pageLoadTime < 2000 && metrics.memoryUsage < 50 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    性能表现优秀，继续保持！
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={collectMetrics}>
              刷新数据
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setHistory([])
                localStorage.removeItem("performance-history")
              }}
            >
              清除历史
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
