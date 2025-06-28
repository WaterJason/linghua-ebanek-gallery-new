"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { FileUpload } from "@/components/file-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle, XCircle, FileText, Table } from "lucide-react"

interface ProductImportDialogProps {
  onImportComplete: () => void
  onCancel: () => void
}

interface ImportResult {
  success: boolean
  results?: {
    imported: number
    updated: number
    skipped: number
    failed: number
    errors: Array<{ row: number; error: string; data: any }>
  }
  message?: string
  error?: string
}

export function ProductImportDialog({ onImportComplete, onCancel }: ProductImportDialogProps) {
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件上传
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    console.log("🔄 [Import] 处理文件:", file.name)

    try {
      if (file.name.endsWith('.csv')) {
        await handleCSVFile(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleExcelFile(file)
      } else {
        toast({
          title: "文件格式不支持",
          description: "请上传CSV或Excel文件",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("🔥 [Import] 文件处理失败:", error)
      toast({
        title: "文件处理失败",
        description: "无法读取文件内容，请检查文件格式",
        variant: "destructive",
      })
    }
  }

  // 处理CSV文件
  const handleCSVFile = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error("CSV文件格式不正确，至少需要表头和一行数据")
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })
      row._rowNumber = index + 2 // 加2因为从第二行开始，且行号从1开始
      return row
    })

    setImportData(data)
    console.log("✅ [Import] CSV解析成功，数据行数:", data.length)
  }

  // 处理Excel文件
  const handleExcelFile = async (file: File) => {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // 使用第一个工作表
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // 转换为JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (data.length < 2) {
      throw new Error("Excel文件格式不正确，至少需要表头和一行数据")
    }

    const headers = (data[0] as any[]).map(h => String(h).trim())
    const rows = data.slice(1).map((row: any, index) => {
      const rowData: any = {}
      headers.forEach((header, i) => {
        rowData[header] = row[i] ? String(row[i]).trim() : ''
      })
      rowData._rowNumber = index + 2
      return rowData
    })

    setImportData(rows)
    console.log("✅ [Import] Excel解析成功，数据行数:", rows.length)
  }

  // 执行导入
  const handleImport = async () => {
    if (importData.length === 0) {
      toast({
        title: "没有数据",
        description: "请先上传文件",
        variant: "destructive",
      })
      return
    }

    try {
      setIsImporting(true)
      console.log("🔄 [Import] 开始导入，数据行数:", importData.length)

      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: importData,
          updateExisting,
          skipDuplicates,
        }),
      })

      const result = await response.json()
      setImportResult(result)

      if (result.success) {
        toast({
          title: "导入完成",
          description: result.message || "产品数据导入成功",
        })
        console.log("✅ [Import] 导入成功:", result.results)
      } else {
        toast({
          title: "导入失败",
          description: result.error || "导入过程中发生错误",
          variant: "destructive",
        })
        console.error("🔥 [Import] 导入失败:", result.error)
      }
    } catch (error) {
      console.error("🔥 [Import] 导入异常:", error)
      toast({
        title: "导入失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // 重置状态
  const handleReset = () => {
    setImportData([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">上传文件</TabsTrigger>
          <TabsTrigger value="preview" disabled={importData.length === 0}>
            预览数据 ({importData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                选择导入文件
              </CardTitle>
              <CardDescription>
                支持CSV和Excel格式文件。请确保文件包含正确的列标题。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) {
                      handleFileUpload(files)
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  {isDragActive ? (
                    <div className="text-sm font-medium text-foreground">
                      拖放文件到这里...
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-foreground">
                        <span className="text-primary underline">点击选择文件</span>
                        或拖拽文件到此处
                      </div>
                      <div className="text-xs text-muted-foreground">
                        支持 CSV、Excel (.xlsx, .xls) 格式，最大 10MB
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {importData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>导入选项</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="updateExisting"
                    checked={updateExisting}
                    onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                  />
                  <Label htmlFor="updateExisting">更新现有产品</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipDuplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  />
                  <Label htmlFor="skipDuplicates">跳过重复产品</Label>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>数据预览</CardTitle>
              <CardDescription>
                共 {importData.length} 行数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2">
                  {importData.slice(0, 10).map((row, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{row.name || row['产品名称'] || `行 ${row._rowNumber}`}</div>
                      <div className="text-sm text-muted-foreground">
                        价格: {row.price || row['价格'] || 'N/A'} |
                        分类: {row.category || row.categoryName || row['分类'] || 'N/A'}
                      </div>
                    </div>
                  ))}
                  {importData.length > 10 && (
                    <div className="text-center text-muted-foreground">
                      还有 {importData.length - 10} 行数据...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 导入结果 */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              导入结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.success && importResult.results && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="default">导入: {importResult.results.imported}</Badge>
                  <Badge variant="secondary">更新: {importResult.results.updated}</Badge>
                  <Badge variant="outline">跳过: {importResult.results.skipped}</Badge>
                  {importResult.results.failed > 0 && (
                    <Badge variant="destructive">失败: {importResult.results.failed}</Badge>
                  )}
                </div>
                {importResult.results.errors.length > 0 && (
                  <ScrollArea className="h-[200px] w-full">
                    <div className="space-y-2">
                      {importResult.results.errors.map((error, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <div className="font-medium text-red-800">行 {error.row}: {error.error}</div>
                          <div className="text-red-600">{JSON.stringify(error.data)}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
            {!importResult.success && (
              <div className="text-red-600">{importResult.error}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button variant="outline" onClick={handleReset}>
          重置
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={importData.length === 0 || isImporting}
        >
          {isImporting ? "导入中..." : "开始导入"}
        </Button>
        {importResult?.success && (
          <Button onClick={onImportComplete}>
            完成
          </Button>
        )}
      </div>
    </div>
  )
}
