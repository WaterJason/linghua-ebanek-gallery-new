"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  DollarSignIcon,
  UsersIcon,
  PackageIcon,
  CalendarIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ExecutiveSummaryProps {
  data: any
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  // 计算总销售额
  const totalSales = (data.gallerySales?.current || 0) + (data.coffeeSales?.current || 0)
  const previousTotalSales = (data.gallerySales?.previous || 0) + (data.coffeeSales?.previous || 0)
  const salesGrowth = previousTotalSales === 0 ? 0 : 
    ((totalSales - previousTotalSales) / previousTotalSales) * 100

  // 计算业务健康度
  const healthScore = calculateBusinessHealth(data)
  
  // 关键指标
  const keyMetrics = [
    {
      label: "总销售额",
      value: `¥${totalSales.toLocaleString()}`,
      change: salesGrowth,
      icon: DollarSignIcon,
      color: "text-green-600"
    },
    {
      label: "活跃员工",
      value: data.employees?.active || 0,
      total: data.employees?.total || 0,
      icon: UsersIcon,
      color: "text-blue-600"
    },
    {
      label: "库存状态",
      value: data.inventory?.total || 0,
      warning: data.inventory?.lowStock || 0,
      icon: PackageIcon,
      color: "text-purple-600"
    },
    {
      label: "工坊活动",
      value: data.workshops?.current || 0,
      change: data.workshops?.growth || 0,
      icon: CalendarIcon,
      color: "text-amber-600"
    }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5" />
            高管总览
          </CardTitle>
          <Badge 
            variant={healthScore >= 80 ? "default" : healthScore >= 60 ? "secondary" : "destructive"}
            className="text-xs"
          >
            健康度 {healthScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 业务健康度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">业务健康度</span>
            <span className="font-medium">{healthScore}%</span>
          </div>
          <Progress 
            value={healthScore} 
            className={cn(
              "h-2",
              healthScore >= 80 ? "bg-green-100" : 
              healthScore >= 60 ? "bg-yellow-100" : "bg-red-100"
            )}
          />
          <p className="text-xs text-muted-foreground">
            {healthScore >= 80 ? "业务运行良好" : 
             healthScore >= 60 ? "需要关注部分指标" : "需要重点关注"}
          </p>
        </div>

        {/* 关键指标 */}
        <div className="space-y-3">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-full bg-gray-100 dark:bg-gray-800", metric.color)}>
                  <metric.icon className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{metric.value}</div>
                {metric.change !== undefined && (
                  <div className={cn(
                    "text-xs flex items-center gap-1",
                    metric.change > 0 ? "text-green-600" : 
                    metric.change < 0 ? "text-red-600" : "text-gray-500"
                  )}>
                    {metric.change > 0 ? (
                      <TrendingUpIcon className="w-3 h-3" />
                    ) : metric.change < 0 ? (
                      <TrendingDownIcon className="w-3 h-3" />
                    ) : null}
                    {Math.abs(metric.change).toFixed(1)}%
                  </div>
                )}
                {metric.total !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    / {metric.total} 总计
                  </div>
                )}
                {metric.warning !== undefined && metric.warning > 0 && (
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangleIcon className="w-3 h-3" />
                    {metric.warning} 预警
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 今日重点 */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">今日重点</h4>
          <div className="space-y-2">
            {data.inventory?.lowStock > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangleIcon className="w-3 h-3 text-amber-500" />
                <span className="text-muted-foreground">
                  {data.inventory.lowStock} 个商品库存不足
                </span>
              </div>
            )}
            {data.orders?.pending > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangleIcon className="w-3 h-3 text-blue-500" />
                <span className="text-muted-foreground">
                  {data.orders.pending} 个订单待处理
                </span>
              </div>
            )}
            {(!data.inventory?.lowStock || data.inventory.lowStock === 0) && 
             (!data.orders?.pending || data.orders.pending === 0) && (
              <div className="flex items-center gap-2 text-xs">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">暂无紧急事项</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 计算业务健康度
function calculateBusinessHealth(data: any): number {
  let score = 100
  
  // 销售增长 (30分)
  const totalSales = (data.gallerySales?.current || 0) + (data.coffeeSales?.current || 0)
  const previousTotalSales = (data.gallerySales?.previous || 0) + (data.coffeeSales?.previous || 0)
  const salesGrowth = previousTotalSales === 0 ? 0 : 
    ((totalSales - previousTotalSales) / previousTotalSales) * 100
  
  if (salesGrowth < -10) score -= 30
  else if (salesGrowth < 0) score -= 15
  else if (salesGrowth < 5) score -= 5
  
  // 库存健康度 (25分)
  const inventoryTotal = data.inventory?.total || 0
  const lowStock = data.inventory?.lowStock || 0
  if (inventoryTotal > 0) {
    const lowStockRatio = lowStock / inventoryTotal
    if (lowStockRatio > 0.2) score -= 25
    else if (lowStockRatio > 0.1) score -= 15
    else if (lowStockRatio > 0.05) score -= 5
  }
  
  // 员工活跃度 (20分)
  const totalEmployees = data.employees?.total || 0
  const activeEmployees = data.employees?.active || 0
  if (totalEmployees > 0) {
    const activeRatio = activeEmployees / totalEmployees
    if (activeRatio < 0.7) score -= 20
    else if (activeRatio < 0.8) score -= 10
    else if (activeRatio < 0.9) score -= 5
  }
  
  // 工坊业务 (15分)
  const workshopGrowth = data.workshops?.growth || 0
  if (workshopGrowth < -20) score -= 15
  else if (workshopGrowth < -10) score -= 10
  else if (workshopGrowth < 0) score -= 5
  
  // 订单处理 (10分)
  const pendingOrders = data.orders?.pending || 0
  const totalOrders = data.orders?.total || 0
  if (totalOrders > 0) {
    const pendingRatio = pendingOrders / totalOrders
    if (pendingRatio > 0.3) score -= 10
    else if (pendingRatio > 0.2) score -= 5
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
