"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  PlusIcon
} from "lucide-react"
import { getSchedules } from "@/lib/actions/schedule-actions"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function ScheduleTab() {
  const [schedules, setSchedules] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSchedules()
  }, [selectedDate])

  const loadSchedules = async () => {
    try {
      setIsLoading(true)
      const data = await getSchedules({
        date: selectedDate
      })
      setSchedules(data)
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

  const todaySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    return scheduleDate.toDateString() === selectedDate.toDateString()
  })

  const getShiftColor = (shift) => {
    switch (shift) {
      case "morning":
        return "bg-blue-100 text-blue-800"
      case "afternoon":
        return "bg-green-100 text-green-800"
      case "evening":
        return "bg-purple-100 text-purple-800"
      case "night":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getShiftText = (shift) => {
    switch (shift) {
      case "morning":
        return "早班"
      case "afternoon":
        return "中班"
      case "evening":
        return "晚班"
      case "night":
        return "夜班"
      default:
        return "未知"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 日期选择 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">选择日期</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={zhCN}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* 当日排班统计 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">选中日期</p>
                <p className="text-lg font-bold">
                  {format(selectedDate, "MM月dd日", { locale: zhCN })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">排班人数</p>
                <p className="text-lg font-bold">{todaySchedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 当日排班列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, "yyyy年MM月dd日", { locale: zhCN })} 排班
          </CardTitle>
          <CardDescription>
            共 {todaySchedules.length} 人排班
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaySchedules.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">当日暂无排班</p>
            </div>
          ) : (
            todaySchedules.map((schedule) => (
              <Card key={schedule.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{schedule.employee?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {schedule.employee?.position}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getShiftColor(schedule.shift)}>
                        {getShiftText(schedule.shift)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                  </div>
                  
                  {schedule.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">{schedule.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* 添加排班按钮 */}
      <Button className="w-full" size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        添加排班
      </Button>
    </div>
  )
}
