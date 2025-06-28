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
  Clock
} from 'lucide-react'
import { formatDiagnosticReport } from '@/lib/database-diagnostics-controller'
import { runDatabaseDiagnosticAction, runQuickHealthCheckAction } from '@/lib/actions/database-diagnostics'
import type { SystemDiagnosticReport } from '@/lib/database-diagnostics-controller'

export default function DatabaseDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<SystemDiagnosticReport | null>(null)
  const [quickStatus, setQuickStatus] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const runFullDiagnostic = async () => {
    setIsRunning(true)
    setProgress(0)

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await runDatabaseDiagnosticAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setReport(result.data)
      } else {
        console.error('诊断失败:', result.error)
      }

    } catch (error) {
      console.error('诊断失败:', error)
    } finally {
      setIsRunning(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const runQuickCheck = async () => {
    try {
      const result = await runQuickHealthCheckAction()
      if (result.success) {
        setQuickStatus(result.data)
      } else {
        console.error('快速检查失败:', result.error)
      }
    } catch (error) {
      console.error('快速检查失败:', error)
    }
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
        return <Activity className="w-4 h-4 text-gray-500" />
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

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">数据库系统诊断</h1>
        <p className="text-gray-600">检查数据库连接状态和各模块CRUD功能</p>
      </div>

      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            诊断控制台
          </CardTitle>
          <CardDescription>
            运行数据库诊断测试，检查系统健康状况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
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
              完整诊断
            </Button>

            <Button
              onClick={runQuickCheck}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              快速检查
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>诊断进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {quickStatus && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(quickStatus.status)}
                <span className="font-medium">快速检查结果</span>
                {getStatusBadge(quickStatus.status)}
              </div>
              <p className="text-sm text-gray-600">{quickStatus.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 诊断结果 */}
      {report && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="modules">模块详情</TabsTrigger>
            <TabsTrigger value="recommendations">建议</TabsTrigger>
            <TabsTrigger value="raw">原始报告</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 总体状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  系统总体状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{report.summary.healthy}</div>
                    <div className="text-sm text-gray-600">健康模块</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{report.summary.warning}</div>
                    <div className="text-sm text-gray-600">警告模块</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
                    <div className="text-sm text-gray-600">异常模块</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{report.summary.total}</div>
                    <div className="text-sm text-gray-600">总模块数</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {getStatusIcon(report.overall)}
                  <span className="font-medium">整体状态:</span>
                  {getStatusBadge(report.overall)}
                </div>
              </CardContent>
            </Card>

            {/* 数据库连接状态 */}
            <Card>
              <CardHeader>
                <CardTitle>数据库连接</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>连接状态</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.database.connection.status)}
                    {getStatusBadge(report.database.connection.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>表结构</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.database.tables.status)}
                    {getStatusBadge(report.database.tables.status)}
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
                      <span className="capitalize">{module.module}</span>
                      {getStatusBadge(module.overall)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>修复建议</CardTitle>
                <CardDescription>
                  基于诊断结果的系统优化建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="text-lg">{rec.charAt(0)}</div>
                      <div className="flex-1 text-sm">{rec.slice(1)}</div>
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
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  {formatDiagnosticReport(report)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
