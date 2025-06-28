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
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  Key,
  Eye,
  Database,
  FileText,
  Download,
  Search,
  Users,
  Settings,
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Globe
} from 'lucide-react'
import { ModernPageContainer } from '@/components/modern-page-container'
import { formatSecurityDiagnosticReport } from '@/lib/security-diagnostics-controller'
import { runSecurityDiagnosticAction, runQuickSecurityCheckAction } from '@/lib/actions/security-diagnostics'
import type { SecurityDiagnosticReport } from '@/lib/security-diagnostics-controller'
import { toast } from '@/hooks/use-toast'

export default function SecurityDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<SecurityDiagnosticReport | null>(null)
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
        setProgress(prev => Math.min(prev + 6, 90))
      }, 1000)

      const result = await runSecurityDiagnosticAction()

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setReport(result.data)
        toast({
          title: "安全诊断完成",
          description: "安全性诊断已成功完成",
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
      const result = await runQuickSecurityCheckAction()
      if (result.success) {
        setQuickStatus(result.data)
        toast({
          title: "快速检查完成",
          description: "安全快速健康检查已完成",
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

    const reportText = formatSecurityDiagnosticReport(report)
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `security-diagnostic-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getSecurityStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <ShieldCheck className="w-4 h-4 text-green-500" />
      case 'warning':
        return <ShieldAlert className="w-4 h-4 text-yellow-500" />
      case 'vulnerable':
        return <ShieldAlert className="w-4 h-4 text-orange-500" />
      case 'critical':
        return <ShieldX className="w-4 h-4 text-red-500" />
      default:
        return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const getSecurityStatusBadge = (status: string) => {
    const variants = {
      secure: 'default',
      warning: 'secondary',
      vulnerable: 'outline',
      critical: 'destructive'
    } as const

    const labels = {
      secure: '安全',
      warning: '警告',
      vulnerable: '漏洞',
      critical: '严重'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getRiskLevelBadge = (riskLevel: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'outline',
      critical: 'destructive'
    } as const

    const labels = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '严重风险'
    }

    return (
      <Badge variant={variants[riskLevel as keyof typeof variants] || 'secondary'}>
        {labels[riskLevel as keyof typeof labels] || riskLevel}
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

  const getAuthenticationIcon = (component: string) => {
    if (component.includes('密码')) return <Key className="w-4 h-4" />
    if (component.includes('会话')) return <Clock className="w-4 h-4" />
    if (component.includes('双因素')) return <Shield className="w-4 h-4" />
    if (component.includes('登录')) return <Eye className="w-4 h-4" />
    if (component.includes('锁定')) return <Lock className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const getAuthorizationIcon = (component: string) => {
    if (component.includes('角色')) return <Users className="w-4 h-4" />
    if (component.includes('权限')) return <Settings className="w-4 h-4" />
    if (component.includes('数据访问')) return <Database className="w-4 h-4" />
    if (component.includes('提升')) return <TrendingUp className="w-4 h-4" />
    if (component.includes('资源')) return <Globe className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const getVulnerabilityIcon = (component: string) => {
    if (component.includes('SQL')) return <Database className="w-4 h-4" />
    if (component.includes('XSS')) return <AlertTriangle className="w-4 h-4" />
    if (component.includes('CSRF')) return <Shield className="w-4 h-4" />
    if (component.includes('输入')) return <Eye className="w-4 h-4" />
    if (component.includes('输出')) return <FileText className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }

  const getDataProtectionIcon = (component: string) => {
    if (component.includes('加密')) return <Lock className="w-4 h-4" />
    if (component.includes('敏感')) return <Eye className="w-4 h-4" />
    if (component.includes('备份')) return <Database className="w-4 h-4" />
    if (component.includes('保留')) return <Clock className="w-4 h-4" />
    if (component.includes('个人')) return <Users className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const getComplianceIcon = (component: string) => {
    if (component.includes('GDPR')) return <FileText className="w-4 h-4" />
    if (component.includes('治理')) return <Settings className="w-4 h-4" />
    if (component.includes('审计')) return <Eye className="w-4 h-4" />
    if (component.includes('日志')) return <Clock className="w-4 h-4" />
    if (component.includes('事件')) return <AlertCircle className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
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
      title="ERP安全性诊断"
      description="全面检测系统安全状态，包括认证授权、漏洞防护、数据保护和合规性检查"
    >
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            安全诊断控制台
          </CardTitle>
          <CardDescription>
            检测认证授权、漏洞防护、数据保护、合规性和模块安全状态
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
              <Shield className="w-5 h-5" />
              快速安全检查
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getSecurityStatusIcon(quickStatus.status)}
              <div>
                <p className="font-medium">{quickStatus.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getSecurityStatusBadge(quickStatus.status)}
                  {getRiskLevelBadge(quickStatus.riskLevel)}
                </div>
                {quickStatus.details && quickStatus.details.failedChecks && quickStatus.details.failedChecks.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    需要关注: {quickStatus.details.failedChecks.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细诊断结果 */}
      {report && diagnosticMode === 'detailed' && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="authentication">认证安全</TabsTrigger>
            <TabsTrigger value="authorization">授权安全</TabsTrigger>
            <TabsTrigger value="vulnerabilities">漏洞防护</TabsTrigger>
            <TabsTrigger value="dataprotection">数据保护</TabsTrigger>
            <TabsTrigger value="compliance">合规性</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总体安全</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getSecurityStatusIcon(report.overall)}
                    {getSecurityStatusBadge(report.overall)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">风险等级</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getSecurityStatusIcon(report.riskAssessment.overallRisk)}
                    {getRiskLevelBadge(report.riskAssessment.overallRisk)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">合规评分</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {report.summary.complianceScore}%
                  </div>
                  <p className="text-xs text-gray-600">
                    合规性达标率
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
            </div>

            {/* 安全状态分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  安全状态分布
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{report.summary.secureChecks}</div>
                    <div className="text-sm text-gray-600">安全</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{report.summary.warningChecks}</div>
                    <div className="text-sm text-gray-600">警告</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{report.summary.vulnerableChecks}</div>
                    <div className="text-sm text-gray-600">漏洞</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{report.summary.criticalChecks}</div>
                    <div className="text-sm text-gray-600">严重</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 风险评估 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  风险评估
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-red-600">{report.riskAssessment.criticalVulnerabilities}</div>
                    <div className="text-sm text-gray-600">严重漏洞</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-orange-600">{report.riskAssessment.highRiskIssues}</div>
                    <div className="text-sm text-gray-600">高风险问题</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">{report.riskAssessment.complianceGaps}</div>
                    <div className="text-sm text-gray-600">合规缺口</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 安全加固建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  安全加固建议
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

          <TabsContent value="authentication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  认证安全检查
                </CardTitle>
                <CardDescription>
                  密码策略、会话管理、多因素认证等认证安全机制检查
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.authentication).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getAuthenticationIcon(result.component)}
                          {result.component}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getSecurityStatusIcon(result.status)}
                            {getSecurityStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          <div className="flex items-center gap-2">
                            {getRiskLevelBadge(result.riskLevel)}
                            <Badge variant="outline" className="text-xs">{result.priority}</Badge>
                          </div>
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

          <TabsContent value="authorization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  授权安全检查
                </CardTitle>
                <CardDescription>
                  角色权限、访问控制、权限矩阵等授权安全机制检查
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.authorization).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getAuthorizationIcon(result.component)}
                          {result.component}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getSecurityStatusIcon(result.status)}
                            {getSecurityStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          <div className="flex items-center gap-2">
                            {getRiskLevelBadge(result.riskLevel)}
                            <Badge variant="outline" className="text-xs">{result.priority}</Badge>
                          </div>
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

          <TabsContent value="vulnerabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  漏洞防护检查
                </CardTitle>
                <CardDescription>
                  SQL注入、XSS、CSRF等常见安全漏洞防护检查
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.vulnerabilities).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getVulnerabilityIcon(result.component)}
                          {result.component}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getSecurityStatusIcon(result.status)}
                            {getSecurityStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          <div className="flex items-center gap-2">
                            {getRiskLevelBadge(result.riskLevel)}
                            <Badge variant="outline" className="text-xs">{result.priority}</Badge>
                          </div>
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

          <TabsContent value="dataprotection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  数据保护检查
                </CardTitle>
                <CardDescription>
                  数据加密、敏感数据处理、备份安全等数据保护机制检查
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.dataProtection).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getDataProtectionIcon(result.component)}
                          {result.component}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getSecurityStatusIcon(result.status)}
                            {getSecurityStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          <div className="flex items-center gap-2">
                            {getRiskLevelBadge(result.riskLevel)}
                            <Badge variant="outline" className="text-xs">{result.priority}</Badge>
                          </div>
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

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  合规性检查
                </CardTitle>
                <CardDescription>
                  GDPR合规、数据治理、审计跟踪等合规性要求检查
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.compliance).map(([key, result]) => (
                    <Card key={key} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getComplianceIcon(result.component)}
                          {result.component}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getSecurityStatusIcon(result.status)}
                            {getSecurityStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium">{result.message}</p>
                          <div className="flex items-center gap-2">
                            {getRiskLevelBadge(result.riskLevel)}
                            <Badge variant="outline" className="text-xs">{result.priority}</Badge>
                          </div>
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

                {/* 模块安全状态 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">模块安全状态</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {report.modules.map((module) => (
                        <Card key={module.module} className="border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span>{getModuleDisplayName(module.module)}</span>
                              {getSecurityStatusBadge(module.overall)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2 p-2 rounded border">
                                <Key className="w-4 h-4" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">认证安全</div>
                                  <div className="flex items-center gap-1">
                                    {getSecurityStatusIcon(module.authentication.status)}
                                    <span className="text-xs text-gray-600">{module.authentication.message}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-2 rounded border">
                                <Users className="w-4 h-4" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">授权控制</div>
                                  <div className="flex items-center gap-1">
                                    {getSecurityStatusIcon(module.authorization.status)}
                                    <span className="text-xs text-gray-600">{module.authorization.message}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-2 rounded border">
                                <Eye className="w-4 h-4" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">数据验证</div>
                                  <div className="flex items-center gap-1">
                                    {getSecurityStatusIcon(module.dataValidation.status)}
                                    <span className="text-xs text-gray-600">{module.dataValidation.message}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 原始报告 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      原始安全报告
                    </CardTitle>
                    <CardDescription>
                      生成时间: {new Date(report.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                      {formatSecurityDiagnosticReport(report)}
                    </pre>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </ModernPageContainer>
  )
}