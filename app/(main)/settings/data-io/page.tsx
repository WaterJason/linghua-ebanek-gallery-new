"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { 
  DownloadIcon, 
  UploadIcon, 
  DatabaseIcon, 
  FileIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from "lucide-react"

export default function DataIOPage() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async (type) => {
    setExporting(true)
    setProgress(0)
    
    try {
      // 模拟导出进度
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/export/${type}`, {
        method: "POST",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "导出成功",
          description: `${type} 数据已导出`,
        })
      } else {
        toast({
          title: "导出失败",
          description: "导出数据时发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("导出失败:", error)
      toast({
        title: "导出失败",
        description: "导出数据时发生错误",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }

  const handleImport = async (type, file) => {
    if (!file) return

    setImporting(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // 模拟导入进度
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      const response = await fetch(`/api/import/${type}`, {
        method: "POST",
        body: formData,
      })

      clearInterval(interval)
      setProgress(100)

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "导入成功",
          description: `成功导入 ${result.count} 条记录`,
        })
      } else {
        toast({
          title: "导入失败",
          description: "导入数据时发生错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("导入失败:", error)
      toast({
        title: "导入失败",
        description: "导入数据时发生错误",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      setProgress(0)
    }
  }

  const exportModules = [
    { id: "products", name: "产品数据", description: "导出所有产品信息和库存数据" },
    { id: "employees", name: "员工数据", description: "导出员工信息和薪资记录" },
    { id: "sales", name: "销售数据", description: "导出销售订单和交易记录" },
    { id: "finance", name: "财务数据", description: "导出财务账目和交易记录" },
    { id: "inventory", name: "库存数据", description: "导出库存变动和盘点记录" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">数据导入导出</h1>
        <p className="text-muted-foreground">管理系统数据的导入导出和备份</p>
      </div>

      {/* 进度显示 */}
      {(importing || exporting) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {importing ? "数据导入中..." : "数据导出中..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              进度: {progress}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* 数据导出 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DownloadIcon className="h-5 w-5" />
            数据导出
          </CardTitle>
          <CardDescription>
            将系统数据导出为Excel文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportModules.map((module) => (
              <div key={module.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{module.name}</h3>
                  <Button
                    size="sm"
                    onClick={() => handleExport(module.id)}
                    disabled={exporting}
                  >
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    导出
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据导入 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            数据导入
          </CardTitle>
          <CardDescription>
            从Excel文件导入数据到系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                导入数据前请确保文件格式正确，建议先备份现有数据
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportModules.map((module) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{module.name}</h3>
                    <div>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImport(module.id, file)
                          }
                        }}
                        className="hidden"
                        id={`import-${module.id}`}
                        disabled={importing}
                      />
                      <Button
                        size="sm"
                        asChild
                        disabled={importing}
                      >
                        <label htmlFor={`import-${module.id}`} className="cursor-pointer">
                          <UploadIcon className="h-4 w-4 mr-1" />
                          导入
                        </label>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据备份 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            数据备份
          </CardTitle>
          <CardDescription>
            创建和管理系统数据备份
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">完整数据备份</h3>
                <p className="text-sm text-muted-foreground">
                  备份所有系统数据，包括用户、产品、订单等
                </p>
              </div>
              <Button>
                <DatabaseIcon className="h-4 w-4 mr-2" />
                创建备份
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">最近备份</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm">2024-12-19 10:30:00</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
