"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  RefreshCwIcon, CalendarIcon, BarChart3Icon,
  ShoppingCartIcon, PackageIcon
} from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  timeRange: string
  onTimeRangeChange: (value: string) => void
  onRefresh: () => void
  className?: string
  userName?: string
}

export function DashboardHeader({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  className,
  userName = "管理员"
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 每分钟更新一次

    return () => clearInterval(timer)
  }, [])

  // 获取问候语
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 6) return "夜深了"
    if (hour < 9) return "早上好"
    if (hour < 12) return "上午好"
    if (hour < 14) return "中午好"
    if (hour < 18) return "下午好"
    if (hour < 22) return "晚上好"
    return "夜深了"
  }

  return (
    <div className={cn("flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6", className)}>
      <div>
        <h1 className="text-3xl font-bold">{getGreeting()}，{userName}</h1>
        <p className="text-muted-foreground">
          今天是 {format(currentTime, "yyyy年MM月dd日 EEEE", { locale: zhCN })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">最近一周</SelectItem>
            <SelectItem value="month">最近一个月</SelectItem>
            <SelectItem value="quarter">最近三个月</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={onRefresh} title="刷新数据">
          <RefreshCwIcon className="h-4 w-4" />
        </Button>


      </div>
    </div>
  )
}
