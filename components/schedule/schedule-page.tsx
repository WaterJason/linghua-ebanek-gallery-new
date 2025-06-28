"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  PlusIcon, CalendarIcon, UsersIcon, CopyIcon,
  FilterIcon, DownloadIcon, UploadIcon, AlertTriangleIcon,
  BarChart3Icon, TrashIcon, InfoIcon, XIcon, UserIcon, ClockIcon
} from "lucide-react"
import { ScheduleCalendar } from "@/components/schedule-calendar"
import { ScheduleDayCalendar } from "@/components/schedule-day-calendar"
import { AddScheduleDialog } from "@/components/add-schedule-dialog"
import { BatchScheduleDialog } from "@/components/batch-schedule-dialog"
import { ScheduleTemplateDialog } from "@/components/schedule-template-dialog"
import { TodaySchedule } from "@/components/today-schedule"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { zhCN } from "date-fns/locale"
import { getSchedules, clearAllSchedules, deleteSchedule, getSchedulesByDate, getScheduleTemplates } from "@/lib/actions/schedule-actions";

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

export function SchedulePage({ employees }) {
  // 增强操作系统
  const enhancedOps = useEnhancedOperations('schedule')
  const [activeTab, setActiveTab] = useState("calendar")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchScheduleOpen, setIsBatchScheduleOpen] = useState(false)
  const [batchScheduleCalendarView, setBatchScheduleCalendarView] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [scheduleAdded, setScheduleAdded] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [scheduleConflicts, setScheduleConflicts] = useState([])
  const [selectedDates, setSelectedDates] = useState([])
  const [templates, setTemplates] = useState([])

  // 加载排班数据和模板
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // 加载排班模板
        const templatesData = await getScheduleTemplates()
        setTemplates(templatesData)

        // 加载排班数据
        await loadSchedules()
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "加载失败",
          description: "无法加载数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // 当月份或员工选择变化时重新加载排班数据
  useEffect(() => {
    loadSchedules()
  }, [selectedMonth, selectedEmployee, scheduleAdded])

  // 加载排班数据
  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const startDate = startOfMonth(selectedMonth)
      const endDate = endOfMonth(selectedMonth)

      // 使用服务器操作获取排班数据
      const data = await getSchedules(startDate, endDate)

      // 如果选择了特定员工，进行客户端过滤
      const filteredData = selectedEmployee !== "all"
        ? data.filter(schedule => schedule.employeeId.toString() === selectedEmployee)
        : data

      setSchedules(filteredData)

      // 检测排班冲突
      detectScheduleConflicts(filteredData)
    } catch (error) {
      console.error("Error loading schedules:", error)
      toast({
        title: "加载失败",
        description: "无法加载排班数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 检测排班冲突
  const detectScheduleConflicts = (schedulesData) => {
    const conflicts = []

    // 按日期和员工分组
    const schedulesByDateAndEmployee = {}

    schedulesData.forEach(schedule => {
      const dateKey = format(new Date(schedule.date), "yyyy-MM-dd")
      const employeeKey = schedule.employeeId

      if (!schedulesByDateAndEmployee[dateKey]) {
        schedulesByDateAndEmployee[dateKey] = {}
      }

      if (!schedulesByDateAndEmployee[dateKey][employeeKey]) {
        schedulesByDateAndEmployee[dateKey][employeeKey] = []
      }

      schedulesByDateAndEmployee[dateKey][employeeKey].push(schedule)
    })

    // 检查每个员工在每天的排班是否有冲突
    Object.keys(schedulesByDateAndEmployee).forEach(dateKey => {
      Object.keys(schedulesByDateAndEmployee[dateKey]).forEach(employeeKey => {
        const employeeSchedules = schedulesByDateAndEmployee[dateKey][employeeKey]

        if (employeeSchedules.length > 1) {
          // 检查时间冲突
          for (let i = 0; i < employeeSchedules.length; i++) {
            for (let j = i + 1; j < employeeSchedules.length; j++) {
              const scheduleA = employeeSchedules[i]
              const scheduleB = employeeSchedules[j]

              // 解析时间
              const [startHourA, startMinA] = scheduleA.startTime.split(":").map(Number)
              const [endHourA, endMinA] = scheduleA.endTime.split(":").map(Number)
              const [startHourB, startMinB] = scheduleB.startTime.split(":").map(Number)
              const [endHourB, endMinB] = scheduleB.endTime.split(":").map(Number)

              const startTimeA = startHourA * 60 + startMinA
              const endTimeA = endHourA * 60 + endMinA
              const startTimeB = startHourB * 60 + startMinB
              const endTimeB = endHourB * 60 + endMinB

              // 检查是否有重叠
              if ((startTimeA < endTimeB && endTimeA > startTimeB) ||
                  (startTimeB < endTimeA && endTimeB > startTimeA)) {
                conflicts.push({
                  date: dateKey,
                  employee: scheduleA.employee,
                  schedules: [scheduleA, scheduleB]
                })
              }
            }
          }
        }
      })
    })

    setScheduleConflicts(conflicts)

    // 如果有冲突，显示提示
    if (conflicts.length > 0) {
      toast({
        title: "发现排班冲突",
        description: `有 ${conflicts.length} 个排班时间冲突，请检查并修正`,
        variant: "destructive",
      })
    }
  }

  const handleAddSchedule = () => {
    setIsAddDialogOpen(true)
  }

  const handleScheduleAdded = (newSchedule) => {
    setIsAddDialogOpen(false)
    setScheduleAdded(!scheduleAdded) // 触发重新获取排班数据

    toast({
      title: "添加成功",
      description: "排班已成功添加",
    })
  }

  // 处理批量排班添加
  const handleBatchScheduleAdded = (newSchedules) => {
    setIsBatchScheduleOpen(false)
    setScheduleAdded(!scheduleAdded) // 触发重新获取排班数据

    toast({
      title: "批量添加成功",
      description: `成功添加 ${newSchedules.length} 个排班`,
    })
  }

  // 处理排班删除
  const handleScheduleDeleted = () => {
    setScheduleAdded(!scheduleAdded) // 触发重新获取排班数据

    toast({
      title: "删除成功",
      description: "排班已成功删除",
    })
  }

  // 处理清除所有排班
  const handleClearAllSchedules = async () => {
    setIsLoading(true)
    try {
      await enhancedOps.delete('所有排班').delete(
        async () => {
          return await clearAllSchedules()
        },
        { count: schedules.length },
        { requiresConfirmation: true }
      )

      setScheduleAdded(!scheduleAdded) // 触发重新获取排班数据
      setSelectedDates([]) // 清空选中的日期
    } catch (error) {
      console.error("Error clearing schedules:", error)
      // 错误已由增强操作系统处理
    } finally {
      setIsLoading(false)
    }
  }

  // 处理日期点击
  const handleDateClick = (date) => {
    setSelectedDate(date)
    setIsAddDialogOpen(true)
  }

  // 处理日期选择
  const handleDateSelect = (date) => {
    setSelectedDates(prev => {
      // 检查日期是否已经被选中
      const isSelected = prev.some(d =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      )

      // 如果已选中，则移除；否则添加
      if (isSelected) {
        return prev.filter(d =>
          !(d.getFullYear() === date.getFullYear() &&
            d.getMonth() === date.getMonth() &&
            d.getDate() === date.getDate())
        )
      } else {
        return [...prev, date]
      }
    })
  }

  // 处理多选日期排班
  const handleMultiDateSchedule = () => {
    if (selectedDates.length === 0) {
      // 如果没有选择日期，则打开日历视图进行选择
      setBatchScheduleCalendarView(true)
      setIsBatchScheduleOpen(true)
      return
    }

    // 打开批量排班对话框，使用已选择的日期
    setBatchScheduleCalendarView(false)
    setIsBatchScheduleOpen(true)
  }

  // 处理排班模板添加/更新
  const handleTemplateAdded = (template) => {
    setIsTemplateDialogOpen(false)

    // 重新加载模板
    toast({
      title: "模板保存成功",
      description: "排班模板已成功保存",
    })
  }

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()

    for (let i = -6; i <= 6; i++) {
      const date = addMonths(now, i)
      options.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "yyyy年MM月", { locale: zhCN })
      })
    }

    return options
  }

  // 处理月份变化
  const handleMonthChange = (value) => {
    const [year, month] = value.split("-").map(Number)
    setSelectedMonth(new Date(year, month - 1, 1))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">排班管理</h2>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAddSchedule}>
            <PlusIcon className="mr-2 h-4 w-4" />
            新建排班
          </Button>

          <Button variant="outline" onClick={() => setIsBatchScheduleOpen(true)}>
            <CopyIcon className="mr-2 h-4 w-4" />
            批量排班
          </Button>

          <Button
            variant={selectedDates.length > 0 ? "default" : "outline"}
            onClick={handleMultiDateSchedule}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            多选排班 {selectedDates.length > 0 && `(${selectedDates.length})`}
          </Button>

          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            排班模板
          </Button>

          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            导出排班
          </Button>

          <Button
            variant="destructive"
            onClick={handleClearAllSchedules}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            清除所有
          </Button>
        </div>
      </div>

      {selectedDates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span>已选择 <strong>{selectedDates.length}</strong> 个日期，按住Ctrl键点击日期可以多选</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedDates([])}>
                清除选择
              </Button>
              <Button size="sm" onClick={handleMultiDateSchedule}>
                为选中日期排班
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <Select
            value={format(selectedMonth, "yyyy-MM")}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="选择月份" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {/* 排班冲突警告 */}
      {scheduleConflicts.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangleIcon className="h-5 w-5 mr-2 text-amber-500" />
              发现排班冲突
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-2">
              系统检测到 {scheduleConflicts.length} 个排班时间冲突，请检查并修正：
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
              {scheduleConflicts.slice(0, 3).map((conflict, index) => (
                <li key={index}>
                  {conflict.date} - {conflict.employee.name} 有重叠的排班时间
                </li>
              ))}
              {scheduleConflicts.length > 3 && (
                <li>还有 {scheduleConflicts.length - 3} 个冲突...</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            日历视图
          </TabsTrigger>
          <TabsTrigger value="list">
            <UsersIcon className="h-4 w-4 mr-2" />
            列表视图
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            排班统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="pt-4">
          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-5">
              <CardHeader>
                <CardTitle>排班日历</CardTitle>
                <CardDescription>查看和管理员工排班</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleCalendar
                  key={scheduleAdded ? "updated" : "initial"}
                  schedules={schedules}
                  loading={isLoading}
                  onScheduleDeleted={handleScheduleDeleted}
                  onDateClick={handleDateClick}
                  selectedDates={selectedDates}
                  onDateSelect={handleDateSelect}
                />
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>日历</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScheduleDayCalendar
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    employees={employees}
                    schedules={schedules}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>当日值班</CardTitle>
                  <CardDescription>
                    {format(selectedDate, "yyyy年MM月dd日", { locale: zhCN })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TodaySchedule
                    employees={employees}
                    date={selectedDate}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>排班列表</CardTitle>
              <CardDescription>查看和管理员工排班</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">加载排班数据...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">暂无排班数据</div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => {
                    const employee = employees.find((e) => e.id === schedule.employeeId) || { name: "未知员工" }
                    return (
                      <div key={schedule.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            {employee.name.slice(0, 1)}
                          </div>
                          <div>
                            <div>{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(schedule.date), "yyyy-MM-dd")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">
                            {schedule.startTime}-{schedule.endTime}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm("确定要删除这个排班吗？")) {
                                // 使用服务器操作删除排班
                                try {
                                  await deleteSchedule(schedule.id)
                                  handleScheduleDeleted()
                                } catch (error) {
                                  console.error("Error deleting schedule:", error)
                                  toast({
                                    title: "删除失败",
                                    description: "无法删除排班",
                                    variant: "destructive",
                                  })
                                }
                              }
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>排班统计</CardTitle>
              <CardDescription>查看员工排班统计数据</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">加载统计数据...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">暂无排班数据</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{schedules.length}</div>
                        <p className="text-sm text-muted-foreground">总排班数</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {new Set(schedules.map(s => s.employeeId)).size}
                        </div>
                        <p className="text-sm text-muted-foreground">参与员工数</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {new Set(schedules.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size}
                        </div>
                        <p className="text-sm text-muted-foreground">排班天数</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">员工排班统计</h3>
                    <div className="space-y-2">
                      {employees
                        .filter(employee => schedules.some(s => s.employeeId === employee.id))
                        .map(employee => {
                          const employeeSchedules = schedules.filter(s => s.employeeId === employee.id)
                          const totalHours = employeeSchedules.reduce((total, schedule) => {
                            const [startHour, startMin] = schedule.startTime.split(":").map(Number)
                            const [endHour, endMin] = schedule.endTime.split(":").map(Number)
                            const startMinutes = startHour * 60 + startMin
                            const endMinutes = endHour * 60 + endMin
                            return total + (endMinutes - startMinutes) / 60
                          }, 0)

                          return (
                            <div key={employee.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                  {employee.name.slice(0, 1)}
                                </div>
                                <span>{employee.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span>{employeeSchedules.length} 次排班</span>
                                <span>{totalHours.toFixed(1)} 小时</span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddScheduleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        employees={employees}
        onScheduleAdded={handleScheduleAdded}
        selectedDate={selectedDate}
      />

      <BatchScheduleDialog
        open={isBatchScheduleOpen}
        onOpenChange={(open) => {
          setIsBatchScheduleOpen(open)
          if (!open) {
            // 重置日历视图状态
            setBatchScheduleCalendarView(false)
          }
        }}
        employees={employees}
        templates={templates}
        selectedDates={selectedDates}
        onSchedulesAdded={handleBatchScheduleAdded}
        initialCalendarView={batchScheduleCalendarView}
      />

      <ScheduleTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={templates}
        employees={employees}
        onTemplateAdded={handleTemplateAdded}
      />
    </div>
  )
}