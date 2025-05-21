"use client"

import { useState, useRef, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

import { LazyImage } from "@/components/ui/lazy-image"
import { SmartSearch } from "@/components/ui/smart-search"
import { KeyboardShortcutsDialog, registerHelpShortcut } from "@/components/keyboard-shortcuts-dialog"
import { registerShortcut, unregisterShortcut } from "@/lib/keyboard-shortcuts"
import { usePerformanceMonitor } from "@/components/monitoring/performance-monitor"
import { fuzzySearch } from "@/lib/fuzzy-search"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { ProductImagePreview } from "@/components/product/product-image-preview"
import { BatchEditDialog } from "@/components/product/batch-edit-dialog"
import { InventoryHistoryDialog } from "@/components/inventory/inventory-history-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  ImageIcon,
  CheckIcon,
  XIcon,
  PackageIcon,
  LayoutGridIcon,
  ListIcon,
  LayoutListIcon,
  X,
  ClockIcon,
  HistoryIcon
} from "lucide-react"
import { Product, ProductCategory, ProductFilter } from "@/types/product"

interface ProductListProps {
  products: Product[]
  categories: ProductCategory[]
  filter: ProductFilter
  onFilterChange: (filter: Partial<ProductFilter>) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
  onSelectionChange?: (selectedIds: number[]) => void
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
  isLoading = false
}: ProductListProps) {
  const isMobile = useIsMobile()
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewProductId, setPreviewProductId] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<{ id: number, field: string, value: string | number } | null>(null)
  const [batchEditing, setBatchEditing] = useState<{ field: string, value: string | number } | null>(null)
  const [historyProductId, setHistoryProductId] = useState<number | null>(null)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)
  const { measurePerformance } = usePerformanceMonitor('ProductList')

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    const ids = checked ? products.map(p => p.id!).filter(Boolean) : [];
    setSelectedProducts(ids);

    // 通知父组件选择变化
    if (onSelectionChange) {
      onSelectionChange(ids);
    }
  }

  // 处理单个选择
  const handleSelectProduct = measurePerformance('selectProduct', (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, id])
    } else {
      setSelectedProducts(prev => prev.filter(productId => productId !== id))
    }

    // 通知父组件选择变化
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedProducts, id]);
      } else {
        onSelectionChange(selectedProducts.filter(productId => productId !== id));
      }
    }
  })

  // 批量操作处理函数
  const handleBatchAction = measurePerformance('batchAction', (action: string) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "请先选择产品",
        description: "请至少选择一个产品进行批量操作",
        variant: "destructive",
      });
      return;
    }

    if (action === "edit") {
      // 打开批量编辑对话框
      setBatchEditing({ field: "", value: "" });
    } else {
      console.log(`执行批量操作: ${action}`, selectedProducts);
      // 这里可以实现其他批量操作的逻辑
    }
  })

  // 处理批量编辑
  const handleBatchEdit = measurePerformance('batchEdit', async (field: string, value: any, reason: string) => {
    if (selectedProducts.length === 0) return;

    // 获取选中的产品
    const productsToUpdate = products.filter(p => selectedProducts.includes(p.id!));

    // 批量更新产品
    for (const product of productsToUpdate) {
      const updatedProduct = { ...product };

      // 设置新值
      (updatedProduct as any)[field] = value;

      // 调用编辑函数
      await onEditProduct(updatedProduct);
    }

    // 重置批量编辑状态
    setBatchEditing(null);
  })

  // 导出处理函数
  const handleExport = measurePerformance('export', (format: string) => {
    console.log(`导出为 ${format}`)
    // 这里可以实现导出逻辑

    toast({
      title: "导出中",
      description: `正在导出为 ${format} 格式...`,
    })
  })

  // 处理双击编辑
  const handleDoubleClick = measurePerformance('doubleClickEdit', (product: Product, field: string) => {
    if (field === 'name' || field === 'inventory' || field === 'price') {
      setEditingField({
        id: product.id!,
        field,
        value: field === 'name'
          ? product.name
          : field === 'inventory'
            ? (product.inventory || 0)
            : (product.price || 0)
      });
    }
  })

  // 处理编辑字段值变化
  const handleEditChange = (value: string) => {
    if (editingField) {
      // 对于inventory和price，确保值是有效的数字
      let newValue: string | number = value;

      if (editingField.field === 'inventory' || editingField.field === 'price') {
        // 允许空字符串，但会转换为0
        if (value === '') {
          newValue = 0;
        } else {
          // 尝试转换为数字，如果无效则使用原值
          const num = Number(value);
          newValue = isNaN(num) ? editingField.value : num;
        }
      }

      setEditingField({
        ...editingField,
        value: newValue
      });
    }
  }

  // 处理编辑完成
  const handleEditComplete = measurePerformance('editComplete', async () => {
    if (!editingField) return;

    try {
      const product = products.find(p => p.id === editingField.id);
      if (!product) return;

      const updatedProduct = { ...product };

      if (editingField.field === 'name') {
        updatedProduct.name = editingField.value as string;
      } else if (editingField.field === 'inventory') {
        updatedProduct.inventory = editingField.value as number;
      } else if (editingField.field === 'price') {
        updatedProduct.price = editingField.value as number;
      }

      // 调用编辑函数
      await onEditProduct(updatedProduct);

      toast({
        title: "更新成功",
        description: `产品${
          editingField.field === 'name' ? '名称' :
          editingField.field === 'inventory' ? '库存' : '价格'
        }已更新`,
      });
    } catch (error) {
      console.error("更新失败:", error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新产品失败",
        variant: "destructive",
      });
    } finally {
      setEditingField(null);
    }
  })

  // 注册键盘快捷键
  useEffect(() => {
    // 注册帮助快捷键
    const cleanupHelp = registerHelpShortcut(setShowShortcutsDialog);

    // 注册产品列表特定的快捷键
    const shortcutIds = [
      // 添加产品快捷键
      registerShortcut({
        key: 'n',
        alt: true,
        description: '添加新产品',
        group: '产品管理',
        handler: () => onAddProduct()
      }),

      // 批量编辑快捷键
      registerShortcut({
        key: 'e',
        alt: true,
        description: '批量编辑选中产品',
        group: '产品管理',
        handler: () => handleBatchAction('edit')
      }),

      // 视图切换快捷键
      registerShortcut({
        key: '1',
        alt: true,
        description: '切换到表格视图',
        group: '产品管理',
        handler: () => setViewMode('table')
      }),

      registerShortcut({
        key: '2',
        alt: true,
        description: '切换到网格视图',
        group: '产品管理',
        handler: () => setViewMode('grid')
      }),

      registerShortcut({
        key: '3',
        alt: true,
        description: '切换到列表视图',
        group: '产品管理',
        handler: () => setViewMode('list')
      }),

      // 搜索快捷键
      registerShortcut({
        key: '/',
        description: '搜索产品',
        group: '产品管理',
        handler: () => {
          const searchInput = document.querySelector('input[placeholder*="搜索产品"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      })
    ];

    // 清理函数
    return () => {
      cleanupHelp();
      shortcutIds.forEach(id => unregisterShortcut(id));
    };
  }, [onAddProduct]);

  return (
    <div className="space-y-4">
      {/* 产品筛选和搜索 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SmartSearch
              placeholder="搜索产品名称、描述、材质..."
              onSearch={(query, filters) => {
                onFilterChange({ searchQuery: query });

                // 处理其他过滤器
                const categoryFilter = filters.find(f => f.type === 'category' && f.active);
                if (categoryFilter) {
                  const categoryId = categories.find(c => c.name === categoryFilter.value)?.id;
                  if (categoryId) {
                    onFilterChange({ categoryId });
                  }
                }

                const materialFilter = filters.find(f => f.type === 'tag' && f.active);
                if (materialFilter) {
                  onFilterChange({ materialFilter: materialFilter.value });
                }
              }}
              suggestions={[
                // 分类建议
                ...categories.map(category => ({
                  id: `category-${category.id}`,
                  text: category.name,
                  type: 'category' as const,
                  category: '分类'
                })),

                // 材质建议
                ...Array.from(new Set(products.map(p => p.material).filter(Boolean))).map((material, index) => ({
                  id: `material-${index}`,
                  text: material,
                  type: 'tag' as const,
                  category: '材质'
                })),

                // 热门搜索建议
                { id: 'popular-1', text: '库存不足', type: 'popular' as const },
                { id: 'popular-2', text: '新产品', type: 'popular' as const },
                { id: 'popular-3', text: '促销', type: 'popular' as const },
              ]}
              filters={[
                // 分类过滤器
                ...categories.map(category => ({
                  id: `category-${category.id}`,
                  name: '分类',
                  value: category.name,
                  type: 'category' as const,
                  active: filter.categoryId === category.id
                })),

                // 材质过滤器
                ...Array.from(new Set(products.map(p => p.material).filter(Boolean))).map((material, index) => ({
                  id: `material-${index}`,
                  name: '材质',
                  value: material,
                  type: 'tag' as const,
                  active: filter.materialFilter === material
                })),

                // 库存状态过滤器
                {
                  id: 'inventory-in-stock',
                  name: '库存状态',
                  value: '有库存',
                  type: 'boolean' as const,
                  active: false
                },
                {
                  id: 'inventory-out-of-stock',
                  name: '库存状态',
                  value: '无库存',
                  type: 'boolean' as const,
                  active: false
                },
              ]}
              showFilterBadges={true}
              showSuggestions={true}
              showHistory={true}
              className="w-full"
            />

            <Select
              value={filter.categoryId ? filter.categoryId.toString() : "all"}
              onValueChange={(value) => onFilterChange({ categoryId: value === "all" ? null : value === "uncategorized" ? -1 : parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                <SelectItem value="uncategorized">未分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.materialFilter || "all"}
              onValueChange={(value) => onFilterChange({ materialFilter: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择材质" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有材质</SelectItem>
                {Array.from(new Set(products.map(p => p.material).filter(Boolean))).map((material, index) => (
                  <SelectItem key={index} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.statusFilter}
              onValueChange={(value) => onFilterChange({ statusFilter: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">上架</SelectItem>
                <SelectItem value="inactive">下架</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 产品列表 */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle>产品列表</CardTitle>
            <div className="flex items-center gap-2">
              {/* 视图模式切换 */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode("table")}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutListIcon className="h-4 w-4" />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    批量操作
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBatchAction("edit")}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    批量编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBatchAction("activate")}>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    批量上架
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBatchAction("deactivate")}>
                    <XIcon className="h-4 w-4 mr-2" />
                    批量下架
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBatchAction("delete")}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    批量删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    导出为CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    导出为Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={onAddProduct}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加产品
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <PackageIcon className="h-8 w-8 mb-2" />
              <p>没有找到产品</p>
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
                        <TableHead className="w-12"></TableHead>
                        <TableHead>产品名称</TableHead>
                        <TableHead>尺寸</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>材质</TableHead>
                        <TableHead>单位</TableHead>
                        <TableHead className="text-right">价格</TableHead>
                        <TableHead className="text-right">库存</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id!)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id!, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div
                              className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer"
                              onClick={() => {
                                if (product.imageUrl) {
                                  setPreviewImage(product.imageUrl);
                                  setPreviewProductId(product.id!);
                                }
                              }}
                            >
                              <LazyImage
                                src={product.imageUrl || ""}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                                fallbackIcon={<ImageIcon className="h-5 w-5 text-gray-400" />}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingField?.id === product.id && editingField?.field === 'name' ? (
                              <div className="flex items-center">
                                <Input
                                  value={editingField.value as string}
                                  onChange={(e) => handleEditChange(e.target.value)}
                                  onBlur={handleEditComplete}
                                  onKeyDown={(e) => e.key === 'Enter' && handleEditComplete()}
                                  autoFocus
                                  className="h-8"
                                />
                              </div>
                            ) : (
                              <div
                                className="font-medium cursor-pointer hover:text-primary"
                                onDoubleClick={() => handleDoubleClick(product, 'name')}
                              >
                                {product.name}
                              </div>
                            )}
                            {product.barcode && (
                              <div className="text-xs text-muted-foreground">
                                {product.barcode}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.dimensions ? (
                              <span>{product.dimensions}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.categoryId ? (
                              <Badge variant="outline">
                                {categories.find(c => c.id === product.categoryId)?.name || '未知分类'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">未分类</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.material ? (
                              <span>{product.material}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.unit ? (
                              <span>{product.unit}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingField?.id === product.id && editingField?.field === 'price' ? (
                              <div className="flex items-center justify-end">
                                <Input
                                  type="number"
                                  value={editingField.value as number}
                                  onChange={(e) => handleEditChange(e.target.value)}
                                  onBlur={handleEditComplete}
                                  onKeyDown={(e) => e.key === 'Enter' && handleEditComplete()}
                                  autoFocus
                                  className="h-8 w-24 text-right"
                                  min={0}
                                  step={0.01}
                                />
                              </div>
                            ) : (
                              <div
                                className="font-medium cursor-pointer hover:text-primary"
                                onDoubleClick={() => handleDoubleClick(product, 'price')}
                              >
                                ¥{(product.price || 0).toFixed(2)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingField?.id === product.id && editingField?.field === 'inventory' ? (
                              <div className="flex items-center justify-end">
                                <Input
                                  type="number"
                                  value={editingField.value as number}
                                  onChange={(e) => handleEditChange(e.target.value)}
                                  onBlur={handleEditComplete}
                                  onKeyDown={(e) => e.key === 'Enter' && handleEditComplete()}
                                  autoFocus
                                  className="h-8 w-20 text-right"
                                  min={0}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <div
                                  className="font-medium cursor-pointer hover:text-primary"
                                  onDoubleClick={() => handleDoubleClick(product, 'inventory')}
                                >
                                  {product.inventory || 0}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setHistoryProductId(product.id)}
                                >
                                  <ClockIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onEditProduct(product)}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>编辑</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDeleteProduct(product)}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>删除</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                                setPreviewImage(product.imageUrl);
                                setPreviewProductId(product.id!);
                              }
                            }}
                          >
                            <LazyImage
                              src={product.imageUrl || ""}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                              fallbackIcon={<ImageIcon className="h-12 w-12 text-gray-400" />}
                            />
                          </div>
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={selectedProducts.includes(product.id!)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id!, !!checked)}
                            />
                          </div>
                        </div>
                        <div className="p-3">
                          <div
                            className="font-medium truncate cursor-pointer hover:text-primary"
                            onDoubleClick={() => handleDoubleClick(product, 'name')}
                          >
                            {product.name}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm text-muted-foreground">
                              {product.dimensions || "-"}
                            </div>
                            <div
                              className="font-medium text-sm cursor-pointer hover:text-primary"
                              onDoubleClick={() => handleDoubleClick(product, 'price')}
                            >
                              ¥{(product.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm">
                              {product.material ? (
                                <Badge variant="outline" className="text-xs">{product.material}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">无材质</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                                onDoubleClick={() => handleDoubleClick(product, 'inventory')}
                              >
                                库存: {product.inventory || 0}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                                onClick={() => setHistoryProductId(product.id)}
                              >
                                <ClockIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-end gap-1 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditProduct(product)}
                            >
                              <PencilIcon className="h-3.5 w-3.5 mr-1" />
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteProduct(product)}
                            >
                              <TrashIcon className="h-3.5 w-3.5 mr-1" />
                              删除
                            </Button>
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
                                setPreviewImage(product.imageUrl);
                                setPreviewProductId(product.id!);
                              }
                            }}
                          >
                            <LazyImage
                              src={product.imageUrl || ""}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                              fallbackIcon={<ImageIcon className="h-6 w-6 text-gray-400" />}
                            />
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <div
                              className="font-medium truncate cursor-pointer hover:text-primary"
                              onDoubleClick={() => handleDoubleClick(product, 'name')}
                            >
                              {product.name}
                            </div>
                            <div
                              className="font-medium cursor-pointer hover:text-primary"
                              onDoubleClick={() => handleDoubleClick(product, 'price')}
                            >
                              ¥{(product.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-2">
                              {product.dimensions && (
                                <span>{product.dimensions}</span>
                              )}
                              {product.material && (
                                <Badge variant="outline" className="text-xs">{product.material}</Badge>
                              )}
                              {product.unit && (
                                <span>单位: {product.unit}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <span
                                  className="cursor-pointer hover:text-primary"
                                  onDoubleClick={() => handleDoubleClick(product, 'inventory')}
                                >
                                  库存: {product.inventory || 0}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 p-0"
                                  onClick={() => setHistoryProductId(product.id)}
                                >
                                  <ClockIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditProduct(product)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteProduct(product)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
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
        <CardFooter className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            共 {products.length} 个产品
          </div>
          {/* 分页控件可以在这里添加 */}
        </CardFooter>
      </Card>

      {/* 增强版图片预览对话框 */}
      <ProductImagePreview
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
        initialImageUrl={previewImage}
        product={previewProductId ? products.find(p => p.id === previewProductId) || null : null}
        products={products}
      />

      {/* 批量编辑对话框 */}
      <BatchEditDialog
        open={!!batchEditing}
        onOpenChange={(open) => !open && setBatchEditing(null)}
        selectedProductIds={selectedProducts}
        onBatchEdit={handleBatchEdit}
        categories={categories}
      />

      {/* 库存历史对话框 */}
      <InventoryHistoryDialog
        open={!!historyProductId}
        onOpenChange={(open) => !open && setHistoryProductId(null)}
        productId={historyProductId}
        productName={historyProductId ? products.find(p => p.id === historyProductId)?.name : undefined}
      />

      {/* 键盘快捷键帮助对话框 */}
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />
    </div>
  )
}
