'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
  Zap,
  Activity,
  BarChart3,
  Clock,
  Database,
  Monitor,
  Download,
  Search,
  Gauge,
  Timer,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  TrendingUp,
  Target
} from 'lucide-react'
import { ModernPageContainer } from '@/components/modern-page-container'
import { formatPerformanceDiagnosticReport } from '@/lib/performance-diagnostics-controller'
import { runPerformanceDiagnosticAction, runQuickPerformanceCheckAction } from '@/lib/actions/performance-diagnostics'
import type { PerformanceDiagnosticReport } from '@/lib/performance-diagnostics-controller'
import { toast } from '@/hooks/use-toast'

export default function PerformanceDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<PerformanceDiagnosticReport | null>(null)
  const [quickStatus, setQuickStatus] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [diagnosticMode, setDiagnosticMode] = useState<'quick' | 'detailed'>('quick')

  const runFullDiagnostic = async () => {
    try {
      setIsRunning(true)
      setProgress(0)
      setDiagnosticMode('detailed')

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 90))
      }, 800)

      const result = await runPerformanceDiagnosticAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setReport(result.data)
        toast({
          title: "性能诊断完成",
          description: "性能监控诊断已成功完成",
        })
      } else {
        console.error('诊断失败:', result.error)
        toast({
          title: "诊断失败",
          description: result.error || '诊断失败',
          variant: "destructive",
        })
      }

      setTimeout(() => setProgress(0), 2000)
    } catch (error) {
      console.error('诊断执行失败:', error)
      toast({
        title: "诊断异常",
        description: error instanceof Error ? error.message : '诊断执行失败',
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const runQuickCheck = async () => {
    try {
      setDiagnosticMode('quick')
      const result = await runQuickPerformanceCheckAction()
      if (result.success) {
        setQuickStatus(result.data)
        toast({
          title: "快速检查完成",
          description: "性能快速健康检查已完成",
        })
      } else {
        console.error('快速检查失败:', result.error)
        toast({
          title: "快速检查失败",
          description: result.error || '快速检查失败',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('快速检查执行失败:', error)
      toast({
        title: "快速检查异常",
        description: error instanceof Error ? error.message : '快速检查执行失败',
        variant: "destructive",
      })
    }
  }

  const exportReport = () => {
    if (!report) return

    const reportText = formatPerformanceDiagnosticReport(report)
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-diagnostic-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPerformanceStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'good':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'needs-improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'poor':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPerformanceStatusBadge = (status: string) => {
    const variants = {
      excellent: 'default',
      good: 'secondary',
      'needs-improvement': 'outline',
      poor: 'destructive'
    } as const

    const labels = {
      excellent: '优秀',
      good: '良好',
      'needs-improvement': '需改进',
      poor: '较差'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getModuleDisplayName = (module: string) => {
    const names = {
      'products': '产品管理',
      'employees': '员工管理',
      'inventory': '库存管理',
      'finance': '财务管理',
      'sales': '销售管理',
      'purchase': '采购管理',
      'channels': '渠道管理',
      'system-settings': '系统设置',
      'production': '生产管理'
    }
    return names[module as keyof typeof names] || module
  }

  const getWebVitalIcon = (vital: string) => {
    switch (vital) {
      case 'lcp':
        return <Timer className="w-4 h-4" />
      case 'fid':
        return <Zap className="w-4 h-4" />
      case 'cls':
        return <Target className="w-4 h-4" />
      case 'fcp':
        return <Activity className="w-4 h-4" />
      case 'ttfb':
        return <Gauge className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getWebVitalName = (vital: string) => {
    const names = {
      'lcp': 'LCP (最大内容绘制)',
      'fid': 'FID (首次输入延迟)',
      'cls': 'CLS (累积布局偏移)',
      'fcp': 'FCP (首次内容绘制)',
      'ttfb': 'TTFB (首字节时间)'
    }
    return names[vital as keyof typeof names] || vital
  }

  const getSystemResourceIcon = (resource: string) => {
    switch (resource) {
      case 'memoryUsage':
        return <MemoryStick className="w-4 h-4" />
      case 'cpuUsage':
        return <Cpu className="w-4 h-4" />
      case 'diskIO':
        return <HardDrive className="w-4 h-4" />
      case 'networkLatency':
        return <Wifi className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getSystemResourceName = (resource: string) => {
    const names = {
      'memoryUsage': '内存使用率',
      'cpuUsage': 'CPU使用率',
      'diskIO': '磁盘I/O等待',
      'networkLatency': '网络延迟'
    }
    return names[resource as keyof typeof names] || resource
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'text-red-600 bg-red-50'
      case 'P1':
        return 'text-orange-600 bg-orange-50'
      case 'P2':
        return 'text-yellow-600 bg-yellow-50'
      case 'P3':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <ModernPageContainer
      title="ERP性能监控诊断"
      description="监控系统性能指标，包括Web Vitals、数据库性能、系统资源使用情况等"
    >
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            性能诊断控制台
          </CardTitle>
          <CardDescription>
            监控Web Vitals、数据库性能、系统资源使用情况和模块加载性能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={runQuickCheck}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isRunning}
            >
              <Search className="w-4 h-4" />
              快速检查
            </Button>

            <Button
              onClick={runFullDiagnostic}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              详细诊断
            </Button>

            {report && (
              <Button
                onClick={exportReport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出报告
              </Button>
            )}
          </div>

          {/* 进度条 */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>诊断进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速状态显示 */}
      {quickStatus && diagnosticMode === 'quick' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              快速性能检查
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getPerformanceStatusIcon(quickStatus.status)}
              <div>
                <p className="font-medium">{quickStatus.message}</p>
                {quickStatus.details && (
                  <p className="text-sm text-gray-600">
                    通过率: {quickStatus.details.passRate}
                    {quickStatus.details.failedChecks && quickStatus.details.failedChecks.length > 0 && (
                      <span className="ml-2">
                        需要关注: {quickStatus.details.failedChecks.join(', ')}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {getPerformanceStatusBadge(quickStatus.status)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细诊断结果 */}
      {report && diagnosticMode === 'detailed' && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="webvitals">Web Vitals</TabsTrigger>
            <TabsTrigger value="database">数据库</TabsTrigger>
            <TabsTrigger value="system">系统资源</TabsTrigger>
            <TabsTrigger value="modules">模块性能</TabsTrigger>
            <TabsTrigger value="raw">原始报告</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总体性能</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getPerformanceStatusIcon(report.overall)}
                    {getPerformanceStatusBadge(report.overall)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">优秀指标</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {report.summary.excellentMetrics}
                  </div>
                  <p className="text-xs text-gray-600">
                    性能表现优秀
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">P0级问题</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {report.summary.p0Issues}
                  </div>
                  <p className="text-xs text-gray-600">
                    需要立即优化
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">P1级问题</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {report.summary.p1Issues}
                  </div>
                  <p className="text-xs text-gray-600">
                    建议优先处理
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 性能指标分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  性能指标分布
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{report.summary.excellentMetrics}</div>
                    <div className="text-sm text-gray-600">优秀</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.summary.goodMetrics}</div>
                    <div className="text-sm text-gray-600">良好</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{report.summary.needsImprovementMetrics}</div>
                    <div className="text-sm text-gray-600">需改进</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.summary.poorMetrics}</div>
                    <div className="text-sm text-gray-600">较差</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 性能优化建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  性能优化建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.slice(0, 5).map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">
                        {recommendation.includes('🔴') ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : recommendation.includes('🟡') || recommendation.includes('🟠') ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webvitals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Web Vitals 性能指标
                </CardTitle>
                <CardDescription>
                  核心Web性能指标，影响用户体验和SEO排名
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.webVitals).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getWebVitalIcon(key)}
                          {getWebVitalName(key)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getPerformanceStatusIcon(result.status)}
                            {getPerformanceStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          {result.value && result.threshold && (
                            <div className="text-xs text-gray-600">
                              阈值: {result.threshold}{key === 'cls' ? '' : 'ms'}
                            </div>
                          )}
                          {result.suggestions && result.suggestions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700">建议:</div>
                              <ul className="text-xs text-gray-600 list-disc list-inside">
                                {result.suggestions.map((suggestion, idx) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  数据库性能分析
                </CardTitle>
                <CardDescription>
                  数据库连接、查询性能和事务处理效率
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.database).map(([key, result]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getPerformanceStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.component}</div>
                          <div className="text-sm text-gray-600">{result.message}</div>
                          {result.suggestions && result.suggestions.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              建议: {result.suggestions[0]}
                            </div>
                          )}
                        </div>
                      </div>
                      {getPerformanceStatusBadge(result.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  系统资源监控
                </CardTitle>
                <CardDescription>
                  CPU、内存、磁盘I/O和网络性能监控
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.systemResources).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getSystemResourceIcon(key)}
                          {getSystemResourceName(key)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getPerformanceStatusIcon(result.status)}
                            {getPerformanceStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          {result.suggestions && result.suggestions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700">建议:</div>
                              <ul className="text-xs text-gray-600 list-disc list-inside">
                                {result.suggestions.map((suggestion, idx) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 负载测试结果 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">负载测试结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(report.loadTests).map(([key, result]) => (
                        <div key={key} className="text-center p-3 border rounded">
                          <div className="flex justify-center mb-2">
                            {getPerformanceStatusIcon(result.status)}
                          </div>
                          <div className="font-medium text-sm">{result.component}</div>
                          <div className="text-xs text-gray-600">{result.message}</div>
                          <div className="mt-1">
                            {getPerformanceStatusBadge(result.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {report.modules.map((module) => (
                <Card key={module.module}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{getModuleDisplayName(module.module)}</span>
                      {getPerformanceStatusBadge(module.overall)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 p-2 rounded border">
                        <Timer className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">加载时间</div>
                          <div className="flex items-center gap-1">
                            {getPerformanceStatusIcon(module.loadTime.status)}
                            <span className="text-xs text-gray-600">{module.loadTime.message}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded border">
                        <Activity className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">渲染时间</div>
                          <div className="flex items-center gap-1">
                            {getPerformanceStatusIcon(module.renderTime.status)}
                            <span className="text-xs text-gray-600">{module.renderTime.message}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded border">
                        <Database className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">数据获取</div>
                          <div className="flex items-center gap-1">
                            {getPerformanceStatusIcon(module.dataFetchTime.status)}
                            <span className="text-xs text-gray-600">{module.dataFetchTime.message}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  原始性能报告
                </CardTitle>
                <CardDescription>
                  生成时间: {new Date(report.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                  {formatPerformanceDiagnosticReport(report)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </ModernPageContainer>
  )
}