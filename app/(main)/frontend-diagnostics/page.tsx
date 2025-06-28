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
  Monitor,
  Activity,
  BarChart3,
  Clock,
  Settings,
  Zap,
  Download,
  Search,
  MousePointer,
  FileText,
  Server,
  AlertCircle,
  MessageSquare,
  Globe
} from 'lucide-react'
import { ModernPageContainer } from '@/components/modern-page-container'
import { formatFrontendDiagnosticReport } from '@/lib/frontend-diagnostics-controller'
import { runFrontendDiagnosticAction, runQuickFrontendHealthCheckAction } from '@/lib/actions/frontend-diagnostics'
import type { FrontendDiagnosticReport } from '@/lib/frontend-diagnostics-controller'
import { toast } from '@/hooks/use-toast'

export default function FrontendDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<FrontendDiagnosticReport | null>(null)
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
        setProgress(prev => Math.min(prev + 10, 90))
      }, 600)

      const result = await runFrontendDiagnosticAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setReport(result.data)
        toast({
          title: "前端诊断完成",
          description: "前端交互诊断已成功完成",
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
      const result = await runQuickFrontendHealthCheckAction()
      if (result.success) {
        setQuickStatus(result.data)
        toast({
          title: "快速检查完成",
          description: "前端快速健康检查已完成",
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

    const reportText = formatFrontendDiagnosticReport(report)
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `frontend-diagnostic-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive',
      critical: 'destructive'
    } as const

    const labels = {
      success: '正常',
      healthy: '健康',
      warning: '警告',
      error: '错误',
      critical: '严重'
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

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'buttonEvents':
        return <MousePointer className="w-4 h-4" />
      case 'formSubmission':
        return <FileText className="w-4 h-4" />
      case 'serverActions':
        return <Server className="w-4 h-4" />
      case 'stateManagement':
        return <Settings className="w-4 h-4" />
      case 'errorHandling':
        return <AlertCircle className="w-4 h-4" />
      case 'userFeedback':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getInteractionName = (type: string) => {
    const names = {
      'buttonEvents': '按钮事件',
      'formSubmission': '表单提交',
      'serverActions': 'Server Actions',
      'stateManagement': '状态管理',
      'errorHandling': '错误处理',
      'userFeedback': '用户反馈'
    }
    return names[type as keyof typeof names] || type
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
      title="ERP前端操作诊断"
      description="检测用户界面交互问题，包括按钮点击、表单提交、状态管理等前端功能"
    >
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            前端诊断控制台
          </CardTitle>
          <CardDescription>
            检测前端交互问题，包括按钮事件、表单提交、Server Actions调用等功能状态
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
              快速前端检查
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getStatusIcon(quickStatus.status)}
              <div>
                <p className="font-medium">{quickStatus.message}</p>
                {quickStatus.details && (
                  <p className="text-sm text-gray-600">
                    成功率: {quickStatus.details.successRate}
                    {quickStatus.details.failedChecks && quickStatus.details.failedChecks.length > 0 && (
                      <span className="ml-2">
                        失败项目: {quickStatus.details.failedChecks.join(', ')}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {getStatusBadge(quickStatus.status)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细诊断结果 */}
      {report && diagnosticMode === 'detailed' && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="modules">模块详情</TabsTrigger>
            <TabsTrigger value="global">全局检查</TabsTrigger>
            <TabsTrigger value="issues">问题分析</TabsTrigger>
            <TabsTrigger value="raw">原始报告</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总体状态</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.overall)}
                    {getStatusBadge(report.overall)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">健康模块</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {report.summary.healthy}
                  </div>
                  <p className="text-xs text-gray-600">
                    共 {report.summary.total} 个模块
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
                    需要立即修复
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
                    需要优先处理
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 问题优先级分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  问题优先级分布
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.summary.p0Issues}</div>
                    <div className="text-sm text-gray-600">P0 - 严重</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{report.summary.p1Issues}</div>
                    <div className="text-sm text-gray-600">P1 - 重要</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{report.summary.p2Issues}</div>
                    <div className="text-sm text-gray-600">P2 - 一般</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.summary.p3Issues}</div>
                    <div className="text-sm text-gray-600">P3 - 轻微</div>
                  </div>
                </div>
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
                      {getStatusBadge(module.overall)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(module.interactions).map(([key, result]) => (
                        <div key={key} className="flex items-center gap-2 p-2 rounded border">
                          {getInteractionIcon(key)}
                          <div className="flex-1">
                            <div className="text-sm font-medium">{getInteractionName(key)}</div>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(result.status)}
                              <span className="text-xs text-gray-600">{result.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 显示问题详情 */}
                    {module.issues.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">发现的问题:</h4>
                        {module.issues.map((issue, idx) => (
                          <div key={idx} className={`p-2 rounded text-xs ${getPriorityColor(issue.priority)}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{issue.component}</span>
                              <Badge variant="outline" className="text-xs">{issue.priority}</Badge>
                            </div>
                            <div className="mt-1">{issue.message}</div>
                            {issue.suggestions && issue.suggestions.length > 0 && (
                              <div className="mt-2">
                                <div className="font-medium">建议:</div>
                                <ul className="list-disc list-inside ml-2">
                                  {issue.suggestions.map((suggestion, sidx) => (
                                    <li key={sidx}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="global" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  全局前端检查
                </CardTitle>
                <CardDescription>
                  检查全局前端功能和性能指标
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.globalChecks).map(([key, result]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.component}</div>
                          <div className="text-sm text-gray-600">{result.message}</div>
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  问题分析与修复建议
                </CardTitle>
                <CardDescription>
                  基于诊断结果生成的问题分析和修复建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.recommendations.map((recommendation, index) => (
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

          <TabsContent value="raw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  原始诊断报告
                </CardTitle>
                <CardDescription>
                  生成时间: {new Date(report.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                  {formatFrontendDiagnosticReport(report)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </ModernPageContainer>
  )
}
