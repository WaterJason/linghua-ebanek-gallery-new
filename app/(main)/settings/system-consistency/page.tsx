"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ModernPageContainer } from "@/components/modern-page-container"
import { useToast } from "@/components/ui/use-toast"
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  RefreshCwIcon,
  WrenchIcon,
  ShieldCheckIcon,
  DatabaseIcon,
  CodeIcon,
  ComponentIcon,
  RouteIcon,
  DownloadIcon
} from "lucide-react"
import { runSystemConsistencyCheck, SystemConsistencyReport, ConsistencyCheckResult } from "@/lib/system-consistency-checker"
import { runAutoFix, AutoFixReport, createSystemBackup } from "@/lib/system-auto-fixer"

export default function SystemConsistencyPage() {
  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [checkReport, setCheckReport] = useState<SystemConsistencyReport | null>(null)
  const [fixReport, setFixReport] = useState<AutoFixReport | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // 执行系统一致性检查
  const handleRunCheck = async () => {
    setIsChecking(true)
    try {
      toast({
        title: "开始检查",
        description: "正在执行系统一致性检查...",
      })

      const report = await runSystemConsistencyCheck()
      setCheckReport(report)
      setFixReport(null) // 清除之前的修复报告

      toast({
        title: "检查完成",
        description: `检查完成，发现 ${report.errorChecks} 个错误，${report.warningChecks} 个警告`,
        variant: report.overallStatus === 'critical' ? 'destructive' : 
                 report.overallStatus === 'warning' ? 'default' : 'default'
      })

      if (report.overallStatus !== 'healthy') {
        setActiveTab("issues")
      }
    } catch (error) {
      console.error("系统检查失败:", error)
      toast({
        title: "检查失败",
        description: error instanceof Error ? error.message : "系统检查过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // 执行自动修复
  const handleAutoFix = async () => {
    if (!checkReport) {
      toast({
        title: "无法修复",
        description: "请先执行系统检查",
        variant: "destructive",
      })
      return
    }

    setIsFixing(true)
    try {
      // 创建备份
      toast({
        title: "创建备份",
        description: "正在创建系统备份...",
      })
      
      await createSystemBackup("自动修复前备份")

      // 执行修复
      toast({
        title: "开始修复",
        description: "正在执行自动修复...",
      })

      const issues = checkReport.results.filter(r => r.status !== 'success')
      const report = await runAutoFix(issues)
      setFixReport(report)

      toast({
        title: "修复完成",
        description: `修复完成，成功修复 ${report.successfulFixes} 个问题，${report.failedFixes} 个修复失败`,
        variant: report.failedFixes > 0 ? 'default' : 'default'
      })

      // 修复后重新检查
      setTimeout(() => {
        handleRunCheck()
      }, 1000)

    } catch (error) {
      console.error("自动修复失败:", error)
      toast({
        title: "修复失败",
        description: error instanceof Error ? error.message : "自动修复过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">健康</Badge>
      case 'warning':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">警告</Badge>
      case 'critical':
        return <Badge variant="destructive">严重</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '数据库一致性':
        return <DatabaseIcon className="h-4 w-4" />
      case '外键完整性':
        return <DatabaseIcon className="h-4 w-4" />
      case '类型定义':
        return <CodeIcon className="h-4 w-4" />
      case '组件版本':
        return <ComponentIcon className="h-4 w-4" />
      case 'Server Actions':
        return <CodeIcon className="h-4 w-4" />
      case '路由结构':
        return <RouteIcon className="h-4 w-4" />
      default:
        return <ShieldCheckIcon className="h-4 w-4" />
    }
  }

  return (
    <ModernPageContainer
      title="系统一致性管理"
      description="检查和修复ERP系统中的数据结构一致性、类型定义匹配、前端组件版本等问题"
    >
      <div className="space-y-6">
        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button
            onClick={handleRunCheck}
            disabled={isChecking || isFixing}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? '检查中...' : '执行检查'}
          </Button>

          {checkReport && checkReport.overallStatus !== 'healthy' && (
            <Button
              onClick={handleAutoFix}
              disabled={isChecking || isFixing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <WrenchIcon className={`h-4 w-4 ${isFixing ? 'animate-spin' : ''}`} />
              {isFixing ? '修复中...' : '自动修复'}
            </Button>
          )}
        </div>

        {/* 检查报告 */}
        {checkReport && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="issues">问题详情</TabsTrigger>
              <TabsTrigger value="recommendations">建议</TabsTrigger>
              {fixReport && <TabsTrigger value="fixes">修复结果</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* 整体状态 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5" />
                    系统整体状态
                  </CardTitle>
                  <CardDescription>
                    检查时间: {checkReport.timestamp.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">状态:</span>
                      {getStatusBadge(checkReport.overallStatus)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{checkReport.passedChecks}</div>
                      <div className="text-sm text-gray-600">通过</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{checkReport.warningChecks}</div>
                      <div className="text-sm text-gray-600">警告</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{checkReport.errorChecks}</div>
                      <div className="text-sm text-gray-600">错误</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{checkReport.totalChecks}</div>
                      <div className="text-sm text-gray-600">总计</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>健康度</span>
                      <span>{Math.round((checkReport.passedChecks / checkReport.totalChecks) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(checkReport.passedChecks / checkReport.totalChecks) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {checkReport.results.map((result, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getCategoryIcon(result.category)}
                      {result.category}
                      {getStatusIcon(result.status)}
                      <Badge variant="outline" className="ml-auto">
                        {result.priority}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                    {result.details && result.details.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <div className="font-medium mb-1">详细信息:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {result.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {checkReport.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>建议 {index + 1}</AlertTitle>
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </TabsContent>

            {fixReport && (
              <TabsContent value="fixes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>修复结果概览</CardTitle>
                    <CardDescription>
                      修复时间: {fixReport.timestamp.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{fixReport.successfulFixes}</div>
                        <div className="text-sm text-gray-600">成功</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{fixReport.failedFixes}</div>
                        <div className="text-sm text-gray-600">失败</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{fixReport.skippedFixes}</div>
                        <div className="text-sm text-gray-600">跳过</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{fixReport.totalFixes}</div>
                        <div className="text-sm text-gray-600">总计</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 修复详情 */}
                {fixReport.results.map((result, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getCategoryIcon(result.category)}
                        {result.category} - {result.action}
                        {getStatusIcon(result.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                      {result.details && result.details.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <div className="font-medium mb-1">详细信息:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {result.details.map((detail, i) => (
                              <li key={i}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* 需要手动处理的问题 */}
                {fixReport.manualActionsRequired.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-yellow-700">需要手动处理的问题</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {fixReport.manualActionsRequired.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* 初始状态 */}
        {!checkReport && (
          <Card>
            <CardHeader>
              <CardTitle>系统一致性检查</CardTitle>
              <CardDescription>
                点击"执行检查"开始检查系统的数据结构一致性、类型定义匹配、前端组件版本等问题
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">尚未执行系统检查</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernPageContainer>
  )
}
