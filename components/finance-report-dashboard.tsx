"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, DownloadIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts"

export function FinanceReportDashboard() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState([])
  const [expenseData, setExpenseData] = useState([])
  const [profitTrend, setProfitTrend] = useState([])
  const [revenueBreakdown, setRevenueBreakdown] = useState([])
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    profitMargin: 0
  })

  // 加载财务数据
  useEffect(() => {
    loadFinanceData()
  }, [dateRange])

  const loadFinanceData = async () => {
    setIsLoading(true)
    try {
      // 加载销售数据（收入）
      await loadRevenueData()
      
      // 加载支出数据
      await loadExpenseData()
      
      // 计算利润趋势
      calculateProfitTrend()
      
      // 计算汇总数据
      calculateSummaryData()
    } catch (error) {
      console.error("Error loading finance data:", error)
      toast({
        title: "加载失败",
        description: "无法加载财务数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRevenueData = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString()
      })
      
      // 加载珐琅馆销售数据
      const gallerySalesResponse = await fetch(`/api/gallery-sales?${params}`)
      if (!gallerySalesResponse.ok) throw new Error("Failed to fetch gallery sales")
      const gallerySales = await gallerySalesResponse.json()
      
      // 加载咖啡店销售数据
      const coffeeSalesResponse = await fetch(`/api/coffee-shop-sales?${params}`)
      if (!coffeeSalesResponse.ok) throw new Error("Failed to fetch coffee shop sales")
      const coffeeSales = await coffeeSalesResponse.json()
      
      // 按日期分组统计收入
      const dateMap = new Map()
      
      // 处理珐琅馆销售
      gallerySales.forEach(sale => {
        const date = format(new Date(sale.date), "yyyy-MM-dd")
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            gallery: 0,
            coffee: 0,
            total: 0
          })
        }
        
        const dateStats = dateMap.get(date)
        dateStats.gallery += sale.totalAmount
        dateStats.total += sale.totalAmount
      })
      
      // 处理咖啡店销售
      coffeeSales.forEach(sale => {
        const date = format(new Date(sale.date), "yyyy-MM-dd")
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            gallery: 0,
            coffee: 0,
            total: 0
          })
        }
        
        const dateStats = dateMap.get(date)
        dateStats.coffee += sale.totalSales
        dateStats.total += sale.totalSales
      })
      
      // 按日期排序
      const sortedDates = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      setRevenueData(sortedDates)
      
      // 计算收入细分
      const galleryTotal = gallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const coffeeTotal = coffeeSales.reduce((sum, sale) => sum + sale.totalSales, 0)
      
      setRevenueBreakdown([
        { name: "珐琅馆销售", value: galleryTotal },
        { name: "咖啡店销售", value: coffeeTotal }
      ])
    } catch (error) {
      console.error("Error loading revenue data:", error)
      throw error
    }
  }

  const loadExpenseData = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString()
      })
      
      // 加载计件工资数据
      const pieceWorksResponse = await fetch(`/api/piece-works?${params}`)
      if (!pieceWorksResponse.ok) throw new Error("Failed to fetch piece works")
      const pieceWorks = await pieceWorksResponse.json()
      
      // 模拟其他支出数据（实际项目中应该从API获取）
      // 这里为了演示，我们生成一些模拟数据
      const fixedSalaries = 15000 // 固定工资
      const rent = 8000 // 租金
      const utilities = 2000 // 水电费
      const materials = 10000 // 材料成本
      const marketing = 5000 // 营销费用
      const other = 3000 // 其他费用
      
      // 计算计件工资总额
      const pieceWorkTotal = pieceWorks.reduce((sum, work) => sum + work.amount, 0)
      
      // 设置支出细分
      setExpenseBreakdown([
        { name: "计件工资", value: pieceWorkTotal },
        { name: "固定工资", value: fixedSalaries },
        { name: "租金", value: rent },
        { name: "水电费", value: utilities },
        { name: "材料成本", value: materials },
        { name: "营销费用", value: marketing },
        { name: "其他费用", value: other }
      ])
      
      // 按日期分组统计支出（这里简化处理，将固定支出平均分配到每天）
      const days = Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)))
      const dailyFixedExpense = (fixedSalaries + rent + utilities + materials + marketing + other) / days
      
      // 处理计件工资按日期分组
      const dateMap = new Map()
      
      pieceWorks.forEach(work => {
        const date = format(new Date(work.date), "yyyy-MM-dd")
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            pieceWork: 0,
            fixed: dailyFixedExpense,
            total: dailyFixedExpense
          })
        }
        
        const dateStats = dateMap.get(date)
        dateStats.pieceWork += work.amount
        dateStats.total += work.amount
      })
      
      // 确保每一天都有数据
      let currentDate = new Date(dateRange.from)
      while (currentDate <= dateRange.to) {
        const dateStr = format(currentDate, "yyyy-MM-dd")
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            date: dateStr,
            pieceWork: 0,
            fixed: dailyFixedExpense,
            total: dailyFixedExpense
          })
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // 按日期排序
      const sortedDates = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      setExpenseData(sortedDates)
    } catch (error) {
      console.error("Error loading expense data:", error)
      throw error
    }
  }

  const calculateProfitTrend = () => {
    // 合并收入和支出数据，计算利润趋势
    const profitMap = new Map()
    
    // 处理收入数据
    revenueData.forEach(item => {
      profitMap.set(item.date, {
        date: item.date,
        revenue: item.total,
        expense: 0,
        profit: item.total
      })
    })
    
    // 处理支出数据
    expenseData.forEach(item => {
      if (profitMap.has(item.date)) {
        const profitItem = profitMap.get(item.date)
        profitItem.expense = item.total
        profitItem.profit = profitItem.revenue - item.total
      } else {
        profitMap.set(item.date, {
          date: item.date,
          revenue: 0,
          expense: item.total,
          profit: -item.total
        })
      }
    })
    
    // 按日期排序
    const sortedDates = Array.from(profitMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    setProfitTrend(sortedDates)
  }

  const calculateSummaryData = () => {
    // 计算总收入
    const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0)
    
    // 计算总支出
    const totalExpense = expenseBreakdown.reduce((sum, item) => sum + item.value, 0)
    
    // 计算净利润和利润率
    const netProfit = totalRevenue - totalExpense
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    
    setSummaryData({
      totalRevenue,
      totalExpense,
      netProfit,
      profitMargin
    })
  }

  const handleExportReport = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        format: 'excel'
      })
      
      // 下载报表
      window.location.href = `/api/export/finance-report?${params}`
      
      toast({
        title: "导出成功",
        description: "财务报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出财务报表",
        variant: "destructive",
      })
    }
  }

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C']

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>财务报表</CardTitle>
          <CardDescription>查看和分析财务数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy-MM-dd")} 至{" "}
                          {format(dateRange.to, "yyyy-MM-dd")}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy-MM-dd")
                      )
                    ) : (
                      <span>选择日期范围</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button variant="outline" onClick={handleExportReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 财务汇总 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">净利润</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summaryData.netProfit >= 0 ? "text-green-500" : "text-red-500"
            )}>
              ¥{summaryData.netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              收入 - 支出
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">利润率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summaryData.profitMargin >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {summaryData.profitMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              净利润 / 总收入
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 利润趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>利润趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[350px]">
              <p className="text-muted-foreground">加载数据中...</p>
            </div>
          ) : profitTrend.length === 0 ? (
            <div className="flex items-center justify-center h-[350px]">
              <p className="text-muted-foreground">暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={profitTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `¥${value}`} />
                <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="收入" stroke="#0070f3" />
                <Line type="monotone" dataKey="expense" name="支出" stroke="#ff4d4f" />
                <Line type="monotone" dataKey="profit" name="利润" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      {/* 收入和支出细分 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 收入细分 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>收入细分</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : revenueBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* 支出细分 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>支出细分</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : expenseBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
