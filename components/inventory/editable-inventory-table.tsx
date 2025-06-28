"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SearchIcon,
  UploadIcon,
  DownloadIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon,
  EditIcon,
  PackageIcon,
  ImageIcon,
  FileTextIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
// 移除客户端同步服务导入，同步将在API端点中处理
import { MobileEditDialog } from "./mobile-edit-dialog"
import { InventoryHelpGuide } from "./inventory-help-guide"

// 类型定义
interface ProductInventoryItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  category?: string
  sku?: string
  barcode?: string
  warehouseId: number
  warehouseName: string
  quantity: number
  minQuantity?: number
  salePrice: number
  costPrice?: number
  lastUpdated: string
  status: 'sufficient' | 'low' | 'out'
}

interface EditingCell {
  rowId: number
  field: 'quantity' | 'minQuantity' | 'salePrice' | 'costPrice'
  value: string
}

interface EditableInventoryTableProps {
  warehouseId?: string
  onDataChange?: () => void
}

export function EditableInventoryTable({ warehouseId, onDataChange }: EditableInventoryTableProps) {
  // 增强操作系统
  const { executeOperation, executeFormOperation } = useEnhancedOperations()

  // 状态管理
  const [data, setData] = useState<ProductInventoryItem[]>([])
  const [filteredData, setFilteredData] = useState<ProductInventoryItem[]>([])
  const [displayData, setDisplayData] = useState<ProductInventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)

  // 移动端编辑状态
  const [isMobileEditOpen, setIsMobileEditOpen] = useState(false)
  const [mobileEditItem, setMobileEditItem] = useState<ProductInventoryItem | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // DOM引用
  const editInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!warehouseId) {
      console.warn('⚠️ [EditableInventoryTable] warehouseId 为空，无法加载数据')
      setData([])
      return
    }

    setIsLoading(true)
    try {
      // 添加时间戳确保获取最新数据
      const timestamp = Date.now()
      console.log(`🔄 [EditableInventoryTable] 加载仓库 ${warehouseId} 的库存数据`)

      const response = await fetch(`/api/inventory/products?warehouseId=${warehouseId}&t=${timestamp}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [EditableInventoryTable] API请求失败: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ [EditableInventoryTable] 成功加载 ${result.data?.length || 0} 条库存数据`)

      setData(result.data || [])

      // 检查是否有同步状态信息
      if (result.syncStatus) {
        console.log('库存数据同步状态:', result.syncStatus)
      }
    } catch (error) {
      console.error('❌ [EditableInventoryTable] 加载库存数据失败:', error)
      toast({
        title: "错误",
        description: `加载库存数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive",
      })
      setData([]) // 确保在错误时清空数据
    } finally {
      setIsLoading(false)
    }
  }, [warehouseId])

  // 初始化数据
  useEffect(() => {
    loadData()
  }, [loadData])

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 应用筛选和分页
  useEffect(() => {
    let result = data

    // 搜索筛选
    if (searchTerm) {
      result = result.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 分类筛选
    if (categoryFilter !== "all") {
      result = result.filter(item => item.category === categoryFilter)
    }

    // 状态筛选
    if (statusFilter !== "all") {
      result = result.filter(item => item.status === statusFilter)
    }

    setFilteredData(result)

    // 计算分页
    const total = Math.ceil(result.length / pageSize)
    setTotalPages(total)

    // 确保当前页在有效范围内
    const validPage = Math.min(currentPage, total || 1)
    if (validPage !== currentPage) {
      setCurrentPage(validPage)
    }
  }, [data, searchTerm, categoryFilter, statusFilter, pageSize])

  // 计算显示数据（分页）
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const pageData = filteredData.slice(startIndex, endIndex)
    setDisplayData(pageData)
  }, [filteredData, currentPage, pageSize])

  // 双击编辑处理
  const handleCellDoubleClick = (rowId: number, field: 'quantity' | 'minQuantity' | 'salePrice' | 'costPrice') => {
    // 防止在加载状态下编辑
    if (isLoading) return

    const item = displayData.find(d => d.id === rowId)
    if (!item) return

    // 移动端使用对话框编辑
    if (isMobile) {
      setMobileEditItem(item)
      setIsMobileEditOpen(true)
      return
    }

    // 检查是否已有其他单元格在编辑中
    if (editingCell && editingCell.rowId !== rowId) {
      toast({
        title: "提示",
        description: "请先完成当前编辑操作",
        variant: "default",
      })
      return
    }

    const currentValue = item[field]?.toString() || '0'
    setEditingCell({ rowId, field, value: currentValue })

    // 延迟聚焦以确保输入框已渲染，增加兼容性处理
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus()
        editInputRef.current.select()

        // 移动端兼容性处理
        if ('ontouchstart' in window) {
          editInputRef.current.setSelectionRange(0, editInputRef.current.value.length)
        }
      }
    }, 50) // 增加延迟时间以提高兼容性
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingCell) return

    // 数据验证
    const newValue = parseFloat(editingCell.value)

    // 检查是否为有效数字
    if (isNaN(newValue)) {
      toast({
        title: "输入错误",
        description: "请输入有效的数字",
        variant: "destructive",
      })
      return
    }

    // 检查负数
    if (newValue < 0) {
      toast({
        title: "输入错误",
        description: "数值不能为负数",
        variant: "destructive",
      })
      return
    }

    // 检查价格字段的合理范围
    if ((editingCell.field === 'salePrice' || editingCell.field === 'costPrice') && newValue > 999999) {
      toast({
        title: "输入错误",
        description: "价格不能超过999,999元",
        variant: "destructive",
      })
      return
    }

    // 检查库存数量的合理范围
    if ((editingCell.field === 'quantity' || editingCell.field === 'minQuantity') && newValue > 999999) {
      toast({
        title: "输入错误",
        description: "库存数量不能超过999,999",
        variant: "destructive",
      })
      return
    }

    // 获取当前值用于比较
    const currentItem = data.find(d => d.id === editingCell.rowId)
    const currentValue = currentItem?.[editingCell.field] || 0

    // 如果值没有变化，直接取消编辑
    if (Math.abs(newValue - currentValue) < 0.01) {
      setEditingCell(null)
      return
    }

    // 保存原始编辑状态，确保在catch块中也能访问
    const originalEditingCell = editingCell

    try {
      console.log(`🔄 [EditableInventoryTable] 开始保存编辑:`, {
        rowId: editingCell.rowId,
        field: editingCell.field,
        value: newValue,
        warehouseId,
        currentValue
      })

      // 直接调用API，不使用executeFormOperation避免复杂性
      const startTime = Date.now()

      const requestBody = {
        field: editingCell.field,
        value: newValue,
        warehouseId,
        timestamp: Date.now() // 添加时间戳防止并发冲突
      }

      console.log(`📤 [EditableInventoryTable] 发送API请求:`, requestBody)

      const res = await fetch(`/api/inventory/products/${editingCell.rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const responseTime = Date.now() - startTime
      console.log(`⏱️ [EditableInventoryTable] API响应时间: ${responseTime}ms`)

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`❌ [EditableInventoryTable] API响应错误:`, {
          status: res.status,
          statusText: res.statusText,
          errorText,
          url: res.url
        })

        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.warn('无法解析错误响应为JSON:', errorText)
          errorData = { error: errorText }
        }

        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
      }

      const result = await res.json()
      console.log(`✅ [EditableInventoryTable] API响应成功:`, result)

      if (result.success) {
        // 更新本地数据
        setData(prev => prev.map(item =>
          item.id === editingCell.rowId
            ? { ...item, [editingCell.field]: newValue }
            : item
        ))

        // 检查数据同步状态
        if (result.syncStatus === "completed") {
          console.log(`✅ [EditableInventoryTable] 数据同步已完成`)
        } else if (result.syncStatus === "warning") {
          console.warn(`⚠️ [EditableInventoryTable] 数据同步有警告，但主要功能正常`)
        }

        setEditingCell(null)
        onDataChange?.()

        // 显示成功提示，包含同步状态
        const syncMessage = result.syncStatus === "warning" ? "（数据同步有警告）" : ""
        toast({
          title: "更新成功",
          description: `${getFieldLabel(originalEditingCell.field)}已更新为 ${newValue}${syncMessage}`,
          variant: "default",
        })
      } else {
        // 更新失败，恢复编辑状态
        setEditingCell(originalEditingCell)
        toast({
          title: "更新失败",
          description: result.message || "请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ [EditableInventoryTable] 保存编辑失败:', error)

      // 恢复编辑状态
      setEditingCell(originalEditingCell)

      // 显示详细错误信息
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      toast({
        title: "保存失败",
        description: `操作失败: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingCell(null)
  }

  // 移动端保存处理
  const handleMobileSave = async (field: string, value: number): Promise<boolean> => {
    if (!mobileEditItem) return false

    try {
      const response = await executeFormOperation(
        async () => {
          const startTime = Date.now()

          const res = await fetch(`/api/inventory/products/${mobileEditItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field,
              value,
              warehouseId,
              timestamp: Date.now()
            })
          })

          const responseTime = Date.now() - startTime
          console.log(`移动端API响应时间: ${responseTime}ms`)

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
          }

          return await res.json()
        },
        { [field]: mobileEditItem[field as keyof ProductInventoryItem] },
        { [field]: value },
        `更新${getFieldLabel(field)}`,
        'inventory',
        {
          playSound: true,
          soundType: 'success',
          enableUndo: true,
          undoTags: ['update', 'inventory', 'mobile-edit'],
          undoPriority: 5
        }
      )

      if (response.success) {
        // 更新本地数据
        setData(prev => prev.map(item =>
          item.id === mobileEditItem.id
            ? { ...item, [field]: value }
            : item
        ))

        // 数据同步现在在API端点中自动处理
        console.log(`🔄 [EditableInventoryTable] 移动端数据同步将在API端点中自动处理`)

        onDataChange?.()
        return true
      }

      return false
    } catch (error) {
      console.error('移动端保存失败:', error)
      return false
    }
  }

  // 获取字段标签
  const getFieldLabel = (field: string) => {
    const labels = {
      quantity: '库存数量',
      minQuantity: '最低库存',
      salePrice: '销售价格',
      costPrice: '成本价格'
    }
    return labels[field as keyof typeof labels] || field
  }

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const variants = {
      sufficient: { variant: "default" as const, label: "充足" },
      low: { variant: "destructive" as const, label: "不足" },
      out: { variant: "secondary" as const, label: "缺货" }
    }
    const config = variants[status as keyof typeof variants] || variants.sufficient
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // 处理文件导入
  const handleFileImport = async () => {
    if (!importFile) return

    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('warehouseId', warehouseId || '')

    try {
      setIsLoading(true)
      const response = await fetch('/api/inventory/products/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Import failed')

      const result = await response.json()

      toast({
        title: "导入成功",
        description: `成功导入 ${result.imported} 条记录`,
      })

      setIsImportDialogOpen(false)
      setImportFile(null)
      loadData()
      onDataChange?.()
    } catch (error) {
      console.error('Error importing file:', error)
      toast({
        title: "导入失败",
        description: "文件导入过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/inventory/products/export?warehouseId=${warehouseId}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-${warehouseId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "导出成功",
        description: "库存数据已导出到CSV文件",
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "导出失败",
        description: "数据导出过程中发生错误",
        variant: "destructive",
      })
    }
  }

  // 检查数据同步状态
  const handleSyncCheck = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products/sync?action=validate')
      if (!response.ok) throw new Error('Sync check failed')

      const result = await response.json()

      if (result.validation.success) {
        toast({
          title: "数据同步正常",
          description: "产品与库存数据一致",
          variant: "default",
        })
      } else {
        const inconsistencies = result.validation.details?.inconsistencies || []
        toast({
          title: "发现数据不一致",
          description: `发现 ${inconsistencies.length} 个数据不一致问题，建议刷新数据`,
          variant: "destructive",
        })

        // 自动刷新数据
        setTimeout(() => {
          loadData()
        }, 1000)
      }
    } catch (error) {
      console.error('Error checking sync status:', error)
      toast({
        title: "同步检查失败",
        description: "无法检查数据同步状态",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>产品库存清单</CardTitle>
            <CardDescription>双击单元格进行快速编辑，支持实时保存和数据同步</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
              <UploadIcon className="h-4 w-4 mr-2" />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleSyncCheck}>
              <CheckIcon className="h-4 w-4 mr-2" />
              同步检查
            </Button>
            <InventoryHelpGuide />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索产品名称、SKU或条码..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="所有分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                {/* 动态分类选项将在实际实现中添加 */}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="sufficient">库存充足</SelectItem>
                <SelectItem value="low">库存不足</SelectItem>
                <SelectItem value="out">缺货</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 可编辑表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="text-center">库存数量</TableHead>
                <TableHead className="text-center">最低库存</TableHead>
                <TableHead className="text-right">销售价格</TableHead>
                <TableHead className="text-right">成本价格</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-center">最后更新</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <PackageIcon className="h-12 w-12 mb-2 opacity-20" />
                      <p>暂无库存数据</p>
                      <p className="text-sm mt-1">请先添加产品到库存或调整筛选条件</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((item) => (
                  <TableRow key={item.id}>
                    {/* 产品信息 */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {item.productImage ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.sku && <span className="mr-2">SKU: {item.sku}</span>}
                            {item.barcode && <span>条码: {item.barcode}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* 分类 */}
                    <TableCell>
                      {item.category ? (
                        <Badge variant="outline">{item.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">未分类</span>
                      )}
                    </TableCell>

                    {/* 可编辑的库存数量 */}
                    <TableCell
                      className="text-center cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'quantity')}
                    >
                      {editingCell?.rowId === item.id && editingCell?.field === 'quantity' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            ref={editInputRef}
                            type="number"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="w-20 h-8 text-center"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            onBlur={handleSaveEdit}
                          />
                          <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                            <CheckIcon className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1">
                          <span className="font-medium">{item.quantity}</span>
                          <EditIcon className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                        </div>
                      )}
                    </TableCell>

                    {/* 可编辑的最低库存 */}
                    <TableCell
                      className="text-center cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'minQuantity')}
                    >
                      {editingCell?.rowId === item.id && editingCell?.field === 'minQuantity' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            ref={editInputRef}
                            type="number"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="w-20 h-8 text-center"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            onBlur={handleSaveEdit}
                          />
                          <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                            <CheckIcon className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1">
                          <span>{item.minQuantity || 0}</span>
                          <EditIcon className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                        </div>
                      )}
                    </TableCell>

                    {/* 可编辑的销售价格 */}
                    <TableCell
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'salePrice')}
                    >
                      {editingCell?.rowId === item.id && editingCell?.field === 'salePrice' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            ref={editInputRef}
                            type="number"
                            step="0.01"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="w-24 h-8 text-right"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            onBlur={handleSaveEdit}
                          />
                          <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                            <CheckIcon className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="font-medium">¥{item.salePrice.toFixed(2)}</span>
                          <EditIcon className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                        </div>
                      )}
                    </TableCell>

                    {/* 可编辑的成本价格 */}
                    <TableCell
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'costPrice')}
                    >
                      {editingCell?.rowId === item.id && editingCell?.field === 'costPrice' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            ref={editInputRef}
                            type="number"
                            step="0.01"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="w-24 h-8 text-right"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            onBlur={handleSaveEdit}
                          />
                          <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                            <CheckIcon className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1">
                          <span>¥{(item.costPrice || 0).toFixed(2)}</span>
                          <EditIcon className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                        </div>
                      )}
                    </TableCell>

                    {/* 状态 */}
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>

                    {/* 最后更新时间 */}
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页控件和统计信息 */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <div className="text-sm text-muted-foreground">
            显示第 {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} 条，
            共 {filteredData.length} 条记录 (总计 {data.length} 条)
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">每页显示</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">条</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            双击单元格进行编辑
          </div>
        </div>
      </CardContent>

      {/* 导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入库存数据</DialogTitle>
            <DialogDescription>
              支持CSV和Excel文件格式，自动匹配产品并更新库存信息
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="file-upload" className="text-sm font-medium">
                选择文件
              </label>
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  ref={fileInputRef}
                />

                {!importFile ? (
                  <div>
                    <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      点击选择文件
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      支持CSV、Excel格式，最大10MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <FileTextIcon className="h-6 w-6 text-primary" />
                    <span className="font-medium">{importFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImportFile(null)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">文件格式要求</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 必须包含产品标识列：产品名称、SKU或条码</li>
                <li>• 可选列：库存数量、最低库存、销售价格、成本价格</li>
                <li>• 第一行为标题行</li>
                <li>• 系统将自动匹配现有产品并更新信息</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleFileImport} disabled={!importFile || isLoading}>
              {isLoading ? "导入中..." : "开始导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移动端编辑对话框 */}
      <MobileEditDialog
        isOpen={isMobileEditOpen}
        onClose={() => {
          setIsMobileEditOpen(false)
          setMobileEditItem(null)
        }}
        item={mobileEditItem}
        onSave={handleMobileSave}
      />
    </Card>
  )
}
