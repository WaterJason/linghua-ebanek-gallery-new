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
    <Card className={cn(
      "stat-card card-hover border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl shadow-sm",
            iconColor
          )}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-sm font-semibold px-2 py-1 rounded-full",
              trend.isPositive
                ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
                : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30"
            )}>
              {trend.isPositive ? (
                <ArrowUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              {description}
            </p>
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
  // 确保数据存在，防止undefined错误
  const gallerySales = data?.gallerySales || { current: 0, previous: 0, growth: 0 };
  const coffeeSales = data?.coffeeSales || { current: 0, previous: 0, growth: 0 };
  const workshops = data?.workshops || { current: 0, previous: 0, growth: 0 };
  const inventory = data?.inventory || { total: 0, lowStock: 0 };
  const employees = data?.employees || { total: 1, active: 0 }; // 避免除以零错误
  const orders = data?.orders;

  // 计算总销售额
  const totalSales = gallerySales.current + coffeeSales.current;
  const previousTotalSales = gallerySales.previous + coffeeSales.previous;
  const totalSalesGrowth = previousTotalSales === 0 ? 0 :
    ((totalSales - previousTotalSales) / previousTotalSales) * 100;

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
        value={`¥${gallerySales.current.toLocaleString()}`}
        icon={<DollarSignIcon className="h-5 w-5" />}
        iconColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        trend={{
          value: parseFloat(gallerySales.growth.toFixed(1)),
          label: "同比",
          isPositive: gallerySales.growth > 0
        }}
      />

      <StatCard
        title="咖啡店销售"
        value={`¥${coffeeSales.current.toLocaleString()}`}
        icon={<CoffeeIcon className="h-5 w-5" />}
        iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        trend={{
          value: parseFloat(coffeeSales.growth.toFixed(1)),
          label: "同比",
          isPositive: coffeeSales.growth > 0
        }}
      />

      {orders ? (
        <StatCard
          title="订单数量"
          value={orders.total}
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          iconColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          trend={{
            value: parseFloat(orders.growth.toFixed(1)),
            label: "同比",
            isPositive: orders.growth > 0
          }}
          description={`待处理: ${orders.pending}`}
        />
      ) : (
        <StatCard
          title="手作团建"
          value={workshops.current}
          icon={<CalendarIcon className="h-5 w-5" />}
          iconColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          trend={{
            value: parseFloat(workshops.growth.toFixed(1)),
            label: "同比",
            isPositive: workshops.growth > 0
          }}
          description="近期场次"
        />
      )}

      <StatCard
        title="库存总量"
        value={inventory.total}
        icon={<PackageIcon className="h-5 w-5" />}
        iconColor="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
        description={`低库存警告: ${inventory.lowStock}`}
      />

      <StatCard
        title="员工数量"
        value={`${employees.active}/${employees.total}`}
        icon={<UsersIcon className="h-5 w-5" />}
        iconColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        description={`在职率: ${Math.round((employees.active / employees.total) * 100)}%`}
      />
    </div>
  )
}
