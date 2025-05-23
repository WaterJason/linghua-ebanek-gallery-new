"use client"

import { BellIcon, ClipboardListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { TodoList } from "@/components/dashboard/todo-list"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { useState, useEffect } from "react"
import { getUnreadNotificationCount, getUncompletedTodosCount } from "@/lib/actions/system-actions"
import { cn } from "@/lib/utils"

interface NotificationTodoPopoverProps {
  className?: string
}

export function NotificationTodoPopover({ className }: NotificationTodoPopoverProps) {
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [uncompletedTodos, setUncompletedTodos] = useState(0)

  useEffect(() => {
    const loadCounts = async () => {
      try {
        // 从服务器获取真实数据
        const notificationCount = await getUnreadNotificationCount()
        const todoCount = await getUncompletedTodosCount()

        setUnreadNotifications(notificationCount)
        setUncompletedTodos(todoCount)
      } catch (error) {
        console.error("Error loading notification/todo counts:", error)
      }
    }

    loadCounts()

    // 设置定时刷新（每分钟检查一次）
    const interval = setInterval(loadCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 通知中心弹出窗口 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <NotificationCenter limit={5} className="border-none shadow-none" />
        </PopoverContent>
      </Popover>

      {/* 待办事项弹出窗口 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <ClipboardListIcon className="h-5 w-5" />
            {uncompletedTodos > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {uncompletedTodos > 99 ? '99+' : uncompletedTodos}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <TodoList limit={5} className="border-none shadow-none" />
        </PopoverContent>
      </Popover>
    </div>
  )
}