"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Product, ProductCategory, ProductFilter } from "@/types/product"
import { useMaterialUnitSync } from "@/hooks/use-material-unit-sync"
import {
  SearchIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
  PlusIcon,
  FilterIcon,
  EyeIcon,
  MoreHorizontalIcon,
  ListIcon,
  LayoutGridIcon,
  RefreshCwIcon,
  TagIcon
} from "lucide-react"
import { LazyImage } from "@/components/ui/lazy-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProductListProps {
  products: Product[]
  categories: ProductCategory[]
  filter: ProductFilter
  onFilterChange: (filter: Partial<ProductFilter>) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: number) => void
  onSelectionChange: (productIds: number[]) => void
  onInlineEditProduct?: (productId: number, field: string, value: string | number) => Promise<boolean>
  isLoading?: boolean
}

export function ProductList({
  products,
  categories,
  filter,
  onFilterChange,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSelectionChange,
  onInlineEditProduct,
  isLoading = false
}: ProductListProps) {
  const { toast } = useToast()

  // 使用材质和单位同步Hook
  const { materials: syncMaterials, isLoading: isMaterialLoading } = useMaterialUnitSync()

  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table")
  const [editingField, setEditingField] = useState<{ id: number, field: string, value: string | number } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [productTags, setProductTags] = useState<string[]>([])

  // 批量编辑状态
  const [showBatchEditDialog, setShowBatchEditDialog] = useState(false)
  const [batchEditField, setBatchEditField] = useState<string>("")
  const [batchEditValue, setBatchEditValue] = useState<string>("")
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)

  // 处理产品选择
  const handleSelectProduct = (productId: number, checked: boolean) => {
    const newSelection = checked
      ? [...selectedProducts, productId]
      : selectedProducts.filter(id => id !== productId)

    setSelectedProducts(newSelection)
    onSelectionChange(newSelection)
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? products.map(p => p.id!).filter(id => id !== undefined) : []
    setSelectedProducts(newSelection)
    onSelectionChange(newSelection)
  }

  // 处理双击内联编辑
  const handleDoubleClickEdit = (productId: number, field: string, value: string | number) => {
    console.log(`[InlineEdit] 开始编辑: 产品${productId}, 字段${field}, 值${value}`)
    setEditingField({ id: productId, field, value })
  }

  // 保存内联编辑（使用专门的内联编辑逻辑）
  const handleSaveInlineEdit = async () => {
    if (!editingField) return

    try {
      console.log(`[InlineEdit] 保存编辑: 产品${editingField.id}, 字段${editingField.field}, 新值${editingField.value}`)

      const product = products.find(p => p.id === editingField.id)
      if (!product) {
        console.error('[InlineEdit] 找不到对应的产品')
        return
      }

      // 数据验证
      if (editingField.field === 'price' && (editingField.value as number) < 0) {
        toast({
          title: "验证失败",
          description: "价格不能为负数",
          variant: "destructive",
        })
        return
      }

      if (editingField.field === 'inventory' && (editingField.value as number) < 0) {
        toast({
          title: "验证失败",
          description: "库存不能为负数",
          variant: "destructive",
        })
        return
      }

      if (editingField.field === 'name' && !(editingField.value as string).trim()) {
        toast({
          title: "验证失败",
          description: "产品名称不能为空",
          variant: "destructive",
        })
        return
      }

      // 保存当前编辑字段信息，用于错误恢复
      const currentEditingField = { ...editingField }

      // 乐观更新：立即更新UI
      setEditingField(null)

      // 优先使用专门的内联编辑回调
      if (onInlineEditProduct) {
        console.log(`[InlineEdit] 使用专门的内联编辑回调`)
        const success = await onInlineEditProduct(editingField.id, editingField.field, editingField.value)

        if (success) {
          toast({
            title: "更新成功",
            description: `${getFieldDisplayName(editingField.field)}已更新`,
          })
        } else {
          // 恢复编辑状态
          setEditingField(currentEditingField)
          toast({
            title: "更新失败",
            description: "无法更新产品信息，请重试",
            variant: "destructive",
          })
        }
        return
      }

      // 备用方案：直接使用PATCH API
      console.log(`[InlineEdit] 使用直接API调用`)
      const updateData = {
        [editingField.field]: editingField.value
      }

      const response = await fetch(`/api/products/${editingField.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "更新失败")
      }

      const result = await response.json()
      console.log(`[InlineEdit] API更新成功:`, result)

      toast({
        title: "更新成功",
        description: `${getFieldDisplayName(editingField.field)}已更新`,
      })

      // 触发数据重新加载（如果需要）
      // 注意：这里不调用onEditProduct，因为它是用于弹窗编辑的

    } catch (error) {
      console.error('[InlineEdit] 保存失败:', error)
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "无法更新产品信息，请重试",
        variant: "destructive",
      })
      // 保存失败时恢复编辑状态
      // setEditingField 保持当前状态，让用户可以重试
    }
  }

  // 取消内联编辑
  const handleCancelInlineEdit = () => {
    console.log(`[InlineEdit] 取消编辑`)
    setEditingField(null)
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveInlineEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelInlineEdit()
    }
  }

  // 处理输入框失焦（延迟执行以避免与按钮点击冲突）
  const handleInputBlur = (e: React.FocusEvent) => {
    // 检查焦点是否移动到了保存或取消按钮
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && (
      relatedTarget.textContent === '✓' ||
      relatedTarget.textContent === '✕' ||
      relatedTarget.closest('[data-inline-edit-controls]')
    )) {
      return // 不取消编辑，让按钮处理
    }

    // 延迟取消编辑，给按钮点击事件时间执行
    setTimeout(() => {
      handleCancelInlineEdit()
    }, 150)
  }

  // 获取字段显示名称
  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      name: '产品名称',
      price: '价格',
      inventory: '库存',
      dimensions: '尺寸'
    }
    return fieldNames[field] || field
  }

  // 获取材质选项（使用同步的材质数据）
  const materialOptions = syncMaterials.map(m => m.name).sort()

  // 提取产品标签（处理标签对象）
  useEffect(() => {
    const allTags = new Set<string>()

    try {
      products.forEach((product, productIndex) => {
        // 检查产品对象是否有效
        if (!product || typeof product !== 'object') {
          console.warn(`[ProductList] 产品 ${productIndex} 不是有效对象:`, product)
          return
        }

        // 检查tags字段
        if (product.tags) {
          if (Array.isArray(product.tags)) {
            product.tags.forEach((tag, tagIndex) => {
              try {
                // 处理标签对象或字符串
                let tagName = ''

                if (tag !== null && tag !== undefined) {
                  if (typeof tag === 'string') {
                    // 如果是字符串，直接使用
                    tagName = tag.trim()
                  } else if (typeof tag === 'object' && tag.name) {
                    // 如果是对象，提取name字段
                    tagName = String(tag.name).trim()
                  } else {
                    // 其他情况，尝试转换为字符串
                    tagName = String(tag).trim()
                  }

                  if (tagName && tagName.length > 0 && tagName !== '[object Object]') {
                    allTags.add(tagName)
                    console.log(`[ProductList] 产品 ${productIndex} 添加标签: "${tagName}"`)
                  } else {
                    console.warn(`[ProductList] 产品 ${productIndex} 标签 ${tagIndex} 无效:`, tag)
                  }
                }
              } catch (tagError) {
                console.warn(`[ProductList] 产品 ${productIndex} 标签 ${tagIndex} 处理失败:`, tag, tagError)
              }
            })
          } else {
            console.warn(`[ProductList] 产品 ${productIndex} 的tags字段不是数组:`, typeof product.tags, product.tags)
          }
        }
      })

      setProductTags(Array.from(allTags).sort())
      console.log(`[ProductList] 提取到 ${allTags.size} 个产品标签:`, Array.from(allTags))
    } catch (error) {
      console.error(`[ProductList] 提取产品标签时发生错误:`, error)
      setProductTags([]) // 设置为空数组作为fallback
    }
  }, [products])

  // 格式化价格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(price)
  }

  // 获取库存状态
  const getInventoryStatus = (inventory: number | null) => {
    if (inventory === null || inventory === undefined) return { text: "未设置", color: "gray" }
    if (inventory === 0) return { text: "缺货", color: "red" }
    if (inventory < 10) return { text: "库存不足", color: "yellow" }
    return { text: "正常", color: "green" }
  }

  // 处理库存同步
  const handleSyncInventory = async () => {
    if (isSyncing) return // 防止重复点击

    try {
      setIsSyncing(true)

      // 显示开始同步的提示
      toast({
        title: "开始同步",
        description: "正在同步产品库存数据...",
      })

      const response = await fetch('/api/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_inconsistencies' })
      })

      if (response.ok) {
        const result = await response.json()
        const fixedCount = result.data?.fixResults?.length || 0

        toast({
          title: "库存同步成功",
          description: `已同步 ${fixedCount} 个产品的库存数据`,
        })

        // 触发数据重新加载（如果有onRefresh回调）
        if (typeof window !== 'undefined') {
          // 使用更优雅的方式刷新数据而不是整页刷新
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } else {
        const error = await response.json()
        toast({
          title: "同步失败",
          description: error.error || "库存同步失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('库存同步错误:', error)
      toast({
        title: "同步失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // 批量编辑处理
  const handleBatchEdit = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "请先选择产品",
        description: "请至少选择一个产品进行批量编辑",
        variant: "destructive",
      })
      return
    }
    setShowBatchEditDialog(true)
  }

  // 执行批量编辑
  const executeBatchEdit = async () => {
    if (!batchEditField || !batchEditValue) {
      toast({
        title: "请填写完整信息",
        description: "请选择要编辑的字段并填写新值",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id!))

      for (const product of selectedProductsData) {
        const updatedProduct = {
          ...product,
          [batchEditField]: batchEditField === 'price' ? parseFloat(batchEditValue) : batchEditValue
        }
        await onEditProduct(updatedProduct)
      }

      toast({
        title: "批量编辑成功",
        description: `已更新 ${selectedProducts.length} 个产品的 ${batchEditField}`,
      })

      setShowBatchEditDialog(false)
      setBatchEditField("")
      setBatchEditValue("")
      setSelectedProducts([])
    } catch (error) {
      toast({
        title: "批量编辑失败",
        description: "部分产品更新失败，请重试",
        variant: "destructive",
      })
    }
  }

  // 批量删除处理
  const handleBatchDelete = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "请先选择产品",
        description: "请至少选择一个产品进行删除",
        variant: "destructive",
      })
      return
    }
    setShowBatchDeleteDialog(true)
  }

  // 执行批量删除
  const executeBatchDelete = async () => {
    try {
      for (const productId of selectedProducts) {
        await onDeleteProduct(productId)
      }

      toast({
        title: "批量删除成功",
        description: `已删除 ${selectedProducts.length} 个产品`,
      })

      setShowBatchDeleteDialog(false)
      setSelectedProducts([])
    } catch (error) {
      toast({
        title: "批量删除失败",
        description: "部分产品删除失败，请重试",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            搜索和过滤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索产品名称、条形码或材料..."
                value={filter.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.categoryId?.toString() || "all"}
              onValueChange={(value) => onFilterChange({
                categoryId: value === "all" ? null : parseInt(value)
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="-1">未分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.materialFilter || "all"}
              onValueChange={(value) => onFilterChange({
                materialFilter: value === "all" ? null : value
              })}
              disabled={isMaterialLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isMaterialLoading ? "加载中..." : "选择材质"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部材质</SelectItem>
                {materialOptions.length === 0 && !isMaterialLoading ? (
                  <SelectItem value="none" disabled>暂无材质数据</SelectItem>
                ) : (
                  materialOptions.map(material => (
                    <SelectItem key={material} value={material}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        {material}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select
              value={filter.tagFilter || "all"}
              onValueChange={(value) => onFilterChange({
                tagFilter: value === "all" ? null : value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {productTags.length === 0 ? (
                  <SelectItem value="none" disabled>暂无标签数据</SelectItem>
                ) : (
                  productTags.map(tag => (
                    <SelectItem key={typeof tag === "string" ? tag : tag?.name || tag} value={typeof tag === "string" ? tag : tag?.name || tag}>
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3 h-3 text-green-500" />
                        {typeof tag === "string" ? tag : tag?.name || tag}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-primary text-primary-foreground" : ""}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}
              >
                <LayoutGridIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* 产品列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>产品列表 ({products.length})</CardTitle>
            <div className="flex items-center gap-2">
              {selectedProducts.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchEdit}
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    批量编辑 ({selectedProducts.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchDelete}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    批量删除
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncInventory}
                disabled={isLoading || isSyncing}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '同步中...' : '同步库存'}
              </Button>
              <Button onClick={onAddProduct}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加产品
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p>暂无产品数据</p>
              <Button onClick={onAddProduct} className="mt-4">
                添加第一个产品
              </Button>
            </div>
          ) : (
            <>
              {/* 表格视图 */}
              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>图片</TableHead>
                        <TableHead>产品名称</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>材质</TableHead>
                        <TableHead>单位</TableHead>
                        <TableHead>尺寸</TableHead>
                        <TableHead>价格</TableHead>
                        <TableHead>库存</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id!)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id!, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded cursor-pointer"
                                onClick={() => setPreviewImage(product.imageUrl)}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingField?.id === product.id && editingField.field === "name" ? (
                              <div className="flex items-center gap-2" data-inline-edit-controls>
                                <Input
                                  value={editingField.value as string}
                                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleInputBlur}
                                  className="h-8 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                                <Button size="sm" onClick={handleSaveInlineEdit} className="h-8 px-2">
                                  ✓
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelInlineEdit} className="h-8 px-2">
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                                onDoubleClick={() => handleDoubleClickEdit(product.id!, "name", product.name)}
                                title="双击编辑产品名称"
                              >
                                {product.name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.categoryName || "未分类"}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.material || "-"}</TableCell>
                          <TableCell>{product.unit || "-"}</TableCell>
                          <TableCell>
                            {editingField?.id === product.id && editingField.field === "dimensions" ? (
                              <div className="flex items-center gap-2" data-inline-edit-controls>
                                <Input
                                  value={editingField.value as string}
                                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleInputBlur}
                                  className="h-8 w-32 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 focus:ring-2 focus:ring-green-500"
                                  placeholder="长x宽x高"
                                  autoFocus
                                />
                                <Button size="sm" onClick={handleSaveInlineEdit} className="h-8 px-2">
                                  ✓
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelInlineEdit} className="h-8 px-2">
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded transition-colors border border-transparent hover:border-green-200 dark:hover:border-green-700"
                                onDoubleClick={() => handleDoubleClickEdit(product.id!, "dimensions", product.dimensions || "")}
                                title="双击编辑尺寸"
                              >
                                {product.dimensions || "-"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingField?.id === product.id && editingField.field === "price" ? (
                              <div className="flex items-center gap-2" data-inline-edit-controls>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingField.value as number}
                                  onChange={(e) => setEditingField({ ...editingField, value: parseFloat(e.target.value) || 0 })}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleInputBlur}
                                  className="h-8 w-24 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600 focus:ring-2 focus:ring-yellow-500"
                                  autoFocus
                                />
                                <Button size="sm" onClick={handleSaveInlineEdit} className="h-8 px-2">
                                  ✓
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelInlineEdit} className="h-8 px-2">
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 p-2 rounded transition-colors border border-transparent hover:border-yellow-200 dark:hover:border-yellow-700 font-medium"
                                onDoubleClick={() => handleDoubleClickEdit(product.id!, "price", product.price)}
                                title="双击编辑价格"
                              >
                                {formatPrice(product.price)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingField?.id === product.id && editingField.field === "inventory" ? (
                              <div className="flex items-center gap-2" data-inline-edit-controls>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingField.value as number}
                                  onChange={(e) => setEditingField({ ...editingField, value: parseInt(e.target.value) || 0 })}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleInputBlur}
                                  className="h-8 w-20 bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 focus:ring-2 focus:ring-purple-500"
                                  autoFocus
                                />
                                <Button size="sm" onClick={handleSaveInlineEdit} className="h-8 px-2">
                                  ✓
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelInlineEdit} className="h-8 px-2">
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2 rounded transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-700"
                                onDoubleClick={() => handleDoubleClickEdit(product.id!, "inventory", product.inventory || 0)}
                                title="双击编辑库存"
                              >
                                {(() => {
                                  const status = getInventoryStatus(product.inventory)
                                  return (
                                    <Badge variant={status.color === "green" ? "default" : status.color === "yellow" ? "secondary" : "destructive"}>
                                      {product.inventory ?? 0} ({status.text})
                                    </Badge>
                                  )
                                })()}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                  <EditIcon className="h-4 w-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDeleteProduct(product.id!)}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* 网格视图 */}
              {viewMode === "grid" && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => (
                      <div key={product.id} className="border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="relative">
                          <div
                            className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer max-h-[200px]"
                            onClick={() => {
                              if (product.imageUrl) {
                                setPreviewImage(product.imageUrl)
                              }
                            }}
                          >
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            )}
                          </div>
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id!)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id!, !!checked)}
                              className="bg-white"
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                  <EditIcon className="h-4 w-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDeleteProduct(product.id!)}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">{product.categoryName || "未分类"}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-primary">{formatPrice(product.price)}</span>
                            <Badge variant="outline" className="text-xs">
                              {product.material || "未知"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span className="text-gray-500">库存: {product.inventory ?? 0}</span>
                            <span className="text-gray-500">{product.unit || "未知单位"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 列表视图 */}
              {viewMode === "list" && (
                <div className="p-4">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {products.map(product => (
                      <div key={product.id} className="flex items-center border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 mr-3">
                          <Checkbox
                            checked={selectedProducts.includes(product.id!)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id!, !!checked)}
                          />
                        </div>
                        <div className="flex-shrink-0 mr-4">
                          <div
                            className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer"
                            onClick={() => {
                              if (product.imageUrl) {
                                setPreviewImage(product.imageUrl)
                              }
                            }}
                          >
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-grow min-w-0 mr-4">
                              <h3 className="font-medium truncate">{product.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {product.categoryName || "未分类"}
                                </Badge>
                                <span className="text-xs text-gray-500">{product.material || "未知材料"}</span>
                                <span className="text-xs text-gray-500">{product.unit || "未知单位"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="font-medium text-primary">{formatPrice(product.price)}</div>
                                <div className="text-xs text-gray-500">库存: {product.inventory ?? 0}</div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {product.dimensions || "未设置尺寸"}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                    <EditIcon className="h-4 w-4 mr-2" />
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDeleteProduct(product.id!)}
                                    className="text-red-600"
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 图片预览对话框 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-4xl p-4">
            <img
              src={previewImage}
              alt="预览"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 批量编辑对话框 */}
      <Dialog open={showBatchEditDialog} onOpenChange={setShowBatchEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量编辑产品 ({selectedProducts.length} 个)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchField">编辑字段</Label>
              <Select value={batchEditField} onValueChange={setBatchEditField}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要编辑的字段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">价格</SelectItem>
                  <SelectItem value="material">材质</SelectItem>
                  <SelectItem value="unit">单位</SelectItem>
                  <SelectItem value="dimensions">尺寸</SelectItem>
                  <SelectItem value="inventory">库存</SelectItem>
                  <SelectItem value="categoryId">分类</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchValue">新值</Label>
              {batchEditField === 'categoryId' ? (
                <Select value={batchEditValue} onValueChange={setBatchEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">未分类</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="batchValue"
                  value={batchEditValue}
                  onChange={(e) => setBatchEditValue(e.target.value)}
                  placeholder={
                    batchEditField === 'price' ? '输入价格' :
                    batchEditField === 'material' ? '输入材质' :
                    batchEditField === 'unit' ? '输入单位' :
                    batchEditField === 'dimensions' ? '输入尺寸（如：长x宽x高）' :
                    batchEditField === 'inventory' ? '输入库存数量' : '输入新值'
                  }
                  type={batchEditField === 'price' || batchEditField === 'inventory' ? 'number' : 'text'}
                  min={batchEditField === 'price' || batchEditField === 'inventory' ? '0' : undefined}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchEditDialog(false)}>
              取消
            </Button>
            <Button onClick={executeBatchEdit}>
              确认编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认批量删除产品</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              确定要删除选中的 <span className="font-semibold text-red-600">{selectedProducts.length}</span> 个产品吗？
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">删除说明：</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• <span className="font-medium">保留</span>：订单、销售、采购、生产等业务记录</li>
                <li>• <span className="font-medium">删除</span>：产品基础信息、库存记录、标签关联</li>
                <li>• 业务记录中的产品引用将标记为"已删除产品"</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">建议：</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                删除前请确保已备份重要的产品信息，删除后无法恢复产品详情。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={executeBatchDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
