"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format, isToday, isTomorrow, addDays } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  CalendarIcon, UsersIcon, MapPinIcon, ClockIcon,
  ChevronRightIcon, PlusIcon, CheckCircleIcon
} from "lucide-react"
import Link from "next/link"
import { getWorkshopSchedule } from "@/lib/actions/system-actions"
import { toast } from "@/components/ui/use-toast"

// 手作团建活动类型
interface WorkshopEvent {
  id: string
  title: string
  date: Date
  startTime: string
  endTime: string
  location: string
  locationType: 'inside' | 'outside'
  participants: number
  teacher: {
    id: number
    name: string
    avatar?: string
  }
  assistant?: {
    id: number
    name: string
    avatar?: string
  }
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}



interface WorkshopScheduleProps {
  className?: string
  limit?: number
  daysAhead?: number
}

export function WorkshopSchedule({
  className,
  limit = 4,
  daysAhead = 7
}: WorkshopScheduleProps) {
  const [workshops, setWorkshops] = useState<WorkshopEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载手作团建活动
  useEffect(() => {
    const loadWorkshops = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取手作团建日程
        const data = await getWorkshopSchedule(limit, daysAhead)
        setWorkshops(data)
      } catch (error) {
        console.error("Error loading workshops:", error)
        toast({
          title: "加载失败",
          description: "无法加载手作团建日程，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkshops()
  }, [limit, daysAhead])

  // 筛选最近的活动
  const upcomingWorkshops = workshops
    .filter(workshop => {
      const eventDate = new Date(workshop.date)
      const maxDate = addDays(new Date(), daysAhead)
      return eventDate <= maxDate && workshop.status === 'upcoming'
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit)

  // 获取日期标签
  const getDateBadge = (date: Date) => {
    if (isToday(date)) {
      return <Badge variant="default" className="ml-2">今天</Badge>
    } else if (isTomorrow(date)) {
      return <Badge variant="secondary" className="ml-2">明天</Badge>
    }
    return null
  }

  // 获取地点类型标签
  const getLocationTypeBadge = (type: string) => {
    if (type === 'inside') {
      return <Badge variant="outline" className="ml-2">馆内</Badge>
    } else {
      return <Badge variant="outline" className="ml-2">外出</Badge>
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">手作团建日程</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workshop">
              查看全部
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription>近期手作团建活动安排</CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : upcomingWorkshops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-muted-foreground">暂无近期手作团建活动</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingWorkshops.map((workshop) => (
              <div
                key={workshop.id}
                className="flex p-3 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">{workshop.title}</span>
                    {getDateBadge(workshop.date)}
                    {getLocationTypeBadge(workshop.locationType)}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      <span>{format(workshop.date, "MM月dd日", { locale: zhCN })}</span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      <span>{workshop.startTime} - {workshop.endTime}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-3.5 w-3.5 mr-1" />
                      <span>{workshop.location}</span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-3.5 w-3.5 mr-1" />
                      <span>{workshop.participants}人</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-2">
                    <div className="flex -space-x-2">
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {workshop.teacher.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {workshop.assistant && (
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs bg-green-500 text-white">
                            {workshop.assistant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {workshop.teacher.name}{workshop.assistant ? ` + ${workshop.assistant.name}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/workshop/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            创建手作团建活动
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
