"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getInventory, getWarehouses, transferInventory } from "@/lib/actions/inventory-actions";
import { getProducts } from "@/lib/actions/product-actions";
import {
  ArrowRightIcon,
  FileIcon,
  FileTextIcon,
  PackageIcon,
  RefreshCwIcon,
  UploadIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon
} from "lucide-react"

// 骨架屏组件
export function InventoryTransferSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function InventoryTransfer() {
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [warehouseData, setWarehouseData] = useState<any[]>([])
  const [productData, setProductData] = useState<any[]>([])
  const [sourceWarehouse, setSourceWarehouse] = useState("")
  const [targetWarehouse, setTargetWarehouse] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [transferQuantity, setTransferQuantity] = useState(1)
  const [transferNotes, setTransferNotes] = useState("")
  const [isTransferring, setIsTransferring] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [uploadedAttachment, setUploadedAttachment] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [transferHistory, setTransferHistory] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const warehouses = await getWarehouses()
      setWarehouseData(warehouses)

      if (warehouses.length > 0) {
        setSourceWarehouse(warehouses[0].id.toString())
        if (warehouses.length > 1) {
          setTargetWarehouse(warehouses[1].id.toString())
        }
      }

      const inventory = await getInventory()
      setInventoryData(inventory)

      const products = await getProducts()
      setProductData(products)

      // 模拟转移历史记录
      setTransferHistory([
        {
          id: 1,
          date: new Date().toISOString(),
          sourceWarehouse: warehouses[0]?.id,
          targetWarehouse: warehouses.length > 1 ? warehouses[1]?.id : warehouses[0]?.id,
          product: products[0]?.id,
          quantity: 5,
          notes: "手动转移",
          status: "completed"
        }
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "加载失败",
        description: "无法加载数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 获取仓库名称
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouseData.find(w => w.id === Number(warehouseId))
    return warehouse ? warehouse.name : "未知仓库"
  }

  // 获取产品名称
  const getProductName = (productId) => {
    const product = productData.find(p => p.id === Number(productId))
    return product ? product.name : "未知产品"
  }

  // 获取产品当前库存
  const getProductInventory = (warehouseId, productId) => {
    const item = inventoryData.find(
      i => i.warehouseId === Number(warehouseId) && i.productId === Number(productId)
    )
    return item ? item.quantity : 0
  }

  // 验证转移数据
  const validateTransferData = () => {
    // 检查必填字段
    if (!sourceWarehouse) {
      toast({
        title: "验证错误",
        description: "请选择源仓库",
        variant: "destructive",
      })
      return false
    }

    if (!targetWarehouse) {
      toast({
        title: "验证错误",
        description: "请选择目标仓库",
        variant: "destructive",
      })
      return false
    }

    if (!selectedProduct) {
      toast({
        title: "验证错误",
        description: "请选择要转移的产品",
        variant: "destructive",
      })
      return false
    }

    // 检查数量
    if (!transferQuantity || transferQuantity <= 0) {
      toast({
        title: "验证错误",
        description: "转移数量必须大于0",
        variant: "destructive",
      })
      return false
    }

    // 检查源仓库和目标仓库是否相同
    if (sourceWarehouse === targetWarehouse) {
      toast({
        title: "验证错误",
        description: "源仓库和目标仓库不能相同",
        variant: "destructive",
      })
      return false
    }

    // 检查库存是否足够
    const currentInventory = getProductInventory(sourceWarehouse, selectedProduct)
    if (currentInventory < transferQuantity) {
      toast({
        title: "库存不足",
        description: `源仓库中该产品的库存不足，当前库存: ${currentInventory}，需要: ${transferQuantity}`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // 处理单个转移
  const handleTransfer = async () => {
    // 验证数据
    if (!validateTransferData()) {
      return
    }

    try {
      setIsTransferring(true)

      // 获取产品和仓库信息，用于日志和提示
      const product = productData.find(p => p.id === Number(selectedProduct))
      const sourceWarehouseName = warehouseData.find(w => w.id === Number(sourceWarehouse))?.name
      const targetWarehouseName = warehouseData.find(w => w.id === Number(targetWarehouse))?.name

      // 记录操作开始
      console.log(`开始转移库存: 产品[${product?.name}] 从[${sourceWarehouseName}]到[${targetWarehouseName}], 数量: ${transferQuantity}`)

      // 直接使用服务器操作进行转移
      const actionResult = await transferInventory({
        fromLocationId: Number(sourceWarehouse),
        toLocationId: Number(targetWarehouse),
        productId: Number(selectedProduct),
        quantity: transferQuantity,
        notes: transferNotes || "手动转移"
      })

      console.log("库存转移结果:", actionResult)

      // 显示成功提示，包含更多详细信息
      toast({
        title: "转移成功",
        description: `已将 ${product?.name || '产品'} ${transferQuantity} ${product?.unit || '件'} 从 ${sourceWarehouseName} 转移到 ${targetWarehouseName}`,
      })

      // 重置表单
      setTransferQuantity(1)
      setTransferNotes("")

      // 重新加载数据
      await loadData()
    } catch (error) {
      // 详细记录错误
      console.error("库存转移失败:", error)

      // 解析错误信息
      let errorMessage = "无法转移库存"

      if (error.message) {
        // 处理常见错误类型，提供更友好的错误提示
        if (error.message.includes("源仓库库存不足")) {
          errorMessage = "源仓库库存不足，无法完成转移"
        } else if (error.message.includes("仓库不存在")) {
          errorMessage = "选择的仓库不存在或已被删除"
        } else if (error.message.includes("产品不存在")) {
          errorMessage = "选择的产品不存在或已被删除"
        } else {
          errorMessage = error.message
        }
      }

      // 显示错误提示
      toast({
        title: "转移失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
    }
  }

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)

    // 预览文件内容
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target.result

        // 解析Excel文件（这里简化为文本预览）
        setImportPreview({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2) + " KB",
          fileType: file.type,
        })
      } catch (error) {
        console.error("Error parsing file:", error)
        toast({
          title: "解析失败",
          description: "无法解析文件，请确保文件格式正确",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file)
  }

  // 处理附件上传
  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedAttachment(file)

    toast({
      title: "附件已选择",
      description: `已选择附件: ${file.name}`,
    })
  }

  // 验证批量导入数据
  const validateImportData = () => {
    // 检查文件
    if (!importFile) {
      toast({
        title: "验证错误",
        description: "请选择要导入的Excel文件",
        variant: "destructive",
      })
      return false
    }

    // 检查文件类型
    if (!importFile.name.endsWith(".xlsx") && !importFile.name.endsWith(".xls")) {
      toast({
        title: "文件格式错误",
        description: "请上传Excel文件(.xlsx或.xls格式)",
        variant: "destructive",
      })
      return false
    }

    // 检查文件大小
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (importFile.size > maxSize) {
      toast({
        title: "文件过大",
        description: "文件大小不能超过10MB",
        variant: "destructive",
      })
      return false
    }

    // 检查仓库选择
    if (!sourceWarehouse) {
      toast({
        title: "验证错误",
        description: "请选择源仓库",
        variant: "destructive",
      })
      return false
    }

    if (!targetWarehouse) {
      toast({
        title: "验证错误",
        description: "请选择目标仓库",
        variant: "destructive",
      })
      return false
    }

    // 检查源仓库和目标仓库是否相同
    if (sourceWarehouse === targetWarehouse) {
      toast({
        title: "验证错误",
        description: "源仓库和目标仓库不能相同",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // 处理批量导入
  const handleImport = async () => {
    // 验证数据
    if (!validateImportData()) {
      return
    }

    try {
      setIsTransferring(true)

      // 获取仓库信息，用于日志和提示
      const sourceWarehouseName = warehouseData.find(w => w.id === Number(sourceWarehouse))?.name
      const targetWarehouseName = warehouseData.find(w => w.id === Number(targetWarehouse))?.name

      // 记录操作开始
      console.log(`开始批量导入库存转移: 从[${sourceWarehouseName}]到[${targetWarehouseName}], 文件: ${importFile?.name}`)

      // 创建表单数据
      const formData = new FormData()
      formData.append("file", importFile)
      formData.append("sourceWarehouseId", sourceWarehouse)
      formData.append("targetWarehouseId", targetWarehouse)
      formData.append("notes", transferNotes || "批量导入转移")

      if (uploadedAttachment) {
        formData.append("attachment", uploadedAttachment)
      }

      // 模拟进度
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + Math.random() * 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 300)

      // 实际导入过程 - 这里使用模拟数据，实际应该调用API
      // const response = await fetch("/api/inventory/transfer/batch", {
      //   method: "POST",
      //   body: formData,
      // })

      // 模拟导入过程
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 模拟响应数据
      const result = {
        success: true,
        transferred: 5,
        items: Array(5).fill(0).map((_, i) => ({
          productId: i + 1,
          quantity: Math.floor(Math.random() * 10) + 1,
          success: true
        })),
        errors: []
      }

      // 停止进度条
      clearInterval(progressInterval)
      setImportProgress(100)

      // 记录成功结果
      console.log(`批量库存转移成功:`, result)

      // 显示成功提示，包含更多详细信息
      if (result.errors && result.errors.length > 0) {
        // 部分成功
        toast({
          title: "部分导入成功",
          description: `成功转移 ${result.transferred} 项，失败 ${result.errors.length} 项`,
          variant: "warning",
        })
      } else {
        // 全部成功
        toast({
          title: "导入成功",
          description: `已成功转移 ${result.transferred} 项产品从 ${sourceWarehouseName} 到 ${targetWarehouseName}`,
        })
      }

      // 重置表单
      setImportFile(null)
      setImportPreview(null)
      setImportProgress(0)
      setUploadedAttachment(null)
      setIsImportDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ""
      }

      // 重新加载数据
      await loadData()
    } catch (error) {
      // 详细记录错误
      console.error("批量库存转移失败:", error)

      // 停止进度条
      setImportProgress(0)

      // 解析错误信息
      let errorTitle = "导入失败"
      let errorMessage = "无法导入库存转移数据"

      if (error.message) {
        // 处理常见错误类型，提供更友好的错误提示
        if (error.message.includes("Excel文件缺少必需的列")) {
          errorTitle = "文件格式错误"
          errorMessage = error.message
        } else if (error.message.includes("源仓库库存不足")) {
          errorTitle = "库存不足"
          errorMessage = "一个或多个产品在源仓库中库存不足"
        } else if (error.message.includes("无法找到产品")) {
          errorTitle = "产品不存在"
          errorMessage = "一个或多个产品不存在或无法识别"
        } else {
          errorMessage = error.message
        }
      }

      // 显示错误提示
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
    }
  }

  if (isLoading) {
    return <InventoryTransferSkeleton />
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">单个转移</TabsTrigger>
          <TabsTrigger value="history">转移记录</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>库存转移</CardTitle>
                  <CardDescription>在不同仓库之间转移库存</CardDescription>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>使用此功能可以将产品从一个仓库转移到另一个仓库。转移后，源仓库库存减少，目标仓库库存增加。</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    批量导入
                  </Button>
                  <Button variant="outline" size="icon" onClick={loadData}>
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sourceWarehouse">源仓库</Label>
                      <span className="text-xs text-muted-foreground">从哪个仓库转出</span>
                    </div>
                    <Select value={sourceWarehouse} onValueChange={setSourceWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择源仓库" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouseData.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="product">产品</Label>
                      <span className="text-xs text-muted-foreground">要转移的产品</span>
                    </div>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择产品" />
                      </SelectTrigger>
                      <SelectContent>
                        {productData.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProduct && sourceWarehouse && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                          当前库存: {getProductInventory(sourceWarehouse, selectedProduct)}
                        </p>
                        {getProductInventory(sourceWarehouse, selectedProduct) <= 10 && (
                          <span className="text-xs text-amber-600 font-medium">库存较低</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes">备注</Label>
                      <span className="text-xs text-muted-foreground">可选，记录转移原因</span>
                    </div>
                    <Textarea
                      id="notes"
                      placeholder="输入转移备注，例如：调整库存、产品调拨等"
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      备注将记录在转移历史中，方便后续查询和追踪
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="targetWarehouse">目标仓库</Label>
                      <span className="text-xs text-muted-foreground">转入哪个仓库</span>
                    </div>
                    <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择目标仓库" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouseData.map((warehouse) => (
                          <SelectItem
                            key={warehouse.id}
                            value={warehouse.id.toString()}
                            disabled={warehouse.id.toString() === sourceWarehouse}
                          >
                            {warehouse.name}
                            {warehouse.id.toString() === sourceWarehouse && " (当前源仓库)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      源仓库和目标仓库不能相同
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quantity">转移数量</Label>
                      <span className="text-xs text-muted-foreground">要转移多少件</span>
                    </div>
                    <Input
                      id="quantity"
                      type="number"
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(Number(e.target.value))}
                      min={1}
                    />
                    {selectedProduct && sourceWarehouse && transferQuantity > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        转移后源仓库剩余: {Math.max(0, getProductInventory(sourceWarehouse, selectedProduct) - transferQuantity)} 件
                      </p>
                    )}
                  </div>

                  <div className="pt-6">
                    <Button
                      className="w-full"
                      onClick={handleTransfer}
                      disabled={isTransferring}
                    >
                      {isTransferring ? (
                        <>处理中...</>
                      ) : (
                        <>
                          <ArrowRightIcon className="h-4 w-4 mr-2" />
                          转移库存
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>转移记录</CardTitle>
                  <CardDescription>库存转移历史记录</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadData}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transferHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">没有转移记录</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>源仓库</TableHead>
                      <TableHead>目标仓库</TableHead>
                      <TableHead>产品</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleString()}</TableCell>
                        <TableCell>{getWarehouseName(record.sourceWarehouse)}</TableCell>
                        <TableCell>{getWarehouseName(record.targetWarehouse)}</TableCell>
                        <TableCell>{getProductName(record.product)}</TableCell>
                        <TableCell>{record.quantity}</TableCell>
                        <TableCell>{record.notes}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckIcon className="h-3 w-3" />
                            已完成
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                共 {transferHistory.length} 条记录
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 批量导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>批量导入库存转移</DialogTitle>
            <DialogDescription>
              上传Excel文件批量转移库存。文件应包含产品ID/条码、数量等信息。
            </DialogDescription>
            <div className="mt-2 text-sm text-muted-foreground border-l-4 border-blue-200 pl-3 py-2 bg-blue-50 rounded">
              <h4 className="font-medium mb-1">Excel文件格式说明：</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>第一行必须包含表头：<span className="font-mono">产品ID</span>、<span className="font-mono">数量</span>（必填）</li>
                <li>可选表头：<span className="font-mono">产品条码</span>、<span className="font-mono">产品名称</span>、<span className="font-mono">备注</span></li>
                <li>如果没有提供产品ID，系统将尝试通过条码或名称查找产品</li>
                <li>数量必须是大于0的整数</li>
                <li>支持的文件格式：.xlsx, .xls</li>
                <li>文件大小不超过10MB</li>
              </ul>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sourceWarehouse">源仓库</Label>
              <Select value={sourceWarehouse} onValueChange={setSourceWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="选择源仓库" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseData.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetWarehouse">目标仓库</Label>
              <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标仓库" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseData.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importFile">选择Excel文件</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="importFile"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                  className="flex-1"
                />
              </div>
              {importPreview && (
                <div className="mt-2 p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center">
                    <FileIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{importPreview.fileName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    大小: {importPreview.fileSize} | 类型: {importPreview.fileType}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">附件上传（可选）</Label>
              <Input
                id="attachment"
                type="file"
                ref={attachmentInputRef}
                onChange={handleAttachmentChange}
                className="flex-1"
              />
              {uploadedAttachment && (
                <div className="mt-2 p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{uploadedAttachment.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    大小: {(uploadedAttachment.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              )}
            </div>

            {importProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>导入进度</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={isTransferring || !importFile}>
              {isTransferring ? "导入中..." : "开始导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
