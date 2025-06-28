'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  User,
  Clock,
  Package,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  TrendingUp
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

interface ProductionOrderDetailDialogProps {
  order: ProductionOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

const statusLabels = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  ON_HOLD: '暂停',
  DELAYED: '延期',
  EXCEPTION: '异常'
}

const priorityLabels = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急'
}

export function ProductionOrderDetailDialog({ order, open, onOpenChange }: ProductionOrderDetailDialogProps) {
  if (!order) return null

  // 模拟详细数据
  const mockStageHistory = [
    {
      stage: 'DESIGN',
      title: '产品设计',
      status: 'COMPLETED',
      startTime: '2024-01-15 09:00',
      endTime: '2024-01-18 17:00',
      duration: '3天8小时',
      operator: '李设计师',
      notes: '设计方案已确认，客户满意'
    },
    {
      stage: 'MATERIAL_PROCUREMENT',
      title: '底胎采购',
      status: 'COMPLETED',
      startTime: '2024-01-19 10:00',
      endTime: '2024-01-22 16:00',
      duration: '3天6小时',
      operator: '采购部',
      notes: '材料已到货，质检合格'
    },
    {
      stage: 'IN_PRODUCTION',
      title: '工艺制作',
      status: 'IN_PROGRESS',
      startTime: '2024-01-25 08:00',
      endTime: null,
      duration: '进行中',
      operator: '张师傅',
      notes: '正在进行掐丝工艺'
    }
  ]

  const mockQualityRecords = [
    {
      stage: 'MATERIAL_PROCUREMENT',
      inspector: '质检员A',
      result: 'PASSED',
      score: 95,
      date: '2024-01-22',
      notes: '材料质量优良'
    }
  ]

  const mockCostRecords = [
    {
      stage: 'DESIGN',
      type: '人工成本',
      amount: 800,
      description: '设计费用'
    },
    {
      stage: 'MATERIAL_PROCUREMENT',
      type: '材料成本',
      amount: 1200,
      description: '底胎及原材料'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>生产订单详情</DialogTitle>
          <DialogDescription>
            订单号: {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">订单号</div>
                  <div className="font-medium">{order.orderNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">产品名称</div>
                  <div className="font-medium">{order.productName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">数量</div>
                  <div className="font-medium">{order.quantity}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">优先级</div>
                  <Badge variant="outline">
                    {priorityLabels[order.priority as keyof typeof priorityLabels]}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">当前阶段</div>
                  <Badge variant="default">
                    {stageLabels[order.currentStage as keyof typeof stageLabels]}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">状态</div>
                  <Badge variant="outline">
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">当前地点</div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">{order.location}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">负责人</div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="text-sm">{order.assignedTo || order.employee.name}</span>
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">整体进度</span>
                  <span className="text-sm text-muted-foreground">{order.progressPercentage}%</span>
                </div>
                <Progress value={order.progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* 详细信息标签页 */}
          <Tabs defaultValue="stages" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stages">阶段历史</TabsTrigger>
              <TabsTrigger value="quality">质量记录</TabsTrigger>
              <TabsTrigger value="costs">成本记录</TabsTrigger>
              <TabsTrigger value="timeline">时间线</TabsTrigger>
            </TabsList>

            <TabsContent value="stages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>阶段历史</CardTitle>
                  <CardDescription>生产订单的各阶段执行情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockStageHistory.map((stage, index) => (
                      <div key={stage.stage} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {stage.status === 'COMPLETED' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {stage.status === 'IN_PROGRESS' && (
                            <Clock className="h-5 w-5 text-blue-500" />
                          )}
                          {stage.status === 'PENDING' && (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{stage.title}</h4>
                            <Badge variant={stage.status === 'COMPLETED' ? 'default' : 'outline'}>
                              {stage.status === 'COMPLETED' ? '已完成' : 
                               stage.status === 'IN_PROGRESS' ? '进行中' : '待开始'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>开始时间: {stage.startTime}</div>
                            <div>结束时间: {stage.endTime || '进行中'}</div>
                            <div>耗时: {stage.duration}</div>
                            <div>操作员: {stage.operator}</div>
                          </div>
                          {stage.notes && (
                            <div className="mt-2 text-sm">{stage.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>质量记录</CardTitle>
                  <CardDescription>各阶段的质量检验记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockQualityRecords.map((record, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {stageLabels[record.stage as keyof typeof stageLabels]} - 质检
                          </h4>
                          <Badge variant={record.result === 'PASSED' ? 'default' : 'destructive'}>
                            {record.result === 'PASSED' ? '合格' : '不合格'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>检验员: {record.inspector}</div>
                          <div>检验日期: {record.date}</div>
                          <div>质量评分: {record.score}分</div>
                          <div>结果: {record.result === 'PASSED' ? '合格' : '不合格'}</div>
                        </div>
                        {record.notes && (
                          <div className="mt-2 text-sm">{record.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>成本记录</CardTitle>
                  <CardDescription>各阶段的成本明细</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCostRecords.map((cost, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{cost.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {stageLabels[cost.stage as keyof typeof stageLabels]} - {cost.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">¥{cost.amount}</div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between font-medium">
                        <span>总成本</span>
                        <span>¥{mockCostRecords.reduce((sum, cost) => sum + cost.amount, 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>时间线</CardTitle>
                  <CardDescription>订单的完整时间线</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>订单创建: {new Date(order.orderDate).toLocaleString()}</span>
                    </div>
                    {order.estimatedEndDate && (
                      <div className="flex items-center gap-4 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>预计完成: {new Date(order.estimatedEndDate).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>当前进度: {order.progressPercentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
