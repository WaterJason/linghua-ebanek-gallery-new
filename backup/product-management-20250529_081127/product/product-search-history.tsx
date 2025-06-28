"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AdvancedSearchFilter, defaultSearchFilter } from "./product-advanced-search"
import { ProductCategory } from "@/types/product"
import { 
  HistoryIcon, 
  SaveIcon, 
  TrashIcon, 
  ClockIcon,
  CheckIcon,
  PlusIcon,
  MoreHorizontalIcon
} from "lucide-react"

// 搜索历史项类型
interface SearchHistoryItem {
  id: string
  name: string
  filter: AdvancedSearchFilter
  createdAt: string
  isFavorite: boolean
}

interface ProductSearchHistoryProps {
  categories: ProductCategory[]
  currentFilter: AdvancedSearchFilter
  onSelectFilter: (filter: AdvancedSearchFilter) => void
}

// 本地存储键
const STORAGE_KEY = "product_search_history"

export function ProductSearchHistory({
  categories,
  currentFilter,
  onSelectFilter
}: ProductSearchHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  
  // 加载搜索历史
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY)
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error("Failed to load search history:", error)
    }
  }, [])
  
  // 保存搜索历史到本地存储
  const saveHistoryToStorage = (newHistory: SearchHistoryItem[]) => {
    if (typeof window === "undefined") return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error("Failed to save search history:", error)
    }
  }
  
  // 保存当前搜索条件
  const handleSaveSearch = () => {
    if (!searchName.trim()) return
    
    // 检查是否与默认过滤器相同
    const isDefaultFilter = Object.entries(currentFilter).every(([key, value]) => {
      const defaultValue = defaultSearchFilter[key as keyof AdvancedSearchFilter]
      
      if (Array.isArray(value) && Array.isArray(defaultValue)) {
        return value.length === defaultValue.length && 
               value.every((v, i) => v === defaultValue[i])
      }
      
      return value === defaultValue
    })
    
    if (isDefaultFilter) {
      // 不保存默认过滤器
      setIsSaveDialogOpen(false)
      return
    }
    
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filter: { ...currentFilter },
      createdAt: new Date().toISOString(),
      isFavorite: false
    }
    
    const newHistory = [...history, newItem]
    setHistory(newHistory)
    saveHistoryToStorage(newHistory)
    
    setSearchName("")
    setIsSaveDialogOpen(false)
  }
  
  // 删除搜索历史项
  const handleDeleteItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    saveHistoryToStorage(newHistory)
  }
  
  // 切换收藏状态
  const handleToggleFavorite = (id: string) => {
    const newHistory = history.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    setHistory(newHistory)
    saveHistoryToStorage(newHistory)
  }
  
  // 选择搜索历史项
  const handleSelectItem = (filter: AdvancedSearchFilter) => {
    onSelectFilter(filter)
    setIsOpen(false)
  }
  
  // 清空所有历史
  const handleClearAll = () => {
    setHistory([])
    saveHistoryToStorage([])
  }
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }
  
  // 获取过滤器描述
  const getFilterDescription = (filter: AdvancedSearchFilter) => {
    const parts: string[] = []
    
    if (filter.searchQuery) {
      parts.push(`关键词: ${filter.searchQuery}`)
    }
    
    if (filter.categoryId) {
      const category = categories.find(c => c.id.toString() === filter.categoryId)
      if (category) {
        parts.push(`分类: ${category.name}`)
      }
    }
    
    if (filter.priceRange) {
      parts.push(`价格: ¥${filter.priceRange[0]}-¥${filter.priceRange[1]}`)
    }
    
    if (filter.inventoryStatus !== "all") {
      parts.push(`库存: ${
        filter.inventoryStatus === "inStock" ? "有库存" :
        filter.inventoryStatus === "lowStock" ? "库存不足" : "无库存"
      }`)
    }
    
    if (filter.materials.length > 0) {
      parts.push(`材质: ${filter.materials.join(", ")}`)
    }
    
    if (filter.hasImage !== null) {
      parts.push(`图片: ${filter.hasImage ? "有图片" : "无图片"}`)
    }
    
    if (filter.sortBy !== "default") {
      parts.push(`排序: ${
        filter.sortBy === "priceAsc" ? "价格↑" :
        filter.sortBy === "priceDesc" ? "价格↓" :
        filter.sortBy === "nameAsc" ? "名称 A-Z" :
        filter.sortBy === "nameDesc" ? "名称 Z-A" :
        filter.sortBy === "inventoryAsc" ? "库存↑" :
        "库存↓"
      }`)
    }
    
    return parts.join(", ")
  }
  
  // 检查当前过滤器是否已保存
  const isCurrentFilterSaved = () => {
    return history.some(item => 
      JSON.stringify(item.filter) === JSON.stringify(currentFilter)
    )
  }
  
  // 排序历史记录：收藏在前，然后按时间倒序
  const sortedHistory = [...history].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <HistoryIcon className="h-4 w-4" />
            <span className="hidden sm:inline">搜索历史</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>搜索历史</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {sortedHistory.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              暂无保存的搜索
            </div>
          ) : (
            <>
              {sortedHistory.slice(0, 5).map(item => (
                <DropdownMenuItem 
                  key={item.id}
                  className="flex items-center justify-between"
                  onClick={() => handleSelectItem(item.filter)}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.isFavorite && <SaveIcon className="h-3.5 w-3.5 text-yellow-500" />}
                    <span className="truncate">{item.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsSaveDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            保存当前搜索
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <ClockIcon className="h-4 w-4 mr-2" />
            查看所有历史
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* 保存搜索对话框 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存搜索</DialogTitle>
            <DialogDescription>
              为当前搜索条件设置一个名称，以便将来重用
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">搜索名称</Label>
              <Input
                id="search-name"
                placeholder="例如：高价产品、库存不足..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>搜索条件</Label>
              <div className="text-sm text-muted-foreground">
                {getFilterDescription(currentFilter) || "默认搜索条件"}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 搜索历史对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>搜索历史</DialogTitle>
            <DialogDescription>
              查看和管理已保存的搜索条件
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {sortedHistory.length === 0 ? (
              <div className="text-center py-8">
                <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">暂无搜索历史</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  保存搜索条件以便将来重用
                </p>
                <Button className="mt-4" onClick={() => setIsSaveDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  保存当前搜索
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">名称</TableHead>
                      <TableHead>搜索条件</TableHead>
                      <TableHead className="w-[120px]">创建时间</TableHead>
                      <TableHead className="w-[100px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHistory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {item.isFavorite && <SaveIcon className="h-3.5 w-3.5 text-yellow-500" />}
                          {item.name}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {getFilterDescription(item.filter) || "默认搜索条件"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSelectItem(item.filter)}>
                                <CheckIcon className="h-4 w-4 mr-2" />
                                应用
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleFavorite(item.id)}>
                                <SaveIcon className="h-4 w-4 mr-2" />
                                {item.isFavorite ? "取消收藏" : "收藏"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-destructive"
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
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive"
              onClick={handleClearAll}
              disabled={history.length === 0}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              清空历史
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                关闭
              </Button>
              <Button 
                onClick={() => {
                  setIsOpen(false)
                  setIsSaveDialogOpen(true)
                }}
                disabled={isCurrentFilterSaved()}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                保存当前搜索
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
