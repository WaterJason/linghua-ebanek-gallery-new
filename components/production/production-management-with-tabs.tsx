'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModernPageContainer } from '@/components/ui/modern-page-container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEnhancedOperations } from '@/hooks/use-enhanced-operations'
import {
  FileText,
  Building,
  Wrench,
  BarChart3,
  RefreshCw,
  Plus,
  Clock,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Zap
} from 'lucide-react'

// 导入各个标签页的组件
import { ModernProductionManagement } from './modern-production-management'
import { ProductionBaseManagement } from '@/components/production-base-management'
import { ProductionManagement } from '@/components/production-management'
import { ProductionReports } from './production-reports'
import DualLocationInventoryManagement from '@/components/inventory/dual-location-inventory-management'
import CostAccountingManagement from '@/components/cost-accounting/cost-accounting-management'

interface ProductionStats {
  totalOrders: number
  inProgress: number
  completed: number
  delayed: number
  totalBases: number
  activeBases: number
}

export function ProductionManagementWithTabs() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('orders')
  const [stats, setStats] = useState<ProductionStats>({
    totalOrders: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    totalBases: 0,
    activeBases: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const { executeOperation, isOperationInProgress } = useEnhancedOperations()

  // 从URL参数中获取初始标签
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['orders', 'bases', 'production', 'reports', 'inventory', 'cost'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 处理标签变化
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // 更新URL参数，但不刷新页面
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.pushState({}, '', url)
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      setIsLoading(true)
      
      // 并行加载生产订单和生产基地数据
      const [ordersResponse, basesResponse] = await Promise.all([
        fetch('/api/production/orders?page=1&limit=1000'),
        fetch('/api/production/bases')
      ])
      
      let ordersData = { data: [] }
      let basesData = []
      
      if (ordersResponse.ok) {
        ordersData = await ordersResponse.json()
      }
      
      if (basesResponse.ok) {
        basesData = await basesResponse.json()
      }
      
      const orders = ordersData.data || []
      const bases = basesData || []
      
      const newStats = {
        totalOrders: orders.length,
        inProgress: orders.filter((o: any) => o.status === 'IN_PROGRESS').length,
        completed: orders.filter((o: any) => o.status === 'COMPLETED').length,
        delayed: orders.filter((o: any) => o.status === 'DELAYED').length,
        totalBases: bases.length,
        activeBases: bases.filter((b: any) => b.isActive).length
      }
      
      setStats(newStats)
      setLastRefresh(new Date())
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

  const tabsConfig = [
    {
      value: 'orders',
      label: '生产订单',
      icon: FileText,
      description: '智能生产订单管理'
    },
    {
      value: 'bases',
      label: '生产基地',
      icon: Building,
      description: '生产基地管理'
    },
    {
      value: 'production',
      label: '计件工单',
      icon: Wrench,
      description: '计件工单管理'
    },
    {
      value: 'reports',
      label: '制作报表',
      icon: BarChart3,
      description: '生产数据分析'
    },
    {
      value: 'inventory',
      label: '库存自动化',
      icon: Package,
      description: '双地点库存自动化管理'
    },
    {
      value: 'cost',
      label: '成本核算',
      icon: DollarSign,
      description: '成本核算与薪酬管理'
    }
  ]

  const statsCards = [
    {
      title: '总订单数',
      value: stats.totalOrders,
      icon: FileText,
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
      title: '生产基地',
      value: `${stats.activeBases}/${stats.totalBases}`,
      icon: Building,
      color: 'purple',
      description: '活跃/总基地数'
    }
  ]

  return (
    <ModernPageContainer
      title="生产/供应链管理"
      description="智能生产/供应链管理系统 - 8阶段生产流程管理"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isOperationInProgress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isOperationInProgress ? 'animate-spin' : ''}`} />
            刷新
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

      {/* 标签页导航和内容 */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto">
            {tabsConfig.map((tab) => {
              const IconComponent = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 2)}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>最后更新: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* 标签页内容 */}
        <TabsContent value="orders" className="space-y-4">
          <ModernProductionManagement />
        </TabsContent>

        <TabsContent value="bases" className="space-y-4">
          <ProductionBaseManagement />
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <ProductionManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ProductionReports />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <DualLocationInventoryManagement />
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <CostAccountingManagement />
        </TabsContent>
      </Tabs>
    </ModernPageContainer>
  )
}
