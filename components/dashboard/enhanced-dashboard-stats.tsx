"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  BarChart3Icon, TrendingUpIcon, ShoppingCartIcon,
  UsersIcon, PackageIcon, CoffeeIcon, CalendarIcon,
  ArrowUpIcon, ArrowDownIcon, AlertTriangleIcon,
  DollarSignIcon, PercentIcon, ClipboardListIcon,
  StarIcon, TrendingDownIcon, ActivityIcon,
  TargetIcon, ZapIcon, AwardIcon
} from "lucide-react"

interface EnhancedStatCardProps {
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
  progress?: number
  target?: number
  className?: string
  size?: "default" | "large"
  showSparkline?: boolean
  sparklineData?: number[]
}

export function EnhancedStatCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  description,
  progress,
  target,
  className,
  size = "default",
  showSparkline = false,
  sparklineData = []
}: EnhancedStatCardProps) {
  const isLarge = size === "large"
  
  return (
    <Card className={cn(
      "stat-card card-hover border-0 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
      isLarge && "lg:col-span-2",
      className
    )}>
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-gray-50 dark:to-gray-800/50 rounded-full -translate-y-16 translate-x-16 opacity-50" />
      
      <CardContent className={cn("p-6", isLarge && "p-8")}>
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex items-center justify-center rounded-xl shadow-sm relative z-10",
            isLarge ? "w-16 h-16" : "w-12 h-12",
            iconColor
          )}>
            {icon}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {trend && (
              <Badge 
                variant={trend.isPositive ? "default" : "destructive"}
                className={cn(
                  "flex items-center text-xs font-semibold px-2 py-1",
                  trend.isPositive
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </Badge>
            )}
            
            {target && (
              <div className="text-xs text-muted-foreground">
                目标: {target}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className={cn(
              "font-medium text-muted-foreground mb-1",
              isLarge ? "text-base" : "text-sm"
            )}>
              {title}
            </h3>
            <p className={cn(
              "font-bold text-gray-900 dark:text-gray-100",
              isLarge ? "text-4xl" : "text-3xl"
            )}>
              {value}
            </p>
          </div>
          
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>完成度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              {description}
            </p>
          )}
          
          {showSparkline && sparklineData.length > 0 && (
            <div className="mt-3">
              <div className="flex items-end space-x-1 h-8">
                {sparklineData.map((value, index) => (
                  <div
                    key={index}
                    className="bg-blue-200 dark:bg-blue-800 rounded-sm flex-1 transition-all duration-300 hover:bg-blue-300 dark:hover:bg-blue-700"
                    style={{ height: `${(value / Math.max(...sparklineData)) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface EnhancedDashboardStatsProps {
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
  performance?: {
    overallScore: number
    salesEfficiency: number
    inventoryTurnover: number
    customerSatisfaction: number
  }
  viewMode?: string
  className?: string
}

export function EnhancedDashboardStats({
  data,
  performance,
  viewMode = "overview",
  className
}: EnhancedDashboardStatsProps) {
  // 确保数据存在，防止undefined错误
  const gallerySales = data?.gallerySales || { current: 0, previous: 0, growth: 0 };
  const coffeeSales = data?.coffeeSales || { current: 0, previous: 0, growth: 0 };
  const workshops = data?.workshops || { current: 0, previous: 0, growth: 0 };
  const inventory = data?.inventory || { total: 0, lowStock: 0 };
  const employees = data?.employees || { total: 1, active: 0 };
  const orders = data?.orders;

  // 计算总销售额
  const totalSales = gallerySales.current + coffeeSales.current;
  const previousTotalSales = gallerySales.previous + coffeeSales.previous;
  const totalSalesGrowth = previousTotalSales === 0 ? 0 :
    ((totalSales - previousTotalSales) / previousTotalSales) * 100;

  // 生成模拟的趋势数据
  const generateSparklineData = (growth: number) => {
    const baseValue = 50;
    return Array.from({ length: 7 }, (_, i) => {
      const trend = growth > 0 ? 1 + (i * 0.1) : 1 - (i * 0.05);
      return Math.max(10, baseValue * trend + (Math.random() - 0.5) * 10);
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* 主要指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedStatCard
          title="总销售额"
          value={`¥${totalSales.toLocaleString()}`}
          icon={<BarChart3Icon className="h-6 w-6" />}
          iconColor="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400"
          trend={{
            value: parseFloat(totalSalesGrowth.toFixed(1)),
            label: "同比",
            isPositive: totalSalesGrowth > 0
          }}
          size="large"
          showSparkline={true}
          sparklineData={generateSparklineData(totalSalesGrowth)}
        />

        <EnhancedStatCard
          title="珐琅馆销售"
          value={`¥${gallerySales.current.toLocaleString()}`}
          icon={<DollarSignIcon className="h-5 w-5" />}
          iconColor="bg-gradient-to-br from-green-100 to-green-200 text-green-700 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400"
          trend={{
            value: parseFloat(gallerySales.growth.toFixed(1)),
            label: "同比",
            isPositive: gallerySales.growth > 0
          }}
          progress={Math.min(100, (gallerySales.current / 100000) * 100)}
          target={100000}
        />

        <EnhancedStatCard
          title="咖啡店销售"
          value={`¥${coffeeSales.current.toLocaleString()}`}
          icon={<CoffeeIcon className="h-5 w-5" />}
          iconColor="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 dark:from-amber-900/30 dark:to-amber-800/30 dark:text-amber-400"
          trend={{
            value: parseFloat(coffeeSales.growth.toFixed(1)),
            label: "同比",
            isPositive: coffeeSales.growth > 0
          }}
          progress={Math.min(100, (coffeeSales.current / 50000) * 100)}
          target={50000}
        />

        <EnhancedStatCard
          title="手作团建"
          value={workshops.current}
          icon={<CalendarIcon className="h-5 w-5" />}
          iconColor="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-400"
          trend={{
            value: parseFloat(workshops.growth.toFixed(1)),
            label: "同比",
            isPositive: workshops.growth > 0
          }}
          description="近期场次"
        />
      </div>

      {/* 详细视图的额外指标 */}
      {viewMode === "detailed" && performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnhancedStatCard
            title="综合评分"
            value={`${performance.overallScore.toFixed(0)}分`}
            icon={<AwardIcon className="h-5 w-5" />}
            iconColor="bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/30 dark:to-indigo-800/30 dark:text-indigo-400"
            progress={performance.overallScore}
            description="业务综合表现"
          />

          <EnhancedStatCard
            title="销售效率"
            value={`¥${performance.salesEfficiency.toLocaleString()}`}
            icon={<ZapIcon className="h-5 w-5" />}
            iconColor="bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-700 dark:from-cyan-900/30 dark:to-cyan-800/30 dark:text-cyan-400"
            description="人均销售额"
          />

          <EnhancedStatCard
            title="库存周转"
            value={`${performance.inventoryTurnover.toFixed(2)}`}
            icon={<ActivityIcon className="h-5 w-5" />}
            iconColor="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-400"
            description="库存周转率"
          />

          <EnhancedStatCard
            title="客户满意度"
            value={`${performance.customerSatisfaction.toFixed(0)}%`}
            icon={<StarIcon className="h-5 w-5" />}
            iconColor="bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 dark:from-pink-900/30 dark:to-pink-800/30 dark:text-pink-400"
            progress={performance.customerSatisfaction}
            description="客户反馈评分"
          />
        </div>
      )}

      {/* 运营指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EnhancedStatCard
          title="库存总量"
          value={inventory.total}
          icon={<PackageIcon className="h-5 w-5" />}
          iconColor="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 dark:from-teal-900/30 dark:to-teal-800/30 dark:text-teal-400"
          description={`低库存警告: ${inventory.lowStock}`}
        />

        <EnhancedStatCard
          title="员工状况"
          value={`${employees.active}/${employees.total}`}
          icon={<UsersIcon className="h-5 w-5" />}
          iconColor="bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 dark:from-violet-900/30 dark:to-violet-800/30 dark:text-violet-400"
          progress={Math.round((employees.active / employees.total) * 100)}
          description={`在职率: ${Math.round((employees.active / employees.total) * 100)}%`}
        />

        {orders && (
          <EnhancedStatCard
            title="订单管理"
            value={orders.total}
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            iconColor="bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 dark:from-rose-900/30 dark:to-rose-800/30 dark:text-rose-400"
            trend={{
              value: parseFloat(orders.growth.toFixed(1)),
              label: "同比",
              isPositive: orders.growth > 0
            }}
            description={`待处理: ${orders.pending}`}
          />
        )}
      </div>
    </div>
  )
}
