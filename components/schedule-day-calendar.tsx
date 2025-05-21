"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getSchedulesByDate } from "@/lib/actions/schedule-actions";

export function ScheduleDayCalendar({
  selected,
  onSelect,
  employees,
  schedules = [],
  className
}) {
  const [daySchedules, setDaySchedules] = useState({})
  const [loading, setLoading] = useState(false)

  // 当日历月份变化时获取该月的排班数据
  const handleMonthChange = async (month) => {
    // 这里可以添加获取整月排班数据的逻辑，如果需要的话
  }

  // 从传入的schedules中提取每天的排班信息
  useEffect(() => {
    if (!schedules || schedules.length === 0) return

    const schedulesMap = {}

    schedules.forEach(schedule => {
      const dateStr = format(new Date(schedule.date), "yyyy-MM-dd")

      if (!schedulesMap[dateStr]) {
        schedulesMap[dateStr] = []
      }

      schedulesMap[dateStr].push(schedule)
    })

    setDaySchedules(schedulesMap)
  }, [schedules])

  // 创建日期修饰符
  const getDayContent = (day) => {
    try {
      // 确保day是有效的日期对象
      if (!(day instanceof Date) || isNaN(day.getTime())) {
        return [];
      }
      const dateStr = format(day, "yyyy-MM-dd");
      return daySchedules[dateStr] || [];
    } catch (error) {
      console.error("Error formatting date:", error);
      return [];
    }
  }

  // 自定义日期单元格内容
  const renderDayContents = (day) => {
    const daySchedulesList = getDayContent(day)

    if (daySchedulesList.length === 0) return null

    return (
      <div className="w-full px-1 mt-1">
        {daySchedulesList.slice(0, 2).map((schedule, index) => {
          const employee = employees.find(e => e.id === schedule.employeeId) || { name: "未知员工" }
          return (
            <div key={index} className="text-[8px] truncate mb-0.5 flex justify-center">
              <Badge variant="outline" className="px-1 py-0 text-[8px] h-3 min-h-0 max-w-full">
                {employee.name}
              </Badge>
            </div>
          )
        })}
        {daySchedulesList.length > 2 && (
          <div className="text-[8px] text-muted-foreground text-center">
            +{daySchedulesList.length - 2}人
          </div>
        )}
      </div>
    )
  }

  return (
    <CalendarComponent
      mode="single"
      selected={selected}
      onSelect={onSelect}
      onMonthChange={handleMonthChange}
      className={cn("rounded-md border", className)}
      classNames={{
        day: "relative h-14 w-12 p-0 font-normal aria-selected:opacity-100",
        cell: "h-14 w-12 p-0 relative",
      }}
      footer={
        <div className="pt-2 text-xs text-center text-muted-foreground">
          日历上显示当日值班人员
        </div>
      }
      components={{
        DayContent: ({ date, ...props }) => (
          <div className="relative h-full w-full flex flex-col items-center">
            <div className="mt-2">{format(date, "d")}</div>
            {renderDayContents(date)}
          </div>
        ),
      }}
    />
  )
}
