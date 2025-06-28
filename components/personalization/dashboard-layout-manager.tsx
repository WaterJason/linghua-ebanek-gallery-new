"use client"

import React, { useState } from 'react'
import { usePersonalization } from './personalization-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  PlusIcon,
  LayoutGridIcon,
  StarIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon
} from 'lucide-react'
import { DashboardLayout } from './personalization-provider'

interface DashboardLayoutManagerProps {
  trigger?: React.ReactNode
}

export function DashboardLayoutManager({ trigger }: DashboardLayoutManagerProps) {
  const { 
    dashboardLayouts, 
    currentLayout, 
    saveDashboardLayout, 
    updateDashboardLayout,
    deleteDashboardLayout,
    setCurrentLayout 
  } = usePersonalization()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // 创建新布局
  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) {
      toast({
        title: '请输入布局名称',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      await saveDashboardLayout({
        name: newLayoutName.trim(),
        isDefault: false,
        cards: currentLayout?.cards || []
      })
      
      setNewLayoutName('')
      setIsCreateDialogOpen(false)
      
      toast({
        title: '布局已创建',
        description: `新布局 "${newLayoutName}" 已成功创建`
      })
    } catch (error) {
      toast({
        title: '创建失败',
        description: '无法创建新布局',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // 切换布局
  const handleSwitchLayout = async (layout: DashboardLayout) => {
    try {
      setCurrentLayout(layout)
      toast({
        title: '布局已切换',
        description: `已切换到 "${layout.name}" 布局`
      })
    } catch (error) {
      toast({
        title: '切换失败',
        description: '无法切换布局',
        variant: 'destructive'
      })
    }
  }

  // 设为默认布局
  const handleSetDefault = async (layoutId: string) => {
    try {
      // 先取消其他默认布局
      const updatePromises = dashboardLayouts.map(layout => {
        if (layout.isDefault && layout.id !== layoutId) {
          return updateDashboardLayout(layout.id, { isDefault: false })
        }
        return Promise.resolve()
      })
      
      await Promise.all(updatePromises)
      
      // 设置新的默认布局
      await updateDashboardLayout(layoutId, { isDefault: true })
      
      toast({
        title: '默认布局已设置',
        description: '布局已设为默认'
      })
    } catch (error) {
      toast({
        title: '设置失败',
        description: '无法设置默认布局',
        variant: 'destructive'
      })
    }
  }

  // 复制布局
  const handleDuplicateLayout = async (layout: DashboardLayout) => {
    try {
      await saveDashboardLayout({
        name: `${layout.name} (副本)`,
        isDefault: false,
        cards: layout.cards
      })
      
      toast({
        title: '布局已复制',
        description: `已创建 "${layout.name}" 的副本`
      })
    } catch (error) {
      toast({
        title: '复制失败',
        description: '无法复制布局',
        variant: 'destructive'
      })
    }
  }

  // 删除布局
  const handleDeleteLayout = async (layoutId: string) => {
    try {
      await deleteDashboardLayout(layoutId)
      
      toast({
        title: '布局已删除',
        description: '布局已成功删除'
      })
    } catch (error) {
      toast({
        title: '删除失败',
        description: '无法删除布局',
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <LayoutGridIcon className="h-4 w-4 mr-2" />
              布局管理
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>仪表盘布局管理</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 创建新布局按钮 */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">我的布局</h3>
                <p className="text-sm text-muted-foreground">
                  管理您的仪表盘布局配置
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建布局
              </Button>
            </div>

            {/* 布局列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {dashboardLayouts.map((layout) => (
                <Card 
                  key={layout.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentLayout?.id === layout.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSwitchLayout(layout)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {layout.name}
                        {layout.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <StarIcon className="h-3 w-3 mr-1" />
                            默认
                          </Badge>
                        )}
                        {currentLayout?.id === layout.id && (
                          <Badge variant="default" className="text-xs">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            当前
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {layout.cards.length} 个卡片
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* 布局预览 */}
                    <div className="grid grid-cols-4 gap-1 mb-3 h-16 bg-muted rounded p-2">
                      {layout.cards.slice(0, 8).map((card, index) => (
                        <div
                          key={card.id}
                          className={`bg-background rounded border ${
                            card.size.width === 2 ? 'col-span-2' : ''
                          } ${
                            card.size.height === 2 ? 'row-span-2' : ''
                          }`}
                          style={{ minHeight: '8px' }}
                        />
                      ))}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-1">
                      {!layout.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefault(layout.id)
                          }}
                          className="flex-1 text-xs"
                        >
                          <StarIcon className="h-3 w-3 mr-1" />
                          设为默认
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateLayout(layout)
                        }}
                        className="flex-1 text-xs"
                      >
                        <CopyIcon className="h-3 w-3 mr-1" />
                        复制
                      </Button>
                      {!layout.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteLayout(layout.id)
                          }}
                          className="flex-1 text-xs text-destructive"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建新布局对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建新布局</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="layout-name">布局名称</Label>
              <Input
                id="layout-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="输入布局名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateLayout()
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateLayout}
                disabled={isCreating || !newLayoutName.trim()}
              >
                {isCreating ? '创建中...' : '创建'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
