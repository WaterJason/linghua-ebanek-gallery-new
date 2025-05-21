"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, TrendingUpIcon, PieChartIcon, BarChart2Icon, UsersIcon } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts"
import { exportSalaryStatisticsToExcel } from "@/lib/export-utils"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export function SalaryStatistics({ salaryRecords, employees }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [monthFilter, setMonthFilter] = useState("all")
  const [filteredRecords, setFilteredRecords] = useState([])
  const [overviewData, setOverviewData] = useState([])
  const [compositionData, setCompositionData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [comparisonData, setComparisonData] = useState([])
  const [loading, setLoading] = useState(true)

  // 筛选薪资记录
  useEffect(() => {
    if (!salaryRecords || salaryRecords.length === 0) {
      setFilteredRecords([])
      setLoading(false)
      return
    }

    let result = [...salaryRecords]

    // 应用年份筛选
    if (yearFilter !== "all") {
      result = result.filter(record => record.year.toString() === yearFilter)
    }

    // 应用月份筛选
    if (monthFilter !== "all") {
      result = result.filter(record => record.month.toString() === monthFilter)
    }

    setFilteredRecords(result)

    // 生成统计数据
    generateStatisticsData(result)

    setLoading(false)
  }, [salaryRecords, yearFilter, monthFilter])

  // 生成统计数据
  const generateStatisticsData = (records) => {
    if (!records || records.length === 0) return

    // 1. 总览数据
    const totalSalary = records.reduce((sum, record) => sum + record.totalIncome, 0)
    const totalNetSalary = records.reduce((sum, record) => sum + record.netIncome, 0)
    const avgSalary = totalSalary / records.length
    const maxSalary = Math.max(...records.map(record => record.totalIncome))
    const minSalary = Math.min(...records.map(record => record.totalIncome))

    setOverviewData([
      { name: '总薪资支出', value: totalSalary },
      { name: '实发薪资总额', value: totalNetSalary },
      { name: '平均薪资', value: avgSalary },
      { name: '最高薪资', value: maxSalary },
      { name: '最低薪资', value: minSalary }
    ])

    // 2. 薪资构成数据
    const baseSalaryTotal = records.reduce((sum, record) => sum + record.baseSalary, 0)
    const scheduleSalaryTotal = records.reduce((sum, record) => sum + record.scheduleSalary, 0)
    const salesCommissionTotal = records.reduce((sum, record) => sum + record.salesCommission, 0)
    const pieceWorkIncomeTotal = records.reduce((sum, record) => sum + record.pieceWorkIncome, 0)
    const workshopIncomeTotal = records.reduce((sum, record) => sum + record.workshopIncome, 0)
    const coffeeShiftCommissionTotal = records.reduce((sum, record) => sum + record.coffeeShiftCommission, 0)
    const overtimePayTotal = records.reduce((sum, record) => sum + record.overtimePay, 0)
    const bonusTotal = records.reduce((sum, record) => sum + record.bonus, 0)

    setCompositionData([
      { name: '基本工资', value: baseSalaryTotal },
      { name: '排班工资', value: scheduleSalaryTotal },
      { name: '销售提成', value: salesCommissionTotal },
      { name: '计件收入', value: pieceWorkIncomeTotal },
      { name: '工作坊收入', value: workshopIncomeTotal },
      { name: '咖啡店提成', value: coffeeShiftCommissionTotal },
      { name: '加班费', value: overtimePayTotal },
      { name: '奖金', value: bonusTotal }
    ])

    // 3. 薪资趋势数据
    // 按月份分组
    const monthlyData = {}
    records.forEach(record => {
      const monthKey = `${record.year}-${record.month.toString().padStart(2, '0')}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalSalary: 0,
          employeeCount: 0
        }
      }
      monthlyData[monthKey].totalSalary += record.totalIncome
      monthlyData[monthKey].employeeCount += 1
    })

    // 转换为数组并排序
    const trendDataArray = Object.values(monthlyData)
    trendDataArray.sort((a, b) => a.month.localeCompare(b.month))

    // 计算平均薪资
    trendDataArray.forEach(item => {
      item.avgSalary = item.totalSalary / item.employeeCount
    })

    setTrendData(trendDataArray)

    // 4. 职位薪资对比数据
    // 按职位分组
    const positionData = {}
    records.forEach(record => {
      const employee = employees.find(e => e.id === record.employeeId)
      if (!employee) return

      const position = employee.position || '未知职位'
      if (!positionData[position]) {
        positionData[position] = {
          position,
          totalSalary: 0,
          count: 0
        }
      }
      positionData[position].totalSalary += record.totalIncome
      positionData[position].count += 1
    })

    // 计算平均薪资并转换为数组
    const comparisonDataArray = Object.values(positionData).map(item => ({
      position: item.position,
      avgSalary: item.totalSalary / item.count,
      employeeCount: item.count
    }))

    setComparisonData(comparisonDataArray)
  }

  // 导出统计数据
  const handleExportStatistics = () => {
    try {
      if (filteredRecords.length === 0) {
        toast({
          title: "无数据可导出",
          description: "请先添加薪资记录",
          variant: "destructive",
        })
        return
      }

      const fileName = exportSalaryStatisticsToExcel(
        overviewData,
        compositionData,
        trendData,
        comparisonData,
        `薪资统计_${yearFilter !== "all" ? yearFilter + "年" : "全部年份"}_${monthFilter !== "all" ? monthFilter + "月" : "全部月份"}`
      )

      toast({
        title: "导出成功",
        description: `薪资统计数据已导出为 ${fileName}`,
      })
    } catch (error) {
      console.error("Error exporting salary statistics:", error)
      toast({
        title: "导出失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 格式化金额
  const formatCurrency = (value) => {
    return `¥${value.toFixed(2)}`
  }

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-2">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* 筛选工具栏 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="年份筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有年份</SelectItem>
              <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}年</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}年</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}年</SelectItem>
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="月份筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有月份</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExportStatistics}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          导出统计数据
        </Button>
      </div>

      {/* 统计选项卡 */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2Icon className="h-4 w-4 mr-2" />
            薪资总览
          </TabsTrigger>
          <TabsTrigger value="composition">
            <PieChartIcon className="h-4 w-4 mr-2" />
            薪资构成
          </TabsTrigger>
          <TabsTrigger value="trend">
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            薪资趋势
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <UsersIcon className="h-4 w-4 mr-2" />
            职位对比
          </TabsTrigger>
        </TabsList>

        {/* 薪资总览 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资总览</CardTitle>
              <CardDescription>薪资支出总览统计</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无薪资数据
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overviewData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="金额" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 薪资构成 */}
        <TabsContent value="composition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资构成分析</CardTitle>
              <CardDescription>各项薪资组成部分占比</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无薪资数据
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={compositionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {compositionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 薪资趋势 */}
        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资趋势分析</CardTitle>
              <CardDescription>薪资变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无薪资数据
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="totalSalary" name="总薪资" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="avgSalary" name="平均薪资" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 职位薪资对比 */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>职位薪资对比</CardTitle>
              <CardDescription>不同职位的平均薪资对比</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无薪资数据
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="position" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="avgSalary" name="平均薪资" fill="#8884d8" />
                      <Bar dataKey="employeeCount" name="员工数量" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
