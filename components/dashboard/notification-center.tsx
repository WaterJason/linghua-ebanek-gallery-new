"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  BellIcon, ShoppingCartIcon, PackageIcon, AlertCircleIcon,
  CalendarIcon, InfoIcon, CheckCircleIcon, XCircleIcon,
  ChevronRightIcon, BellOffIcon
} from "lucide-react"
import Link from "next/link"
import { getNotifications } from "@/lib/actions/system-actions"
import { toast } from "@/components/ui/use-toast"

// 通知类型
interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'inventory' | 'schedule' | 'workshop' | 'system' | 'other'
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
  read: boolean
  link?: string
}



interface NotificationCenterProps {
  className?: string
  limit?: number
}

export function NotificationCenter({
  className,
  limit = 5
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // 加载通知
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取通知
        const data = await getNotifications(limit, activeTab)

        // 由于目前没有通知表，我们创建一些模拟数据
        // 这部分代码在实际实现通知功能后应该删除
        const mockData: Notification[] = [
          {
            id: '1',
            title: '新订单通知',
            message: '您有一个新的销售订单需要处理',
            type: 'order',
            priority: 'high',
            timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 30)),
            read: false,
            link: '/sales'
          },
          {
            id: '2',
            title: '库存预警',
            message: '珐琅原料A库存低于安全库存',
            type: 'inventory',
            priority: 'high',
            timestamp: new Date(new Date().setHours(new Date().getHours() - 2)),
            read: false,
            link: '/inventory'
          },
          {
            id: '3',
            title: '排班提醒',
            message: '明日排班已更新，请查看',
            type: 'schedule',
            priority: 'medium',
            timestamp: new Date(new Date().setHours(new Date().getHours() - 5)),
            read: true,
            link: '/schedule'
          },
          {
            id: '4',
            title: '手作团建预约',
            message: '收到一个新的团建活动预约',
            type: 'workshop',
            priority: 'medium',
            timestamp: new Date(new Date().setHours(new Date().getHours() - 8)),
            read: false,
            link: '/workshop'
          },
          {
            id: '5',
            title: '系统更新',
            message: '系统已更新到最新版本',
            type: 'system',
            priority: 'low',
            timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
            read: true,
            link: '/settings'
          }
        ];

        // 如果服务器返回的数据为空，使用模拟数据
        // 这是临时解决方案，直到通知功能完全实现
        setNotifications(data.length > 0 ? data : mockData)
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
  }, [limit, activeTab])

  // 标记通知为已读
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ))
  }

  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })))
  }

  // 根据标签筛选通知
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  }).slice(0, limit)

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
      default:
        return <BellIcon className={iconClassName} />
    }
  }

  // 获取未读通知数量
  const unreadCount = notifications.filter(notification => !notification.read).length

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CardTitle className="text-base font-medium">通知中心</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              全部标为已读
            </Button>
          )}
        </div>
        <CardDescription>系统通知和提醒</CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">未读{unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
            <TabsTrigger value="order">订单</TabsTrigger>
            <TabsTrigger value="inventory">库存</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BellOffIcon className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">暂无通知</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start p-3 rounded-lg border",
                      notification.read
                        ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    )}
                    onClick={() => markAsRead(notification.id)}
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
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-1">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/notifications">
            查看全部通知
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
