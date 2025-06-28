"use client"

import { useState, useEffect } from "react"
import { getSchedulesByDate } from "@/lib/actions/schedule-actions"

export function TodaySchedule({ employees, date = new Date() }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  // 获取指定日期的排班
  useEffect(() => {
    async function fetchDaySchedules() {
      try {
        setLoading(true)
        // 使用服务器操作获取排班数据
        const scheduleDate = new Date(date)
        scheduleDate.setHours(0, 0, 0, 0)

        const data = await getSchedulesByDate(scheduleDate)
        setSchedules(data)
      } catch (error) {
        console.error("Error fetching day schedules:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDaySchedules()
  }, [date])

  if (loading) {
    return <div className="text-center py-4">加载当日排班...</div>
  }

  if (schedules.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">当日暂无排班</div>
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const employee = employees.find((e) => e.id === schedule.employeeId) || { name: "未知员工" }
        return (
          <div key={schedule.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {employee.name.slice(0, 1)}
              </div>
              <span>{employee.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {schedule.startTime}-{schedule.endTime}
            </span>
          </div>
        )
      })}
    </div>
  )
}
