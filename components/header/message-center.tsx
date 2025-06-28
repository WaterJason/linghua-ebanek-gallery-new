"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquareIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  MoreHorizontalIcon,
  SendIcon
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MessageCenterProps {
  className?: string
}

interface Message {
  id: string
  type: 'chat' | 'system' | 'announcement'
  sender: {
    id: string
    name: string
    avatar?: string
    role?: string
  }
  content: string
  timestamp: Date
  read: boolean
  urgent?: boolean
}

export function MessageCenter({ className }: MessageCenterProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      try {
        // 从API获取消息数据
        const response = await fetch("/api/messages?limit=10")
        if (!response.ok) {
          // 如果API不存在，使用模拟数据
          console.warn("消息API不可用，使用模拟数据")
          const mockMessages = [
            {
              id: "1",
              content: "欢迎使用琳华珐琅文化ERP系统！",
              type: "system",
              urgent: false,
              read: false,
              timestamp: new Date(),
              sender: {
                id: "system",
                name: "系统通知",
                role: "系统",
                avatar: null
              }
            },
            {
              id: "2",
              content: "今日销售数据已更新，请查看销售报表。",
              type: "system",
              urgent: false,
              read: true,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
              sender: {
                id: "system",
                name: "系统通知",
                role: "系统",
                avatar: null
              }
            }
          ]
          setMessages(mockMessages)
          setUnreadCount(mockMessages.filter(m => !m.read).length)
          return
        }

        const data = await response.json()
        setMessages(data.messages || [])
        setUnreadCount(data.messages?.filter((m: Message) => !m.read).length || 0)
      } catch (error) {
        console.error("Error loading messages:", error)
        // 使用空数据而不是抛出错误
        setMessages([])
        setUnreadCount(0)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // 设置定时刷新（每分钟检查一次）
    const interval = setInterval(loadMessages, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredMessages = messages.filter(message => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !message.read
    if (activeTab === "urgent") return message.urgent
    return message.type === activeTab
  })

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquareIcon className="w-4 h-4 text-blue-500" />
      case 'system':
        return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      case 'announcement':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">📢</span>
        </div>
      default:
        return <MessageSquareIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, read: true } : msg
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}分钟前`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`
    } else {
      return format(date, "MM-dd HH:mm", { locale: zhCN })
    }
  }

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
          title="消息中心"
        >
          <MessageSquareIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">消息中心</CardTitle>
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="text-xs">
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mx-4 mb-4">
                <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">未读</TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs">紧急</TabsTrigger>
                <TabsTrigger value="system" className="text-xs">系统</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquareIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">暂无消息</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-80 overflow-y-auto px-4 pb-4">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          !message.read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50",
                          message.urgent && "border-l-2 border-l-red-500"
                        )}
                        onClick={() => !message.read && markAsRead(message.id)}
                      >
                        <div className="flex-shrink-0">
                          {message.sender.avatar ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback>
                                {message.sender.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {getMessageIcon(message.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {message.sender.name}
                              {message.sender.role && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  · {message.sender.role}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1">
                              {message.urgent && (
                                <Badge variant="destructive" className="text-xs px-1">
                                  紧急
                                </Badge>
                              )}
                              {!message.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* 快速操作 */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Link href="/messages" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <MessageSquareIcon className="w-3 h-3 mr-1" />
                    消息管理
                  </Button>
                </Link>
                <Link href="/messages/compose" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <SendIcon className="w-3 h-3 mr-1" />
                    发送消息
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
