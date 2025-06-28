"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart3Icon,
  LineChartIcon,
  PieChartIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  RefreshCwIcon,
  FilterIcon,
  CalendarIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  PackageIcon,
  UsersIcon,
  CoffeeIcon,
  BuildingIcon
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"

// 临时报表数据
const DEMO_REPORT_DATA = {
  summary: {
    sales: {
      current: 128500,
      previous: 115200,
      change: 11.5
    },
    orders: {
      current: 156,
      previous: 142,
      change: 9.9
    },
    customers: {
      current: 48,
      previous: 39,
      change: 23.1
    },
    profit: {
      current: 42800,
      previous: 38600,
      change: 10.9
    }
  },
  salesByCategory: [
    { name: "珐琅饰品", value: 68500 },
    { name: "珐琅摆件", value: 32000 },
    { name: "珐琅工艺画", value: 18000 },
    { name: "团建活动", value: 8500 },
    { name: "咖啡销售", value: 1500 }
  ],
  salesByChannel: [
    { name: "直营店", value: 85000 },
    { name: "线上商城", value: 22000 },
    { name: "渠道合作", value: 15000 },
    { name: "团建活动", value: 6500 }
  ],
  monthlySales: [
    { month: "1月", sales: 85000 },
    { month: "2月", sales: 92000 },
    { month: "3月", sales: 108000 },
    { month: "4月", sales: 115000 },
    { month: "5月", sales: 125000 },
    { month: "6月", sales: 128500 }
  ]
}

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [reportPeriod, setReportPeriod] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)

  // 加载报表数据
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        // 实际项目中应该调用API
        // const response = await fetch(`/api/reports?from=${dateRange.from}&to=${dateRange.to}`)
        // const data = await response.json()
        // setReportData(data)

        // 使用演示数据
        setTimeout(() => {
          setReportData(DEMO_REPORT_DATA)
          setIsLoading(false)
        }, 800)
      } catch (error) {
        console.error("Error fetching report data:", error)
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [dateRange, reportPeriod])

  // 处理日期范围变化
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
  }

  // 处理报表周期变化
  const handlePeriodChange = (value: string) => {
    setReportPeriod(value)

    const now = new Date()
    switch (value) {
      case "week":
        setDateRange({
          from: subDays(now, 7),
          to: now
        })
        break
      case "month":
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now)
        })
        break
      case "quarter":
        // 简化处理，实际应该计算当前季度
        setDateRange({
          from: subDays(now, 90),
          to: now
        })
        break
      case "year":
        setDateRange({
          from: startOfYear(now),
          to: endOfYear(now)
        })
        break
      default:
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">综合报表</h2>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            导出报表
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <Select
            value={reportPeriod}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="选择报表周期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年度</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onSelect={handleDateRangeChange}
        />
      </div>

      {/* 报表导航 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Link href="/reports/sales">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <BarChart3Icon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">销售报表</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/purchase">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <ShoppingCartIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">采购报表</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/inventory">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <PackageIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">库存报表</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/finance">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <DollarSignIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">财务报表</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/workshops">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <BuildingIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">团建报表</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/coffee-shop">
          <Card className="h-full hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <CoffeeIcon className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium text-center">咖啡店报表</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 业务概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={isLoading ? "opacity-60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">销售额</CardTitle>
            <CardDescription>
              {reportPeriod === "custom"
                ? `${format(dateRange.from, "yyyy-MM-dd")} 至 ${format(dateRange.to, "yyyy-MM-dd")}`
                : reportPeriod === "week" ? "近7天"
                : reportPeriod === "month" ? "本月"
                : reportPeriod === "quarter" ? "本季度"
                : "本年度"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">¥{reportData?.summary.sales.current.toLocaleString()}</div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${reportData?.summary.sales.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {reportData?.summary.sales.change >= 0 ? (
                      <ArrowUpIcon className="inline h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="inline h-3 w-3 mr-1" />
                    )}
                    {Math.abs(reportData?.summary.sales.change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">vs 上期</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={isLoading ? "opacity-60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">订单数</CardTitle>
            <CardDescription>
              {reportPeriod === "custom"
                ? `${format(dateRange.from, "yyyy-MM-dd")} 至 ${format(dateRange.to, "yyyy-MM-dd")}`
                : reportPeriod === "week" ? "近7天"
                : reportPeriod === "month" ? "本月"
                : reportPeriod === "quarter" ? "本季度"
                : "本年度"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{reportData?.summary.orders.current}</div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${reportData?.summary.orders.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {reportData?.summary.orders.change >= 0 ? (
                      <ArrowUpIcon className="inline h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="inline h-3 w-3 mr-1" />
                    )}
                    {Math.abs(reportData?.summary.orders.change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">vs 上期</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={isLoading ? "opacity-60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">新增客户</CardTitle>
            <CardDescription>
              {reportPeriod === "custom"
                ? `${format(dateRange.from, "yyyy-MM-dd")} 至 ${format(dateRange.to, "yyyy-MM-dd")}`
                : reportPeriod === "week" ? "近7天"
                : reportPeriod === "month" ? "本月"
                : reportPeriod === "quarter" ? "本季度"
                : "本年度"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{reportData?.summary.customers.current}</div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${reportData?.summary.customers.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {reportData?.summary.customers.change >= 0 ? (
                      <ArrowUpIcon className="inline h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="inline h-3 w-3 mr-1" />
                    )}
                    {Math.abs(reportData?.summary.customers.change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">vs 上期</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={isLoading ? "opacity-60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">利润</CardTitle>
            <CardDescription>
              {reportPeriod === "custom"
                ? `${format(dateRange.from, "yyyy-MM-dd")} 至 ${format(dateRange.to, "yyyy-MM-dd")}`
                : reportPeriod === "week" ? "近7天"
                : reportPeriod === "month" ? "本月"
                : reportPeriod === "quarter" ? "本季度"
                : "本年度"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">¥{reportData?.summary.profit.current.toLocaleString()}</div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${reportData?.summary.profit.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {reportData?.summary.profit.change >= 0 ? (
                      <ArrowUpIcon className="inline h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="inline h-3 w-3 mr-1" />
                    )}
                    {Math.abs(reportData?.summary.profit.change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">vs 上期</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={isLoading ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle>销售趋势</CardTitle>
            <CardDescription>月度销售额趋势</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-full">
                {/* 这里应该是实际的图表组件 */}
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-1 flex items-end">
                    {reportData?.monthlySales.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full max-w-[40px] bg-primary rounded-t-sm"
                          style={{
                            height: `${(item.sales / Math.max(...reportData.monthlySales.map(s => s.sales))) * 100}%`,
                            minHeight: '10px'
                          }}
                        />
                        <span className="text-xs mt-2">{item.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-8 mt-4 border-t pt-2 text-center text-sm text-muted-foreground">
                    销售额 (元)
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isLoading ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle>销售分布</CardTitle>
            <CardDescription>按产品类别和销售渠道</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <Tabs defaultValue="category">
                <TabsList className="mb-4">
                  <TabsTrigger value="category">按产品类别</TabsTrigger>
                  <TabsTrigger value="channel">按销售渠道</TabsTrigger>
                </TabsList>

                <TabsContent value="category">
                  <div className="space-y-4">
                    {reportData?.salesByCategory.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-36 text-sm">{item.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div
                              className="h-4 bg-primary rounded-sm"
                              style={{
                                width: `${(item.value / reportData.salesByCategory.reduce((sum, i) => sum + i.value, 0)) * 100}%`
                              }}
                            />
                            <span className="ml-2 text-sm">
                              ¥{item.value.toLocaleString()}
                              ({((item.value / reportData.salesByCategory.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="channel">
                  <div className="space-y-4">
                    {reportData?.salesByChannel.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-36 text-sm">{item.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div
                              className="h-4 bg-primary rounded-sm"
                              style={{
                                width: `${(item.value / reportData.salesByChannel.reduce((sum, i) => sum + i.value, 0)) * 100}%`
                              }}
                            />
                            <span className="ml-2 text-sm">
                              ¥{item.value.toLocaleString()}
                              ({((item.value / reportData.salesByChannel.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}