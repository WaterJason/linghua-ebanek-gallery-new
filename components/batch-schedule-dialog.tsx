"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format, addDays, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon, PlusIcon, MinusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createBatchSchedules, getScheduleTemplates } from "@/lib/actions/schedule-actions";
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  startDate: z.date({
    required_error: "请选择开始日期",
  }),
  endDate: z.date({
    required_error: "请选择结束日期",
  }),
  employeeIds: z.array(z.string()).min(1, {
    message: "请至少选择一名员工",
  }),
  startTime: z.string().min(1, {
    message: "请输入开始时间",
  }),
  endTime: z.string().min(1, {
    message: "请输入结束时间",
  }),
  weekdays: z.array(z.string()).min(1, {
    message: "请至少选择一天",
  }),
  templateId: z.string().optional(),
})

export function BatchScheduleDialog({ open, onOpenChange, employees, templates = [], onSchedulesAdded, selectedDates = [], initialCalendarView = false }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [useSelectedDates, setUseSelectedDates] = useState(selectedDates.length > 0)
  const [calendarView, setCalendarView] = useState(initialCalendarView)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [internalSelectedDates, setInternalSelectedDates] = useState(selectedDates)

  // 当外部selectedDates变化时更新内部状态
  useEffect(() => {
    setInternalSelectedDates(selectedDates)
  }, [selectedDates])

  // 当initialCalendarView变化时更新内部状态
  useEffect(() => {
    setCalendarView(initialCalendarView)
  }, [initialCalendarView])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      employeeIds: [],
      startTime: "09:00",
      endTime: "17:00",
      weekdays: ["1", "2", "3", "4", "5"], // 默认选择工作日（周一至周五）
      templateId: "",
    },
  })

  // 处理模板选择
  const handleTemplateChange = (templateId) => {
    if (templateId) {
      const template = templates.find(t => t.id.toString() === templateId)
      if (template) {
        setSelectedTemplate(template)

        // 更新表单值
        form.setValue("startTime", template.startTime)
        form.setValue("endTime", template.endTime)
        form.setValue("weekdays", template.weekdays)

        if (template.employeeIds && template.employeeIds.length > 0) {
          form.setValue("employeeIds", template.employeeIds.map(id => id.toString()))
        }
      }
    } else {
      setSelectedTemplate(null)
    }

    form.setValue("templateId", templateId)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!useSelectedDates && values.endDate < values.startDate) {
      toast({
        title: "日期错误",
        description: "结束日期不能早于开始日期",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // 确定要使用的日期
      let scheduleDates = []

      if (useSelectedDates && internalSelectedDates.length > 0) {
        // 使用已选中的日期
        scheduleDates = internalSelectedDates
      } else {
        // 生成日期范围内的所有日期
        const dateRange = eachDayOfInterval({
          start: values.startDate,
          end: values.endDate,
        })

        // 过滤出符合选定星期几的日期
        const selectedWeekdays = values.weekdays.map(Number)
        scheduleDates = dateRange.filter(date => selectedWeekdays.includes(date.getDay() || 7))
      }

      if (scheduleDates.length === 0) {
        toast({
          title: "无可用日期",
          description: "没有符合条件的日期可以排班",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // 为每个员工和每个日期创建排班
      const scheduleRequests = []

      for (const employeeId of values.employeeIds) {
        for (const date of scheduleDates) {
          scheduleRequests.push({
            employeeId,
            date,
            startTime: values.startTime,
            endTime: values.endTime,
          })
        }
      }

      // 批量创建排班
      const newSchedules = await createBatchSchedules(scheduleRequests)

      onSchedulesAdded(newSchedules)
      form.reset({
        startDate: new Date(),
        endDate: addDays(new Date(), 7),
        employeeIds: [],
        startTime: "09:00",
        endTime: "17:00",
        weekdays: ["1", "2", "3", "4", "5"],
        templateId: "",
      })
    } catch (error) {
      console.error("Failed to create batch schedules:", error)
      toast({
        title: "创建失败",
        description: "无法创建批量排班",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const weekdayOptions = [
    { value: "1", label: "周一" },
    { value: "2", label: "周二" },
    { value: "3", label: "周三" },
    { value: "4", label: "周四" },
    { value: "5", label: "周五" },
    { value: "6", label: "周六" },
    { value: "0", label: "周日" },
  ]

  // 处理日期选择
  const handleDateSelect = (date) => {
    setInternalSelectedDates(prev => {
      // 检查日期是否已经被选中
      const isSelected = prev.some(d => isSameDay(d, date))

      // 如果已选中，则移除；否则添加
      if (isSelected) {
        return prev.filter(d => !isSameDay(d, date))
      } else {
        return [...prev, date]
      }
    })

    // 自动启用使用选中日期
    setUseSelectedDates(true)
  }

  // 下一月/上一月
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // 生成月历视图
  const renderMonthCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = new Date(monthStart)
    const endDate = new Date(monthEnd)

    // 调整开始日期到周一
    const dayOfWeek = startDate.getDay() || 7
    if (dayOfWeek !== 1) {
      startDate.setDate(startDate.getDate() - (dayOfWeek - 1))
    }

    // 调整结束日期到周日
    const endDayOfWeek = endDate.getDay() || 7
    if (endDayOfWeek !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDayOfWeek))
    }

    // 生成日期数组
    const dateArray = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {format(currentMonth, "yyyy年MM月", { locale: zhCN })}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* 星期标题 */}
          {["一", "二", "三", "四", "五", "六", "日"].map((day, i) => (
            <div key={`header-${i}`} className="text-center py-2 font-medium">
              周{day}
            </div>
          ))}

          {/* 日期单元格 */}
          {dateArray.map((date, i) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
            const isSelected = internalSelectedDates.some(d => isSameDay(d, date))

            return (
              <div
                key={`day-${i}`}
                className={cn(
                  "border rounded-md p-2 cursor-pointer text-center",
                  !isCurrentMonth && "opacity-40",
                  isSelected && "bg-blue-100 border-blue-300"
                )}
                onClick={() => handleDateSelect(date)}
              >
                <div className="text-sm">
                  {format(date, "d")}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center">
          <div>
            已选择 <strong>{internalSelectedDates.length}</strong> 个日期
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInternalSelectedDates([])}
            disabled={internalSelectedDates.length === 0}
          >
            清除选择
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>批量排班</DialogTitle>
          <DialogDescription>为多个员工创建批量排班。</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 排班模板选择 */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <FormLabel>排班模板</FormLabel>
                <Select onValueChange={handleTemplateChange} value={form.watch("templateId")}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择排班模板（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不使用模板</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 日期选择方式 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>日期选择</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarView(!calendarView)}
                >
                  {calendarView ? "使用日期范围" : "使用日历视图"}
                </Button>
              </div>

              {/* 日历视图 */}
              {calendarView ? (
                <div className="border rounded-md p-4">
                  {renderMonthCalendar()}
                </div>
              ) : (
                <>
                  {/* 使用已选择的日期 */}
                  {internalSelectedDates.length > 0 && (
                    <div className="space-y-2 bg-blue-50 p-3 rounded-md border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="use-selected-dates"
                          checked={useSelectedDates}
                          onCheckedChange={setUseSelectedDates}
                        />
                        <label
                          htmlFor="use-selected-dates"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          使用已选择的 {internalSelectedDates.length} 个日期
                        </label>
                      </div>
                      {useSelectedDates && (
                        <div className="text-sm text-muted-foreground mt-2">
                          将为以下日期创建排班：
                          <div className="flex flex-wrap gap-1 mt-1">
                            {internalSelectedDates.slice(0, 5).map((date, index) => (
                              <Badge key={index} variant="outline">
                                {format(date, "yyyy-MM-dd")}
                              </Badge>
                            ))}
                            {internalSelectedDates.length > 5 && (
                              <Badge variant="outline">
                                等 {internalSelectedDates.length} 个日期
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 日期范围选择 - 仅在非日历视图且未使用已选日期时显示 */}
            {!calendarView && (!internalSelectedDates.length || !useSelectedDates) && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>开始日期</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "yyyy-MM-dd") : <span>选择日期</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>结束日期</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "yyyy-MM-dd") : <span>选择日期</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 员工选择 */}
            <FormField
              control={form.control}
              name="employeeIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>选择员工</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {employees.map((employee) => (
                      <FormField
                        key={employee.id}
                        control={form.control}
                        name="employeeIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={employee.id}
                              className="flex flex-row items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(employee.id.toString())}
                                  onCheckedChange={(checked) => {
                                    const value = employee.id.toString()
                                    return checked
                                      ? field.onChange([...field.value, value])
                                      : field.onChange(field.value?.filter((val) => val !== value))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {employee.name} ({employee.position})
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 时间选择 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开始时间</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结束时间</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 星期选择 - 仅在非日历视图且未使用已选日期时显示 */}
            {!calendarView && (!internalSelectedDates.length || !useSelectedDates) && (
              <FormField
                control={form.control}
                name="weekdays"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>选择星期</FormLabel>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weekdayOptions.map((option) => (
                        <FormField
                          key={option.value}
                          control={form.control}
                          name="weekdays"
                          render={({ field }) => {
                            return (
                              <FormItem key={option.value} className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, option.value])
                                        : field.onChange(field.value?.filter((val) => val !== option.value))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">{option.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "创建中..." : "创建排班"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
