"use client"

import React, { useMemo } from 'react'
import { usePersonalization } from './personalization-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { FavoritesManager } from './favorites-manager'
import {
  StarIcon,
  ExternalLinkIcon,
  FolderIcon,
  FileTextIcon,
  SearchIcon,
  PlayIcon,
  SettingsIcon,
  TrendingUpIcon
} from 'lucide-react'
import { UserFavorite } from './personalization-provider'

interface FavoritesQuickAccessProps {
  maxItems?: number
  showManageButton?: boolean
}

// 收藏类型图标映射
const TYPE_ICONS = {
  page: FolderIcon,
  report: FileTextIcon,
  search: SearchIcon,
  operation: PlayIcon
}

export function FavoritesQuickAccess({ 
  maxItems = 8, 
  showManageButton = true 
}: FavoritesQuickAccessProps) {
  const { favorites, accessFavorite } = usePersonalization()
  const { toast } = useToast()

  // 获取最常用的收藏项
  const topFavorites = useMemo(() => {
    return [...favorites]
      .sort((a, b) => {
        // 优先按访问次数排序，然后按最近访问时间
        if (a.accessCount !== b.accessCount) {
          return b.accessCount - a.accessCount
        }
        
        const aTime = a.lastAccess ? new Date(a.lastAccess).getTime() : 0
        const bTime = b.lastAccess ? new Date(b.lastAccess).getTime() : 0
        return bTime - aTime
      })
      .slice(0, maxItems)
  }, [favorites, maxItems])

  // 处理收藏访问
  const handleAccessFavorite = async (favorite: UserFavorite) => {
    try {
      await accessFavorite(favorite.id)
      
      // 如果有URL，打开链接
      if (favorite.url) {
        window.open(favorite.url, '_blank')
      }
      
      toast({
        title: '已打开',
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

  // 获取收藏类型图标
  const getTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || FolderIcon
    return IconComponent
  }

  // 如果没有收藏，不显示组件
  if (favorites.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <StarIcon className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">收藏</span>
          {favorites.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {favorites.length > 99 ? '99+' : favorites.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>我的收藏</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUpIcon className="h-3 w-3" />
            <span>按使用频率排序</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {topFavorites.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            暂无收藏项
          </div>
        ) : (
          <>
            {topFavorites.map((favorite) => {
              const TypeIcon = getTypeIcon(favorite.type)
              
              return (
                <DropdownMenuItem
                  key={favorite.id}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => handleAccessFavorite(favorite)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{favorite.title}</div>
                      {favorite.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {favorite.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {favorite.accessCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {favorite.accessCount}
                      </Badge>
                    )}
                    {favorite.url && (
                      <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
            
            {favorites.length > maxItems && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                  还有 {favorites.length - maxItems} 个收藏项
                </div>
              </>
            )}
          </>
        )}
        
        {showManageButton && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <FavoritesManager
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    管理收藏
                  </Button>
                }
              />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
