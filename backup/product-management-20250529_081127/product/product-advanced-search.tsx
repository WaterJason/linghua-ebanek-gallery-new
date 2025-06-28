"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductCategory } from "@/types/product"
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  CheckIcon,
  RefreshCwIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from "lucide-react"
import { useResponsive } from "@/hooks/use-responsive"

// 搜索条件类型
export interface AdvancedSearchFilter {
  searchQuery: string
  categoryId: string | null
  priceRange: [number, number] | null
  inventoryStatus: "all" | "inStock" | "outOfStock" | "lowStock"
  sortBy: "default" | "priceAsc" | "priceDesc" | "nameAsc" | "nameDesc" | "inventoryAsc" | "inventoryDesc"
  materials: string[]
  hasImage: boolean | null
}

// 默认搜索条件
export const defaultSearchFilter: AdvancedSearchFilter = {
  searchQuery: "",
  categoryId: null,
  priceRange: null,
  inventoryStatus: "all",
  sortBy: "default",
  materials: [],
  hasImage: null
}

interface ProductAdvancedSearchProps {
  categories: ProductCategory[]
  materials: string[]
  filter: AdvancedSearchFilter
  onFilterChange: (filter: AdvancedSearchFilter) => void
  maxPrice?: number
  activeFilterCount?: number
}

