"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArtworkFilter as ArtworkFilterType, ArtworkCategory } from "@/types/artwork"
import { SearchIcon } from "lucide-react"

interface ArtworkFilterProps {
  filter: ArtworkFilterType
  categories: ArtworkCategory[]
  onFilterChange: (filter: Partial<ArtworkFilterType>) => void
}

export function ArtworkFilter({
  filter,
  categories,
  onFilterChange
}: ArtworkFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="搜索作品名称、SKU或条形码..."
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
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
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
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="active">正常</SelectItem>
          <SelectItem value="inactive">停用</SelectItem>
          <SelectItem value="draft">草稿</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
