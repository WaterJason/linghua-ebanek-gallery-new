"use client"

import React, { useState, useMemo } from 'react'
import { usePersonalization } from './personalization-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import {
  StarIcon,
  SearchIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  FolderIcon,
  FileTextIcon,
  SettingsIcon,
  PlayIcon,
  PlusIcon,
  SortAscIcon,
  SortDescIcon,
  FilterIcon
} from 'lucide-react'
import { UserFavorite } from './personalization-provider'

interface FavoritesManagerProps {
  trigger?: React.ReactNode
}

// 收藏类型配置
const FAVORITE_TYPES = {
  page: { label: '页面', icon: FolderIcon, color: 'bg-blue-100 text-blue-800' },
  report: { label: '报表', icon: FileTextIcon, color: 'bg-green-100 text-green-800' },
  search: { label: '搜索', icon: SearchIcon, color: 'bg-purple-100 text-purple-800' },
  operation: { label: '操作', icon: PlayIcon, color: 'bg-orange-100 text-orange-800' }
}

// 收藏分类配置
const FAVORITE_CATEGORIES = {
  product: '产品管理',
  sales: '销售管理',
  inventory: '库存管理',
  finance: '财务管理',
  employee: '员工管理',
  customer: '客户管理',
  channel: '渠道管理',
  system: '系统设置',
  other: '其他'
}

export function FavoritesManager({ trigger }: FavoritesManagerProps) {
  const { favorites, addFavorite, removeFavorite, updateFavorite, accessFavorite } = usePersonalization()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'access' | 'date'>('access')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingFavorite, setEditingFavorite] = useState<UserFavorite | null>(null)

  // 过滤和排序收藏
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites.filter(fav => {
      const matchesSearch = fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (fav.description && fav.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesType = selectedType === 'all' || fav.type === selectedType
      const matchesCategory = selectedCategory === 'all' || fav.category === selectedCategory
      
      return matchesSearch && matchesType && matchesCategory
    })

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'access':
          comparison = a.accessCount - b.accessCount
          break
        case 'date':
          comparison = new Date(a.lastAccess || a.id).getTime() - new Date(b.lastAccess || b.id).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [favorites, searchQuery, selectedType, selectedCategory, sortBy, sortOrder])

  // 处理收藏访问
  const handleAccessFavorite = async (favorite: UserFavorite) => {
    try {
      await accessFavorite(favorite.id)
      
      // 如果有URL，打开链接
      if (favorite.url) {
        window.open(favorite.url, '_blank')
      }
      
      toast({
        title: '已打开收藏',
        description: favorite.title
      })
    } catch (error) {
      toast({
        title: '打开失败',
        description: '无法打开该收藏项',
        variant: 'destructive'
      })
    }
  }

  // 处理删除收藏
  const handleDeleteFavorite = async (id: string) => {
    try {
      await removeFavorite(id)
      toast({
        title: '删除成功',
        description: '收藏已删除'
      })
    } catch (error) {
      toast({
        title: '删除失败',
        description: '无法删除该收藏项',
        variant: 'destructive'
      })
    }
  }

  // 获取收藏类型信息
  const getTypeInfo = (type: string) => {
    return FAVORITE_TYPES[type as keyof typeof FAVORITE_TYPES] || FAVORITE_TYPES.page
  }

  // 获取分类名称
  const getCategoryName = (category?: string) => {
    return category ? FAVORITE_CATEGORIES[category as keyof typeof FAVORITE_CATEGORIES] || category : '未分类'
  }

  // 渲染收藏项
  const renderFavoriteItem = (favorite: UserFavorite) => {
    const typeInfo = getTypeInfo(favorite.type)
    const TypeIcon = typeInfo.icon

    return (
      <Card key={favorite.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                <h3 
                  className="font-medium truncate cursor-pointer hover:text-primary"
                  onClick={() => handleAccessFavorite(favorite)}
                >
                  {favorite.title}
                </h3>
                {favorite.url && (
                  <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              
              {favorite.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {favorite.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className={typeInfo.color}>
                  {typeInfo.label}
                </Badge>
                <span>{getCategoryName(favorite.category)}</span>
                <span>•</span>
                <span>访问 {favorite.accessCount} 次</span>
                {favorite.lastAccess && (
                  <>
                    <span>•</span>
                    <span>最近访问: {new Date(favorite.lastAccess).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAccessFavorite(favorite)}>
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  打开
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingFavorite(favorite)}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteFavorite(favorite.id)}
                  className="text-destructive"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <StarIcon className="h-4 w-4 mr-2" />
            收藏管理
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>收藏管理</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索收藏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">排序方式</div>
                  <div className="space-y-1">
                    {[
                      { value: 'access', label: '访问次数' },
                      { value: 'name', label: '名称' },
                      { value: 'date', label: '最近访问' }
                    ].map(option => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSortBy(option.value as any)}
                      >
                        {option.label}
                        {sortBy === option.value && (
                          sortOrder === 'asc' ? 
                            <SortAscIcon className="h-3 w-3 ml-auto" /> : 
                            <SortDescIcon className="h-3 w-3 ml-auto" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 类型和分类筛选 */}
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="page">页面</TabsTrigger>
              <TabsTrigger value="report">报表</TabsTrigger>
              <TabsTrigger value="search">搜索</TabsTrigger>
              <TabsTrigger value="operation">操作</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 收藏列表 */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {filteredAndSortedFavorites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <StarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无收藏项</p>
                <p className="text-sm">在任意页面点击收藏按钮添加收藏</p>
              </div>
            ) : (
              filteredAndSortedFavorites.map(renderFavoriteItem)
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
