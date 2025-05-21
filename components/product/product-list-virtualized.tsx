"use client"

import { useState, useEffect, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Product, ProductCategory, ProductFilter } from "@/types/product"
import {
  PackageIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
} from "lucide-react"

interface ProductListVirtualizedProps {
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

export function ProductListVirtualized({
  products,
  categories,
  filter,
  onFilterChange,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSelectionChange,
  isLoading = false
}: ProductListVirtualizedProps) {
  const isMobile = useIsMobile()
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // 虚拟滚动相关
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: isLoading ? 0 : products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 估计每行高度
    overscan: 5,
  })
  
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
  const handleSelectProduct = (id: number, checked: boolean) => {
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
  }
  
  // 处理排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 切换排序方向
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      // 设置新的排序字段
      setSortField(field)
      setSortDirection("asc")
    }
  }
  
  // 排序产品
  const sortedProducts = [...products].sort((a, b) => {
    let valueA: any = a[sortField as keyof Product]
    let valueB: any = b[sortField as keyof Product]
    
    // 处理null或undefined值
    if (valueA === null || valueA === undefined) valueA = ""
    if (valueB === null || valueB === undefined) valueB = ""
    
    // 数字类型比较
    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA
    }
    
    // 字符串类型比较
    return sortDirection === "asc" 
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA))
  })
  
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            产品列表
          </CardTitle>
          <Button onClick={onAddProduct} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            添加产品
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索产品..."
              className="pl-8"
              value={filter.searchQuery || ""}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filter.categoryFilter || "all"}
              onValueChange={(value) => onFilterChange({ categoryFilter: value === "all" ? null : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                <SelectItem value="uncategorized">未分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ArrowUpDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>排序方式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort("name")}>
                  按名称{sortField === "name" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("price")}>
                  按价格{sortField === "price" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("category")}>
                  按分类{sortField === "category" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("material")}>
                  按材质{sortField === "material" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("unit")}>
                  按单位{sortField === "unit" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[40px_40px_2fr_1fr_1fr_1fr_1fr_1fr_1fr_80px] bg-muted p-3 text-sm font-medium">
            <div>
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
            <div></div>
            <div>产品名称</div>
            <div>尺寸</div>
            <div>分类</div>
            <div>材质</div>
            <div>单位</div>
            <div className="text-right">价格</div>
            <div className="text-right">库存</div>
            <div className="text-right">操作</div>
          </div>
          
          <div 
            ref={parentRef} 
            className="h-[600px] overflow-auto"
            style={{
              width: '100%',
              height: `600px`,
              overflow: 'auto',
            }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const product = sortedProducts[virtualRow.index]
                return (
                  <div
                    key={virtualRow.index}
                    className={`grid grid-cols-[40px_40px_2fr_1fr_1fr_1fr_1fr_1fr_1fr_80px] p-3 text-sm ${
                      virtualRow.index % 2 ? 'bg-muted/50' : ''
                    } border-b last:border-b-0`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedProducts.includes(product.id!)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id!, !!checked)}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      {product.imageUrl ? (
                        <div className="h-8 w-8 rounded-md overflow-hidden">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="font-medium">{product.name}</div>
                      {product.barcode && (
                        <div className="text-xs text-muted-foreground">
                          {product.barcode}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {product.dimensions ? (
                        <span>{product.dimensions}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {product.category ? (
                        <Badge variant="outline">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">未分类</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {product.material ? (
                        <span>{product.material}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {product.unit ? (
                        <span>{product.unit}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="font-medium">¥{(product.price || 0).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="font-medium">{product.inventory || 0}</div>
                    </div>
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditProduct(product)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteProduct(product)}>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          共 {products.length} 个产品
          {selectedProducts.length > 0 && `, 已选择 ${selectedProducts.length} 个`}
        </div>
      </CardFooter>
    </Card>
  )
}
