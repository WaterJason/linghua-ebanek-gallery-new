'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useEnhancedOperations } from '@/hooks/use-enhanced-operations'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import {
  Clock,
  User,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle,
  Play,
  Eye
} from 'lucide-react'

interface ProductionOrder {
  id: number
  orderNumber: string
  productName: string
  quantity: number
  currentStage: string
  status: string
  priority: string
  progressPercentage: number
  location: string
  assignedTo?: string
  estimatedEndDate?: string
  orderDate: string
  productionBase: {
    name: string
    location: string
  }
  employee: {
    name: string
  }
}

const stages = [
  { id: 'DESIGN', title: '产品设计', color: 'blue' },
  { id: 'MATERIAL_PROCUREMENT', title: '底胎采购', color: 'purple' },
  { id: 'SHIPPING_TO_PRODUCTION', title: '物流发送', color: 'orange' },
  { id: 'IN_PRODUCTION', title: '工艺制作', color: 'green' },
  { id: 'QUALITY_CHECK', title: '质量检验', color: 'yellow' },
  { id: 'SHIPPING_BACK', title: '物流返回', color: 'orange' },
  { id: 'PACKAGING', title: '包装装裱', color: 'indigo' },
  { id: 'SALES_READY', title: '渠道销售', color: 'emerald' },
]

const priorityColors = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red'
}

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle,
  DELAYED: AlertTriangle,
  ON_HOLD: Clock,
  EXCEPTION: AlertTriangle
}

export function ProductionKanbanView() {
  const [ordersByStage, setOrdersByStage] = useState<Record<string, ProductionOrder[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)

  const { executeOperation } = useEnhancedOperations()

  // 加载订单数据
  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/production/orders?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        const orders = data.data || []
        
        // 按阶段分组
        const grouped = stages.reduce((acc, stage) => {
          acc[stage.id] = orders.filter((order: ProductionOrder) => order.currentStage === stage.id)
          return acc
        }, {} as Record<string, ProductionOrder[]>)
        
        setOrdersByStage(grouped)
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理拖拽
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const orderId = parseInt(draggableId)
    const newStage = destination.droppableId

    await executeOperation(
      async () => {
        const response = await fetch('/api/production/smart-transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            targetStage: newStage,
            operatorId: 1, // 当前用户ID
            userRole: 'manager',
            conditions: {},
            notes: `通过看板拖拽转换到 ${stages.find(s => s.id === newStage)?.title}`
          })
        })

        if (!response.ok) {
          throw new Error('状态转换失败')
        }

        await loadOrders()
      },
      {
        loadingMessage: '正在转换状态...',
        successMessage: '状态转换成功',
        errorMessage: '状态转换失败'
      }
    )
  }

  // 初始加载
  useEffect(() => {
    loadOrders()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>生产看板 - 按阶段分组</CardTitle>
        </CardHeader>
      </Card>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <Card className={`${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {stage.title}
                      </CardTitle>
                      <Badge variant="secondary">
                        {ordersByStage[stage.id]?.length || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[200px]"
                  >
                    {ordersByStage[stage.id]?.map((order, index) => (
                      <Draggable
                        key={order.id}
                        draggableId={order.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                            }`}
                          >
                            <CardContent className="p-3">
                              {/* 订单头部 */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {order.orderNumber}
                                </span>
                                <Badge 
                                  variant={priorityColors[order.priority as keyof typeof priorityColors] as any}
                                  className="text-xs"
                                >
                                  {order.priority}
                                </Badge>
                              </div>

                              {/* 产品信息 */}
                              <div className="space-y-1 mb-3">
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {order.productName}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  数量: {order.quantity}
                                </div>
                              </div>

                              {/* 进度条 */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">进度</span>
                                  <span className="text-xs font-medium">
                                    {order.progressPercentage}%
                                  </span>
                                </div>
                                <Progress value={order.progressPercentage} className="h-1" />
                              </div>

                              {/* 详细信息 */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {order.location}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {order.assignedTo || order.employee.name}
                                  </span>
                                </div>

                                {order.estimatedEndDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(order.estimatedEndDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* 状态指示器 */}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Clock
                                    return <StatusIcon className="h-3 w-3 text-muted-foreground" />
                                  })()}
                                  <span className="text-xs text-muted-foreground">
                                    {order.status}
                                  </span>
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedOrder(order)
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* 空状态 */}
                    {(!ordersByStage[stage.id] || ordersByStage[stage.id].length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="mx-auto h-8 w-8 mb-2" />
                        <p className="text-sm">暂无订单</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* 统计信息 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {stages.map((stage) => {
              const count = ordersByStage[stage.id]?.length || 0
              return (
                <div key={stage.id} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{stage.title}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
