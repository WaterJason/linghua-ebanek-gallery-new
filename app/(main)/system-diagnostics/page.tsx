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
  Database,
  Activity,
  BarChart3,
  Clock,
  Settings,
  Zap,
  Download,
  Search
} from 'lucide-react'
import { ModernPageContainer } from '@/components/modern-page-container'
import { formatDiagnosticReport } from '@/lib/database-diagnostics-controller'
import { runDatabaseDiagnosticAction, runQuickHealthCheckAction } from '@/lib/actions/database-diagnostics'
import type { SystemDiagnosticReport } from '@/lib/database-diagnostics-controller'
import { toast } from '@/hooks/use-toast'

export default function SystemDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<SystemDiagnosticReport | null>(null)
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

      const result = await runDatabaseDiagnosticAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setReport(result.data)
        toast({
          title: "诊断完成",
          description: "系统诊断已成功完成",
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
      const result = await runQuickHealthCheckAction()
      if (result.success) {
        setQuickStatus(result.data)
        toast({
          title: "快速检查完成",
          description: "快速健康检查已完成",
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

    const reportText = formatDiagnosticReport(report)
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-diagnostic-report-${new Date().toISOString().split('T')[0]}.txt`
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
      'payroll': '薪酬管理',
      'sales': '销售管理',
      'purchase': '采购管理',
      'channels': '渠道管理',
      'system-settings': '系统设置',
      'production': '生产管理'
    }
    return names[module as keyof typeof names] || module
  }

  return (
    <ModernPageContainer
      title="ERP系统数据操作诊断"
      description="全面检测ERP系统各模块的数据操作功能状态"
    >
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            诊断控制台
          </CardTitle>
          <CardDescription>
            运行系统诊断测试，检查所有模块的CRUD操作和系统健康状况
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
              快速诊断
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
              快速健康检查
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getStatusIcon(quickStatus.status)}
              <div>
                <p className="font-medium">{quickStatus.message}</p>
                {quickStatus.details && (
                  <p className="text-sm text-gray-600">
                    {typeof quickStatus.details === 'string'
                      ? quickStatus.details
                      : JSON.stringify(quickStatus.details)
                    }
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
            <TabsTrigger value="system">系统状态</TabsTrigger>
            <TabsTrigger value="recommendations">建议</TabsTrigger>
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
                  <CardTitle className="text-sm font-medium">警告模块</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.summary.warning}
                  </div>
                  <p className="text-xs text-gray-600">
                    需要关注
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">异常模块</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {report.summary.critical}
                  </div>
                  <p className="text-xs text-gray-600">
                    需要修复
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 数据库状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  数据库状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span>数据库连接</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.database.connection.status)}
                      <span className="text-sm">{report.database.connection.message}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>数据表结构</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.database.tables.status)}
                      <span className="text-sm">{report.database.tables.message}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.modules.map((module) => (
                <Card key={module.module}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{getModuleDisplayName(module.module)}</span>
                      {getStatusBadge(module.overall)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(module.crud.create.status)}
                        <span>创建</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(module.crud.read.status)}
                        <span>查询</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(module.crud.update.status)}
                        <span>更新</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(module.crud.delete.status)}
                        <span>删除</span>
                      </div>
                    </div>

                    {/* 显示错误详情 */}
                    {module.overall !== 'healthy' && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        {[module.crud.create, module.crud.read, module.crud.update, module.crud.delete]
                          .filter(op => op.status !== 'success')
                          .map((op, idx) => (
                            <div key={idx} className="text-gray-600">
                              {op.message}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Server Actions 状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Server Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{report.serverActions.message}</p>
                      {report.serverActions.details && (
                        <p className="text-sm text-gray-600">
                          响应时间: {report.serverActions.details.responseTime}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(report.serverActions.status)}
                  </div>
                </CardContent>
              </Card>

              {/* 增强操作系统状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    增强操作系统
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{report.enhancedOperations.message}</p>
                      {report.enhancedOperations.details?.components && (
                        <div className="text-sm text-gray-600 mt-2">
                          {report.enhancedOperations.details.components.map((comp: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              {getStatusIcon(comp.status === 'available' ? 'success' : 'error')}
                              <span>{comp.component}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {getStatusBadge(report.enhancedOperations.status)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  修复建议
                </CardTitle>
                <CardDescription>
                  基于诊断结果生成的系统优化建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">
                        {recommendation.includes('🔴') ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : recommendation.includes('🟡') ? (
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
                  {formatDiagnosticReport(report)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </ModernPageContainer>
  )
}
