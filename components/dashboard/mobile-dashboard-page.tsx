"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { EnhancedChart } from "@/components/enhanced-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getDashboardData } from "@/lib/actions/system-actions"
import {
  BarChart3Icon, TrendingUpIcon, ShoppingCartIcon,
  UsersIcon, PackageIcon, CoffeeIcon, CalendarIcon,
  ArrowUpIcon, ArrowDownIcon, AlertTriangleIcon,
  DollarSignIcon
} from "lucide-react"
import Link from "next/link"

interface MobileDashboardCardProps {
  title: string
  icon: React.ReactNode
  iconColor: string
  value: string | number
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  chart?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

function MobileDashboardCard({
  title,
  icon,
  iconColor,
  value,
  trend,
  chart,
  collapsible = false,
  defaultCollapsed = true
}: MobileDashboardCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 pb-0">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => collapsible && setCollapsed(!collapsed)}
        >
          <div className="flex items-center">
            <div className={`p-1.5 rounded-md ${iconColor}`}>
              {icon}
            </div>
            <h3 className="text-sm font-medium ml-2">{title}</h3>
          </div>
          {trend && (
            <div className="flex items-center">
              {trend.isPositive ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(trend.value)}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="text-xl font-bold">{value}</div>
        {chart && !collapsed && (
          <div className="h-16 mt-2">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MobileDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")
  const [dashboardData, setDashboardData] = useState({
    gallerySales: {
      current: 0,
      previous: 0,
      growth: 0,
      data: []
    },
    coffeeSales: {
      current: 0,
      previous: 0,
      growth: 0,
      data: []
    },
    workshops: {
      current: 0,
      previous: 0,
      growth: 0,
      data: []
    },
    employees: {
      total: 0,
      active: 0,
      performance: []
    },
    inventory: {
      total: 0,
      lowStock: 0,
      distribution: []
    },
    recentSales: [],
    topProducts: []
  })

  // 加载仪表盘数据
  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  // 获取仪表盘数据
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // 使用服务器端操作获取仪表盘数据
      const data = await getDashboardData(timeRange)
      setDashboardData(data)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "加载失败",
        description: "无法加载仪表盘数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 计算总销售额
  const totalSales = dashboardData.gallerySales.current + dashboardData.coffeeSales.current
  const previousTotalSales = dashboardData.gallerySales.previous + dashboardData.coffeeSales.previous
  const totalSalesGrowth = previousTotalSales === 0 ? 0 :
    ((totalSales - previousTotalSales) / previousTotalSales) * 100

  // 合并销售数据
  const salesTrendData = dashboardData.gallerySales.data.map((item, index) => {
    const coffeeItem = dashboardData.coffeeSales.data[index] || { value: 0 }
    return {
      date: item.date,
      gallery: item.value,
      coffee: coffeeItem.value,
      total: item.value + coffeeItem.value
    }
  })

  return (
    <div className="space-y-4">
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={fetchDashboardData}
      />

      <QuickActions limit={4} showDescription={false} />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="sales">销售</TabsTrigger>
            <TabsTrigger value="inventory">库存</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <MobileDashboardCard
                title="总销售额"
                icon={<BarChart3Icon className="h-4 w-4" />}
                iconColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                value={`¥${totalSales.toLocaleString()}`}
                trend={{
                  value: parseFloat(totalSalesGrowth.toFixed(1)),
                  label: "同比",
                  isPositive: totalSalesGrowth > 0
                }}
              />

              <MobileDashboardCard
                title="手作团建"
                icon={<CalendarIcon className="h-4 w-4" />}
                iconColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                value={dashboardData.workshops.current}
                trend={{
                  value: parseFloat(dashboardData.workshops.growth.toFixed(1)),
                  label: "同比",
                  isPositive: dashboardData.workshops.growth > 0
                }}
              />
            </div>

            <EnhancedChart
              title="销售趋势"
              data={salesTrendData}
              type="area"
              xAxisKey="date"
              yAxisKeys={["gallery", "coffee", "total"]}
              height={250}
              options={{
                showGrid: false,
                areaType: "monotone",
                stacked: true
              }}
            />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href="/sales/reports">
                  <BarChart3Icon className="mr-2 h-4 w-4" />
                  销售报表
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href="/schedule">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  排班管理
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <MobileDashboardCard
                title="珐琅馆销售"
                icon={<DollarSignIcon className="h-4 w-4" />}
                iconColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                value={`¥${dashboardData.gallerySales.current.toLocaleString()}`}
                trend={{
                  value: parseFloat(dashboardData.gallerySales.growth.toFixed(1)),
                  label: "同比",
                  isPositive: dashboardData.gallerySales.growth > 0
                }}
              />

              <MobileDashboardCard
                title="咖啡店销售"
                icon={<CoffeeIcon className="h-4 w-4" />}
                iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                value={`¥${dashboardData.coffeeSales.current.toLocaleString()}`}
                trend={{
                  value: parseFloat(dashboardData.coffeeSales.growth.toFixed(1)),
                  label: "同比",
                  isPositive: dashboardData.coffeeSales.growth > 0
                }}
              />
            </div>

            <EnhancedChart
              title="热销产品"
              data={dashboardData.topProducts}
              type="bar"
              xAxisKey="name"
              yAxisKeys={["sales"]}
              height={250}
              options={{
                showGrid: false,
                orientation: "horizontal",
                barSize: 16
              }}
            />

            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/sales">
                <ShoppingCartIcon className="mr-2 h-4 w-4" />
                查看销售管理
              </Link>
            </Button>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <MobileDashboardCard
                title="库存总量"
                icon={<PackageIcon className="h-4 w-4" />}
                iconColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                value={dashboardData.inventory.total}
              />

              <MobileDashboardCard
                title="低库存警告"
                icon={<AlertTriangleIcon className="h-4 w-4" />}
                iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                value={dashboardData.inventory.lowStock}
              />
            </div>

            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/inventory">
                <PackageIcon className="mr-2 h-4 w-4" />
                查看库存管理
              </Link>
            </Button>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