export function ProductAdvancedSearch({
  categories,
  materials,
  filter,
  onFilterChange,
  maxPrice = 10000,
  activeFilterCount = 0
}: ProductAdvancedSearchProps) {
  const { isMobile } = useResponsive()
  const [isOpen, setIsOpen] = useState(false)
  const [localFilter, setLocalFilter] = useState<AdvancedSearchFilter>(filter)
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filter.priceRange || [0, maxPrice]
  )

  // 当外部过滤器变化时更新本地状态
  useEffect(() => {
    setLocalFilter(filter)
    setPriceRange(filter.priceRange || [0, maxPrice])
  }, [filter, maxPrice])

  // 处理搜索查询变化
  const handleSearchQueryChange = (value: string) => {
    setLocalFilter(prev => ({ ...prev, searchQuery: value }))
  }

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setLocalFilter(prev => ({ ...prev, categoryId: value === "all" ? null : value }))
  }

  // 处理价格范围变化
  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value)

    // 如果价格范围是默认的最小值到最大值，则设置为null
    const isDefaultRange = value[0] === 0 && value[1] === maxPrice
    setLocalFilter(prev => ({
      ...prev,
      priceRange: isDefaultRange ? null : value
    }))
  }

  // 处理库存状态变化
  const handleInventoryStatusChange = (value: AdvancedSearchFilter["inventoryStatus"]) => {
    setLocalFilter(prev => ({ ...prev, inventoryStatus: value }))
  }

  // 处理排序方式变化
  const handleSortByChange = (value: AdvancedSearchFilter["sortBy"]) => {
    setLocalFilter(prev => ({ ...prev, sortBy: value }))
  }

  // 处理材质变化
  const handleMaterialChange = (material: string, checked: boolean) => {
    setLocalFilter(prev => ({
      ...prev,
      materials: checked
        ? [...prev.materials, material]
        : prev.materials.filter(m => m !== material)
    }))
  }

  // 处理图片状态变化
  const handleHasImageChange = (value: boolean | null) => {
    setLocalFilter(prev => ({ ...prev, hasImage: value }))
  }

  // 应用过滤器
  const handleApplyFilter = () => {
    onFilterChange(localFilter)
    setIsOpen(false)
  }

  // 重置过滤器
  const handleResetFilter = () => {
    setLocalFilter(defaultSearchFilter)
    setPriceRange([0, maxPrice])
  }

  // 计算活跃过滤器数量
  const getActiveFilterCount = () => {
    let count = 0

    if (filter.searchQuery) count++
    if (filter.categoryId) count++
    if (filter.priceRange) count++
    if (filter.inventoryStatus !== "all") count++
    if (filter.materials.length > 0) count++
    if (filter.hasImage !== null) count++
    if (filter.sortBy !== "default") count++

    return count
  }

  // 移动端使用Sheet，桌面端使用Popover
  if (isMobile) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索产品..."
              className="pl-8"
              value={filter.searchQuery}
              onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            />
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0 relative"
              onClick={() => setIsOpen(true)}
            >
              <FilterIcon className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>高级搜索</SheetTitle>
                <SheetDescription>
                  设置多个条件精确筛选产品
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <Label>关键词</Label>
                  <Input
                    placeholder="输入产品名称、描述等"
                    value={localFilter.searchQuery}
                    onChange={(e) => handleSearchQueryChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>分类</Label>
                  <Select
                    value={localFilter.categoryId || "all"}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="所有分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name} ({category.productCount || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>价格范围</Label>
                  <div className="pt-4 px-2">
                    <Slider
                      value={priceRange}
                      min={0}
                      max={maxPrice}
                      step={10}
                      onValueChange={handlePriceRangeChange}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">¥{priceRange[0]}</span>
                      <span className="text-sm">¥{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>库存状态</Label>
                  <RadioGroup
                    value={localFilter.inventoryStatus}
                    onValueChange={handleInventoryStatusChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">所有产品</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inStock" id="inStock" />
                      <Label htmlFor="inStock">有库存</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lowStock" id="lowStock" />
                      <Label htmlFor="lowStock">库存不足 (≤5)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outOfStock" id="outOfStock" />
                      <Label htmlFor="outOfStock">无库存</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>材质</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {materials.map((material) => (
                      <div key={material} className="flex items-center space-x-2">
                        <Checkbox
                          id={`material-${material}`}
                          checked={localFilter.materials.includes(material)}
                          onCheckedChange={(checked) =>
                            handleMaterialChange(material, !!checked)
                          }
                        />
                        <Label htmlFor={`material-${material}`}>{material}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>图片</Label>
                  <RadioGroup
                    value={localFilter.hasImage === null
                      ? "all"
                      : localFilter.hasImage
                        ? "hasImage"
                        : "noImage"
                    }
                    onValueChange={(value) => {
                      if (value === "all") handleHasImageChange(null)
                      else if (value === "hasImage") handleHasImageChange(true)
                      else handleHasImageChange(false)
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="imageAll" />
                      <Label htmlFor="imageAll">所有产品</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hasImage" id="hasImage" />
                      <Label htmlFor="hasImage">有图片</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="noImage" id="noImage" />
                      <Label htmlFor="noImage">无图片</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>排序方式</Label>
                  <Select
                    value={localFilter.sortBy}
                    onValueChange={handleSortByChange}
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
        </div>

        {/* 活跃过滤器标签 */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filter.categoryId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                分类: {categories.find(c => c.id.toString() === filter.categoryId)?.name}
                <XIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFilterChange({ ...filter, categoryId: null })}
                />
              </Badge>
            )}

            {filter.priceRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                价格: ¥{filter.priceRange[0]}-¥{filter.priceRange[1]}
                <XIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFilterChange({ ...filter, priceRange: null })}
                />
              </Badge>
            )}

            {filter.inventoryStatus !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                库存: {
                  filter.inventoryStatus === "inStock" ? "有库存" :
                  filter.inventoryStatus === "lowStock" ? "库存不足" : "无库存"
                }
                <XIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFilterChange({ ...filter, inventoryStatus: "all" })}
                />
              </Badge>
            )}

            {filter.materials.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                材质: {filter.materials.join(", ")}
                <XIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFilterChange({ ...filter, materials: [] })}
                />
              </Badge>
            )}

            {filter.hasImage !== null && (
              <Badge variant="secondary" className="flex items-center gap-1">
                图片: {filter.hasImage ? "有图片" : "无图片"}
                <XIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFilterChange({ ...filter, hasImage: null })}
                />
              </Badge>
            )}

            {filter.sortBy !== "default" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                排序: {
                  filter.sortBy === "priceAsc" ? "价格↑" :
                  filter.sortBy === "priceDesc" ? "价格↓" :
                  filter.sortBy === "nameAsc" ? "名称 A-Z" :
                  filter.sortBy === "nameDesc" ? "名称 Z-A" :
                  filter.sortBy === "inventoryAsc" ? "库存↑" :
                  "库存↓"
                }
                <XIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFilterChange({ ...filter, sortBy: "default" })}
                />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleResetFilter}
            >
              清除全部
            </Button>
          </div>
        )}
      </div>
    )
  }

  // 桌面端使用Popover
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索产品..."
            className="pl-8"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 relative"
            >
              <FilterIcon className="h-4 w-4" />
              高级搜索
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">高级搜索</h4>

              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={localFilter.categoryId || "all"}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="所有分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name} ({category.productCount || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>价格范围</Label>
                <div className="pt-4 px-2">
                  <Slider
                    value={priceRange}
                    min={0}
                    max={maxPrice}
                    step={10}
                    onValueChange={handlePriceRangeChange}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">¥{priceRange[0]}</span>
                    <span className="text-sm">¥{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>库存状态</Label>
                <Select
                  value={localFilter.inventoryStatus}
                  onValueChange={handleInventoryStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="所有产品" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有产品</SelectItem>
                    <SelectItem value="inStock">有库存</SelectItem>
                    <SelectItem value="lowStock">库存不足 (≤5)</SelectItem>
                    <SelectItem value="outOfStock">无库存</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>排序方式</Label>
                <Select
                  value={localFilter.sortBy}
                  onValueChange={handleSortByChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="默认排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认排序</SelectItem>
                    <SelectItem value="priceAsc">
                      <div className="flex items-center">
                        价格
                        <ArrowUpIcon className="h-3 w-3 ml-1" />
                      </div>
                    </SelectItem>
                    <SelectItem value="priceDesc">
                      <div className="flex items-center">
                        价格
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                      </div>
                    </SelectItem>
                    <SelectItem value="nameAsc">名称 A-Z</SelectItem>
                    <SelectItem value="nameDesc">名称 Z-A</SelectItem>
                    <SelectItem value="inventoryAsc">
                      <div className="flex items-center">
                        库存
                        <ArrowUpIcon className="h-3 w-3 ml-1" />
                      </div>
                    </SelectItem>
                    <SelectItem value="inventoryDesc">
                      <div className="flex items-center">
                        库存
                        <ArrowDownIcon className="h-3 w-3 ml-1" />
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={handleResetFilter}>
                  重置
                </Button>
                <Button size="sm" onClick={handleApplyFilter}>
                  应用
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 活跃过滤器标签 */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filter.categoryId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              分类: {categories.find(c => c.id.toString() === filter.categoryId)?.name}
              <XIcon
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFilterChange({ ...filter, categoryId: null })}
              />
            </Badge>
          )}

          {filter.priceRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              价格: ¥{filter.priceRange[0]}-¥{filter.priceRange[1]}
              <XIcon
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFilterChange({ ...filter, priceRange: null })}
              />
            </Badge>
          )}

          {filter.inventoryStatus !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              库存: {
                filter.inventoryStatus === "inStock" ? "有库存" :
                filter.inventoryStatus === "lowStock" ? "库存不足" : "无库存"
              }
              <XIcon
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFilterChange({ ...filter, inventoryStatus: "all" })}
              />
            </Badge>
          )}

          {filter.sortBy !== "default" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              排序: {
                filter.sortBy === "priceAsc" ? "价格↑" :
                filter.sortBy === "priceDesc" ? "价格↓" :
                filter.sortBy === "nameAsc" ? "名称 A-Z" :
                filter.sortBy === "nameDesc" ? "名称 Z-A" :
                filter.sortBy === "inventoryAsc" ? "库存↑" :
                "库存↓"
              }
              <XIcon
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onFilterChange({ ...filter, sortBy: "default" })}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFilterChange(defaultSearchFilter)}
          >
            清除全部
          </Button>
        </div>
      )}
    </div>
  )
}
