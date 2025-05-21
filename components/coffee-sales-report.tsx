"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, BarChart3Icon, CalendarIcon } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getSystemSettings } from "@/lib/actions/system-actions";

export function CoffeeSalesReport() {
  const [employees, setEmployees] = useState([])
  const [commissionRate, setCommissionRate] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [salesData, setSalesData] = useState([])
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalCustomers: 0,
    averagePerCustomer: 0,
    totalCommission: 0,
    paymentMethods: {
      cash: 0,
      card: 0,
      wechat: 0,
      alipay: 0,
      other: 0
    }
  })

  // 加载员工数据和系统设置
  useEffect(() => {
    async function loadData() {
      try {
        const [employeesData, settings] = await Promise.all([
          getEmployees(),
          getSystemSettings()
        ])

        setEmployees(employeesData.filter(emp => emp.status === "active"))
        setCommissionRate(settings?.coffeeSalesCommissionRate || 20)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "加载失败",
          description: "无法加载员工数据或系统设置",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [])

  // 加载销售数据
  useEffect(() => {
    loadSalesData()
  }, [dateRange, selectedEmployee])

  const loadSalesData = async () => {
    setIsLoading(true)
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString()
      })

      if (selectedEmployee !== "all") {
        params.append('employeeId', selectedEmployee)
      }

      const response = await fetch(`/api/coffee-shop-sales?${params}`)
      if (!response.ok) throw new Error("Failed to fetch coffee shop sales")

      const data = await response.json()
      setSalesData(data)
      generateSummary(data)
    } catch (error) {
      console.error("Error loading coffee shop sales:", error)
      toast({
        title: "加载失败",
        description: "无法加载咖啡店销售数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummaryData({
        totalSales: 0,
        totalCustomers: 0,
        averagePerCustomer: 0,
        totalCommission: 0,
        paymentMethods: {
          cash: 0,
          card: 0,
          wechat: 0,
          alipay: 0,
          other: 0
        }
      })
      return
    }

    // 计算总销售额和总顾客数
    const totalSales = data.reduce((sum, sale) => sum + sale.totalSales, 0)
    const totalCustomers = data.reduce((sum, sale) => sum + sale.customerCount, 0)

    // 计算支付方式统计
    const paymentMethods = {
      cash: data.reduce((sum, sale) => sum + sale.cashAmount, 0),
      card: data.reduce((sum, sale) => sum + sale.cardAmount, 0),
      wechat: data.reduce((sum, sale) => sum + sale.wechatAmount, 0),
      alipay: data.reduce((sum, sale) => sum + sale.alipayAmount, 0),
      other: data.reduce((sum, sale) => sum + sale.otherAmount, 0)
    }

    // 计算总提成
    const totalCommission = totalSales * (commissionRate / 100)

    // 计算客单价
    const averagePerCustomer = totalCustomers > 0 ? totalSales / totalCustomers : 0

    setSummaryData({
      totalSales,
      totalCustomers,
      averagePerCustomer,
      totalCommission,
      paymentMethods
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

      if (selectedEmployee !== "all") {
        params.append('employeeId', selectedEmployee)
      }

      // 下载报表
      window.location.href = `/api/export/coffee-sales?${params}`

      toast({
        title: "导出成功",
        description: "咖啡店销售报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出咖啡店销售报表",
        variant: "destructive",
      })
    }
  }

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = format(date, "yyyy年MM月")
      options.push({ value, label })
    }

    return options
  }

  const monthOptions = generateMonthOptions()

  // 处理月份选择变化
  const handleMonthChange = (value) => {
    setSelectedMonth(value)
    const [year, month] = value.split('-').map(Number)
    setDateRange({
      from: startOfMonth(new Date(year, month - 1)),
      to: endOfMonth(new Date(year, month - 1))
    })
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>咖啡店销售报表</CardTitle>
          <CardDescription>查看和导出咖啡店销售统计报表</CardDescription>
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

            <div className="space-y-2">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择员工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部员工</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleExportReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 报表摘要 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总顾客数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">客单价</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.averagePerCustomer.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总提成 ({commissionRate}%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalCommission.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 支付方式统计 */}
      <Card>
        <CardHeader>
          <CardTitle>支付方式统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">现金</div>
              <div className="text-xl font-medium">¥{summaryData.paymentMethods.cash.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {summaryData.totalSales > 0
                  ? `${((summaryData.paymentMethods.cash / summaryData.totalSales) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">刷卡</div>
              <div className="text-xl font-medium">¥{summaryData.paymentMethods.card.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {summaryData.totalSales > 0
                  ? `${((summaryData.paymentMethods.card / summaryData.totalSales) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">微信</div>
              <div className="text-xl font-medium">¥{summaryData.paymentMethods.wechat.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {summaryData.totalSales > 0
                  ? `${((summaryData.paymentMethods.wechat / summaryData.totalSales) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">支付宝</div>
              <div className="text-xl font-medium">¥{summaryData.paymentMethods.alipay.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {summaryData.totalSales > 0
                  ? `${((summaryData.paymentMethods.alipay / summaryData.totalSales) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">其他</div>
              <div className="text-xl font-medium">¥{summaryData.paymentMethods.other.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {summaryData.totalSales > 0
                  ? `${((summaryData.paymentMethods.other / summaryData.totalSales) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 销售记录表格 */}
      <Card>
        <CardHeader>
          <CardTitle>销售记录</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">加载中...</div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>顾客数</TableHead>
                  <TableHead className="text-right">销售额</TableHead>
                  <TableHead className="text-right">提成</TableHead>
                  <TableHead>值班员工</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(sale.date instanceof Date ? sale.date : new Date(sale.date), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{sale.customerCount}</TableCell>
                    <TableCell className="text-right">¥{sale.totalSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">¥{(sale.totalSales * (commissionRate / 100)).toFixed(2)}</TableCell>
                    <TableCell>
                      {sale.shifts.map(shift => shift.employee.name).join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
