"use client"

import { useState } from "react"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedChart } from "@/components/enhanced-chart"
import { 
  BarChart3Icon, PieChartIcon, LineChartIcon, 
  UserIcon, CalendarIcon, ClockIcon 
} from "lucide-react"

export function ScheduleStats({ schedules = [], employees = [], loading = false, month = new Date() }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  
  // 计算统计数据
  const calculateStats = () => {
    // 过滤选定员工的排班
    const filteredSchedules = selectedEmployee === "all" 
      ? schedules 
      : schedules.filter(s => s.employeeId.toString() === selectedEmployee)
    
    // 计算总排班数
    const totalSchedules = filteredSchedules.length
    
    // 计算参与员工数
    const uniqueEmployees = new Set(filteredSchedules.map(s => s.employeeId))
    const employeeCount = uniqueEmployees.size
    
    // 计算排班天数
    const uniqueDates = new Set(filteredSchedules.map(s => format(new Date(s.date), "yyyy-MM-dd")))
    const daysCount = uniqueDates.size
    
    // 计算总工时
    const totalHours = filteredSchedules.reduce((total, schedule) => {
      const [startHour, startMin] = schedule.startTime.split(":").map(Number)
      const [endHour, endMin] = schedule.endTime.split(":").map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      return total + (endMinutes - startMinutes) / 60
    }, 0)
    
    // 计算平均每天工时
    const avgHoursPerDay = daysCount > 0 ? totalHours / daysCount : 0
    
    // 计算平均每人工时
    const avgHoursPerEmployee = employeeCount > 0 ? totalHours / employeeCount : 0
    
    return {
      totalSchedules,
      employeeCount,
      daysCount,
      totalHours,
      avgHoursPerDay,
      avgHoursPerEmployee
    }
  }
  
  // 生成员工工时数据
  const generateEmployeeHoursData = () => {
    const data = []
    
    employees.forEach(employee => {
      const employeeSchedules = schedules.filter(s => s.employeeId === employee.id)
      
      if (employeeSchedules.length > 0) {
        const totalHours = employeeSchedules.reduce((total, schedule) => {
          const [startHour, startMin] = schedule.startTime.split(":").map(Number)
          const [endHour, endMin] = schedule.endTime.split(":").map(Number)
          const startMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin
          return total + (endMinutes - startMinutes) / 60
        }, 0)
        
        data.push({
          name: employee.name,
          hours: parseFloat(totalHours.toFixed(1)),
          count: employeeSchedules.length
        })
      }
    })
    
    return data.sort((a, b) => b.hours - a.hours)
  }
  
  // 生成每日排班数据
  const generateDailyScheduleData = () => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    return daysInMonth.map(day => {
      const daySchedules = schedules.filter(s => {
        const scheduleDate = new Date(s.date)
        return format(scheduleDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      })
      
      const totalHours = daySchedules.reduce((total, schedule) => {
        const [startHour, startMin] = schedule.startTime.split(":").map(Number)
        const [endHour, endMin] = schedule.endTime.split(":").map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        return total + (endMinutes - startMinutes) / 60
      }, 0)
      
      return {
        date: format(day, "MM-dd"),
        day: format(day, "EEE", { locale: zhCN }),
        count: daySchedules.length,
        hours: parseFloat(totalHours.toFixed(1)),
        weekday: getDay(day)
      }
    })
  }
  
  // 生成星期排班分布数据
  const generateWeekdayDistributionData = () => {
    const weekdays = [
      { name: "周日", value: 0, count: 0 },
      { name: "周一", value: 0, count: 0 },
      { name: "周二", value: 0, count: 0 },
      { name: "周三", value: 0, count: 0 },
      { name: "周四", value: 0, count: 0 },
      { name: "周五", value: 0, count: 0 },
      { name: "周六", value: 0, count: 0 },
    ]
    
    schedules.forEach(schedule => {
      const date = new Date(schedule.date)
      const dayOfWeek = getDay(date)
      
      const [startHour, startMin] = schedule.startTime.split(":").map(Number)
      const [endHour, endMin] = schedule.endTime.split(":").map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const hours = (endMinutes - startMinutes) / 60
      
      weekdays[dayOfWeek].value += hours
      weekdays[dayOfWeek].count += 1
    })
    
    return weekdays.map(day => ({
      ...day,
      value: parseFloat(day.value.toFixed(1))
    }))
  }
  
  // 生成时间段分布数据
  const generateTimeDistributionData = () => {
    const timeSlots = [
      { name: "早班 (6-10点)", value: 0 },
      { name: "上午 (10-12点)", value: 0 },
      { name: "中午 (12-14点)", value: 0 },
      { name: "下午 (14-18点)", value: 0 },
      { name: "晚班 (18-22点)", value: 0 },
      { name: "夜班 (22-6点)", value: 0 },
    ]
    
    schedules.forEach(schedule => {
      const [startHour, startMin] = schedule.startTime.split(":").map(Number)
      const [endHour, endMin] = schedule.endTime.split(":").map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const hours = (endMinutes - startMinutes) / 60
      
      // 根据开始时间判断属于哪个时间段
      if (startHour >= 6 && startHour < 10) {
        timeSlots[0].value += hours
      } else if (startHour >= 10 && startHour < 12) {
        timeSlots[1].value += hours
      } else if (startHour >= 12 && startHour < 14) {
        timeSlots[2].value += hours
      } else if (startHour >= 14 && startHour < 18) {
        timeSlots[3].value += hours
      } else if (startHour >= 18 && startHour < 22) {
        timeSlots[4].value += hours
      } else {
        timeSlots[5].value += hours
      }
    })
    
    return timeSlots.map(slot => ({
      ...slot,
      value: parseFloat(slot.value.toFixed(1))
    }))
  }
  
  const stats = calculateStats()
  const employeeHoursData = generateEmployeeHoursData()
  const dailyScheduleData = generateDailyScheduleData()
  const weekdayDistributionData = generateWeekdayDistributionData()
  const timeDistributionData = generateTimeDistributionData()

  return (
    <div className="space-y-6">
      {/* 员工选择器 */}
      <div className="w-full sm:w-auto">
        <Select 
          value={selectedEmployee} 
          onValueChange={setSelectedEmployee}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总排班数</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalSchedules}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.daysCount} 天 / {stats.employeeCount} 名员工
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总工时</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)} 小时</div>
            )}
            <p className="text-xs text-muted-foreground">
              平均每天 {stats.avgHoursPerDay.toFixed(1)} 小时
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">人均工时</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.avgHoursPerEmployee.toFixed(1)} 小时</div>
            )}
            <p className="text-xs text-muted-foreground">
              平均每人 {(stats.totalSchedules / (stats.employeeCount || 1)).toFixed(1)} 次排班
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 图表区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            员工工时
          </TabsTrigger>
          <TabsTrigger value="daily">
            <LineChartIcon className="h-4 w-4 mr-2" />
            每日排班
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <PieChartIcon className="h-4 w-4 mr-2" />
            排班分布
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>员工工时统计</CardTitle>
              <CardDescription>各员工排班工时统计</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : employeeHoursData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground">暂无数据</p>
                </div>
              ) : (
                <EnhancedChart
                  data={employeeHoursData}
                  type="bar"
                  xAxisKey="name"
                  yAxisKeys={["hours"]}
                  height={350}
                  options={{
                    showGrid: true,
                    orientation: "horizontal",
                    barSize: 20
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="daily" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>每日排班统计</CardTitle>
              <CardDescription>每日排班数量和工时统计</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : dailyScheduleData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground">暂无数据</p>
                </div>
              ) : (
                <EnhancedChart
                  data={dailyScheduleData}
                  type="composed"
                  xAxisKey="date"
                  yAxisKeys={["count", "hours"]}
                  height={350}
                  options={{
                    showGrid: true,
                    chartTypes: {
                      count: "bar",
                      hours: "line"
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>星期分布</CardTitle>
                <CardDescription>按星期统计的排班工时分布</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : weekdayDistributionData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">暂无数据</p>
                  </div>
                ) : (
                  <EnhancedChart
                    data={weekdayDistributionData}
                    type="bar"
                    xAxisKey="name"
                    yAxisKeys={["value"]}
                    height={300}
                    options={{
                      showGrid: true,
                      barSize: 30
                    }}
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>时段分布</CardTitle>
                <CardDescription>按时间段统计的排班工时分布</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : timeDistributionData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">暂无数据</p>
                  </div>
                ) : (
                  <EnhancedChart
                    data={timeDistributionData}
                    type="pie"
                    xAxisKey="name"
                    yAxisKeys={["value"]}
                    height={300}
                    options={{
                      showGrid: false,
                      pieInnerRadius: 60,
                      pieOuterRadius: 120,
                      pieLabel: true
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
