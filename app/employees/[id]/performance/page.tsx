"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeftIcon, UserIcon, BarChart3Icon, TrendingUpIcon, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function EmployeePerformancePage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        setLoading(true)
        // 获取员工详情
        const response = await fetch(`/api/employees/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch employee")
        }
        const data = await response.json()
        setEmployee(data)

        // 获取绩效数据
        await fetchPerformanceData()
      } catch (error) {
        console.error("Error fetching employee data:", error)
        toast({
          title: "获取员工数据失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchEmployeeData()
    }
  }, [params.id])

  // 确保fetchPerformanceData可以访问到最新的状态
  useEffect(() => {
    if (employee) {
      fetchPerformanceData()
    }
  }, [selectedPeriod, selectedMonth])

  // 获取绩效数据
  const fetchPerformanceData = async () => {
    try {
      setLoading(true)

      // 计算日期范围
      let startDate, endDate

      if (selectedPeriod === "month") {
        startDate = startOfMonth(selectedMonth)
        endDate = endOfMonth(selectedMonth)
      } else if (selectedPeriod === "quarter") {
        startDate = startOfMonth(subMonths(selectedMonth, 2))
        endDate = endOfMonth(selectedMonth)
      } else if (selectedPeriod === "year") {
        startDate = startOfMonth(subMonths(selectedMonth, 11))
        endDate = endOfMonth(selectedMonth)
      }

      // 格式化日期
      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")

      // 获取活动数据
      const activitiesResponse = await fetch(
        `/api/employees/${params.id}/activities?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      )

      if (!activitiesResponse.ok) {
        throw new Error("Failed to fetch activities")
      }

      const activitiesData = await activitiesResponse.json()

      // 获取排班数据
      const schedulesResponse = await fetch(
        `/api/employees/${params.id}/schedules?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      )

      if (!schedulesResponse.ok) {
        throw new Error("Failed to fetch schedules")
      }

      const schedulesData = await schedulesResponse.json()

      // 计算绩效指标
      const performanceMetrics = calculatePerformanceMetrics(activitiesData, schedulesData)

      setPerformanceData({
        activities: activitiesData,
        schedules: schedulesData,
        metrics: performanceMetrics,
        period: {
          startDate,
          endDate,
          type: selectedPeriod
        }
      })
    } catch (error) {
      console.error("Error fetching performance data:", error)
      toast({
        title: "获取绩效数据失败",
        description: "请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 计算绩效指标
  const calculatePerformanceMetrics = (activities, schedules) => {
    // 按类型分组活动
    const gallerySales = activities.filter(a => a.type === '画廊销售')
    const pieceWorks = activities.filter(a => a.type === '配件制作' || a.type === '珐琅制作')
    const teacherWorkshops = activities.filter(a => a.type === '工作坊讲师')
    const assistantWorkshops = activities.filter(a => a.type === '工作坊助教')
    const coffeeShifts = activities.filter(a => a.type === '咖啡店值班')

    // 计算销售总额
    const totalSalesAmount = gallerySales.reduce((sum, sale) => {
      try {
        const detailsText = sale.details || '';
        const match = detailsText.match(/¥(\d+(\.\d+)?)/);
        const amount = match ? parseFloat(match[1]) : 0;
        return sum + amount;
      } catch (error) {
        console.error("Error parsing sale amount:", error, sale);
        return sum;
      }
    }, 0)

    // 计算计件工作总额
    const totalPieceWorkAmount = pieceWorks.reduce((sum, work) => {
      try {
        const detailsText = work.details || '';
        const match = detailsText.match(/¥(\d+(\.\d+)?)/);
        const amount = match ? parseFloat(match[1]) : 0;
        return sum + amount;
      } catch (error) {
        console.error("Error parsing piece work amount:", error, work);
        return sum;
      }
    }, 0)

    // 计算工作坊总时长
    const totalWorkshopHours = [
      ...teacherWorkshops,
      ...assistantWorkshops
    ].reduce((sum, workshop) => {
      try {
        const detailsText = workshop.details || '';
        const match = detailsText.match(/时长: (\d+(\.\d+)?)/);
        const hours = match ? parseFloat(match[1]) : 0;
        return sum + hours;
      } catch (error) {
        console.error("Error parsing workshop hours:", error, workshop);
        return sum;
      }
    }, 0)

    // 计算排班总时长
    const totalScheduledHours = schedules.reduce((sum, schedule) => {
      const startTime = schedule.startTime.split(':').map(Number)
      const endTime = schedule.endTime.split(':').map(Number)
      const startMinutes = startTime[0] * 60 + startTime[1]
      const endMinutes = endTime[0] * 60 + endTime[1]
      const hours = (endMinutes - startMinutes) / 60
      return sum + hours
    }, 0)

    // 计算活动总数
    const totalActivities = activities.length

    return {
      totalSalesAmount,
      totalPieceWorkAmount,
      totalWorkshopHours,
      totalScheduledHours,
      totalActivities,
      gallerySalesCount: gallerySales.length,
      pieceWorksCount: pieceWorks.length,
      workshopsCount: teacherWorkshops.length + assistantWorkshops.length,
      coffeeShiftsCount: coffeeShifts.length
    }
  }

  // 处理时间段变更
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    // 不需要手动调用fetchPerformanceData，useEffect会处理
  }

  // 处理月份变更
  const handleMonthChange = (direction) => {
    const newMonth = new Date(selectedMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
    // 不需要手动调用fetchPerformanceData，useEffect会处理
  }

  if (loading && !employee) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-8">
          <UserIcon className="h-16 w-16 mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-semibold mb-2">未找到员工</h2>
          <p className="text-muted-foreground mb-4">无法找到ID为 {params.id} 的员工</p>
          <Button asChild>
            <Link href="/employees">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              返回员工列表
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* 顶部导航和标题 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/employees/${params.id}`}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                返回员工详情
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">员工绩效 - {employee.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleMonthChange('prev')}>
              上一{selectedPeriod === 'month' ? '月' : selectedPeriod === 'quarter' ? '季度' : '年'}
            </Button>
            <div className="px-2 py-1 rounded-md bg-muted">
              {selectedPeriod === 'month' && format(selectedMonth, 'yyyy年MM月', { locale: zhCN })}
              {selectedPeriod === 'quarter' && `${format(subMonths(selectedMonth, 2), 'yyyy年MM月', { locale: zhCN })} - ${format(selectedMonth, 'yyyy年MM月', { locale: zhCN })}`}
              {selectedPeriod === 'year' && `${format(subMonths(selectedMonth, 11), 'yyyy年MM月', { locale: zhCN })} - ${format(selectedMonth, 'yyyy年MM月', { locale: zhCN })}`}
            </div>
            <Button variant="outline" size="sm" onClick={() => handleMonthChange('next')}>
              下一{selectedPeriod === 'month' ? '月' : selectedPeriod === 'quarter' ? '季度' : '年'}
            </Button>
          </div>
        </div>

        {/* 时间段选择 */}
        <Tabs defaultValue="month" value={selectedPeriod} onValueChange={handlePeriodChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="month">月度</TabsTrigger>
            <TabsTrigger value="quarter">季度</TabsTrigger>
            <TabsTrigger value="year">年度</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 绩效指标卡片 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">加载绩效数据中...</span>
          </div>
        ) : performanceData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">销售业绩</CardTitle>
                <CardDescription>画廊销售总额</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{performanceData.metrics.totalSalesAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  共 {performanceData.metrics.gallerySalesCount} 笔销售
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">计件工作</CardTitle>
                <CardDescription>计件工作总额</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{performanceData.metrics.totalPieceWorkAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  共 {performanceData.metrics.pieceWorksCount} 笔计件工作
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">工作坊</CardTitle>
                <CardDescription>工作坊总时长</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.metrics.totalWorkshopHours.toFixed(1)} 小时</div>
                <p className="text-xs text-muted-foreground mt-1">
                  共 {performanceData.metrics.workshopsCount} 场工作坊
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">排班时长</CardTitle>
                <CardDescription>总排班时长</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.metrics.totalScheduledHours.toFixed(1)} 小时</div>
                <p className="text-xs text-muted-foreground mt-1">
                  共 {performanceData.schedules.length} 次排班
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            暂无绩效数据
          </div>
        )}

        {/* 绩效详情 */}
        <Card>
          <CardHeader>
            <CardTitle>绩效详情</CardTitle>
            <CardDescription>
              {performanceData && performanceData.period && (
                <>
                  {format(performanceData.period.startDate, 'yyyy年MM月dd日', { locale: zhCN })} 至
                  {format(performanceData.period.endDate, 'yyyy年MM月dd日', { locale: zhCN })}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              详细绩效分析功能正在开发中...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
