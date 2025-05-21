"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeftIcon, UserIcon, FileTextIcon, CalendarIcon, DollarSignIcon, DownloadIcon } from "lucide-react"
import Link from "next/link"
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function EmployeeSalaryPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [salaryData, setSalaryData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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

        // 获取薪资数据
        await fetchSalaryData()
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

  // 确保fetchSalaryData可以访问到最新的状态
  useEffect(() => {
    if (employee) {
      fetchSalaryData()
    }
  }, [selectedYear])

  // 获取薪资数据
  const fetchSalaryData = async () => {
    try {
      setLoading(true)

      // 生成所选年份的每个月
      const startDate = new Date(selectedYear, 0, 1) // 1月1日
      const endDate = new Date(selectedYear, 11, 31) // 12月31日

      const months = eachMonthOfInterval({ start: startDate, end: endDate })

      // 为每个月生成薪资数据
      const salaryRecords = await Promise.all(months.map(async (month) => {
        try {
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)

          // 格式化日期
          const formattedStartDate = format(monthStart, "yyyy-MM-dd")
          const formattedEndDate = format(monthEnd, "yyyy-MM-dd")

          // 获取活动数据
          const activitiesResponse = await fetch(
            `/api/employees/${params.id}/activities?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
          )

          if (!activitiesResponse.ok) {
            console.error(`Failed to fetch activities for ${format(month, 'yyyy-MM')}: ${activitiesResponse.statusText}`)
            return null
          }

          const activitiesData = await activitiesResponse.json()

          // 获取排班数据
          const schedulesResponse = await fetch(
            `/api/employees/${params.id}/schedules?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
          )

          if (!schedulesResponse.ok) {
            console.error(`Failed to fetch schedules for ${format(month, 'yyyy-MM')}: ${schedulesResponse.statusText}`)
            return null
          }

          const schedulesData = await schedulesResponse.json()

          // 计算薪资
          return calculateMonthlySalary(month, activitiesData, schedulesData)
        } catch (error) {
          console.error(`Error processing month ${format(month, 'yyyy-MM')}:`, error)
          return null
        }
      }))

      // 过滤掉null值并按月份排序
      const validRecords = salaryRecords.filter(record => record !== null)
      setSalaryData(validRecords)
    } catch (error) {
      console.error("Error fetching salary data:", error)
      toast({
        title: "获取薪资数据失败",
        description: "请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 计算月度薪资
  const calculateMonthlySalary = (month, activities, schedules) => {
    if (!employee) return null

    // 按类型分组活动
    const gallerySales = activities.filter(a => a.type === '画廊销售')
    const pieceWorks = activities.filter(a => a.type === '配件制作' || a.type === '珐琅制作')
    const teacherWorkshops = activities.filter(a => a.type === '工作坊讲师')
    const assistantWorkshops = activities.filter(a => a.type === '工作坊助教')
    const coffeeShifts = activities.filter(a => a.type === '咖啡店值班')

    // 计算销售提成
    const salesCommission = gallerySales.reduce((sum, sale) => {
      try {
        const detailsText = sale.details || '';
        const match = detailsText.match(/¥(\d+(\.\d+)?)/);
        const amount = match ? parseFloat(match[1]) : 0;
        // 假设销售提成为10%
        return sum + (amount * 0.1);
      } catch (error) {
        console.error("Error parsing sale amount:", error, sale);
        return sum;
      }
    }, 0)

    // 计算计件工作收入
    const pieceWorkIncome = pieceWorks.reduce((sum, work) => {
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

    // 计算工作坊收入
    const teacherWorkshopIncome = teacherWorkshops.length * 200 // 假设讲师费用为200元/场
    const assistantWorkshopIncome = assistantWorkshops.length * 130 // 假设助教费用为130元/场

    // 计算咖啡店值班提成
    const coffeeShiftCommission = coffeeShifts.reduce((sum, shift) => {
      try {
        const detailsText = shift.details || '';
        const match = detailsText.match(/¥(\d+(\.\d+)?)/);
        const amount = match ? parseFloat(match[1]) : 0;
        // 假设咖啡店销售提成为20%
        return sum + (amount * 0.2);
      } catch (error) {
        console.error("Error parsing coffee shift amount:", error, shift);
        return sum;
      }
    }, 0)

    // 计算排班工资
    const scheduleSalary = schedules.reduce((sum, schedule) => {
      const startTime = schedule.startTime.split(':').map(Number)
      const endTime = schedule.endTime.split(':').map(Number)
      const startMinutes = startTime[0] * 60 + startTime[1]
      const endMinutes = endTime[0] * 60 + endTime[1]
      const hours = (endMinutes - startMinutes) / 60

      // 日薪按小时计算
      return sum + (hours * (employee.dailySalary / 8))
    }, 0)

    // 计算总收入
    const totalIncome = salesCommission + pieceWorkIncome + teacherWorkshopIncome +
                        assistantWorkshopIncome + coffeeShiftCommission + scheduleSalary

    return {
      month,
      salesCommission,
      pieceWorkIncome,
      workshopIncome: teacherWorkshopIncome + assistantWorkshopIncome,
      coffeeShiftCommission,
      scheduleSalary,
      totalIncome,
      details: {
        schedulesCount: schedules.length,
        gallerySalesCount: gallerySales.length,
        pieceWorksCount: pieceWorks.length,
        workshopsCount: teacherWorkshops.length + assistantWorkshops.length,
        coffeeShiftsCount: coffeeShifts.length
      }
    }
  }

  // 处理年份变更
  const handleYearChange = (direction) => {
    const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1
    setSelectedYear(newYear)
    // 不需要手动调用fetchSalaryData，useEffect会处理
  }

  // 导出薪资单
  const handleExportSalary = (monthData) => {
    toast({
      title: "导出功能开发中",
      description: `即将导出 ${format(new Date(monthData.month), 'yyyy年MM月', { locale: zhCN })} 的薪资单`,
    })
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
            <h1 className="text-2xl font-semibold tracking-tight">员工薪资 - {employee.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleYearChange('prev')}>
              上一年
            </Button>
            <div className="px-2 py-1 rounded-md bg-muted">
              {selectedYear}年
            </div>
            <Button variant="outline" size="sm" onClick={() => handleYearChange('next')}>
              下一年
            </Button>
          </div>
        </div>

        {/* 薪资信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>薪资信息</CardTitle>
            <CardDescription>员工基本薪资信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col p-4 border rounded-md">
                <span className="text-sm text-muted-foreground">日薪标准</span>
                <span className="text-2xl font-bold">¥{employee.dailySalary.toFixed(2)}</span>
              </div>
              <div className="flex flex-col p-4 border rounded-md">
                <span className="text-sm text-muted-foreground">月薪估算 (22天)</span>
                <span className="text-2xl font-bold">¥{(employee.dailySalary * 22).toFixed(2)}</span>
              </div>
              <div className="flex flex-col p-4 border rounded-md">
                <span className="text-sm text-muted-foreground">年薪估算</span>
                <span className="text-2xl font-bold">¥{(employee.dailySalary * 22 * 12).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 月度薪资表格 */}
        <Card>
          <CardHeader>
            <CardTitle>月度薪资明细</CardTitle>
            <CardDescription>{selectedYear}年薪资记录</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">加载薪资数据中...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月份</TableHead>
                      <TableHead>排班工资</TableHead>
                      <TableHead>销售提成</TableHead>
                      <TableHead>计件收入</TableHead>
                      <TableHead>工作坊收入</TableHead>
                      <TableHead>咖啡店提成</TableHead>
                      <TableHead>总收入</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <FileTextIcon className="h-12 w-12 mb-2 opacity-20" />
                            <p>暂无薪资数据</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      salaryData.map((record) => (
                        <TableRow key={`${record.month.getFullYear()}-${record.month.getMonth() + 1}`}>
                          <TableCell>
                            <div className="font-medium">
                              {format(new Date(record.month), 'MM月', { locale: zhCN })}
                            </div>
                          </TableCell>
                          <TableCell>¥{record.scheduleSalary.toFixed(2)}</TableCell>
                          <TableCell>¥{record.salesCommission.toFixed(2)}</TableCell>
                          <TableCell>¥{record.pieceWorkIncome.toFixed(2)}</TableCell>
                          <TableCell>¥{record.workshopIncome.toFixed(2)}</TableCell>
                          <TableCell>¥{record.coffeeShiftCommission.toFixed(2)}</TableCell>
                          <TableCell className="font-bold">¥{record.totalIncome.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleExportSalary(record)}>
                              <DownloadIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
