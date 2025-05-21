"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet"
import { ProductCardMobile } from "@/components/product/product-card-mobile"
import { Product, ProductCategory } from "@/types/product"
import {
  PackageIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  CheckIcon,
  XIcon,
  ArrowUpDownIcon,
  RefreshCwIcon
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface ProductListMobileProps {
  products: Product[]
  categories: ProductCategory[]
  filter: {
    searchQuery: string
    categoryFilter: string | null
  }
  onFilterChange: (filter: { searchQuery: string; categoryFilter: string | null }) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
  onSelectionChange: (selectedIds: number[]) => void
  isLoading?: boolean
}

export function ProductListMobile({
  products,
  categories,
  filter,
  onFilterChange,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSelectionChange,
  isLoading = false
}: ProductListMobileProps) {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(filter.categoryFilter)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [sortOption, setSortOption] = useState<string>("default")
  const [showInStock, setShowInStock] = useState<boolean>(true)

  // 防抖搜索查询
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // 当防抖搜索查询变化时更新过滤器
  useEffect(() => {
    onFilterChange({
      searchQuery: debouncedSearchQuery,
      categoryFilter
    })
  }, [debouncedSearchQuery, categoryFilter, onFilterChange])

  // 处理产品选择
  const handleProductSelect = (product: Product, selected: boolean) => {
    setSelectedProductIds(prev => {
      const newSelectedIds = selected
        ? [...prev, product.id!]
        : prev.filter(id => id !== product.id)

      // 通知父组件选择变化
      onSelectionChange(newSelectedIds)

      return newSelectedIds
    })
  }

  // 处理全选/取消全选
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredProducts.map(p => p.id!)
      setSelectedProductIds(allIds)
      onSelectionChange(allIds)
    } else {
      setSelectedProductIds([])
      onSelectionChange([])
    }
  }

  // 应用过滤器
  const handleApplyFilter = () => {
    onFilterChange({
      searchQuery,
      categoryFilter
    })
    setIsFilterSheetOpen(false)
  }

  // 重置过滤器
  const handleResetFilter = () => {
    setSearchQuery("")
    setCategoryFilter(null)
    setSortOption("default")
    setShowInStock(true)

    onFilterChange({
      searchQuery: "",
      categoryFilter: null
    })

    setIsFilterSheetOpen(false)
  }

  // 排序和过滤产品
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 应用分类过滤
    if (categoryFilter) {
      const categoryId = parseInt(categoryFilter)
      result = result.filter(p => p.categoryId === categoryId)
    }

    // 应用库存过滤
    if (showInStock) {
      result = result.filter(p => p.inventory === undefined || p.inventory === null || p.inventory > 0)
    }

    // 应用排序
    switch (sortOption) {
      case "priceAsc":
        result.sort((a, b) => a.price - b.price)
        break
      case "priceDesc":
        result.sort((a, b) => b.price - a.price)
        break
      case "nameAsc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "nameDesc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "inventoryAsc":
        result.sort((a, b) => {
          const aInventory = a.inventory ?? 0
          const bInventory = b.inventory ?? 0
          return aInventory - bInventory
        })
        break
      case "inventoryDesc":
        result.sort((a, b) => {
          const aInventory = a.inventory ?? 0
          const bInventory = b.inventory ?? 0
          return bInventory - aInventory
        })
        break
      default:
        // 默认排序（ID升序）
        result.sort((a, b) => (a.id || 0) - (b.id || 0))
    }

    return result
  }, [products, categoryFilter, sortOption, showInStock])

  // 全选状态
  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索产品..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <FilterIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>筛选与排序</SheetTitle>
              <SheetDescription>
                设置产品列表的筛选条件和排序方式
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={categoryFilter || ""}
                  onValueChange={(value) => setCategoryFilter(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="所有分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">所有分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name} ({category.productCount || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>排序方式</Label>
                <Select
                  value={sortOption}
                  onValueChange={setSortOption}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="默认排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认排序</SelectItem>
                    <SelectItem value="priceAsc">价格从低到高</SelectItem>
                    <SelectItem value="priceDesc">价格从高到低</SelectItem>
                    <SelectItem value="nameAsc">名称 A-Z</SelectItem>
                    <SelectItem value="nameDesc">名称 Z-A</SelectItem>
                    <SelectItem value="inventoryAsc">库存从低到高</SelectItem>
                    <SelectItem value="inventoryDesc">库存从高到低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-in-stock"
                  checked={showInStock}
                  onCheckedChange={(checked) => setShowInStock(!!checked)}
                />
                <Label htmlFor="show-in-stock">只显示有库存产品</Label>
              </div>
            </div>

            <SheetFooter className="flex-row gap-2 sm:space-x-0">
              <Button variant="outline" className="flex-1" onClick={handleResetFilter}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Button className="flex-1" onClick={handleApplyFilter}>
                <CheckIcon className="h-4 w-4 mr-2" />
                应用
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Button variant="default" size="icon" className="flex-shrink-0" onClick={onAddProduct}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* 选择工具栏 */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm">
              {selectedProductIds.length > 0
                ? `已选择 ${selectedProductIds.length} 个产品`
                : "全选"}
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            共 {filteredProducts.length} 个产品
          </div>
        </div>
      )}

      {/* 产品列表 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCwIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <PackageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-lg font-medium">暂无产品</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || categoryFilter
              ? "没有符合条件的产品，请尝试调整筛选条件"
              : "点击「添加产品」按钮创建第一个产品"}
          </p>
          <Button className="mt-4" onClick={onAddProduct}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加产品
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map((product) => (
            <ProductCardMobile
              key={product.id}
              product={product}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              onSelect={handleProductSelect}
              isSelected={selectedProductIds.includes(product.id!)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
