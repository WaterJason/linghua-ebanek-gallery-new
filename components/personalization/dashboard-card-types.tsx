"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSignIcon,
  PackageIcon,
  UsersIcon,
  ShoppingCartIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon,
  BellIcon,
  ZapIcon
} from 'lucide-react'

// 仪表盘卡片配置类型
export interface DashboardCardConfig {
  id: string
  type: string
  title: string
  description: string
  icon: React.ComponentType<any>
  category: string
  defaultSize: { width: number; height: number }
  configurable: boolean
  dataSource?: string
}

// 可用的仪表盘卡片类型
export const DASHBOARD_CARD_TYPES: DashboardCardConfig[] = [
  {
    id: 'sales-overview',
    type: 'sales-overview',
    title: '销售概览',
    description: '今日/本周/本月销售数据',
    icon: DollarSignIcon,
    category: 'sales',
    defaultSize: { width: 2, height: 1 },
    configurable: true,
    dataSource: 'sales'
  },
  {
    id: 'inventory-alerts',
    type: 'inventory-alerts',
    title: '库存预警',
    description: '低库存和缺货提醒',
    icon: AlertTriangleIcon,
    category: 'inventory',
    defaultSize: { width: 1, height: 1 },
    configurable: true,
    dataSource: 'inventory'
  },
  {
    id: 'financial-status',
    type: 'financial-status',
    title: '财务状况',
    description: '收支情况和账户余额',
    icon: BarChart3Icon,
    category: 'finance',
    defaultSize: { width: 2, height: 1 },
    configurable: true,
    dataSource: 'finance'
  },
  {
    id: 'employee-performance',
    type: 'employee-performance',
    title: '员工绩效',
    description: '员工工作量和绩效',
    icon: UsersIcon,
    category: 'employee',
    defaultSize: { width: 1, height: 1 },
    configurable: true,
    dataSource: 'employee'
  },
  {
    id: 'customer-stats',
    type: 'customer-stats',
    title: '客户统计',
    description: '客户数量和类型分布',
    icon: PieChartIcon,
    category: 'customer',
    defaultSize: { width: 1, height: 1 },
    configurable: true,
    dataSource: 'customer'
  },
  {
    id: 'order-status',
    type: 'order-status',
    title: '订单状态',
    description: '订单处理进度',
    icon: ShoppingCartIcon,
    category: 'sales',
    defaultSize: { width: 2, height: 1 },
    configurable: true,
    dataSource: 'orders'
  },
  {
    id: 'production-progress',
    type: 'production-progress',
    title: '生产进度',
    description: '制作工单完成情况',
    icon: PackageIcon,
    category: 'production',
    defaultSize: { width: 1, height: 1 },
    configurable: true,
    dataSource: 'production'
  },
  {
    id: 'channel-analysis',
    type: 'channel-analysis',
    title: '渠道分析',
    description: '渠道销售数据',
    icon: TrendingUpIcon,
    category: 'channel',
    defaultSize: { width: 2, height: 1 },
    configurable: true,
    dataSource: 'channels'
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: '快速操作',
    description: '常用功能快捷入口',
    icon: ZapIcon,
    category: 'system',
    defaultSize: { width: 1, height: 2 },
    configurable: false
  },
  {
    id: 'notifications',
    type: 'notifications',
    title: '通知消息',
    description: '系统通知和提醒',
    icon: BellIcon,
    category: 'system',
    defaultSize: { width: 1, height: 2 },
    configurable: true,
    dataSource: 'notifications'
  }
]

// 仪表盘卡片组件接口
export interface DashboardCardProps {
  config: any
  data?: any
  onEdit?: () => void
  onRemove?: () => void
  isEditing?: boolean
}

// 销售概览卡片
export function SalesOverviewCard({ config, data, onEdit, onRemove, isEditing }: DashboardCardProps) {
  const salesData = data || {
    today: { amount: 12500, change: 8.5 },
    week: { amount: 85600, change: -2.3 },
    month: { amount: 342000, change: 15.2 }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">销售概览</CardTitle>
          {isEditing && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="text-xs text-blue-600">编辑</button>
              <button onClick={onRemove} className="text-xs text-red-600">删除</button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold">¥{salesData.today.amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">今日</div>
            <div className={`text-xs flex items-center justify-center gap-1 ${
              salesData.today.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {salesData.today.change >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
              {Math.abs(salesData.today.change)}%
            </div>
          </div>
          <div>
            <div className="text-lg font-bold">¥{salesData.week.amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">本周</div>
            <div className={`text-xs flex items-center justify-center gap-1 ${
              salesData.week.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {salesData.week.change >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
              {Math.abs(salesData.week.change)}%
            </div>
          </div>
          <div>
            <div className="text-lg font-bold">¥{salesData.month.amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">本月</div>
            <div className={`text-xs flex items-center justify-center gap-1 ${
              salesData.month.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {salesData.month.change >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
              {Math.abs(salesData.month.change)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 库存预警卡片
export function InventoryAlertsCard({ config, data, onEdit, onRemove, isEditing }: DashboardCardProps) {
  const alertData = data || {
    lowStock: 12,
    outOfStock: 3,
    total: 156
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">库存预警</CardTitle>
          {isEditing && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="text-xs text-blue-600">编辑</button>
              <button onClick={onRemove} className="text-xs text-red-600">删除</button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">缺货商品</span>
            <Badge variant="destructive">{alertData.outOfStock}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">低库存</span>
            <Badge variant="secondary">{alertData.lowStock}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">总商品数</span>
            <span className="text-sm font-medium">{alertData.total}</span>
          </div>
        </div>
        <Progress value={(alertData.total - alertData.lowStock - alertData.outOfStock) / alertData.total * 100} className="h-2" />
        <div className="text-xs text-center text-muted-foreground">
          库存健康度: {Math.round((alertData.total - alertData.lowStock - alertData.outOfStock) / alertData.total * 100)}%
        </div>
      </CardContent>
    </Card>
  )
}

// 快速操作卡片
export function QuickActionsCard({ config, data, onEdit, onRemove, isEditing }: DashboardCardProps) {
  const actions = [
    { label: '新建产品', icon: PackageIcon, href: '/products?action=new' },
    { label: '添加客户', icon: UsersIcon, href: '/customers?action=new' },
    { label: '创建订单', icon: ShoppingCartIcon, href: '/sales/orders?action=new' },
    { label: '库存盘点', icon: BarChart3Icon, href: '/inventory?action=count' },
    { label: '财务记录', icon: DollarSignIcon, href: '/finance/transactions?action=new' },
    { label: '员工管理', icon: CalendarIcon, href: '/employees' }
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">快速操作</CardTitle>
          {isEditing && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="text-xs text-blue-600">编辑</button>
              <button onClick={onRemove} className="text-xs text-red-600">删除</button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => window.open(action.href, '_blank')}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{action.label}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// 卡片组件映射
export const DASHBOARD_CARD_COMPONENTS = {
  'sales-overview': SalesOverviewCard,
  'inventory-alerts': InventoryAlertsCard,
  'quick-actions': QuickActionsCard,
  // 其他卡片组件可以后续添加
}
