"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Settings,
  Plus,
  Trash2,
  Move,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  LayoutGridIcon
} from 'lucide-react'
import { usePersonalization, DashboardCard, DashboardLayout } from './personalization-provider'
import {
  DASHBOARD_CARD_TYPES,
  DASHBOARD_CARD_COMPONENTS,
  DashboardCardConfig
} from './dashboard-card-types'
import { cn } from '@/lib/utils'



interface CustomizableDashboardProps {
  className?: string
  editMode?: boolean
  onEditModeChange?: (editMode: boolean) => void
}

export function CustomizableDashboard({
  className,
  editMode = false,
  onEditModeChange
}: CustomizableDashboardProps) {
  const { toast } = useToast()
  const {
    currentLayout,
    updateDashboardLayout,
    saveDashboardLayout,
    setCurrentLayout
  } = usePersonalization()

  const [localCards, setLocalCards] = useState<DashboardCard[]>(
    currentLayout?.cards || []
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [cardData, setCardData] = useState<Record<string, any>>({})

  // 同步当前布局到本地状态
  useEffect(() => {
    if (currentLayout?.cards) {
      setLocalCards(currentLayout.cards)
      setHasChanges(false)
    }
  }, [currentLayout])

  // 模拟加载卡片数据
  useEffect(() => {
    // 这里可以根据卡片类型加载对应的数据
    const mockData = {
      'sales-overview': {
        today: { amount: 12500, change: 8.5 },
        week: { amount: 85600, change: -2.3 },
        month: { amount: 342000, change: 15.2 }
      },
      'inventory-alerts': {
        lowStock: 12,
        outOfStock: 3,
        total: 156
      }
    }
    setCardData(mockData)
  }, [])

  // 处理拖拽结束
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(localCards)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // 更新位置信息
    const updatedCards = items.map((card, index) => ({
      ...card,
      position: { x: index % 4, y: Math.floor(index / 4) }
    }))

    setLocalCards(updatedCards)
    setHasChanges(true)
  }, [localCards])

  // 添加卡片
  const addCard = useCallback((cardType: string) => {
    const cardConfig = DASHBOARD_CARD_TYPES.find(config => config.type === cardType)
    if (!cardConfig) return

    const newCard: DashboardCard = {
      id: `card_${Date.now()}`,
      type: cardType,
      title: cardConfig.title,
      position: { x: localCards.length % 4, y: Math.floor(localCards.length / 4) },
      size: cardConfig.defaultSize,
      config: {},
      isVisible: true
    }

    setLocalCards(prev => [...prev, newCard])
    setHasChanges(true)

    toast({
      title: '卡片已添加',
      description: `${cardConfig.title} 已添加到仪表盘`
    })
  }, [localCards.length, toast])

  // 删除卡片
  const removeCard = useCallback((cardId: string) => {
    setLocalCards(prev => prev.filter(card => card.id !== cardId))
    setHasChanges(true)
  }, [])

  // 切换卡片可见性
  const toggleCardVisibility = useCallback((cardId: string) => {
    setLocalCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, isVisible: !card.isVisible } : card
    ))
    setHasChanges(true)
  }, [])

  // 保存更改
  const saveChanges = useCallback(async () => {
    if (!currentLayout || !hasChanges) return

    try {
      const updatedLayout = {
        ...currentLayout,
        cards: localCards
      }

      await updateDashboardLayout(currentLayout.id, updatedLayout)
      setCurrentLayout(updatedLayout)
      setHasChanges(false)

      toast({
        title: '保存成功',
        description: '仪表盘布局已保存'
      })
    } catch (error) {
      console.error('保存仪表盘布局失败:', error)
      toast({
        title: '保存失败',
        description: '无法保存仪表盘布局',
        variant: 'destructive'
      })
    }
  }, [currentLayout, localCards, hasChanges, updateDashboardLayout, setCurrentLayout, toast])

  // 重置更改
  const resetChanges = useCallback(() => {
    setLocalCards(currentLayout?.cards || [])
    setHasChanges(false)
  }, [currentLayout?.cards])

  // 渲染卡片内容
  const renderCardContent = (card: DashboardCard) => {
    const CardComponent = DASHBOARD_CARD_COMPONENTS[card.type]

    if (CardComponent) {
      return (
        <CardComponent
          config={card.config}
          data={cardData[card.type]}
          isEditing={editMode}
          onEdit={() => {
            // 处理卡片编辑
            toast({
              title: '编辑卡片',
              description: `编辑 ${card.title} 的配置`
            })
          }}
          onRemove={() => removeCard(card.id)}
        />
      )
    }

    // 默认卡片内容
    const cardConfig = DASHBOARD_CARD_TYPES.find(config => config.type === card.type)
    const Icon = cardConfig?.icon || LayoutGridIcon

    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Icon className="h-8 w-8 mx-auto mb-2" />
          <div className="text-sm">{card.title}</div>
          <div className="text-xs mt-1">{cardConfig?.description}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 编辑模式工具栏 */}
      {editMode && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">仪表盘定制</CardTitle>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetChanges}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      重置
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveChanges}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      保存
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditModeChange?.(false)}
                >
                  退出编辑
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 可添加的卡片类型 */}
              <div>
                <h4 className="text-sm font-medium mb-2">添加卡片</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {DASHBOARD_CARD_TYPES.map((config) => {
                    const isAdded = localCards.some(card => card.type === config.type)
                    const Icon = config.icon
                    return (
                      <Button
                        key={config.type}
                        variant={isAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => !isAdded && addCard(config.type)}
                        disabled={isAdded}
                        className="flex flex-col items-center gap-1 h-auto p-3"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{config.title}</span>
                        {isAdded && <Badge variant="secondary" className="text-xs">已添加</Badge>}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* 当前卡片列表 */}
              <div>
                <h4 className="text-sm font-medium mb-2">当前卡片</h4>
                <div className="space-y-2">
                  {localCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Move className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{card.title}</span>
                        {!card.isVisible && (
                          <Badge variant="secondary">隐藏</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardVisibility(card.id)}
                          className="h-8 w-8 p-0"
                        >
                          {card.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCard(card.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 仪表盘网格 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {localCards
                .filter(card => card.isVisible)
                .map((card, index) => (
                  <Draggable
                    key={card.id}
                    draggableId={card.id}
                    index={index}
                    isDragDisabled={!editMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative",
                          card.size.width === 2 && "md:col-span-2",
                          card.size.height === 2 && "row-span-2",
                          snapshot.isDragging && "z-50"
                        )}
                      >
                        <Card className={cn(
                          "h-full transition-all duration-200",
                          editMode && "border-dashed border-2",
                          snapshot.isDragging && "shadow-lg rotate-2"
                        )}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{card.title}</CardTitle>
                              {editMode && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-move p-1 rounded hover:bg-accent"
                                >
                                  <Move className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {renderCardContent(card)}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 编辑模式切换按钮 */}
      {!editMode && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => onEditModeChange?.(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            定制仪表盘
          </Button>
        </div>
      )}
    </div>
  )
}
