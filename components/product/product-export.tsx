"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  FileIcon, 
  DownloadIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  FileSpreadsheetIcon
} from "lucide-react"
import { Product } from "@/types/product"

interface ProductExportProps {
  products: Product[];
  selectedProductIds?: number[];
  onExportComplete?: () => void;
  onCancel?: () => void;
}

export function ProductExport({
  products,
  selectedProductIds,
  onExportComplete,
  onCancel
}: ProductExportProps) {
  const { toast } = useToast()
  const [exportScope, setExportScope] = useState<"all" | "selected" | "filtered">("all")
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel")
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 选择要导出的字段
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    price: true,
    category: true,
    barcode: true,
    dimensions: true,
    material: true,
    unit: true,
    description: true,
    inventory: true,
    imageUrl: false,
    cost: false,
    commissionRate: false,
    sku: false,
  })
  
  // 处理字段选择变化
  const handleFieldToggle = (field: keyof typeof selectedFields, checked: boolean) => {
    setSelectedFields(prev => ({ ...prev, [field]: checked }))
  }
  
  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    const newState = Object.keys(selectedFields).reduce((acc, field) => {
      acc[field as keyof typeof selectedFields] = checked
      return acc
    }, {} as typeof selectedFields)
    
    setSelectedFields(newState)
  }
  
  // 获取要导出的产品
  const getProductsToExport = () => {
    if (exportScope === "selected" && selectedProductIds && selectedProductIds.length > 0) {
      return products.filter(product => selectedProductIds.includes(product.id!))
    }
    
    // 这里可以添加过滤逻辑，如果需要支持"filtered"选项
    
    return products
  }
  
  // 处理导出
  const handleExport = async () => {
    // 检查是否有选择的字段
    const hasSelectedFields = Object.values(selectedFields).some(value => value)
    if (!hasSelectedFields) {
      setError("请至少选择一个要导出的字段")
      return
    }
    
    const productsToExport = getProductsToExport()
    
    if (productsToExport.length === 0) {
      setError("没有可导出的产品")
      return
    }
    
    setIsExporting(true)
    setError(null)
    
    try {
      // 准备导出数据
      const exportData = productsToExport.map(product => {
        const data: Record<string, any> = {}
        
        // 只包含选中的字段
        Object.entries(selectedFields).forEach(([field, selected]) => {
          if (selected) {
            data[field] = product[field as keyof Product]
          }
        })
        
        return data
      })
      
      // 创建查询参数
      const queryParams = new URLSearchParams()
      queryParams.append("format", exportFormat)
      queryParams.append("fields", Object.keys(selectedFields).filter(field => selectedFields[field as keyof typeof selectedFields]).join(","))
      
      // 发送请求
      const response = await fetch(`/api/export/products?${queryParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "导出失败")
      }
      
      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "products"
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // 下载文件
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // 显示成功提示
      toast({
        title: "导出成功",
        description: `成功导出 ${productsToExport.length} 个产品`,
      })
      
      // 调用回调
      if (onExportComplete) {
        onExportComplete()
      }
    } catch (error) {
      console.error("导出错误:", error)
      setError(error instanceof Error ? error.message : "导出过程中发生错误")
      
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheetIcon className="h-5 w-5" />
            导出产品数据
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>导出错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">导出范围</h3>
              <RadioGroup value={exportScope} onValueChange={(value) => setExportScope(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="scope-all" />
                  <Label htmlFor="scope-all">所有产品 ({products.length})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="selected" 
                    id="scope-selected" 
                    disabled={!selectedProductIds || selectedProductIds.length === 0}
                  />
                  <Label htmlFor="scope-selected">
                    已选择的产品 ({selectedProductIds?.length || 0})
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">导出格式</h3>
              <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="format-excel" />
                  <Label htmlFor="format-excel">Excel (.xlsx)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="format-csv" />
                  <Label htmlFor="format-csv">CSV (.csv)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">导出字段</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSelectAll(!Object.values(selectedFields).every(Boolean))}
                >
                  {Object.values(selectedFields).every(Boolean) ? "取消全选" : "全选"}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-name"
                    checked={selectedFields.name}
                    onCheckedChange={(checked) => handleFieldToggle("name", !!checked)}
                  />
                  <Label htmlFor="field-name">产品名称</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-price"
                    checked={selectedFields.price}
                    onCheckedChange={(checked) => handleFieldToggle("price", !!checked)}
                  />
                  <Label htmlFor="field-price">价格</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-category"
                    checked={selectedFields.category}
                    onCheckedChange={(checked) => handleFieldToggle("category", !!checked)}
                  />
                  <Label htmlFor="field-category">分类</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-barcode"
                    checked={selectedFields.barcode}
                    onCheckedChange={(checked) => handleFieldToggle("barcode", !!checked)}
                  />
                  <Label htmlFor="field-barcode">条码</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-dimensions"
                    checked={selectedFields.dimensions}
                    onCheckedChange={(checked) => handleFieldToggle("dimensions", !!checked)}
                  />
                  <Label htmlFor="field-dimensions">尺寸</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-material"
                    checked={selectedFields.material}
                    onCheckedChange={(checked) => handleFieldToggle("material", !!checked)}
                  />
                  <Label htmlFor="field-material">材质</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-unit"
                    checked={selectedFields.unit}
                    onCheckedChange={(checked) => handleFieldToggle("unit", !!checked)}
                  />
                  <Label htmlFor="field-unit">单位</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-description"
                    checked={selectedFields.description}
                    onCheckedChange={(checked) => handleFieldToggle("description", !!checked)}
                  />
                  <Label htmlFor="field-description">描述</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-inventory"
                    checked={selectedFields.inventory}
                    onCheckedChange={(checked) => handleFieldToggle("inventory", !!checked)}
                  />
                  <Label htmlFor="field-inventory">库存</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-imageUrl"
                    checked={selectedFields.imageUrl}
                    onCheckedChange={(checked) => handleFieldToggle("imageUrl", !!checked)}
                  />
                  <Label htmlFor="field-imageUrl">图片URL</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-cost"
                    checked={selectedFields.cost}
                    onCheckedChange={(checked) => handleFieldToggle("cost", !!checked)}
                  />
                  <Label htmlFor="field-cost">成本</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-commissionRate"
                    checked={selectedFields.commissionRate}
                    onCheckedChange={(checked) => handleFieldToggle("commissionRate", !!checked)}
                  />
                  <Label htmlFor="field-commissionRate">提成比例</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-sku"
                    checked={selectedFields.sku}
                    onCheckedChange={(checked) => handleFieldToggle("sku", !!checked)}
                  />
                  <Label htmlFor="field-sku">SKU</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isExporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <DownloadIcon className="mr-2 h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <DownloadIcon className="mr-2 h-4 w-4" />
                导出数据
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
