"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TodoList } from "@/components/dashboard/todo-list"
import { WorkshopSchedule } from "@/components/dashboard/workshop-schedule"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getDashboardData } from "@/lib/actions/system-actions"
import { useIsMobile } from "@/hooks/use-mobile"

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")
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

  const isMobile = useIsMobile()

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



  return (
    <div className="space-y-6">
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={fetchDashboardData}
      />

      <QuickActions />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <DashboardStats data={dashboardData} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardCharts data={dashboardData} />
            </div>
            <div className="space-y-6">
              <TodoList />
              <WorkshopSchedule />
              <NotificationCenter />
            </div>
          </div>
        </>
      )}
    </div>
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
