"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface FinanceReportDashboardProps {
  accountBalances: any[]
}

export function FinanceReportDashboard({ accountBalances }: FinanceReportDashboardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState<any>(null)
  
  // 默认日期范围：当前月份
  const today = new Date()
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  })

  // 颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

  // 加载财务统计数据
  const loadSummaryData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd")
      const endDateStr = format(dateRange.endDate, "yyyy-MM-dd")
      
      const response = await fetch(`/api/finance/summary?startDate=${startDateStr}&endDate=${endDateStr}`)
      
      if (!response.ok) {
        throw new Error("获取财务统计数据失败")
      }
      
      const data = await response.json()
      setSummaryData(data)
    } catch (error) {
      console.error("Error loading summary data:", error)
      setError(error instanceof Error ? error.message : "获取财务统计数据失败")
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error instanceof Error ? error.message : "获取财务统计数据失败",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当日期范围变化时重新加载数据
  useEffect(() => {
    loadSummaryData()
  }, [dateRange])

  // 设置日期范围快捷方式
  const setCurrentMonth = () => {
    setDateRange({
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    })
  }

  const setPreviousMonth = () => {
    const prevMonth = subMonths(today, 1)
    setDateRange({
      startDate: startOfMonth(prevMonth),
      endDate: endOfMonth(prevMonth),
    })
  }

  const setLastThreeMonths = () => {
    setDateRange({
      startDate: startOfMonth(subMonths(today, 2)),
      endDate: endOfMonth(today),
    })
  }

  // 计算总余额
  const totalBalance = accountBalances.reduce((sum, account) => sum + account.currentBalance, 0)

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="summary">收支总览</TabsTrigger>
        <TabsTrigger value="accounts">账户余额</TabsTrigger>
        <TabsTrigger value="trends">收支趋势</TabsTrigger>
      </TabsList>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={setCurrentMonth}>
            本月
          </Button>
          <Button variant="outline" size="sm" onClick={setPreviousMonth}>
            上月
          </Button>
          <Button variant="outline" size="sm" onClick={setLastThreeMonths}>
            近三个月
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.startDate ? (
                    format(dateRange.startDate, "yyyy-MM-dd")
                  ) : (
                    <span>选择开始日期</span>
                  )}
                  {" 至 "}
                  {dateRange?.endDate ? (
                    format(dateRange.endDate, "yyyy-MM-dd")
                  ) : (
                    <span>选择结束日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.startDate}
                  selected={{
                    from: dateRange?.startDate,
                    to: dateRange?.endDate,
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({
                        startDate: range.from,
                        endDate: range.to,
                      })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="outline" size="sm" onClick={loadSummaryData}>
            刷新
          </Button>
        </div>
      </div>
      <TabsContent value="summary" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <span>{error}</span>
          </div>
        ) : !summaryData ? (
          <div className="flex items-center justify-center py-8">
            <span>暂无数据</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    总收入
                  </CardTitle>
                  <Icons.arrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryData.totalIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    所选时间范围内的总收入
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    总支出
                  </CardTitle>
                  <Icons.arrowDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summaryData.totalExpense)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    所选时间范围内的总支出
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    净收入
                  </CardTitle>
                  <Icons.wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${summaryData.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summaryData.netAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    总收入减去总支出
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>收入分类统计</CardTitle>
                  <CardDescription>
                    按分类统计收入金额
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  {summaryData.incomeByCategory.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <span>暂无收入数据</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={summaryData.incomeByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="categoryName"
                        >
                          {summaryData.incomeByCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label: any) => ""}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>支出分类统计</CardTitle>
                  <CardDescription>
                    按分类统计支出金额
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  {summaryData.expenseByCategory.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <span>暂无支出数据</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={summaryData.expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="categoryName"
                        >
                          {summaryData.expenseByCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label: any) => ""}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </TabsContent>
      <TabsContent value="accounts" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>账户余额</CardTitle>
            <CardDescription>
              各资金账户当前余额
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accountBalances.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span>暂无账户数据</span>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalBalance)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    总余额
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={accountBalances}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="currentBalance" name="当前余额" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {accountBalances.map((account) => (
                    <div key={account.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <div className="ml-2">
                          <p className="text-sm font-medium">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.accountType === "bank" && "银行账户"}
                            {account.accountType === "cash" && "现金账户"}
                            {account.accountType === "alipay" && "支付宝"}
                            {account.accountType === "wechat" && "微信支付"}
                            {account.accountType === "other" && "其他账户"}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => router.push("/finance/accounts")}>
              管理账户
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="trends" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <span>{error}</span>
          </div>
        ) : !summaryData ? (
          <div className="flex items-center justify-center py-8">
            <span>暂无数据</span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>收支趋势</CardTitle>
              <CardDescription>
                每日收入和支出趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryData.dailyTransactions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <span>暂无交易数据</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={summaryData.dailyTransactions}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" name="收入" fill="#82ca9d" />
                    <Bar dataKey="expense" name="支出" fill="#ff7c7c" />
                    <Bar dataKey="net" name="净收入" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
