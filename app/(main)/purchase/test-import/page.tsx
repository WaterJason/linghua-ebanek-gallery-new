"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Play,
  RefreshCw
} from "lucide-react"

interface TestResult {
  allTestsPassed: boolean
  testResults: {
    databaseConnection: boolean
    productCreation: boolean
    tagCreation: boolean
    supplierExists: boolean
    employeeExists: boolean
    errors: string[]
  }
  recommendations: string[]
  sampleCSV: string
}

export default function PurchaseImportTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [progress, setProgress] = useState(0)

  // 执行功能测试
  const runFunctionTest = async () => {
    setIsLoading(true)
    setProgress(0)
    setTestResult(null)

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 20
        })
      }, 300)

      const response = await fetch("/api/purchase-orders/import/test", {
        method: "GET"
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error("测试请求失败")
      }

      const result = await response.json()
      
      if (result.success) {
        setTestResult(result.data)
        toast({
          title: "功能测试完成",
          description: result.data.allTestsPassed ? "所有测试通过" : "部分测试未通过"
        })
      } else {
        throw new Error(result.error || "测试失败")
      }

    } catch (error) {
      console.error("功能测试失败:", error)
      toast({
        title: "测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 下载测试CSV
  const downloadTestCSV = () => {
    if (!testResult) return

    const blob = new Blob([testResult.sampleCSV], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "批量导入测试数据.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ModernPageContainer
      title="批量导入功能测试"
      description="测试采购管理模块的批量导入和自动创建产品功能"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "采购管理", href: "/purchase" },
        { label: "功能测试" }
      ]}
    >
      <div className="space-y-6">
        {/* 测试控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              功能测试控制面板
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runFunctionTest} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isLoading ? "测试中..." : "开始功能测试"}
              </Button>

              {testResult && (
                <Button 
                  variant="outline" 
                  onClick={downloadTestCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  下载测试数据
                </Button>
              )}
            </div>

            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  正在测试批量导入功能... {progress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResult && (
          <div className="space-y-6">
            {/* 总体状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.allTestsPassed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  测试结果总览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={testResult.allTestsPassed ? "default" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {testResult.allTestsPassed ? "✅ 所有测试通过" : "❌ 部分测试失败"}
                </Badge>
              </CardContent>
            </Card>

            {/* 详细测试结果 */}
            <Card>
              <CardHeader>
                <CardTitle>详细测试结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>数据库连接</span>
                    <Badge variant={testResult.testResults.databaseConnection ? "default" : "destructive"}>
                      {testResult.testResults.databaseConnection ? "✅ 正常" : "❌ 失败"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>产品创建功能</span>
                    <Badge variant={testResult.testResults.productCreation ? "default" : "destructive"}>
                      {testResult.testResults.productCreation ? "✅ 正常" : "❌ 失败"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>标签创建功能</span>
                    <Badge variant={testResult.testResults.tagCreation ? "default" : "destructive"}>
                      {testResult.testResults.tagCreation ? "✅ 正常" : "❌ 失败"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>供应商数据</span>
                    <Badge variant={testResult.testResults.supplierExists ? "default" : "destructive"}>
                      {testResult.testResults.supplierExists ? "✅ 存在" : "❌ 缺失"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>员工数据</span>
                    <Badge variant={testResult.testResults.employeeExists ? "default" : "destructive"}>
                      {testResult.testResults.employeeExists ? "✅ 存在" : "❌ 缺失"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 错误信息 */}
            {testResult.testResults.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">发现的问题</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResult.testResults.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 建议 */}
            <Card>
              <CardHeader>
                <CardTitle>操作建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 下一步操作 */}
            <Card>
              <CardHeader>
                <CardTitle>下一步操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.open('/purchase', '_blank')}
                    variant="outline"
                  >
                    前往采购管理
                  </Button>
                  <Button 
                    onClick={() => window.open('/products', '_blank')}
                    variant="outline"
                  >
                    查看产品管理
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ModernPageContainer>
  )
}
