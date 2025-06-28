"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { UserIcon, ClockIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { getSchedulesByDate } from "@/lib/actions/schedule-actions"

interface TodayScheduleProps {
  employees: Array<{
    id: number
    name: string
    position?: string
  }>
  date: Date
}

export function TodaySchedule({ employees, date }: TodayScheduleProps) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTodaySchedules() {
      setLoading(true)
      try {
        const data = await getSchedulesByDate(date)
        setSchedules(data)
      } catch (error) {
        console.error("Error loading today's schedules:", error)
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }

    loadTodaySchedules()
  }, [date])

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">加载中...</p>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-4">
        <UserIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">今日无排班</p>
      </div>
    )
  }

  // 按时间排序
  const sortedSchedules = schedules.sort((a, b) => {
    const timeA = a.startTime.replace(":", "")
    const timeB = b.startTime.replace(":", "")
    return timeA.localeCompare(timeB)
  })

  return (
    <div className="space-y-3">
      {sortedSchedules.map((schedule) => {
        const employee = employees.find(e => e.id === schedule.employeeId)
        
        return (
          <div key={schedule.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{employee?.name || "未知员工"}</p>
                {employee?.position && (
                  <p className="text-xs text-muted-foreground">{employee.position}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <ClockIcon className="w-3 h-3" />
                <span>{schedule.startTime}-{schedule.endTime}</span>
              </div>
              {schedule.shift && (
                <Badge variant="outline" className="text-xs mt-1">
                  {schedule.shift}
                </Badge>
              )}
            </div>
          </div>
        )
      })}
      
      <div className="text-center pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          共 {schedules.length} 人值班
        </p>
      </div>
    </div>
  )
}
