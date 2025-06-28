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
const DEMO_SALES_REPORT_DATA = {
  summary: {
    totalSales: 128500,
    posCount: 86,
    posAmount: 42500,
    orderCount: 70,
    orderAmount: 86000,
    avgOrderValue: 1228.57
  },
  salesByProduct: [
    { name: "珐琅手镯", count: 32, amount: 25600 },
    { name: "珐琅吊坠", count: 28, amount: 19600 },
    { name: "珐琅耳饰", count: 24, amount: 16800 },
    { name: "珐琅摆件", count: 18, amount: 36000 },
    { name: "珐琅工艺画", count: 12, amount: 24000 },
    { name: "其他", count: 8, amount: 6500 }
  ],
  salesByEmployee: [
    { name: "张三", count: 42, amount: 38500 },
    { name: "李四", count: 38, amount: 35000 },
    { name: "王五", count: 32, amount: 28000 },
    { name: "赵六", count: 28, amount: 27000 }
  ],
  dailySales: [
    { date: "06-01", amount: 4200 },
    { date: "06-02", amount: 3800 },
    { date: "06-03", amount: 4500 },
    { date: "06-04", amount: 5200 },
    { date: "06-05", amount: 4800 },
    { date: "06-06", amount: 5500 },
    { date: "06-07", amount: 6200 },
    { date: "06-08", amount: 5800 },
    { date: "06-09", amount: 6500 },
    { date: "06-10", amount: 7200 },
    { date: "06-11", amount: 6800 },
    { date: "06-12", amount: 7500 },
    { date: "06-13", amount: 8200 },
    { date: "06-14", amount: 7800 },
    { date: "06-15", amount: 8500 },
    { date: "06-16", amount: 9200 },
    { date: "06-17", amount: 8800 },
    { date: "06-18", amount: 9500 },
    { date: "06-19", amount: 10200 },
    { date: "06-20", amount: 9800 }
  ]
}

export function SalesReportPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [reportPeriod, setReportPeriod] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // 加载报表数据
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        // 实际项目中应该调用API
        // const response = await fetch(`/api/reports/sales?from=${dateRange.from}&to=${dateRange.to}`)
        // const data = await response.json()
        // setReportData(data)

        // 使用演示数据
        setTimeout(() => {
          setReportData(DEMO_SALES_REPORT_DATA)
          setIsLoading(false)
        }, 800)
      } catch (error) {
        console.error("Error fetching sales report data:", error)
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
        <div className="flex items-center gap-2">
          <Link href="/reports" className="text-muted-foreground hover:text-foreground">
            报表中心
          </Link>
          <span className="text-muted-foreground">/</span>
          <h2 className="text-2xl font-bold">销售报表</h2>
        </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            销售概览
          </TabsTrigger>
          <TabsTrigger value="products">
            <PackageIcon className="h-4 w-4 mr-2" />
            产品销售
          </TabsTrigger>
          <TabsTrigger value="employees">
            <UsersIcon className="h-4 w-4 mr-2" />
            员工销售
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChartIcon className="h-4 w-4 mr-2" />
            销售趋势
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          {/* 销售概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={isLoading ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总销售额</CardTitle>
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
                  <div className="text-2xl font-bold">¥{reportData?.summary.totalSales.toLocaleString()}</div>
                )}
              </CardContent>
            </Card>

            <Card className={isLoading ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">POS销售</CardTitle>
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
                    <div className="text-2xl font-bold">¥{reportData?.summary.posAmount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {reportData?.summary.posCount} 笔交易
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className={isLoading ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">订单销售</CardTitle>
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
                    <div className="text-2xl font-bold">¥{reportData?.summary.orderAmount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {reportData?.summary.orderCount} 笔订单，平均 ¥{reportData?.summary.avgOrderValue.toFixed(2)}/单
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 销售趋势图表 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>销售趋势</CardTitle>
              <CardDescription>每日销售额变化</CardDescription>
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
                      {reportData?.dailySales.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full max-w-[20px] bg-primary rounded-t-sm"
                            style={{
                              height: `${(item.amount / Math.max(...reportData.dailySales.map(s => s.amount))) * 100}%`,
                              minHeight: '10px'
                            }}
                          />
                          <span className="text-xs mt-2 rotate-45 origin-left">{item.date}</span>
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
        </TabsContent>

        <TabsContent value="products" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>产品销售分析</CardTitle>
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
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {reportData?.salesByProduct.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-36 text-sm">{item.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div
                              className="h-4 bg-primary rounded-sm"
                              style={{
                                width: `${(item.amount / reportData.salesByProduct.reduce((sum, i) => sum + i.amount, 0)) * 100}%`
                              }}
                            />
                            <span className="ml-2 text-sm">
                              ¥{item.amount.toLocaleString()}
                              ({((item.amount / reportData.salesByProduct.reduce((sum, i) => sum + i.amount, 0)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {reportData?.salesByProduct.slice(0, 3).map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="text-lg font-medium">{item.name}</div>
                          <div className="text-2xl font-bold mt-2">¥{item.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            销量: {item.count} 件
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>员工销售分析</CardTitle>
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
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {reportData?.salesByEmployee.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-36 text-sm">{item.name}</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div
                              className="h-4 bg-primary rounded-sm"
                              style={{
                                width: `${(item.amount / reportData.salesByEmployee.reduce((sum, i) => sum + i.amount, 0)) * 100}%`
                              }}
                            />
                            <span className="ml-2 text-sm">
                              ¥{item.amount.toLocaleString()}
                              ({((item.amount / reportData.salesByEmployee.reduce((sum, i) => sum + i.amount, 0)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                    {reportData?.salesByEmployee.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                              {item.name.slice(0, 1)}
                            </div>
                            <div className="text-lg font-medium">{item.name}</div>
                          </div>
                          <div className="text-2xl font-bold mt-2">¥{item.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.count} 笔交易
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>销售趋势分析</CardTitle>
              <CardDescription>
                {reportPeriod === "custom"
                  ? `${format(dateRange.from, "yyyy-MM-dd")} 至 ${format(dateRange.to, "yyyy-MM-dd")}`
                  : reportPeriod === "week" ? "近7天"
                  : reportPeriod === "month" ? "本月"
                  : reportPeriod === "quarter" ? "本季度"
                  : "本年度"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-full">
                  {/* 这里应该是实际的图表组件 */}
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex-1 flex items-end">
                      {reportData?.dailySales.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full max-w-[30px] bg-primary rounded-t-sm"
                            style={{
                              height: `${(item.amount / Math.max(...reportData.dailySales.map(s => s.amount))) * 100}%`,
                              minHeight: '10px'
                            }}
                          />
                          <span className="text-xs mt-2 rotate-45 origin-left">{item.date}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}