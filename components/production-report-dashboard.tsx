"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, DownloadIcon, ClockIcon } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts"

export function ProductionReportDashboard() {
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [pieceWorks, setPieceWorks] = useState([])
  const [productionTrend, setProductionTrend] = useState([])
  const [employeePerformance, setEmployeePerformance] = useState([])
  const [productPerformance, setProductPerformance] = useState([])
  const [summaryData, setSummaryData] = useState({
    totalPieces: 0,
    totalAmount: 0,
    averagePerDay: 0,
    employeeCount: 0
  })

  // 加载员工数据
  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await fetch('/api/employees')
        if (!response.ok) throw new Error("Failed to fetch employees")
        
        const data = await response.json()
        setEmployees(data.filter(emp => emp.status === "active"))
      } catch (error) {
        console.error("Error loading employees:", error)
        toast({
          title: "加载失败",
          description: "无法加载员工数据",
          variant: "destructive",
        })
      }
    }
    
    loadEmployees()
  }, [])

  // 加载计件数据
  useEffect(() => {
    loadPieceWorkData()
  }, [dateRange, selectedEmployee])

  const loadPieceWorkData = async () => {
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
      
      const response = await fetch(`/api/piece-works?${params}`)
      if (!response.ok) throw new Error("Failed to fetch piece works")
      
      const data = await response.json()
      setPieceWorks(data)
      
      // 处理计件数据
      processProductionData(data)
    } catch (error) {
      console.error("Error loading piece work data:", error)
      toast({
        title: "加载失败",
        description: "无法加载计件数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processProductionData = (data) => {
    // 计算生产趋势（按日期分组）
    const dateMap = new Map()
    
    data.forEach(work => {
      const date = format(new Date(work.date), "yyyy-MM-dd")
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          count: 0,
          amount: 0
        })
      }
      
      const dateStats = dateMap.get(date)
      dateStats.count += work.quantity
      dateStats.amount += work.amount
    })
    
    // 按日期排序
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    setProductionTrend(sortedDates)
    
    // 计算员工绩效
    const employeeMap = new Map()
    
    data.forEach(work => {
      const employeeId = work.employee.id
      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          name: work.employee.name,
          count: 0,
          amount: 0
        })
      }
      
      const employeeStats = employeeMap.get(employeeId)
      employeeStats.count += work.quantity
      employeeStats.amount += work.amount
    })
    
    // 按金额排序
    const sortedEmployees = Array.from(employeeMap.values())
      .sort((a, b) => b.amount - a.amount)
    
    setEmployeePerformance(sortedEmployees)
    
    // 计算产品绩效
    const productMap = new Map()
    
    data.forEach(work => {
      const productName = work.productName
      if (!productMap.has(productName)) {
        productMap.set(productName, {
          name: productName,
          count: 0,
          amount: 0
        })
      }
      
      const productStats = productMap.get(productName)
      productStats.count += work.quantity
      productStats.amount += work.amount
    })
    
    // 按数量排序
    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // 只取前10名
    
    setProductPerformance(sortedProducts)
    
    // 计算汇总数据
    const totalPieces = data.reduce((sum, work) => sum + work.quantity, 0)
    const totalAmount = data.reduce((sum, work) => sum + work.amount, 0)
    
    // 计算日期范围内的天数
    const days = Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)))
    const averagePerDay = totalPieces / days
    
    setSummaryData({
      totalPieces,
      totalAmount,
      averagePerDay,
      employeeCount: employeeMap.size
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
      window.location.href = `/api/export/production-report?${params}`
      
      toast({
        title: "导出成功",
        description: "生产报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出生产报表",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>生产报表</CardTitle>
          <CardDescription>查看和分析生产计件数据</CardDescription>
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
      
      {/* 生产汇总 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总生产数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalPieces}</div>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总计件金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              计件工资总额
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">日均生产</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.averagePerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              平均每日生产数量
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">参与员工</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.employeeCount}</div>
            <p className="text-xs text-muted-foreground">
              参与生产的员工数量
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 生产趋势 */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>生产趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : productionTrend.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={productionTrend}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `¥${value}`} />
                  <Tooltip formatter={(value, name) => [
                    name === "count" ? `${value} 件` : `¥${value.toFixed(2)}`,
                    name === "count" ? "生产数量" : "计件金额"
                  ]} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" name="生产数量" stroke="#0070f3" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="amount" name="计件金额" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* 员工绩效 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>员工绩效</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : employeePerformance.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  layout="vertical"
                  data={employeePerformance}
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <XAxis type="number" tickFormatter={(value) => `¥${value}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                  <Bar dataKey="amount" name="计件金额" fill="#0070f3" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* 产品生产量 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>产品生产量 TOP 10</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : productPerformance.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  layout="vertical"
                  data={productPerformance}
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value, name) => [
                    name === "count" ? `${value} 件` : `¥${value.toFixed(2)}`,
                    name === "count" ? "生产数量" : "计件金额"
                  ]} />
                  <Bar dataKey="count" name="生产数量" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
