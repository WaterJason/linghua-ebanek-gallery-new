"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { toast } from "@/components/ui/use-toast"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  X
} from "lucide-react"

interface ImportItem {
  row: number
  productName: string
  quantity: number
  price: number
  notes?: string
  isValid: boolean
  errors: string[]
  matchedProduct?: {
    id: number
    name: string
    similarity: number
  }
}

interface PreviewResult {
  items: ImportItem[]
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    duplicateRows: number
  }
  suggestions: string[]
}

interface ImportResult {
  batchId: string
  totalCount: number
  successCount: number
  failedCount: number
  orders: Array<{
    id: number
    orderNumber: string
    supplierName: string
    totalAmount: number
    itemCount: number
  }>
  errors: Array<{
    row: number
    productName: string
    error: string
  }>
}

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suppliers: Array<{ id: number; name: string }>
  employees: Array<{ id: number; name: string }>
  onImportComplete?: (result: ImportResult) => void
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  suppliers,
  employees,
  onImportComplete
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<"upload" | "parse" | "match" | "preview" | "validate" | "importing" | "result">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    supplierId: "",
    employeeId: "",
    expectedDate: "",
    notes: ""
  })
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [productPreview, setProductPreview] = useState<any>(null) // 产品预览结果
  const [matchResults, setMatchResults] = useState<any>(null) // 产品匹配结果
  const [smartProducts, setSmartProducts] = useState<any[]>([]) // 智能推断的产品
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 重置对话框状态
  const resetDialog = () => {
    setStep("upload")
    setSelectedFile(null)
    setFormData({
      supplierId: "",
      employeeId: "",
      expectedDate: "",
      notes: ""
    })
    setPreviewResult(null)
    setProductPreview(null)
    setMatchResults(null)
    setSmartProducts([])
    setImportProgress(0)
    setImportResult(null)
    setIsLoading(false)
  }

  // 处理文件上传
  const handleFileUpload = (fileUrl: string) => {
    // 这里我们需要从URL获取文件对象，暂时跳过
    console.log("文件上传完成:", fileUrl)
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // 预览文件内容
  const handlePreview = async () => {
    if (!selectedFile) {
      toast({
        title: "错误",
        description: "请先选择要导入的文件",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("🔍 开始预览文件:", selectedFile.name)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/purchase-orders/import/product-preview", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("预览请求失败:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`预览请求失败 (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      if (result.success) {
        // 转换新API响应格式为旧格式以保持兼容性
        const convertedData = {
          items: result.data.previewResults.map(item => ({
            row: item.row,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            isValid: item.matchStatus !== 'error',
            errors: item.matchStatus === 'error' ? ['产品处理失败'] : [],
            matchedProduct: item.existingProduct ? {
              id: item.existingProduct.id,
              name: item.existingProduct.name,
              similarity: item.confidence
            } : null
          })),
          summary: {
            totalRows: result.data.statistics.total,
            validRows: result.data.statistics.total - result.data.statistics.errors,
            invalidRows: result.data.statistics.errors,
            duplicateRows: 0 // 暂时设为0，后续可以添加重复检测
          },
          suggestions: [
            `发现 ${result.data.statistics.exactMatches} 个精确匹配的产品`,
            `发现 ${result.data.statistics.fuzzyMatches} 个相似产品`,
            `将创建 ${result.data.statistics.newProducts} 个新产品`,
            result.data.statistics.errors > 0 ? `${result.data.statistics.errors} 个产品处理失败` : null
          ].filter(Boolean)
        }

        setPreviewResult(convertedData)
        setProductPreview(result.data) // 保存原始数据用于后续处理
        setStep("preview")

        // 显示预览结果提示
        toast({
          title: "文件解析完成",
          description: `共解析 ${convertedData.summary.totalRows} 行数据，其中 ${convertedData.summary.validRows} 行有效`
        })
      } else {
        throw new Error(result.error || "预览失败")
      }
    } catch (error) {
      console.error("预览文件失败:", error)
      toast({
        title: "预览失败",
        description: error instanceof Error ? error.message : "无法解析文件内容，请检查文件格式",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 执行导入
  const handleImport = async () => {
    if (!selectedFile || !formData.supplierId || !formData.employeeId || !productPreview) {
      toast({
        title: "错误",
        description: "请填写完整的导入信息并完成产品预览",
        variant: "destructive"
      })
      return
    }

    setStep("importing")
    setImportProgress(0)

    try {
      console.log("🚀 开始执行智能导入...")

      // 阶段1: 准备新产品数据 (0-30%)
      setImportProgress(10)

      const newProducts = productPreview.previewResults
        .filter(item => item.matchStatus === 'new' && item.inferredProduct)
        .map(item => ({
          row: item.row,
          name: item.productName,
          material: item.inferredProduct.material,
          unit: item.inferredProduct.unit,
          price: item.price,
          description: item.inferredProduct.description,
          categoryName: item.inferredProduct.category,
          quantity: item.quantity,
          notes: item.notes
        }))

      setImportProgress(20)

      // 阶段2: 创建新产品 (20-60%)
      let smartProductResult = null
      if (newProducts.length > 0) {
        console.log(`🧠 创建 ${newProducts.length} 个新产品`)

        const smartProductResponse = await fetch("/api/purchase-orders/import/smart-product-creation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            products: newProducts,
            purchaseOrderData: {
              supplierId: parseInt(formData.supplierId),
              employeeId: parseInt(formData.employeeId),
              expectedDate: formData.expectedDate,
              notes: formData.notes || "智能批量导入"
            }
          })
        })

        if (!smartProductResponse.ok) {
          throw new Error(`智能产品创建失败: ${smartProductResponse.status}`)
        }

        smartProductResult = await smartProductResponse.json()
        console.log("✅ 智能产品创建完成:", smartProductResult)
      }

      setImportProgress(60)

      // 阶段3: 处理现有产品的采购订单 (60-90%)
      const existingProductItems = productPreview.previewResults
        .filter(item => item.matchStatus === 'exact' || item.matchStatus === 'fuzzy')

      let traditionalImportResult = null
      if (existingProductItems.length > 0) {
        console.log(`📦 为 ${existingProductItems.length} 个现有产品创建采购订单`)

        const formDataToSend = new FormData()
        formDataToSend.append("file", selectedFile)
        formDataToSend.append("supplierId", formData.supplierId)
        formDataToSend.append("employeeId", formData.employeeId)
        if (formData.expectedDate) {
          formDataToSend.append("expectedDate", formData.expectedDate)
        }
        if (formData.notes) {
          formDataToSend.append("notes", formData.notes)
        }

        const response = await fetch("/api/purchase-orders/import", {
          method: "POST",
          body: formDataToSend
        })

        if (!response.ok) {
          throw new Error(`传统导入失败: ${response.status}`)
        }

        traditionalImportResult = await response.json()
        console.log("✅ 传统导入完成:", traditionalImportResult)
      }

      setImportProgress(90)

      // 阶段4: 合并结果 (90-100%)
      const combinedResult = {
        success: true,
        message: "智能导入完成",
        data: {
          smartProductResult,
          traditionalImportResult,
          summary: {
            newProductsCreated: smartProductResult?.data?.statistics?.successful || 0,
            existingProductOrders: traditionalImportResult?.data?.ordersCreated || 0,
            totalProcessed: productPreview.statistics.total,
            errors: (smartProductResult?.data?.statistics?.failed || 0) +
                   (traditionalImportResult?.data?.errors || 0)
          }
        }
      }

      setImportProgress(100)

      if (combinedResult.success) {
        // 阶段5: 完成处理 (95-100%)
        setImportProgress(95)
        setImportResult(combinedResult.data)
        setImportProgress(100)

        setStep("result")
        onImportComplete?.(combinedResult.data)

        const summary = combinedResult.data.summary
        toast({
          title: "智能导入成功",
          description: `创建了 ${summary.newProductsCreated} 个新产品，生成了 ${summary.existingProductOrders} 个采购订单`
        })
      } else {
        throw new Error("智能导入失败")
      }

    } catch (error) {
      console.error("导入失败:", error)
      setImportProgress(0)
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
      setStep("validate")
    }
  }

  // 下载模板
  const handleDownloadTemplate = () => {
    const csvContent = "产品名称,数量,单价,备注\n珐琅杯,10,25.00,蓝色款\n珐琅盘,5,45.00,白色款\n珐琅茶具套装,2,158.00,高端系列"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "采购订单导入模板.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 关闭对话框
  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            批量导入采购订单
          </DialogTitle>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-between mb-6">
          {[
            { key: "upload", label: "上传文件", icon: Upload },
            { key: "preview", label: "预览数据", icon: Eye },
            { key: "validate", label: "数据验证", icon: CheckCircle },
            { key: "importing", label: "导入中", icon: Upload },
            { key: "result", label: "导入结果", icon: CheckCircle }
          ].map((stepItem, index) => {
            const Icon = stepItem.icon
            const isActive = step === stepItem.key
            const isCompleted = ["upload", "preview", "validate", "importing", "result"].indexOf(step) > index
            
            return (
              <div key={stepItem.key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isActive 
                    ? "border-primary bg-primary text-primary-foreground" 
                    : isCompleted 
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground text-muted-foreground"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {stepItem.label}
                </span>
                {index < 4 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    isCompleted ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* 上传文件步骤 */}
        {step === "upload" && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                支持Excel (.xlsx, .xls) 和CSV (.csv) 格式文件。请确保文件包含：产品名称、数量、单价、备注（可选）列。
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">供应商 *</Label>
                <Select value={formData.supplierId} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, supplierId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee">负责员工 *</Label>
                <Select value={formData.employeeId} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, employeeId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择负责员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectedDate">预期到货日期</Label>
                <Input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  placeholder="导入备注信息"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>选择导入文件</Label>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  下载模板
                </Button>
              </div>
              
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Badge variant="secondary">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button onClick={handlePreview} disabled={!selectedFile || isLoading}>
                {isLoading ? "解析中..." : "预览数据"}
              </Button>
            </div>
          </div>
        )}

        {/* 预览数据步骤 */}
        {step === "preview" && previewResult && (
          <div className="space-y-6">
            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">总计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{previewResult.summary.totalRows}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">有效</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{previewResult.summary.validRows}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">无效</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{previewResult.summary.invalidRows}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-600">重复</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{previewResult.summary.duplicateRows}</div>
                </CardContent>
              </Card>
            </div>

            {/* 建议信息 */}
            {previewResult.suggestions.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {previewResult.suggestions.map((suggestion, index) => (
                      <div key={index}>• {suggestion}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 数据预览表格 */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">数据预览</h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">行号</th>
                      <th className="text-left p-2">产品名称</th>
                      <th className="text-center p-2">数量</th>
                      <th className="text-right p-2">单价</th>
                      <th className="text-left p-2">匹配产品</th>
                      <th className="text-left p-2">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.items.map((item, index) => (
                      <tr key={index} className={`border-t ${!item.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                        <td className="p-2 text-muted-foreground">{item.row}</td>
                        <td className="p-2 font-medium">{item.productName}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">¥{item.price.toFixed(2)}</td>
                        <td className="p-2">
                          {item.matchedProduct ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-600">
                                {item.matchedProduct.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(item.matchedProduct.similarity * 100)}%
                              </span>
                            </div>
                          ) : (
                            <Badge variant="destructive">将跳过</Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {item.isValid ? (
                            <Badge variant="outline" className="text-green-600">有效</Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="destructive">无效</Badge>
                              {item.errors.map((error, errorIndex) => (
                                <div key={errorIndex} className="text-xs text-red-600">{error}</div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                返回上传
              </Button>
              <Button
                onClick={() => setStep("validate")}
                disabled={previewResult.summary.validRows === 0}
              >
                继续验证 ({previewResult.summary.validRows} 条有效数据)
              </Button>
            </div>
          </div>
        )}

        {/* 数据验证步骤 */}
        {step === "validate" && previewResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">数据验证完成</h3>
              <p className="text-muted-foreground">所有数据已通过验证，可以开始导入</p>
            </div>

            {/* 验证摘要 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">可导入数据</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{previewResult.summary.validRows}</div>
                  <p className="text-xs text-muted-foreground">条记录</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">将跳过</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {previewResult.items.filter(item => !item.matchedProduct).length}
                  </div>
                  <p className="text-xs text-muted-foreground">未匹配产品</p>
                </CardContent>
              </Card>
            </div>

            {/* 将跳过的产品列表 */}
            {previewResult.items.filter(item => !item.matchedProduct && item.isValid).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">将跳过的未匹配产品</h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {previewResult.items
                    .filter(item => !item.matchedProduct && item.isValid)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            第{item.row}行
                          </span>
                        </div>
                        <Badge variant="destructive">
                          将跳过（请先创建产品）
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>数据验证通过！导入后将：</p>
                  <ul className="text-sm ml-4 space-y-1">
                    <li>• 为匹配到的产品创建采购订单</li>
                    <li>• 自动启动采购审批流程</li>
                    <li>• 跳过未匹配的产品（请先在产品管理中创建）</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("preview")}>
                返回预览
              </Button>
              <Button onClick={handleImport}>
                确认导入
              </Button>
            </div>
          </div>
        )}

        {/* 导入中步骤 */}
        {step === "importing" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">正在导入数据...</h3>
              <p className="text-muted-foreground">
                {importProgress < 20 && "准备导入数据..."}
                {importProgress >= 20 && importProgress < 30 && "发送导入请求..."}
                {importProgress >= 30 && importProgress < 80 && "处理采购订单..."}
                {importProgress >= 80 && importProgress < 95 && "启动审批流程..."}
                {importProgress >= 95 && "导入完成！"}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{importProgress}%</p>
            </div>

            {importProgress >= 30 && importProgress < 95 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                正在创建采购订单并启动审批流程...
              </div>
            )}
          </div>
        )}

        {/* 导入结果步骤 */}
        {step === "result" && importResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">导入完成</h3>
              <p className="text-muted-foreground">
                采购订单已创建并自动进入审批流程
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">总计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{importResult.totalCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">成功</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">跳过</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{importResult.failedCount}</div>
                </CardContent>
              </Card>
            </div>



            {importResult.orders.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">成功创建的采购订单</h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {importResult.orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                      <div>
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {order.supplierName} · {order.itemCount}项
                        </span>
                      </div>
                      <span className="font-medium">¥{order.totalAmount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">导入错误</h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-2 border-b last:border-b-0">
                      <div className="text-sm">
                        <span className="font-medium">第{error.row}行:</span>
                        <span className="ml-2">{error.productName}</span>
                      </div>
                      <div className="text-xs text-red-600 mt-1">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 后续操作建议 */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">后续操作建议：</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 通知相关审批人员处理采购订单审批</li>
                    <li>• 跟踪订单审批进度和供应商确认</li>
                    <li>• 准备收货验收和库存入库流程</li>
                    <li>• 如有跳过的产品，请先在产品管理中创建后重新导入</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => window.open('/purchase', '_blank')}>
                查看采购管理
              </Button>
              <Button onClick={handleClose}>
                完成
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
