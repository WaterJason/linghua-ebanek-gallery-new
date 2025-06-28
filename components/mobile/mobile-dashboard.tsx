"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardData } from "@/lib/actions/system-actions"

export function MobileDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await getDashboardData("week")
        setDashboardData(data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 销售统计 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">销售统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">本周销售额</span>
              <span className="text-2xl font-bold">
                ¥{dashboardData?.salesSummary?.currentPeriod?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">本周订单数</span>
              <span className="text-2xl font-bold">
                {dashboardData?.orderCount?.currentPeriod || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 库存提醒 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">库存提醒</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>库存不足</span>
              <span className="font-bold">{dashboardData?.inventoryAlerts?.lowStock || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>待入库</span>
              <span className="font-bold">{dashboardData?.inventoryAlerts?.pendingInbound || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 今日待办 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">今日待办</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>待处理订单</span>
              <span className="font-bold">{dashboardData?.pendingTasks?.orders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>待审批</span>
              <span className="font-bold">{dashboardData?.pendingTasks?.approvals || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
