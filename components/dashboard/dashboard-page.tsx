"use client"

import { useState, useEffect } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EnhancedDashboardStats } from "@/components/dashboard/enhanced-dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { WorkshopSchedule } from "@/components/dashboard/workshop-schedule"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { BusinessInsights } from "@/components/dashboard/business-insights"
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics"
import { SystemHealthMonitor } from "@/components/dashboard/system-health-monitor"
import { ExecutiveSummary } from "@/components/dashboard/executive-summary"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getDashboardData } from "@/lib/actions/system-actions"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  TrendingUpIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  SettingsIcon,
  ExpandIcon,
  EyeIcon,
  StarIcon,
  CalendarIcon,
  BarChart3Icon,
  ActivityIcon
} from "lucide-react"

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState("overview") // overview, detailed, custom
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
    topProducts: [],
    alerts: [],
    insights: [],
    performance: {}
  })

  const isMobile = useIsMobile()

  // 加载仪表盘数据
  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  // 获取仪表盘数据
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      // 使用服务器端操作获取仪表盘数据
      const data = await getDashboardData(timeRange)

      // 增强数据处理，添加洞察和警告
      const enhancedData = {
        ...data,
        alerts: generateAlerts(data),
        insights: generateInsights(data),
        performance: calculatePerformanceMetrics(data)
      }

      setDashboardData(enhancedData)

      if (showRefreshIndicator) {
        toast({
          title: "数据已更新",
          description: "仪表盘数据已刷新到最新状态",
        })
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "加载失败",
        description: "无法加载仪表盘数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // 生成业务警告
  const generateAlerts = (data: any) => {
    const alerts = []

    if (data.inventory?.lowStock > 5) {
      alerts.push({
        type: "warning",
        title: "库存预警",
        message: `有 ${data.inventory.lowStock} 个产品库存不足`,
        action: "查看库存"
      })
    }

    if (data.gallerySales?.growth < -10) {
      alerts.push({
        type: "error",
        title: "销售下滑",
        message: "珐琅馆销售额较上期下降超过10%",
        action: "查看分析"
      })
    }

    return alerts
  }

  // 生成业务洞察
  const generateInsights = (data: any) => {
    const insights = []

    if (data.gallerySales?.growth > 20) {
      insights.push({
        type: "positive",
        title: "销售增长强劲",
        message: "珐琅馆销售额增长超过20%，表现优异",
        suggestion: "考虑增加库存以满足需求"
      })
    }

    if (data.workshops?.growth > 15) {
      insights.push({
        type: "positive",
        title: "团建业务火爆",
        message: "手作团建业务增长迅速，市场反响良好",
        suggestion: "可考虑扩大团建服务规模"
      })
    }

    return insights
  }

  // 计算绩效指标
  const calculatePerformanceMetrics = (data: any) => {
    const totalSales = (data.gallerySales?.current || 0) + (data.coffeeSales?.current || 0)
    const totalGrowth = data.gallerySales?.growth || 0

    return {
      overallScore: Math.min(100, Math.max(0, 70 + totalGrowth)),
      salesEfficiency: totalSales / (data.employees?.active || 1),
      inventoryTurnover: totalSales / (data.inventory?.total || 1),
      customerSatisfaction: 85 + Math.random() * 10 // 模拟数据
    }
  }



  return (
    <ModernPageContainer
      title="聆花文化 · 智能仪表盘"
      description="欢迎回来！掌握业务全貌，洞察增长机会。"
      breadcrumbs={[
        { label: "首页" }
      ]}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "overview" ? "detailed" : "overview")}
              className="hidden md:flex"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              {viewMode === "overview" ? "详细视图" : "概览视图"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
          <DashboardHeader
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onRefresh={() => fetchDashboardData(true)}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* 业务警告和洞察横幅 */}
        {!isLoading && (dashboardData.alerts?.length > 0 || dashboardData.insights?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboardData.alerts?.length > 0 && (
              <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                      需要关注
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardData.alerts.slice(0, 2).map((alert: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">{alert.title}</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{alert.message}</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-amber-700 border-amber-300">
                        {alert.action}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {dashboardData.insights?.length > 0 && (
              <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-lg text-green-800 dark:text-green-200">
                      业务洞察
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardData.insights.slice(0, 2).map((insight: any, index: number) => (
                    <div key={index}>
                      <p className="font-medium text-green-800 dark:text-green-200">{insight.title}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{insight.message}</p>
                      {insight.suggestion && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          💡 {insight.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}



        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* 增强的统计卡片区域 */}
            <EnhancedDashboardStats
              data={dashboardData}
              performance={dashboardData.performance}
              viewMode={viewMode}
            />

            {/* 主要内容区域 */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* 图表区域 */}
              <div className="xl:col-span-3 space-y-6">
                <DashboardCharts data={dashboardData} />

                {viewMode === "detailed" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PerformanceMetrics data={dashboardData.performance} />
                    <RecentActivities data={dashboardData.recentSales} />
                  </div>
                )}
              </div>

              {/* 右侧信息面板 */}
              <div className="xl:col-span-1 space-y-6">
                {/* 高管总览 */}
                <ExecutiveSummary data={dashboardData} />

                {/* 工坊排期概览 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      工坊排期概览
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WorkshopSchedule />
                  </CardContent>
                </Card>

                {/* 系统健康监控 */}
                <SystemHealthMonitor />

                {viewMode === "detailed" && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5" />
                        业务洞察
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BusinessInsights insights={dashboardData.insights} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ModernPageContainer>
  )
}

// 仪表盘骨架屏
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[140px] w-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[350px] w-full" />
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}
