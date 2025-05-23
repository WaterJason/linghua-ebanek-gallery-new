"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimplePagination } from "@/components/ui/simple-pagination"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  BellIcon, ShoppingCartIcon, PackageIcon, AlertCircleIcon,
  CalendarIcon, InfoIcon, CheckCircleIcon, XCircleIcon,
  ChevronRightIcon, BellOffIcon, FactoryIcon, DollarSignIcon
} from "lucide-react"
import Link from "next/link"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/system-actions"
import { toast } from "@/components/ui/use-toast"

// 通知类型
interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'inventory' | 'schedule' | 'workshop' | 'system' | 'finance' | 'purchase' | 'approval' | 'other'
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
  read: boolean
  link?: string
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotifications, setTotalNotifications] = useState(0)
  const pageSize = 10

  // 加载通知
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取通知
        const data = await getNotifications(pageSize, activeTab)
        setNotifications(data)

        // 计算总页数（假设服务器返回的是当前页的数据）
        // 实际实现中，服务器应该返回总数量
        setTotalNotifications(data.length)
        setTotalPages(Math.ceil(data.length / pageSize))
      } catch (error) {
        console.error("Error loading notifications:", error)
        toast({
          title: "加载失败",
          description: "无法加载通知，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [activeTab, page])

  // 标记通知为已读
  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await markNotificationAsRead(id)
      if (success) {
        setNotifications(notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        ))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "操作失败",
        description: "无法标记通知为已读，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead()
      if (success) {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })))
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "操作失败",
        description: "无法标记所有通知为已读，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 获取通知图标
  const getNotificationIcon = (type: string, priority: string) => {
    const iconClassName = cn(
      "h-5 w-5",
      priority === 'high' ? "text-red-500" :
      priority === 'medium' ? "text-amber-500" :
      "text-blue-500"
    )

    switch (type) {
      case 'order':
        return <ShoppingCartIcon className={iconClassName} />
      case 'inventory':
        return <PackageIcon className={iconClassName} />
      case 'schedule':
        return <CalendarIcon className={iconClassName} />
      case 'workshop':
        return <CalendarIcon className={iconClassName} />
      case 'system':
        return <InfoIcon className={iconClassName} />
      case 'finance':
        return <DollarSignIcon className={iconClassName} />
      case 'purchase':
        return <FactoryIcon className={iconClassName} />
      case 'approval':
        return <CheckCircleIcon className={iconClassName} />
      default:
        return <BellIcon className={iconClassName} />
    }
  }

  // 获取未读通知数量
  const unreadCount = notifications.filter(notification => !notification.read).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CardTitle>通知列表</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              全部标为已读
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">未读{unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
            <TabsTrigger value="order">订单</TabsTrigger>
            <TabsTrigger value="inventory">库存</TabsTrigger>
            <TabsTrigger value="approval">审批</TabsTrigger>
            <TabsTrigger value="system">系统</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BellOffIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">暂无通知</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start p-4 rounded-lg border",
                      notification.read
                        ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    )}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-medium",
                          notification.read && "text-muted-foreground"
                        )}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <Badge variant="default" className="ml-2">新</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {format(notification.timestamp, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="ml-auto text-primary hover:underline flex items-center"
                          >
                            查看详情
                            <ChevronRightIcon className="h-3 w-3 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6">
                <SimplePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
