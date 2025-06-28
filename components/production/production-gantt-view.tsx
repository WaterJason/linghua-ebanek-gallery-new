'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Play
} from 'lucide-react'

interface GanttOrder {
  id: number
  orderNumber: string
  productName: string
  currentStage: string
  status: string
  priority: string
  startDate: Date
  endDate: Date
  progress: number
  location: string
  assignedTo: string
  stages: Array<{
    stage: string
    title: string
    startDate: Date
    endDate: Date
    status: 'completed' | 'in_progress' | 'pending' | 'delayed'
    progress: number
  }>
}

const stageLabels = {
  DESIGN: '产品设计',
  MATERIAL_PROCUREMENT: '底胎采购',
  SHIPPING_TO_PRODUCTION: '物流发送',
  IN_PRODUCTION: '工艺制作',
  QUALITY_CHECK: '质量检验',
  SHIPPING_BACK: '物流返回',
  PACKAGING: '包装装裱',
  SALES_READY: '渠道销售'
}

const statusColors = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-gray-300',
  delayed: 'bg-red-500'
}

const priorityColors = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red'
}

export function ProductionGanttView() {
  const [orders, setOrders] = useState<GanttOrder[]>([])
  const [timeRange, setTimeRange] = useState('month')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<GanttOrder | null>(null)

  // 生成时间网格
  const generateTimeGrid = () => {
    const now = new Date()
    const days = []
    
    for (let i = -7; i <= 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    
    return days
  }

  // 计算任务在时间轴上的位置
  const calculatePosition = (startDate: Date, endDate: Date, timeGrid: Date[]) => {
    const gridStart = timeGrid[0]
    const gridEnd = timeGrid[timeGrid.length - 1]
    const totalDays = (gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
    
    const startOffset = Math.max(0, (startDate.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24))
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    
    return {
      left: (startOffset / totalDays) * 100,
      width: Math.max(1, (duration / totalDays) * 100)
    }
  }

  // 加载甘特图数据
  const loadGanttData = async () => {
    try {
      setIsLoading(true)

      // 从API获取真实数据
      const response = await fetch('/api/production/orders?page=1&limit=1000')

      if (response.ok) {
        const data = await response.json()
        const orders = data.data || []

        // 转换为甘特图格式
        const ganttOrders = orders.map((order: any) => convertToGanttOrder(order))
        setOrders(ganttOrders)
      } else {
        throw new Error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Failed to load gantt data:', error)
      // 如果API失败，设置空数组
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // 转换订单数据为甘特图格式
  const convertToGanttOrder = (order: any): GanttOrder => {
    const startDate = order.orderDate ? new Date(order.orderDate) : new Date()
    const estimatedEndDate = order.estimatedCompletionDate ? new Date(order.estimatedCompletionDate) : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000)

    // 生成阶段时间线
    const stages = generateStageTimeline(startDate, estimatedEndDate, order.currentStage, order.progressPercentage || 0)

    return {
      id: order.id,
      orderNumber: order.orderNumber || `PO-${order.id}`,
      productName: order.product?.name || '未知产品',
      currentStage: order.currentStage || 'DESIGN',
      status: order.status || 'PENDING',
      priority: order.priority || 'NORMAL',
      startDate,
      endDate: estimatedEndDate,
      progress: order.progressPercentage || 0,
      location: order.location || '未知地点',
      assignedTo: order.employee?.name || '未分配',
      stages
    }
  }

  // 生成阶段时间线
  const generateStageTimeline = (startDate: Date, endDate: Date, currentStage: string, progress: number) => {
    const stageOrder = ['DESIGN', 'MATERIAL_PROCUREMENT', 'SHIPPING_TO_PRODUCTION', 'IN_PRODUCTION', 'QUALITY_CHECK', 'SHIPPING_BACK', 'PACKAGING', 'SALES_READY']
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPerStage = Math.max(1, Math.floor(totalDays / stageOrder.length))

    const currentStageIndex = stageOrder.indexOf(currentStage)

    return stageOrder.map((stage, index) => {
      const stageStartDate = new Date(startDate.getTime() + index * daysPerStage * 24 * 60 * 60 * 1000)
      const stageEndDate = new Date(startDate.getTime() + (index + 1) * daysPerStage * 24 * 60 * 60 * 1000)

      let status: 'completed' | 'in_progress' | 'pending' | 'delayed'
      let stageProgress = 0

      if (index < currentStageIndex) {
        status = 'completed'
        stageProgress = 100
      } else if (index === currentStageIndex) {
        status = 'in_progress'
        stageProgress = progress
      } else {
        status = 'pending'
        stageProgress = 0
      }

      // 检查是否延期
      if (status === 'in_progress' && new Date() > stageEndDate) {
        status = 'delayed'
      }

      return {
        stage,
        title: stageLabels[stage as keyof typeof stageLabels] || stage,
        startDate: stageStartDate,
        endDate: stageEndDate,
        status,
        progress: stageProgress
      }
    })
  }

  useEffect(() => {
    loadGanttData()
  }, [timeRange])

  const timeGrid = generateTimeGrid()

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
          <div className="flex items-center justify-between">
            <CardTitle>生产甘特图</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex">
            {/* 左侧订单信息 */}
            <div className="w-80 border-r">
              <div className="p-4 border-b bg-muted/50">
                <div className="text-sm font-medium">订单信息</div>
              </div>
              <ScrollArea className="h-96">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                      selectedOrder?.id === order.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{order.orderNumber}</span>
                        <Badge variant={priorityColors[order.priority as keyof typeof priorityColors] as any}>
                          {order.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.productName}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{order.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{order.assignedTo}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          进度: {order.progress}%
                        </span>
                        <div className="flex items-center gap-1">
                          {order.status === 'IN_PROGRESS' && <Play className="h-3 w-3 text-blue-500" />}
                          {order.status === 'COMPLETED' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {order.status === 'DELAYED' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* 右侧时间轴 */}
            <div className="flex-1">
              {/* 时间轴头部 */}
              <div className="p-4 border-b bg-muted/50">
                <div className="flex">
                  {timeGrid.map((date, index) => (
                    <div
                      key={index}
                      className="flex-1 text-center text-xs text-muted-foreground border-r last:border-r-0"
                    >
                      <div>{date.getMonth() + 1}/{date.getDate()}</div>
                      <div className="text-xs">{['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 甘特图内容 */}
              <ScrollArea className="h-96">
                <div className="relative">
                  {orders.map((order, orderIndex) => (
                    <div key={order.id} className="relative h-16 border-b">
                      {/* 今日线 */}
                      {orderIndex === 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{
                            left: `${((new Date().getTime() - timeGrid[0].getTime()) / (timeGrid[timeGrid.length - 1].getTime() - timeGrid[0].getTime())) * 100}%`
                          }}
                        />
                      )}

                      {/* 阶段条 */}
                      {order.stages.map((stage, stageIndex) => {
                        const position = calculatePosition(stage.startDate, stage.endDate, timeGrid)
                        return (
                          <div
                            key={stage.stage}
                            className={`absolute h-6 rounded ${statusColors[stage.status]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                            style={{
                              left: `${position.left}%`,
                              width: `${position.width}%`,
                              top: `${8 + stageIndex * 8}px`
                            }}
                            title={`${stage.title}: ${stage.startDate.toLocaleDateString()} - ${stage.endDate.toLocaleDateString()}`}
                          >
                            <div className="px-2 py-1 text-white text-xs truncate">
                              {stage.title} ({stage.progress}%)
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图例 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>进行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>待开始</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>延期</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-red-500"></div>
              <span>今日</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
