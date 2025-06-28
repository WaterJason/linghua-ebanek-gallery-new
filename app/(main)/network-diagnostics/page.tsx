'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Wifi,
  Globe,
  Server,
  Upload,
  Download,
  Zap,
  Shield,
  Database,
  FileText,
  BarChart3,
  Activity,
  Network
} from 'lucide-react'
import { ModernPageContainer } from '@/components/modern-page-container'
import { toast } from '@/hooks/use-toast'
import { runNetworkDiagnosticAction, runQuickNetworkCheckAction } from '@/lib/actions/network-diagnostics'
import type { NetworkDiagnosticReport } from '@/lib/network-diagnostics-controller'
import {
  exportDiagnosticReportAsJSON,
  exportDiagnosticReportAsMarkdown,
  exportDiagnosticReportAsCSV
} from '@/lib/actions/diagnostic-export'

export default function NetworkDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isQuickCheck, setIsQuickCheck] = useState(false)
  const [progress, setProgress] = useState(0)
  const [diagnosticData, setDiagnosticData] = useState<NetworkDiagnosticReport | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isExporting, setIsExporting] = useState(false)

  const runFullDiagnostic = async () => {
    try {
      setIsRunning(true)
      setProgress(0)
      setActiveTab('overview')

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const result = await runNetworkDiagnosticAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setDiagnosticData(result.data)
        toast({
          title: "网络诊断完成",
          description: `诊断完成，发现 ${result.data.summary.disconnectedServices + result.data.summary.unstableServices} 个问题`,
        })
      } else {
        toast({
          title: "网络诊断失败",
          description: result.error || "诊断执行过程中出现错误",
          variant: "destructive",
        })
      }

      setTimeout(() => setProgress(0), 2000)
    } catch (error) {
      console.error('网络诊断失败:', error)
      toast({
        title: "网络诊断异常",
        description: "诊断执行过程中出现异常",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const runQuickCheck = async () => {
    try {
      setIsQuickCheck(true)
      setProgress(0)

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      const result = await runQuickNetworkCheckAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        // 创建简化的诊断报告用于显示
        const quickReport: NetworkDiagnosticReport = {
          timestamp: new Date().toISOString(),
          overall: result.data.summary.disconnectedServices > 0 ? 'disconnected' :
                   result.data.summary.unstableServices > 0 ? 'unstable' :
                   result.data.summary.slowServices > 2 ? 'slow' : 'connected',
          apiEndpoints: result.data.apiEndpoints,
          networkLatency: result.data.networkLatency,
          thirdPartyServices: {
            emailService: { component: '邮件服务', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            paymentGateway: { component: '支付网关', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            cloudStorage: { component: '云存储', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            analyticsService: { component: '分析服务', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            notificationService: { component: '通知服务', status: 'connected', message: '快速检查跳过', priority: 'P3' }
          },
          fileTransfer: {
            uploadTest: { component: '文件上传', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            downloadTest: { component: '文件下载', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            largeFileTest: { component: '大文件传输', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            concurrentTransfer: { component: '并发传输', status: 'connected', message: '快速检查跳过', priority: 'P3' }
          },
          webSocket: {
            connectionEstablishment: { component: 'WebSocket连接', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            messageTransmission: { component: '消息传输', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            connectionStability: { component: '连接稳定性', status: 'connected', message: '快速检查跳过', priority: 'P3' },
            reconnectionCapability: { component: '重连能力', status: 'connected', message: '快速检查跳过', priority: 'P3' }
          },
          summary: result.data.summary,
          recommendations: [`快速检查完成，平均延迟: ${result.data.summary.averageLatency.toFixed(1)}ms`]
        }

        setDiagnosticData(quickReport)
        toast({
          title: "快速网络检查完成",
          description: `检查完成，平均延迟: ${result.data.summary.averageLatency.toFixed(1)}ms`,
        })
      } else {
        toast({
          title: "快速网络检查失败",
          description: result.error || "检查执行过程中出现错误",
          variant: "destructive",
        })
      }

      setTimeout(() => setProgress(0), 2000)
    } catch (error) {
      console.error('快速网络检查失败:', error)
      toast({
        title: "快速网络检查异常",
        description: "检查执行过程中出现异常",
        variant: "destructive",
      })
    } finally {
      setIsQuickCheck(false)
    }
  }

  // 导出网络诊断报告
  const exportNetworkReport = async (format: 'json' | 'markdown' | 'csv') => {
    if (!diagnosticData) {
      toast({
        title: "导出失败",
        description: "没有可导出的网络诊断数据",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExporting(true)

      // 转换网络诊断数据为统一格式
      const unifiedData = {
        timestamp: diagnosticData.timestamp,
        overall: diagnosticData.overall,
        summary: {
          healthyCount: diagnosticData.summary.connectedServices,
          warningCount: diagnosticData.summary.slowServices + diagnosticData.summary.unstableServices,
          errorCount: diagnosticData.summary.disconnectedServices,
          totalIssues: diagnosticData.summary.disconnectedServices + diagnosticData.summary.unstableServices,
          p0Issues: diagnosticData.summary.p0Issues,
          p1Issues: diagnosticData.summary.p1Issues,
          p2Issues: diagnosticData.summary.p2Issues,
          p3Issues: diagnosticData.summary.p3Issues
        },
        tools: [
          {
            id: 'network-api',
            name: 'API端点检测',
            status: Object.values(diagnosticData.apiEndpoints).some(r => r.status === 'disconnected') ? 'error' : 'healthy',
            priority: 'P0',
            summary: `检测了 ${Object.keys(diagnosticData.apiEndpoints).length} 个API端点`,
            issueCount: Object.values(diagnosticData.apiEndpoints).filter(r => r.status !== 'connected').length,
            lastRun: new Date().toLocaleString('zh-CN'),
            details: diagnosticData.apiEndpoints
          },
          {
            id: 'network-latency',
            name: '网络延迟测试',
            status: diagnosticData.summary.averageLatency > 200 ? 'warning' : 'healthy',
            priority: 'P1',
            summary: `平均延迟: ${diagnosticData.summary.averageLatency.toFixed(1)}ms`,
            issueCount: Object.values(diagnosticData.networkLatency).filter(r => r.status !== 'connected').length,
            lastRun: new Date().toLocaleString('zh-CN'),
            details: diagnosticData.networkLatency
          }
        ]
      }

      let result
      switch (format) {
        case 'json':
          result = await exportDiagnosticReportAsJSON(unifiedData as any)
          break
        case 'markdown':
          result = await exportDiagnosticReportAsMarkdown(unifiedData as any)
          break
        case 'csv':
          result = await exportDiagnosticReportAsCSV(unifiedData as any)
          break
        default:
          throw new Error('不支持的导出格式')
      }

      if (result.success) {
        // 创建下载链接
        const blob = new Blob([typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)], {
          type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/markdown'
        })

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename?.replace('ERP诊断报告', '网络诊断报告') || `网络诊断报告.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "导出成功",
          description: `网络诊断报告已导出为 ${format.toUpperCase()} 格式`,
        })
      } else {
        toast({
          title: "导出失败",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('导出网络诊断报告失败:', error)
      toast({
        title: "导出异常",
        description: "导出过程中出现异常",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'slow':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'unstable':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status?: string) => {
    const variants = {
      connected: 'default',
      slow: 'secondary',
      unstable: 'secondary',
      disconnected: 'destructive'
    } as const

    const labels = {
      connected: '已连接',
      slow: '缓慢',
      unstable: '不稳定',
      disconnected: '断开连接'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || '未知'}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      P0: 'destructive',
      P1: 'secondary',
      P2: 'outline',
      P3: 'outline'
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'} className="text-xs">
        {priority}
      </Badge>
    )
  }

  return (
    <ModernPageContainer
      title="网络连接诊断"
      description="检测ERP系统的网络连接状态，包括API端点、网络延迟、第三方服务、文件传输和WebSocket连接"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "网络诊断" }
      ]}
    >
      {/* 控制面板 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            网络诊断控制台
          </CardTitle>
          <CardDescription>
            检测网络连接状态和性能，确保ERP系统网络依赖正常运行
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={runFullDiagnostic}
              disabled={isRunning || isQuickCheck}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              运行完整诊断
            </Button>

            <Button
              variant="outline"
              onClick={runQuickCheck}
              disabled={isRunning || isQuickCheck}
              className="flex items-center gap-2"
            >
              {isQuickCheck ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              快速检查
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => exportNetworkReport('json')}
              disabled={!diagnosticData || isExporting}
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              导出报告
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                toast({
                  title: "功能开发中",
                  description: "网络诊断历史功能正在开发中",
                })
              }}
            >
              <BarChart3 className="w-4 h-4" />
              查看历史
            </Button>
          </div>

          {/* 进度条 */}
          {(isRunning || isQuickCheck) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isRunning ? '完整诊断进度' : '快速检查进度'}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 诊断结果 */}
      {diagnosticData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="api">API端点</TabsTrigger>
            <TabsTrigger value="latency">网络延迟</TabsTrigger>
            <TabsTrigger value="services">第三方服务</TabsTrigger>
            <TabsTrigger value="files">文件传输</TabsTrigger>
            <TabsTrigger value="websocket">WebSocket</TabsTrigger>
          </TabsList>

          {/* 总览标签页 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 总体状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  网络连接总体状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 border rounded">
                    <div className={`text-2xl font-bold ${
                      diagnosticData.overall === 'connected' ? 'text-green-600' :
                      diagnosticData.overall === 'slow' ? 'text-yellow-600' :
                      diagnosticData.overall === 'unstable' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {getStatusIcon(diagnosticData.overall)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">总体状态</div>
                    <div className="mt-1">{getStatusBadge(diagnosticData.overall)}</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {diagnosticData.summary.connectedServices}
                    </div>
                    <div className="text-sm text-gray-600">已连接服务</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {diagnosticData.summary.slowServices + diagnosticData.summary.unstableServices}
                    </div>
                    <div className="text-sm text-gray-600">问题服务</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {diagnosticData.summary.averageLatency.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">平均延迟</div>
                  </div>
                </div>

                {/* 建议 */}
                <div className="space-y-2">
                  <h4 className="font-medium">诊断建议</h4>
                  {diagnosticData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API端点标签页 */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  API端点可用性检测
                </CardTitle>
                <CardDescription>
                  检测内部API、外部API、数据库连接、文件存储和认证服务的可用性
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(diagnosticData.apiEndpoints).map(([key, result]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.component}</span>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(result.status)}
                          {getPriorityBadge(result.priority)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.endpoint && (
                        <p className="text-xs text-gray-500">端点: {result.endpoint}</p>
                      )}
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">建议:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {result.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 网络延迟标签页 */}
          <TabsContent value="latency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  网络延迟测试
                </CardTitle>
                <CardDescription>
                  测试本地网络、互联网连接、DNS解析和CDN性能的延迟情况
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(diagnosticData.networkLatency).map(([key, result]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.component}</span>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(result.status)}
                          {getPriorityBadge(result.priority)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">建议:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {result.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 第三方服务标签页 */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  第三方服务集成状态
                </CardTitle>
                <CardDescription>
                  监控邮件服务、支付网关、云存储、分析服务和通知服务的连接状态
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(diagnosticData.thirdPartyServices).map(([key, result]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.component}</span>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(result.status)}
                          {getPriorityBadge(result.priority)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.endpoint && (
                        <p className="text-xs text-gray-500">端点: {result.endpoint}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 文件传输标签页 */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  文件传输功能测试
                </CardTitle>
                <CardDescription>
                  测试文件上传、下载、大文件传输和并发传输的性能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(diagnosticData.fileTransfer).map(([key, result]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.component}</span>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(result.status)}
                          {getPriorityBadge(result.priority)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">建议:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {result.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WebSocket标签页 */}
          <TabsContent value="websocket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  WebSocket连接状态检查
                </CardTitle>
                <CardDescription>
                  检查WebSocket连接建立、消息传输、连接稳定性和重连能力
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(diagnosticData.webSocket).map(([key, result]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.component}</span>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(result.status)}
                          {getPriorityBadge(result.priority)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">建议:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {result.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* 无数据状态 */}
      {!diagnosticData && (
        <Card>
          <CardContent className="text-center py-12">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">开始网络诊断</h3>
            <p className="text-gray-600 mb-4">
              点击上方按钮开始检测ERP系统的网络连接状态
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={runQuickCheck} variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                快速检查
              </Button>
              <Button onClick={runFullDiagnostic}>
                <Play className="w-4 h-4 mr-2" />
                完整诊断
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </ModernPageContainer>
  )
}
