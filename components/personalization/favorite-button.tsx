"use client"

import React, { useState, useEffect } from 'react'
import { usePersonalization } from './personalization-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { StarIcon, HeartIcon } from 'lucide-react'
import { UserFavorite } from './personalization-provider'

interface FavoriteButtonProps {
  type: 'page' | 'report' | 'search' | 'operation'
  title: string
  url?: string
  icon?: string
  category?: string
  description?: string
  config?: any
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

// 收藏分类选项
const CATEGORY_OPTIONS = [
  { value: 'product', label: '产品管理' },
  { value: 'sales', label: '销售管理' },
  { value: 'inventory', label: '库存管理' },
  { value: 'finance', label: '财务管理' },
  { value: 'employee', label: '员工管理' },
  { value: 'customer', label: '客户管理' },
  { value: 'channel', label: '渠道管理' },
  { value: 'system', label: '系统设置' },
  { value: 'other', label: '其他' }
]

export function FavoriteButton({
  type,
  title,
  url,
  icon,
  category,
  description,
  config,
  variant = 'outline',
  size = 'sm',
  className,
  children
}: FavoriteButtonProps) {
  const { favorites, addFavorite, removeFavorite } = usePersonalization()
  const { toast } = useToast()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [existingFavorite, setExistingFavorite] = useState<UserFavorite | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: title,
    description: description || '',
    category: category || 'other'
  })

  // 检查是否已收藏
  useEffect(() => {
    const existing = favorites.find(fav => 
      fav.type === type && 
      fav.title === title && 
      fav.url === url
    )
    
    setIsFavorited(!!existing)
    setExistingFavorite(existing || null)
  }, [favorites, type, title, url])

  // 处理收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (isFavorited && existingFavorite) {
      // 取消收藏
      try {
        setIsLoading(true)
        await removeFavorite(existingFavorite.id)
        toast({
          title: '取消收藏',
          description: '已从收藏中移除'
        })
      } catch (error) {
        toast({
          title: '操作失败',
          description: '取消收藏失败',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      // 添加收藏 - 打开对话框
      setFormData({
        title: title,
        description: description || '',
        category: category || 'other'
      })
      setIsDialogOpen(true)
    }
  }

  // 确认添加收藏
  const handleConfirmAdd = async () => {
    try {
      setIsLoading(true)
      
      await addFavorite({
        type,
        title: formData.title,
        url,
        icon,
        category: formData.category,
        description: formData.description,
        config,
        sortOrder: 0
      })
      
      toast({
        title: '添加成功',
        description: '已添加到收藏'
      })
      
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: '添加失败',
        description: '无法添加到收藏',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleToggleFavorite}
        disabled={isLoading}
      >
        {isFavorited ? (
          <HeartIcon className="h-4 w-4 mr-2 fill-current text-red-500" />
        ) : (
          <StarIcon className="h-4 w-4 mr-2" />
        )}
        {children || (isFavorited ? '已收藏' : '收藏')}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加到收藏</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">收藏名称</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入收藏名称"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入收藏描述"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmAdd}
                disabled={isLoading || !formData.title.trim()}
              >
                {isLoading ? '添加中...' : '确认添加'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
