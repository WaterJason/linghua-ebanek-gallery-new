'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useEnhancedOperations } from '@/hooks/use-enhanced-operations'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Package
} from 'lucide-react'
import { ProductionOrderDetailDialog } from './production-order-detail-dialog'
import { StageTransitionDialog } from './stage-transition-dialog'

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

const statusColors = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  ON_HOLD: 'yellow',
  DELAYED: 'orange',
  EXCEPTION: 'red'
}

const priorityColors = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red'
}

export function ProductionOrdersList() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ProductionOrder[]>([])
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showTransitionDialog, setShowTransitionDialog] = useState(false)
  const [transitionOrder, setTransitionOrder] = useState<ProductionOrder | null>(null)

  const { executeOperation, isOperationInProgress } = useEnhancedOperations()

  // 加载订单数据
  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/production/orders?page=1&limit=100')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 筛选订单
  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(order => order.currentStage === stageFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, stageFilter])

  // 初始加载
  useEffect(() => {
    loadOrders()
  }, [])

  // 处理选择
  const handleSelectOrder = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId])
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id))
    } else {
      setSelectedOrders([])
    }
  }

  // 状态转换
  const handleStageTransition = (order: ProductionOrder) => {
    setTransitionOrder(order)
    setShowTransitionDialog(true)
  }

  // 查看详情
  const handleViewDetails = (order: ProductionOrder) => {
    setSelectedOrder(order)
    setShowDetailDialog(true)
  }

  // 批量操作
  const handleBatchOperation = async (operation: string) => {
    if (selectedOrders.length === 0) return

    await executeOperation(
      async () => {
        const response = await fetch('/api/production/orders/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: operation,
            data: { ids: selectedOrders }
          })
        })

        if (!response.ok) {
          throw new Error('批量操作失败')
        }

        await loadOrders()
        setSelectedOrders([])
      },
      {
        loadingMessage: '正在执行批量操作...',
        successMessage: '批量操作成功',
        errorMessage: '批量操作失败'
      }
    )
  }

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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>生产订单列表</CardTitle>
          
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索订单号或产品名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                {Object.entries(stageLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 批量操作 */}
        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <span className="text-sm">已选择 {selectedOrders.length} 个订单</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchOperation('update')}
            >
              批量更新
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchOperation('delete')}
            >
              批量删除
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>订单号</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>当前阶段</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>预计完成</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.productName}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {stageLabels[order.currentStage as keyof typeof stageLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status as keyof typeof statusColors] as any}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityColors[order.priority as keyof typeof priorityColors] as any}>
                      {priorityLabels[order.priority as keyof typeof priorityLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={order.progressPercentage} className="w-16" />
                      <span className="text-sm">{order.progressPercentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm">{order.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="text-sm">{order.assignedTo || order.employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.estimatedEndDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">
                          {new Date(order.estimatedEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStageTransition(order)}>
                          <Play className="mr-2 h-4 w-4" />
                          状态转换
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑订单
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">没有找到订单</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || stageFilter !== 'all'
                ? '请调整筛选条件'
                : '还没有创建任何生产订单'}
            </p>
          </div>
        )}
      </CardContent>

      {/* 订单详情对话框 */}
      <ProductionOrderDetailDialog
        order={selectedOrder}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* 状态转换对话框 */}
      <StageTransitionDialog
        order={transitionOrder}
        open={showTransitionDialog}
        onOpenChange={setShowTransitionDialog}
        onSuccess={() => {
          setShowTransitionDialog(false)
          loadOrders()
        }}
      />
    </Card>
  )
}
