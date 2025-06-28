"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ImportResult } from "@/types/product"
import { FileIcon, UploadIcon, AlertCircleIcon, CheckCircleIcon, ShieldAlertIcon } from "lucide-react"
import { useSession } from "next-auth/react"

interface ProductImportProps {
  onImportComplete?: (result: ImportResult) => void
  onCancel?: () => void
}

export function ProductImport({ onImportComplete, onCancel }: ProductImportProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  // 检查用户是否有权限导入产品
  useEffect(() => {
    if (session) {
      // 只有管理员可以导入产品
      const userRole = session.user?.role as string | undefined
      setHasPermission(userRole === "admin")
    } else {
      setHasPermission(false)
    }
  }, [session])

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImportFile(file)
    setError(null)
    setResult(null)
  }

  // 处理下载模板
  const handleDownloadTemplate = async () => {
    // 检查权限
    if (hasPermission === false) {
      toast({
        title: "权限不足",
        description: "只有管理员可以下载产品导入模板"
      })
      return
    }

    try {
      // 设置下载中状态
      setIsImporting(true)
      toast({
        title: "正在准备下载",
        description: "正在生成导入模板，请稍候...",
      })

      // 使用fetch API获取模板
      const response = await fetch("/api/templates/products", {
        method: "GET",
        credentials: "include", // 包含身份验证信息
      })

      if (!response.ok) {
        // 检查响应状态码
        if (response.status === 403) {
          throw new Error("未授权，请确保您已登录并有权限下载模板")
        }

        // 尝试解析错误响应
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.error || "下载模板失败")
        } catch (parseError) {
          // 如果无法解析JSON，使用状态文本
          throw new Error(`下载失败: ${response.statusText || response.status}`)
        }
      }

      // 获取文件内容
      const blob = await response.blob()

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "product_import_template.xlsx"
      document.body.appendChild(a)
      a.click()

      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "下载成功",
        description: "产品导入模板已下载",
      })
    } catch (error) {
      console.error("下载模板失败:", error)
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : "下载模板时出错"
      })
    } finally {
      setIsImporting(false)
    }
  }

  // 处理导入
  const handleImport = async () => {
    // 检查权限
    if (hasPermission === false) {
      setError("权限不足，只有管理员可以导入产品")
      toast({
        title: "权限不足",
        description: "只有管理员可以导入产品数据"
      })
      return
    }

    if (!importFile) {
      setError("请选择要导入的文件")
      return
    }

    // 检查文件类型
    if (!importFile.name.endsWith(".xlsx") && !importFile.name.endsWith(".xls")) {
      setError("请上传Excel文件(.xlsx或.xls)")
      return
    }

    setIsImporting(true)
    setProgress(0)
    setError(null)
    setResult(null)

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5
        return newProgress >= 90 ? 90 : newProgress
      })
    }, 300)

    try {
      // 创建FormData
      const formData = new FormData()
      formData.append("file", importFile)

      // 发送请求
      const response = await fetch("/api/import/products", {
        method: "POST",
        body: formData,
        credentials: "include", // 包含身份验证信息
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        // 检查响应状态码
        if (response.status === 403) {
          throw new Error("未授权，请确保您已登录并有权限导入产品")
        }

        // 尝试解析错误响应
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.error || "导入失败")
        } catch (parseError) {
          // 如果无法解析JSON，使用状态文本
          throw new Error(`导入失败: ${response.statusText || response.status}`)
        }
      }

      const data = await response.json()
      setProgress(100)

      // 处理导入结果
      const importResult: ImportResult = {
        success: true,
        total: data.products?.length || 0,
        created: data.created || 0,
        updated: data.updated || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      }

      setResult(importResult)

      // 调用回调
      if (onImportComplete) {
        onImportComplete(importResult)
      }

      // 显示成功提示
      toast({
        title: "导入成功",
        description: `成功导入 ${importResult.total} 个产品`,
      })
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setProgress(0)
      console.error("导入错误:", error)
      setError(error instanceof Error ? error.message : "导入过程中发生错误")

      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "导入过程中发生错误"
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>导入产品数据</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPermission === false && (
            <Alert variant="destructive">
              <ShieldAlertIcon className="h-4 w-4" />
              <AlertTitle>权限不足</AlertTitle>
              <AlertDescription>
                只有管理员可以导入产品数据。如需导入产品，请联系管理员或使用管理员账户登录。
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="import-file">选择Excel文件</Label>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleDownloadTemplate}
                disabled={isImporting || hasPermission === false}
              >
                下载导入模板
              </Button>
            </div>
            <Input
              id="import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting || hasPermission === false}
            />
            <p className="text-sm text-muted-foreground">
              支持的文件格式: Excel (.xlsx, .xls)
            </p>
          </div>

          {importFile && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <div>{importFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(importFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>导入错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                导入中... {progress}%
              </p>
            </div>
          )}

          {result && (
            <Alert variant={result.failed > 0 ? "destructive" : "default"}>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertTitle>导入完成</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  <p>总计: {result.total} 个产品</p>
                  <p>新建: {result.created} 个</p>
                  <p>更新: {result.updated} 个</p>
                  {result.failed > 0 && <p>失败: {result.failed} 个</p>}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">错误信息:</p>
                    <ul className="list-disc list-inside text-sm">
                      {result.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isImporting}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={!importFile || isImporting || hasPermission === false}>
            {isImporting ? (
              <>
                <UploadIcon className="mr-2 h-4 w-4 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                开始导入
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
