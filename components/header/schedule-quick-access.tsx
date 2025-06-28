"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, ClockIcon, UserIcon, PlusIcon } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"
import { getSchedulesByDate } from "@/lib/actions/schedule-actions"
import { cn } from "@/lib/utils"

interface ScheduleQuickAccessProps {
  className?: string
}

interface Schedule {
  id: number
  employeeId: number
  date: Date
  startTime: string
  endTime: string
  shift?: string
  employee?: {
    id: number
    name: string
    position?: string
  }
}

export function ScheduleQuickAccess({ className }: ScheduleQuickAccessProps) {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([])
  const [tomorrowSchedules, setTomorrowSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true)
      try {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const [todayData, tomorrowData] = await Promise.all([
          getSchedulesByDate(today),
          getSchedulesByDate(tomorrow)
        ])

        setTodaySchedules(todayData || [])
        setTomorrowSchedules(tomorrowData || [])
      } catch (error) {
        console.error("Error loading schedules:", error)
        setTodaySchedules([])
        setTomorrowSchedules([])
      } finally {
        setLoading(false)
      }
    }

    loadSchedules()
  }, [])

  const getScheduleCount = () => {
    return todaySchedules.length + tomorrowSchedules.length
  }

  const renderScheduleItem = (schedule: Schedule, dateLabel: string) => (
    <div key={`${schedule.id}-${dateLabel}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
          <UserIcon className="w-3 h-3 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{schedule.employee?.name || "未知员工"}</p>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs">
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200",
            className
          )}
          title="日程安排"
        >
          <CalendarIcon className="w-5 h-5" />
          {getScheduleCount() > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {getScheduleCount() > 99 ? '99+' : getScheduleCount()}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">日程安排</CardTitle>
              <Link href="/schedule">
                <Button variant="ghost" size="sm" className="text-xs">
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* 今日排班 */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    今日排班 ({todaySchedules.length}人)
                  </h4>
                  {todaySchedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">今日无排班</p>
                  ) : (
                    <div className="space-y-2">
                      {todaySchedules.slice(0, 3).map(schedule => 
                        renderScheduleItem(schedule, "今日")
                      )}
                      {todaySchedules.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          还有 {todaySchedules.length - 3} 人...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 明日排班 */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    明日排班 ({tomorrowSchedules.length}人)
                  </h4>
                  {tomorrowSchedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">明日无排班</p>
                  ) : (
                    <div className="space-y-2">
                      {tomorrowSchedules.slice(0, 3).map(schedule => 
                        renderScheduleItem(schedule, "明日")
                      )}
                      {tomorrowSchedules.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          还有 {tomorrowSchedules.length - 3} 人...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 快速操作 */}
                <div className="pt-2 border-t">
                  <div className="flex gap-2">
                    <Link href="/schedule" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        排班管理
                      </Button>
                    </Link>
                    <Link href="/schedule?action=add" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <PlusIcon className="w-3 h-3 mr-1" />
                        添加排班
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
