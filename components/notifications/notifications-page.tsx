"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon
} from "lucide-react"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notification-actions"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast({
        title: "加载失败",
        description: "无法加载通知数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      toast({
        title: "已标记为已读",
        description: "通知已标记为已读",
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "操作失败",
        description: "标记通知失败",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      toast({
        title: "全部已读",
        description: "所有通知已标记为已读",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "操作失败",
        description: "标记所有通知失败",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertTriangleIcon className="h-5 w-5 text-red-500" />
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "success":
        return "bg-green-100 text-green-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getNotificationTypeName = (type) => {
    switch (type) {
      case "warning":
        return "警告"
      case "error":
        return "错误"
      case "success":
        return "成功"
      case "info":
        return "信息"
      default:
        return "通知"
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case "unread":
        return !notification.isRead
      case "read":
        return notification.isRead
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

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
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">通知中心</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : "所有通知已读"}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckIcon className="h-4 w-4 mr-2" />
            全部标记为已读
          </Button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">总通知</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">未读</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">已读</p>
                <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 通知列表 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">全部通知</TabsTrigger>
          <TabsTrigger value="unread">未读 ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">已读</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BellIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "unread" ? "暂无未读通知" : "暂无通知"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors ${
                  !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge className={getNotificationTypeColor(notification.type)}>
                            {getNotificationTypeName(notification.type)}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="secondary">未读</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.isRead && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
