"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import {
  DownloadIcon,
  BarChart3Icon,
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon,
  UserIcon,
  PieChartIcon,
  TrendingUpIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon
} from "lucide-react"
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  isSameDay
} from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { CoffeeShopEditForm } from "@/components/coffee-shop-edit-form"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getSystemSettings } from "@/lib/actions/system-actions";
import { getCoffeeShopSales, deleteCoffeeShopSale } from "@/lib/actions/sales-actions";
import { getSchedules } from "@/lib/actions/schedule-actions";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts"

// 定义时间范围选项
const TIME_RANGE_OPTIONS = [
  { value: "day", label: "今日" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "year", label: "今年" },
  { value: "custom", label: "自定义" },
];

// 定义图表颜色
const CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
  "#00c49f", "#ffbb28", "#ff8042", "#a4de6c", "#d0ed57"
];

export function EnhancedCoffeeSalesReport() {
  const [employees, setEmployees] = useState([])
  const [commissionRate, setCommissionRate] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [salesData, setSalesData] = useState([])
  const [scheduleData, setScheduleData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSale, setCurrentSale] = useState(null)
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

  // 根据时间范围选择更新日期范围
  useEffect(() => {
    const now = new Date()

    switch (timeRange) {
      case "day":
        setDateRange({
          from: startOfDay(now),
          to: endOfDay(now)
        })
        break
      case "week":
        setDateRange({
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 })
        })
        break
      case "month":
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now)
        })
        break
      case "year":
        setDateRange({
          from: startOfYear(now),
          to: endOfYear(now)
        })
        break
      // 自定义范围不在这里处理
      case "custom":
        break
    }
  }, [timeRange])

  // 加载销售数据和排班数据
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      loadSalesData()
      loadScheduleData()
    }
  }, [dateRange, selectedEmployee])

  // 加载销售数据
  const loadSalesData = async () => {
    setIsLoading(true)
    try {
      // 使用服务器端操作获取咖啡店销售数据
      const startDate = dateRange.from.toISOString()
      const endDate = dateRange.to.toISOString()
      const employeeId = selectedEmployee !== "all" ? selectedEmployee : undefined

      console.log(`Loading coffee shop sales: ${startDate} to ${endDate}, employee: ${employeeId || 'all'}`);

      const data = await getCoffeeShopSales(startDate, endDate, employeeId)

      // 确保数据有效
      if (Array.isArray(data)) {
        console.log(`Loaded ${data.length} coffee shop sales records`);
        setSalesData(data)
        generateSummary(data)

        // 如果没有数据，显示提示
        if (data.length === 0) {
          toast({
            title: "没有找到数据",
            description: "所选时间范围内没有咖啡店销售记录",
          })
        }
      } else {
        console.error("Invalid coffee shop sales data:", data)
        setSalesData([])
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

        toast({
          title: "数据格式错误",
          description: "咖啡店销售数据格式不正确",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading coffee shop sales:", error)
      setSalesData([])
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

      toast({
        title: "加载失败",
        description: "无法加载咖啡店销售数据，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 加载排班数据
  const loadScheduleData = async () => {
    try {
      const startDate = dateRange.from.toISOString()
      const endDate = dateRange.to.toISOString()

      const data = await getSchedules(dateRange.from, dateRange.to)
      setScheduleData(data)
    } catch (error) {
      console.error("Error loading schedule data:", error)
    }
  }

  // 生成销售数据摘要
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

  // 处理导出报表
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

  // 处理编辑销售记录
  const handleEditSale = (sale) => {
    setCurrentSale(sale)
    setIsEditDialogOpen(true)
  }

  // 处理删除销售记录
  const handleDeleteSale = (sale) => {
    setCurrentSale(sale)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除销售记录
  const confirmDeleteSale = async () => {
    try {
      await deleteCoffeeShopSale(currentSale.id)

      toast({
        title: "删除成功",
        description: "咖啡店销售记录已删除",
      })

      // 重新加载数据
      loadSalesData()
    } catch (error) {
      console.error("Error deleting coffee shop sale:", error)
      toast({
        title: "删除失败",
        description: "无法删除咖啡店销售记录",
        variant: "destructive",
      })
    }
  }

  // 过滤销售数据
  const filteredSalesData = useMemo(() => {
    if (!searchQuery.trim()) return salesData

    const query = searchQuery.toLowerCase()
    return salesData.filter(sale => {
      // 按日期搜索
      const dateStr = format(new Date(sale.date), "yyyy-MM-dd")
      if (dateStr.includes(query)) return true

      // 按员工名称搜索
      const staffNames = sale.shifts.map(shift => shift.employee.name.toLowerCase()).join(" ")
      if (staffNames.includes(query)) return true

      // 按销售额搜索
      if (sale.totalSales.toString().includes(query)) return true

      // 按备注搜索
      if (sale.notes && sale.notes.toLowerCase().includes(query)) return true

      return false
    })
  }, [salesData, searchQuery])

  // 生成支付方式数据
  const paymentMethodChartData = useMemo(() => {
    return [
      { name: "现金", value: summaryData.paymentMethods.cash },
      { name: "刷卡", value: summaryData.paymentMethods.card },
      { name: "微信", value: summaryData.paymentMethods.wechat },
      { name: "支付宝", value: summaryData.paymentMethods.alipay },
      { name: "其他", value: summaryData.paymentMethods.other },
    ].filter(item => item.value > 0)
  }, [summaryData.paymentMethods])

  // 生成每日销售趋势数据
  const dailySalesData = useMemo(() => {
    const dailyMap = new Map()

    salesData.forEach(sale => {
      const date = format(new Date(sale.date), "yyyy-MM-dd")
      const existing = dailyMap.get(date) || { date, sales: 0, customers: 0 }

      existing.sales += sale.totalSales
      existing.customers += sale.customerCount

      dailyMap.set(date, existing)
    })

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [salesData])

  // 生成员工销售数据
  const staffSalesData = useMemo(() => {
    const staffMap = new Map()

    salesData.forEach(sale => {
      // 计算每位员工的销售额和提成
      const staffCount = sale.shifts.length
      if (staffCount === 0) return

      const salesPerStaff = sale.totalSales / staffCount
      const commissionPerStaff = (sale.totalSales * commissionRate / 100) / staffCount

      sale.shifts.forEach(shift => {
        const { id, name } = shift.employee
        const existing = staffMap.get(id) || {
          id,
          name,
          sales: 0,
          commission: 0,
          days: new Set()
        }

        existing.sales += salesPerStaff
        existing.commission += commissionPerStaff
        existing.days.add(format(new Date(sale.date), "yyyy-MM-dd"))

        staffMap.set(id, existing)
      })
    })

    return Array.from(staffMap.values())
      .map(staff => ({
        ...staff,
        days: staff.days.size,
        averagePerDay: staff.sales / staff.days.size
      }))
      .sort((a, b) => b.sales - a.sales)
  }, [salesData, commissionRate])

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>咖啡店销售报表</CardTitle>
          <CardDescription>查看和导出咖啡店销售统计报表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>时间范围</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择时间范围" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {timeRange !== "custom" && (
                <div className="text-xs text-muted-foreground">
                  {dateRange?.from && dateRange?.to && (
                    <>
                      {format(dateRange.from, "yyyy-MM-dd")} 至{" "}
                      {format(dateRange.to, "yyyy-MM-dd")}
                    </>
                  )}
                </div>
              )}
            </div>

            {timeRange === "custom" && (
              <div className="space-y-2">
                <Label>自定义日期范围</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
            )}

            <div className="space-y-2">
              <Label>员工</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>搜索</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索日期、员工、金额..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={loadSalesData}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  加载中...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  刷新数据
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportReport}
              disabled={isLoading || salesData.length === 0}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>

          {isLoading && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              正在加载数据，请稍候...
            </div>
          )}

          {!isLoading && salesData.length === 0 && (
            <div className="mt-4 p-4 border rounded-md bg-muted/20">
              <div className="text-center">
                <p className="text-muted-foreground">当前筛选条件下没有找到数据</p>
                <p className="text-xs text-muted-foreground mt-1">
                  尝试更改日期范围或员工筛选条件，或点击"刷新数据"按钮重试
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 报表内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3Icon className="mr-2 h-4 w-4" />
            总览
          </TabsTrigger>
          <TabsTrigger value="staff">
            <UserIcon className="mr-2 h-4 w-4" />
            员工分析
          </TabsTrigger>
          <TabsTrigger value="details">
            <SearchIcon className="mr-2 h-4 w-4" />
            详细记录
          </TabsTrigger>
        </TabsList>

        {/* 总览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 关键指标卡片 */}
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

          {/* 销售趋势图表 */}
          <Card>
            <CardHeader>
              <CardTitle>销售趋势</CardTitle>
              <CardDescription>
                {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")} 的销售趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailySalesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无数据</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      name="销售额"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="customers"
                      name="顾客数"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 支付方式统计 */}
          <Card>
            <CardHeader>
              <CardTitle>支付方式统计</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(summaryData.paymentMethods).map(([key, value]) => {
                    const labels = {
                      cash: "现金",
                      card: "刷卡",
                      wechat: "微信",
                      alipay: "支付宝",
                      other: "其他"
                    };

                    if (value === 0) return null;

                    const percentage = summaryData.totalSales > 0
                      ? (value / summaryData.totalSales) * 100
                      : 0;

                    return (
                      <div key={key} className="space-y-1">
                        <div className="text-sm text-muted-foreground">{labels[key]}</div>
                        <div className="text-xl font-medium">¥{value.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 员工分析标签页 */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>员工销售统计</CardTitle>
              <CardDescription>
                {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")} 的员工销售数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffSalesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无数据</div>
              ) : (
                <div className="space-y-6">
                  {/* 员工销售额柱状图 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">员工销售额</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={staffSalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="sales" name="销售额" fill="#8884d8" />
                        <Bar dataKey="commission" name="提成" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 员工销售数据表格 */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">员工销售详情</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>员工</TableHead>
                          <TableHead className="text-right">销售额</TableHead>
                          <TableHead className="text-right">提成</TableHead>
                          <TableHead className="text-right">出勤天数</TableHead>
                          <TableHead className="text-right">日均销售</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffSalesData.map(staff => (
                          <TableRow key={staff.id}>
                            <TableCell>{staff.name}</TableCell>
                            <TableCell className="text-right">¥{staff.sales.toFixed(2)}</TableCell>
                            <TableCell className="text-right">¥{staff.commission.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{staff.days}</TableCell>
                            <TableCell className="text-right">¥{staff.averagePerDay.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 排班与销售关联分析 */}
          <Card>
            <CardHeader>
              <CardTitle>排班与销售关联</CardTitle>
              <CardDescription>
                分析排班情况与销售业绩的关系
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesData.length === 0 || scheduleData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无数据</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">总排班天数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {new Set(scheduleData.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">有销售记录天数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {new Set(salesData.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">平均每天销售额</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ¥{(summaryData.totalSales / new Set(salesData.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">排班与销售记录对比</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>排班员工</TableHead>
                          <TableHead className="text-right">销售额</TableHead>
                          <TableHead className="text-right">顾客数</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from(new Set(
                          [...salesData, ...scheduleData].map(item =>
                            format(new Date(item.date), "yyyy-MM-dd")
                          )
                        )).sort().map(dateStr => {
                          // 获取当天的排班员工
                          const daySchedules = scheduleData.filter(s =>
                            format(new Date(s.date), "yyyy-MM-dd") === dateStr
                          );

                          // 获取当天的销售记录
                          const daySales = salesData.filter(s =>
                            format(new Date(s.date), "yyyy-MM-dd") === dateStr
                          );

                          // 计算当天总销售额和顾客数
                          const totalSales = daySales.reduce((sum, sale) => sum + sale.totalSales, 0);
                          const totalCustomers = daySales.reduce((sum, sale) => sum + sale.customerCount, 0);

                          return (
                            <TableRow key={dateStr}>
                              <TableCell>{dateStr}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {daySchedules.map(schedule => (
                                    <Badge key={schedule.id} variant="outline">
                                      {schedule.employee.name} ({schedule.startTime}-{schedule.endTime})
                                    </Badge>
                                  ))}
                                  {daySchedules.length === 0 && "无排班"}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {totalSales > 0 ? `¥${totalSales.toFixed(2)}` : "无销售"}
                              </TableCell>
                              <TableCell className="text-right">{totalCustomers}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 详细记录标签页 */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>销售记录</CardTitle>
                <CardDescription>
                  {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")} 的销售记录
                  {searchQuery && ` (搜索: "${searchQuery}")`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {filteredSalesData.length > 0 && `共 ${filteredSalesData.length} 条记录`}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCwIcon className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                  <p className="text-muted-foreground">加载销售记录中...</p>
                </div>
              ) : filteredSalesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground mb-2">暂无销售记录数据</p>
                  <p className="text-xs text-muted-foreground text-center max-w-md">
                    当前筛选条件下没有找到销售记录。尝试更改日期范围或员工筛选条件，或点击"刷新数据"按钮重试。
                  </p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日期</TableHead>
                        <TableHead>顾客数</TableHead>
                        <TableHead className="text-right">销售额</TableHead>
                        <TableHead className="text-right">提成</TableHead>
                        <TableHead>值班员工</TableHead>
                        <TableHead>支付方式</TableHead>
                        <TableHead>备注</TableHead>
                        <TableHead className="w-[80px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalesData.map(sale => (
                        <TableRow key={sale.id}>
                          <TableCell>{format(sale.date instanceof Date ? sale.date : new Date(sale.date), "yyyy-MM-dd")}</TableCell>
                          <TableCell>{sale.customerCount}</TableCell>
                          <TableCell className="text-right font-medium">¥{sale.totalSales.toFixed(2)}</TableCell>
                          <TableCell className="text-right">¥{(sale.totalSales * (commissionRate / 100)).toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {sale.shifts.map(shift => (
                                <Badge key={shift.id} variant="outline">
                                  {shift.employee.name}
                                </Badge>
                              ))}
                              {sale.shifts.length === 0 && <span className="text-muted-foreground text-xs">无值班员工</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                              {sale.cashAmount > 0 && <span>现金: ¥{sale.cashAmount.toFixed(2)}</span>}
                              {sale.cardAmount > 0 && <span>刷卡: ¥{sale.cardAmount.toFixed(2)}</span>}
                              {sale.wechatAmount > 0 && <span>微信: ¥{sale.wechatAmount.toFixed(2)}</span>}
                              {sale.alipayAmount > 0 && <span>支付宝: ¥{sale.alipayAmount.toFixed(2)}</span>}
                              {sale.otherAmount > 0 && <span>其他: ¥{sale.otherAmount.toFixed(2)}</span>}
                              {(sale.cashAmount + sale.cardAmount + sale.wechatAmount + sale.alipayAmount + sale.otherAmount) === 0 &&
                                <span className="text-muted-foreground">未分类</span>
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate" title={sale.notes || ""}>
                              {sale.notes || <span className="text-muted-foreground text-xs">无备注</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteSale(sale)}
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑咖啡店销售记录</DialogTitle>
            <DialogDescription>
              修改咖啡店销售记录的详细信息
            </DialogDescription>
          </DialogHeader>
          {currentSale && (
            <CoffeeShopEditForm
              saleData={currentSale}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                loadSalesData()
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="确认删除"
        description="您确定要删除这条咖啡店销售记录吗？此操作无法撤销。"
        confirmLabel="确认删除"
        variant="destructive"
        onConfirm={confirmDeleteSale}
      >
        {currentSale && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between">
              <span className="font-medium">日期:</span>
              <span>{format(new Date(currentSale.date), "yyyy-MM-dd")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">销售额:</span>
              <span>¥{currentSale.totalSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">值班员工:</span>
              <span>{currentSale.shifts.map(shift => shift.employee.name).join(", ")}</span>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
