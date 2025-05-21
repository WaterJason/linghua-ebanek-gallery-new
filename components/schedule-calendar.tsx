"use client"

import { useState, useEffect, useRef } from "react"
import {
  addDays, format, startOfWeek, addWeeks, subWeeks, parseISO,
  startOfMonth, endOfMonth, eachWeekOfInterval, isSameMonth, isSameDay
} from "date-fns"
import { zhCN } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon, ChevronRightIcon, CalendarIcon,
  ListIcon, TrashIcon, PlusIcon, InfoIcon, XIcon,
  UserIcon, ClockIcon, PencilIcon, CalendarPlusIcon
} from "lucide-react"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { deleteSchedule } from "@/lib/actions/schedule-actions";

// 员工颜色映射
const employeeColors: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
  2: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
  3: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
  4: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
  5: "bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200",
  6: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200",
  7: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200",
  8: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
  9: "bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200",
  10: "bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200",
}

// 获取员工颜色
const getEmployeeColor = (employeeId: number) => {
  const colorIndex = employeeId % 10 || 10
  return employeeColors[colorIndex] || "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
}

export function ScheduleCalendar({
  schedules = [],
  loading = false,
  currentDate: externalCurrentDate,
  onScheduleDeleted,
  onDateClick,
  selectedDates = [],
  onDateSelect
}) {
  const [currentDate, setCurrentDate] = useState(externalCurrentDate || new Date())
  const [viewMode, setViewMode] = useState("week") // "week" 或 "month"
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [contextMenuDate, setContextMenuDate] = useState(null)

  // 当外部currentDate变化时更新内部状态
  useEffect(() => {
    if (externalCurrentDate) {
      setCurrentDate(externalCurrentDate)
    }
  }, [externalCurrentDate])

  // 获取当前周的开始日期
  const startDate = viewMode === "week"
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : startOfMonth(currentDate)

  // 获取结束日期
  const endDate = viewMode === "week"
    ? addDays(startDate, 6)
    : endOfMonth(currentDate)

  // 生成日期数组
  const getDaysToDisplay = () => {
    if (viewMode === "week") {
      // 生成一周的日期
      return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))
    } else {
      // 生成月视图的日期网格
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const startWeek = startOfWeek(monthStart, { weekStartsOn: 1 })
      const endWeek = startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 })

      // 生成所有周
      const weeks = eachWeekOfInterval(
        { start: startWeek, end: endWeek },
        { weekStartsOn: 1 }
      )

      // 为每周生成7天
      return weeks.flatMap(week =>
        Array.from({ length: 7 }).map((_, i) => addDays(week, i))
      )
    }
  }

  const daysToDisplay = getDaysToDisplay()

  // 下一周/上一周或下一月/上一月
  const next = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  const prev = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  // 切换到今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 获取指定日期的排班
  const getScheduleForDate = (date) => {
    if (!schedules || schedules.length === 0) return []

    const dateStr = format(date, "yyyy-MM-dd")
    return schedules.filter((s) => {
      const scheduleDate = s.date instanceof Date ? s.date : new Date(s.date)
      return format(scheduleDate, "yyyy-MM-dd") === dateStr
    })
  }

  // 处理日期点击，打开添加排班对话框
  const handleDateClick = (date) => {
    // 触发父组件的添加排班事件，传递选中的日期
    if (typeof onDateClick === 'function') {
      onDateClick(date)
    }
  }

  // 处理删除排班
  const handleDeleteSchedule = async (schedule) => {
    if (!confirm(`确定要删除 ${schedule.employee?.name || "未知员工"} 在 ${format(new Date(schedule.date), "yyyy-MM-dd")} 的排班吗？`)) {
      return
    }

    try {
      // 使用服务器操作删除排班
      await deleteSchedule(schedule.id)

      // 通知父组件排班已删除
      if (typeof onScheduleDeleted === 'function') {
        onScheduleDeleted()
      }

      toast({
        title: "删除成功",
        description: "排班已成功删除",
      })
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "删除失败",
        description: "无法删除排班",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-lg font-medium">
          {viewMode === "week" ? (
            <>
              {format(startDate, "yyyy年MM月dd日", { locale: zhCN })} -
              {format(endDate, "yyyy年MM月dd日", { locale: zhCN })}
            </>
          ) : (
            format(currentDate, "yyyy年MM月", { locale: zhCN })
          )}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            今天
          </Button>
          <div className="flex">
            <Button
              variant="outline"
              size="icon"
              className="rounded-r-none"
              onClick={prev}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-l-none"
              onClick={next}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("week")}
            >
              <ListIcon className="h-4 w-4 mr-1" />
              周
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("month")}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              月
            </Button>
          </div>
        </div>
      </div>

      <div className={cn(
        "grid gap-1",
        viewMode === "week" ? "grid-cols-7" : "grid-cols-7"
      )}>
        {/* 星期标题 */}
        {["一", "二", "三", "四", "五", "六", "日"].map((day, i) => (
          <div key={`header-${i}`} className="text-center py-2 font-medium">
            周{day}
          </div>
        ))}

        {/* 排班内容 */}
        {daysToDisplay.map((day, i) => {
          const daySchedules = getScheduleForDate(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = viewMode === "week" || isSameMonth(day, currentDate)
          const isSelected = selectedDates?.some(d => isSameDay(d, day))

          return (
            <ContextMenu key={`day-${i}`}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "border rounded-md p-1 cursor-pointer",
                    viewMode === "week" ? "min-h-[120px]" : "min-h-[100px]",
                    isToday ? "bg-blue-50 border-blue-200" : "",
                    !isCurrentMonth && "bg-gray-50 opacity-60",
                    isSelected && "bg-blue-100 border-blue-300"
                  )}
                  onClick={(e) => {
                    // 如果按住Ctrl键，则是多选模式
                    if (e.ctrlKey || e.metaKey) {
                      if (typeof onDateSelect === 'function') {
                        onDateSelect(day)
                      }
                    } else {
                      // 否则是单击添加排班
                      handleDateClick(day)
                    }
                  }}
                >
                  <div className="text-right text-sm mb-1">
                    <span className={cn(
                      "inline-block rounded-full w-6 h-6 text-center leading-6",
                      isToday ? "bg-blue-500 text-white" :
                      isSelected ? "bg-blue-400 text-white" : "text-gray-500"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    {isSelected && "已选择"}
                  </div>

                  {loading ? (
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : daySchedules.length > 0 ? (
                    <div className="space-y-1">
                      {daySchedules.map((schedule) => (
                        <TooltipProvider key={schedule.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "text-xs p-1 rounded border cursor-pointer",
                                  getEmployeeColor(schedule.employeeId)
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSchedule(schedule)
                                }}
                              >
                                <div className="font-medium truncate">{schedule.employee?.name || "未知员工"}</div>
                                <div className="truncate">
                                  {schedule.startTime}-{schedule.endTime}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <div className="font-medium">{schedule.employee?.name || "未知员工"}</div>
                                <div>{format(new Date(schedule.date), "yyyy-MM-dd")}</div>
                                <div>{schedule.startTime} - {schedule.endTime}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSchedule(schedule)
                                    }}
                                  >
                                    <TrashIcon className="h-3 w-3 mr-1" />
                                    删除
                                  </Button>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[60px] flex items-center justify-center text-xs text-muted-foreground">
                      {isCurrentMonth && "无排班"}
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>

              {/* 右键菜单 */}
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => handleDateClick(day)}
                  className="cursor-pointer"
                >
                  <CalendarPlusIcon className="mr-2 h-4 w-4" />
                  添加排班
                </ContextMenuItem>

                {daySchedules.length > 0 && (
                  <>
                    <ContextMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-semibold">当日排班</div>
                    {daySchedules.map((schedule) => (
                      <ContextMenuItem
                        key={schedule.id}
                        className="cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{schedule.employee?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {schedule.startTime}-{schedule.endTime}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSchedule(schedule)
                            }}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSchedule(schedule)
                            }}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </ContextMenuItem>
                    ))}
                  </>
                )}

                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    if (typeof onDateSelect === 'function') {
                      onDateSelect(day)
                    }
                  }}
                  className="cursor-pointer"
                >
                  {isSelected ? (
                    <>
                      <XIcon className="mr-2 h-4 w-4" />
                      取消选择
                    </>
                  ) : (
                    <>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      选择此日期
                    </>
                  )}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>

      {/* 排班详情弹窗 */}
      {selectedSchedule && (
        <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>排班详情</DialogTitle>
              <DialogDescription>
                查看和管理排班信息
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedSchedule.employee?.name || "未知员工"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedSchedule.date), "yyyy-MM-dd")}</span>
                  <Badge variant="outline">
                    {format(new Date(selectedSchedule.date), "EEEE", { locale: zhCN })}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                  <Badge variant="outline">
                    {(() => {
                      const [startHour, startMin] = selectedSchedule.startTime.split(":").map(Number)
                      const [endHour, endMin] = selectedSchedule.endTime.split(":").map(Number)
                      const startMinutes = startHour * 60 + startMin
                      const endMinutes = endHour * 60 + endMin
                      const durationHours = (endMinutes - startMinutes) / 60
                      return `${durationHours.toFixed(1)}小时`
                    })()}
                  </Badge>
                </div>

                {selectedSchedule.note && (
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedSchedule.note}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteSchedule(selectedSchedule)
                  setSelectedSchedule(null)
                }}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                删除排班
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
