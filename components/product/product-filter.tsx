"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductFilter as ProductFilterType, ProductCategory } from "@/types/product"
import { SearchIcon } from "lucide-react"

interface ProductFilterProps {
  filter: ProductFilterType
  categories: ProductCategory[]
  onFilterChange: (filter: Partial<ProductFilterType>) => void
}

export function ProductFilter({
  filter,
  categories,
  onFilterChange
}: ProductFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      >
        <SelectTrigger>
          <SelectValue placeholder="选择材料" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部材料</SelectItem>
          <SelectItem value="珐琅">珐琅</SelectItem>
          <SelectItem value="陶瓷">陶瓷</SelectItem>
          <SelectItem value="金属">金属</SelectItem>
          <SelectItem value="玻璃">玻璃</SelectItem>
          <SelectItem value="木材">木材</SelectItem>
          <SelectItem value="塑料">塑料</SelectItem>
          <SelectItem value="其他">其他</SelectItem>
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
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="active">正常</SelectItem>
          <SelectItem value="inactive">停用</SelectItem>
          <SelectItem value="draft">草稿</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
