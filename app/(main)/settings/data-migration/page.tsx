"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DatabaseIcon,
  ArrowRightIcon,
  DownloadIcon,
  ShieldIcon
} from "lucide-react"
import { FieldMappingIssue, MigrationResult } from "@/lib/data-migration-tool"
import { detectFieldMappingIssues, runFullMigration } from "@/lib/actions/data-migration-actions"

export default function DataMigrationPage() {
  const { toast } = useToast()
  const [isDetecting, setIsDetecting] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [issues, setIssues] = useState<FieldMappingIssue[]>([])
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  // 检测字段映射问题
  const handleDetectIssues = async () => {
    setIsDetecting(true)
    try {
      toast({
        title: "开始检测",
        description: "正在检测数据结构映射问题...",
      })

      const detectedIssues = await detectFieldMappingIssues()
      setIssues(detectedIssues)

      const errorCount = detectedIssues.filter(i => i.severity === 'error').length
      const warningCount = detectedIssues.filter(i => i.severity === 'warning').length

      toast({
        title: "检测完成",
        description: `发现 ${errorCount} 个错误，${warningCount} 个警告`,
        variant: errorCount > 0 ? 'destructive' : warningCount > 0 ? 'default' : 'default'
      })

      if (detectedIssues.length > 0) {
        setActiveTab("issues")
      }
    } catch (error) {
      console.error("检测失败:", error)
      toast({
        title: "检测失败",
        description: error instanceof Error ? error.message : "检测过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsDetecting(false)
    }
  }

  // 执行数据迁移
  const handleRunMigration = async () => {
    setIsMigrating(true)
    try {
      toast({
        title: "开始迁移",
        description: "正在执行数据结构迁移...",
      })

      const result = await runFullMigration()
      setMigrationResults(result.results)

      toast({
        title: result.success ? "迁移成功" : "迁移完成",
        description: result.message,
        variant: result.success ? 'default' : 'default'
      })

      setActiveTab("results")

      // 迁移后重新检测问题
      setTimeout(() => {
        handleDetectIssues()
      }, 1000)

    } catch (error) {
      console.error("迁移失败:", error)
      toast({
        title: "迁移失败",
        description: error instanceof Error ? error.message : "迁移过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  // 获取严重程度图标
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取严重程度徽章
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">错误</Badge>
      case 'warning':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">警告</Badge>
      case 'info':
        return <Badge variant="secondary">信息</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const infoCount = issues.filter(i => i.severity === 'info').length

  return (
    <ModernPageContainer
      title="数据结构迁移"
      description="检测和修复产品管理模块的数据结构不匹配问题"
    >
      <div className="space-y-6">
        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button
            onClick={handleDetectIssues}
            disabled={isDetecting || isMigrating}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isDetecting ? 'animate-spin' : ''}`} />
            {isDetecting ? '检测中...' : '检测问题'}
          </Button>

          {issues.length > 0 && (errorCount > 0 || warningCount > 0) && (
            <Button
              onClick={handleRunMigration}
              disabled={isDetecting || isMigrating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <WrenchIcon className={`h-4 w-4 ${isMigrating ? 'animate-spin' : ''}`} />
              {isMigrating ? '迁移中...' : '执行迁移'}
            </Button>
          )}
        </div>

        {/* 检测结果 */}
        {issues.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="issues">问题详情</TabsTrigger>
              {migrationResults.length > 0 && <TabsTrigger value="results">迁移结果</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* 问题统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5" />
                    数据结构问题统计
                  </CardTitle>
                  <CardDescription>
                    检测时间: {new Date().toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                      <div className="text-sm text-gray-600">错误</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                      <div className="text-sm text-gray-600">警告</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{infoCount}</div>
                      <div className="text-sm text-gray-600">信息</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{issues.length}</div>
                      <div className="text-sm text-gray-600">总计</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 迁移建议 */}
              {(errorCount > 0 || warningCount > 0) && (
                <Alert>
                  <ShieldIcon className="h-4 w-4" />
                  <AlertTitle>迁移建议</AlertTitle>
                  <AlertDescription>
                    发现了 {errorCount + warningCount} 个需要处理的问题。建议执行数据迁移来修复这些问题，确保系统的数据一致性。
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {issues.map((issue, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getSeverityIcon(issue.severity)}
                      产品 ID: {issue.id} - {issue.field}
                      {getSeverityBadge(issue.severity)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">当前值:</span>
                      <code className="bg-gray-100 px-1 rounded">{String(issue.currentValue)}</code>
                      <ArrowRightIcon className="h-3 w-3" />
                      <span className="font-medium">期望值:</span>
                      <code className="bg-gray-100 px-1 rounded">{String(issue.expectedValue)}</code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {migrationResults.length > 0 && (
              <TabsContent value="results" className="space-y-4">
                {migrationResults.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                        迁移步骤 {index + 1}
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "成功" : "失败"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-3">{result.message}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{result.details.processed}</div>
                          <div className="text-xs text-gray-600">处理</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{result.details.updated}</div>
                          <div className="text-xs text-gray-600">更新</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">{result.details.errors}</div>
                          <div className="text-xs text-gray-600">错误</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">{result.details.warnings.length}</div>
                          <div className="text-xs text-gray-600">警告</div>
                        </div>
                      </div>

                      {result.details.warnings.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <div className="font-medium mb-1">详细信息:</div>
                          <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                            {result.details.warnings.slice(0, 5).map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                            {result.details.warnings.length > 5 && (
                              <li>... 还有 {result.details.warnings.length - 5} 条记录</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* 初始状态 */}
        {issues.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>数据结构迁移工具</CardTitle>
              <CardDescription>
                检测和修复产品管理模块中前端组件与Prisma模型之间的数据结构不匹配问题
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DatabaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">尚未执行问题检测</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 检测前端字段与数据库模型的映射问题</p>
                  <p>• 识别废弃字段和类型不匹配</p>
                  <p>• 自动修复可修复的数据结构问题</p>
                  <p>• 提供详细的修复报告和建议</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernPageContainer>
  )
}
