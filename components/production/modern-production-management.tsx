'use client'

import { useState, useEffect } from 'react'
import { ModernPageContainer } from '@/components/ui/modern-page-container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEnhancedOperations } from '@/hooks/use-enhanced-operations'
import { 
  LayoutGrid, 
  List, 
  Calendar, 
  Plus, 
  RefreshCw, 
  Filter,
  Search,
  Bell,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { ProductionOrdersList } from './production-orders-list'
import { ProductionKanbanView } from './production-kanban-view'
import { ProductionGanttView } from './production-gantt-view'
import { ProductionDashboard } from './production-dashboard'
import { ProductionAlerts } from './production-alerts'
import { CreateProductionOrderDialog } from './create-production-order-dialog'
import { ProductionFilters } from './production-filters'

export type ViewMode = 'list' | 'kanban' | 'gantt' | 'dashboard'

interface ProductionStats {
  totalOrders: number
  inProgress: number
  completed: number
  delayed: number
  alertsCount: number
}

export function ModernProductionManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState<ProductionStats>({
    totalOrders: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    alertsCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const { executeOperation, isOperationInProgress } = useEnhancedOperations()

  // 加载统计数据
  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/production/orders?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        const orders = data.data || []
        
        const newStats = {
          totalOrders: orders.length,
          inProgress: orders.filter((o: any) => o.status === 'IN_PROGRESS').length,
          completed: orders.filter((o: any) => o.status === 'COMPLETED').length,
          delayed: orders.filter((o: any) => o.status === 'DELAYED').length,
          alertsCount: 0 // 将通过预警API获取
        }
        
        setStats(newStats)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = async () => {
    await executeOperation(
      async () => {
        await loadStats()
      },
      {
        loadingMessage: '正在刷新数据...',
        successMessage: '数据刷新成功',
        errorMessage: '数据刷新失败'
      }
    )
  }

  // 初始加载
  useEffect(() => {
    loadStats()
  }, [])

  // 自动刷新（30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const viewModeButtons = [
    { mode: 'dashboard' as ViewMode, icon: TrendingUp, label: '仪表板', description: '总览和分析' },
    { mode: 'list' as ViewMode, icon: List, label: '列表视图', description: '详细列表' },
    { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: '看板视图', description: '按阶段分组' },
    { mode: 'gantt' as ViewMode, icon: Calendar, label: '甘特图', description: '时间线视图' },
  ]

  const statsCards = [
    {
      title: '总订单数',
      value: stats.totalOrders,
      icon: List,
      color: 'blue',
      description: '所有生产订单'
    },
    {
      title: '进行中',
      value: stats.inProgress,
      icon: Clock,
      color: 'orange',
      description: '正在生产的订单'
    },
    {
      title: '已完成',
      value: stats.completed,
      icon: TrendingUp,
      color: 'green',
      description: '已完成的订单'
    },
    {
      title: '延期订单',
      value: stats.delayed,
      icon: AlertTriangle,
      color: 'red',
      description: '需要关注的订单'
    }
  ]

  return (
    <ModernPageContainer
      title="生产订单管理"
      description="智能生产订单管理系统 - 8阶段生产流程管理"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hidden md:flex"
          >
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isOperationInProgress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isOperationInProgress ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建订单
          </Button>
        </div>
      }
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 text-${card.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 预警通知 */}
      <ProductionAlerts className="mb-6" />

      {/* 视图模式切换 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">视图模式:</span>
          <div className="flex items-center gap-1">
            {viewModeButtons.map((button) => {
              const IconComponent = button.icon
              return (
                <Button
                  key={button.mode}
                  variant={viewMode === button.mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(button.mode)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{button.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>最后更新: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 筛选器 */}
      {showFilters && (
        <div className="mb-6">
          <ProductionFilters onFiltersChange={(filters) => {
            // 处理筛选器变更
            console.log('Filters changed:', filters)
          }} />
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="space-y-6">
        {viewMode === 'dashboard' && <ProductionDashboard />}
        {viewMode === 'list' && <ProductionOrdersList />}
        {viewMode === 'kanban' && <ProductionKanbanView />}
        {viewMode === 'gantt' && <ProductionGanttView />}
      </div>

      {/* 创建订单对话框 */}
      <CreateProductionOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          handleRefresh()
        }}
      />
    </ModernPageContainer>
  )
}
