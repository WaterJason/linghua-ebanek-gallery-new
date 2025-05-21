"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  BarChart3Icon, TrendingUpIcon, ShoppingCartIcon,
  UsersIcon, PackageIcon, CoffeeIcon, CalendarIcon,
  ArrowUpIcon, ArrowDownIcon, AlertTriangleIcon,
  DollarSignIcon, PercentIcon, ClipboardListIcon
} from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconColor: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  description,
  className
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-full", iconColor)}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center">
              {trend.isPositive ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              )}
              <p className={cn(
                "text-xs",
                trend.isPositive ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(trend.value)}% {trend.label}
              </p>
            </div>
          )}
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  data: {
    gallerySales: {
      current: number
      previous: number
      growth: number
    }
    coffeeSales: {
      current: number
      previous: number
      growth: number
    }
    workshops: {
      current: number
      previous: number
      growth: number
    }
    employees: {
      total: number
      active: number
    }
    inventory: {
      total: number
      lowStock: number
    }
    orders?: {
      total: number
      pending: number
      growth: number
    }
  }
  className?: string
}

export function DashboardStats({
  data,
  className
}: DashboardStatsProps) {
  // 计算总销售额
  const totalSales = data.gallerySales.current + data.coffeeSales.current
  const previousTotalSales = data.gallerySales.previous + data.coffeeSales.previous
  const totalSalesGrowth = previousTotalSales === 0 ? 0 : 
    ((totalSales - previousTotalSales) / previousTotalSales) * 100

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      <StatCard
        title="总销售额"
        value={`¥${totalSales.toLocaleString()}`}
        icon={<BarChart3Icon className="h-5 w-5" />}
        iconColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        trend={{
          value: parseFloat(totalSalesGrowth.toFixed(1)),
          label: "同比",
          isPositive: totalSalesGrowth > 0
        }}
      />
      
      <StatCard
        title="珐琅馆销售"
        value={`¥${data.gallerySales.current.toLocaleString()}`}
        icon={<DollarSignIcon className="h-5 w-5" />}
        iconColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        trend={{
          value: parseFloat(data.gallerySales.growth.toFixed(1)),
          label: "同比",
          isPositive: data.gallerySales.growth > 0
        }}
      />
      
      <StatCard
        title="咖啡店销售"
        value={`¥${data.coffeeSales.current.toLocaleString()}`}
        icon={<CoffeeIcon className="h-5 w-5" />}
        iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        trend={{
          value: parseFloat(data.coffeeSales.growth.toFixed(1)),
          label: "同比",
          isPositive: data.coffeeSales.growth > 0
        }}
      />
      
      {data.orders ? (
        <StatCard
          title="订单数量"
          value={data.orders.total}
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          iconColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          trend={{
            value: parseFloat(data.orders.growth.toFixed(1)),
            label: "同比",
            isPositive: data.orders.growth > 0
          }}
          description={`待处理: ${data.orders.pending}`}
        />
      ) : (
        <StatCard
          title="手作团建"
          value={data.workshops.current}
          icon={<CalendarIcon className="h-5 w-5" />}
          iconColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          trend={{
            value: parseFloat(data.workshops.growth.toFixed(1)),
            label: "同比",
            isPositive: data.workshops.growth > 0
          }}
          description="近期场次"
        />
      )}
      
      <StatCard
        title="库存总量"
        value={data.inventory.total}
        icon={<PackageIcon className="h-5 w-5" />}
        iconColor="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
        description={`低库存警告: ${data.inventory.lowStock}`}
      />
      
      <StatCard
        title="员工数量"
        value={`${data.employees.active}/${data.employees.total}`}
        icon={<UsersIcon className="h-5 w-5" />}
        iconColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        description={`在职率: ${Math.round((data.employees.active / data.employees.total) * 100)}%`}
      />
    </div>
  )
}
