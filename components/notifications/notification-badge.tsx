"use client"

import { useState, useEffect } from "react"
import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUnreadNotificationCount } from "@/lib/actions/system-actions"
import { useRouter } from "next/navigation"

interface NotificationBadgeProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function NotificationBadge({
  variant = "ghost",
  size = "icon",
  className
}: NotificationBadgeProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // 加载未读通知数量
  useEffect(() => {
    const loadUnreadCount = async () => {
      setIsLoading(true)
      try {
        const count = await getUnreadNotificationCount()
        setUnreadCount(count)
      } catch (error) {
        console.error("Error loading unread notification count:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUnreadCount()

    // 设置定时器，每分钟刷新一次
    const intervalId = setInterval(loadUnreadCount, 60000)

    return () => clearInterval(intervalId)
  }, [])

  // 点击通知图标
  const handleClick = () => {
    router.push("/notifications")
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
