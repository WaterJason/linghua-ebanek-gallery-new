"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DownloadIcon, UploadIcon, FileIcon, ChevronDownIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export type ImportFormat = "excel" | "csv" | "json"
export type ExportFormat = "excel" | "csv" | "json" | "pdf"

interface DataImportExportProps {
  // 导入配置
  importEnabled?: boolean
  importFormats?: ImportFormat[]
  importEndpoint?: string
  importTemplateUrl?: string
  onImportSuccess?: (data: any) => void
  importInstructions?: string
  
  // 导出配置
  exportEnabled?: boolean
  exportFormats?: ExportFormat[]
  exportEndpoint?: string
  exportFileName?: string
  exportParams?: Record<string, string>
  
  // 通用配置
  className?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  showLabels?: boolean
}

export function DataImportExport({
  importEnabled = true,
  importFormats = ["excel"],
  importEndpoint = "/api/import",
  importTemplateUrl,
  onImportSuccess,
  importInstructions,
  
  exportEnabled = true,
  exportFormats = ["excel"],
  exportEndpoint = "/api/export",
  exportFileName,
  exportParams = {},
  
  className,
  buttonVariant = "outline",
  buttonSize = "default",
  showLabels = true,
}: DataImportExportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importFormat, setImportFormat] = useState<ImportFormat>(importFormats[0])
  const [exportFormat, setExportFormat] = useState<ExportFormat>(exportFormats[0])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const isMobile = useIsMobile()
  
  // 处理导出
  const handleExport = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        ...exportParams,
        format: exportFormat
      })
      
      // 构建文件名
      const timestamp = new Date().toISOString().split("T")[0]
      const fileExt = exportFormat === "excel" ? "xlsx" : exportFormat
      const fileName = exportFileName 
        ? `${exportFileName}.${fileExt}`
        : `export-${timestamp}.${fileExt}`
      
      // 触发文件下载
      window.location.href = `${exportEndpoint}?${params.toString()}`
      
      toast({
        title: "导出成功",
        description: "文件已开始下载",
      })
    } catch (error) {
      console.error("导出失败:", error)
      toast({
        title: "导出失败",
        description: "导出数据时出错",
        variant: "destructive",
      })
    }
  }
  
  // 处理导入
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "导入失败",
        description: "请选择要导入的文件",
        variant: "destructive",
      })
      return
    }
    
    setIsImporting(true)
    setImportProgress(0)
    setValidationErrors([])
    
    try {
      const formData = new FormData()
      formData.append("file", importFile)
      formData.append("format", importFormat)
      
      // 模拟进度
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + Math.random() * 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 300)
      
      const response = await fetch(importEndpoint, {
        method: "POST",
        body: formData,
      })
      
      clearInterval(progressInterval)
      setImportProgress(100)
      
      if (!response.ok) {
        const error = await response.json()
        
        if (error.details && Array.isArray(error.details)) {
          setValidationErrors(error.details)
          throw new Error("导入数据有错误，请检查并修正")
        }
        
        throw new Error(error.error || "导入失败")
      }
      
      const result = await response.json()
      
      toast({
        title: "导入成功",
        description: result.message || `成功导入数据`,
      })
      
      if (onImportSuccess) {
        onImportSuccess(result)
      }
      
      setTimeout(() => {
        setIsImportDialogOpen(false)
        setImportFile(null)
        setImportProgress(0)
      }, 1000)
    } catch (error) {
      console.error("导入失败:", error)
      toast({
        title: "导入失败",
        description: error.message || "导入数据时出错",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }
  
  // 下载导入模板
  const handleDownloadTemplate = () => {
    if (importTemplateUrl) {
      window.location.href = importTemplateUrl
    }
  }
  
  // 渲染导入导出按钮
  const renderButtons = () => {
    // 只有导出按钮
    if (exportEnabled && !importEnabled) {
      if (exportFormats.length === 1) {
        return (
          <Button 
            variant={buttonVariant} 
            size={buttonSize}
            onClick={handleExport}
            className={className}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            {showLabels && "导出"}
          </Button>
        )
      } else {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={buttonVariant} 
                size={buttonSize}
                className={className}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                {showLabels && "导出"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {exportFormats.map(format => (
                <DropdownMenuItem 
                  key={format}
                  onClick={() => {
                    setExportFormat(format)
                    handleExport()
                  }}
                >
                  导出为 {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
    
    // 只有导入按钮
    if (importEnabled && !exportEnabled) {
      return (
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          onClick={() => setIsImportDialogOpen(true)}
          className={className}
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {showLabels && "导入"}
        </Button>
      )
    }
    
    // 导入和导出按钮
    return (
      <div className={cn("flex gap-2", className)}>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          onClick={() => setIsImportDialogOpen(true)}
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {showLabels && "导入"}
        </Button>
        
        {exportFormats.length === 1 ? (
          <Button 
            variant={buttonVariant} 
            size={buttonSize}
            onClick={handleExport}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            {showLabels && "导出"}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={buttonVariant} 
                size={buttonSize}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                {showLabels && "导出"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {exportFormats.map(format => (
                <DropdownMenuItem 
                  key={format}
                  onClick={() => {
                    setExportFormat(format)
                    handleExport()
                  }}
                >
                  导出为 {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }
  
  return (
    <>
      {renderButtons()}
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className={cn("sm:max-w-md", isMobile && "w-[90vw] max-w-[90vw]")}>
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
            <DialogDescription>
              请选择要导入的文件。文件必须包含正确的格式和数据结构。
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">上传文件</TabsTrigger>
              <TabsTrigger value="help">导入说明</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">选择文件</Label>
                  <Input
                    id="file"
                    type="file"
                    accept={importFormats.map(format => 
                      format === "excel" ? ".xlsx,.xls" : `.${format}`
                    ).join(",")}
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    disabled={isImporting}
                  />
                  
                  {importFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileIcon className="h-4 w-4" />
                      <span>{importFile.name}</span>
                      <span>({(importFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
                
                {importFormats.length > 1 && (
                  <div className="grid gap-2">
                    <Label htmlFor="format">文件格式</Label>
                    <select
                      id="format"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={importFormat}
                      onChange={(e) => setImportFormat(e.target.value as ImportFormat)}
                      disabled={isImporting}
                    >
                      {importFormats.map(format => (
                        <option key={format} value={format}>
                          {format === "excel" ? "Excel (.xlsx)" : 
                           format === "csv" ? "CSV (.csv)" : 
                           format === "json" ? "JSON (.json)" : format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>导入进度</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
                
                {validationErrors.length > 0 && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon className="h-4 w-4 text-destructive" />
                      <h4 className="text-sm font-medium text-destructive">导入数据有错误</h4>
                    </div>
                    <ul className="mt-2 text-sm text-destructive space-y-1 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="help" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">导入说明</h3>
                  <p className="text-sm text-muted-foreground">
                    {importInstructions || "请确保您的导入文件符合系统要求的格式和数据结构。"}
                  </p>
                </div>
                
                {importTemplateUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadTemplate}
                    className="w-full"
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    下载导入模板
                  </Button>
                )}
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">支持的文件格式</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {importFormats.map(format => (
                      <li key={format}>
                        {format === "excel" ? "Excel (.xlsx, .xls)" : 
                         format === "csv" ? "CSV (.csv)" : 
                         format === "json" ? "JSON (.json)" : format.toUpperCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
            >
              取消
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importFile || isImporting}
              className={isImporting ? "opacity-80" : ""}
            >
              {isImporting ? "导入中..." : "导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
