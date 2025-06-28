"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquareIcon,
  SearchIcon,
  SendIcon,
  UserIcon,
  BellIcon,
  MegaphoneIcon,
  FilterIcon
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

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

export function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      try {
        // 从API获取真实消息数据
        const response = await fetch(`/api/messages?filter=${activeTab}&limit=50`)
        if (!response.ok) {
          throw new Error("获取消息失败")
        }

        const data = await response.json()
        const messages = data.messages || []

        // 转换为组件需要的格式
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            role: msg.sender.role || '员工'
          },
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          read: msg.read,
          urgent: msg.urgent
        }))

        setMessages(formattedMessages)
      } catch (error) {
        console.error("Error loading messages:", error)
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [activeTab])

  const filteredMessages = messages.filter(message => {
    // 按标签页筛选
    if (activeTab === "unread" && message.read) return false
    if (activeTab === "urgent" && !message.urgent) return false
    if (activeTab !== "all" && activeTab !== "unread" && activeTab !== "urgent" && message.type !== activeTab) return false

    // 按搜索关键词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        message.content.toLowerCase().includes(query) ||
        message.sender.name.toLowerCase().includes(query)
      )
    }

    return true
  })

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquareIcon className="w-4 h-4 text-blue-500" />
      case 'system':
        return <BellIcon className="w-4 h-4 text-orange-500" />
      case 'announcement':
        return <MegaphoneIcon className="w-4 h-4 text-green-500" />
      default:
        return <MessageSquareIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'chat':
        return '聊天'
      case 'system':
        return '系统'
      case 'announcement':
        return '公告'
      default:
        return '其他'
    }
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

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, read: true } : msg
    ))
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>消息管理</CardTitle>
            <Button size="sm">
              <SendIcon className="w-4 h-4 mr-2" />
              发送消息
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索消息内容或发送人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <FilterIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 消息列表 */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="unread">未读</TabsTrigger>
                <TabsTrigger value="urgent">紧急</TabsTrigger>
                <TabsTrigger value="chat">聊天</TabsTrigger>
                <TabsTrigger value="system">系统</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquareIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    {searchQuery ? "未找到匹配的消息" : "暂无消息"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "尝试使用其他关键词搜索" : "新消息会显示在这里"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !message.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => !message.read && markAsRead(message.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {message.sender.avatar ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback>
                                {message.sender.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {getMessageIcon(message.type)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">
                                {message.sender.name}
                              </h3>
                              {message.sender.role && (
                                <span className="text-sm text-gray-500">
                                  · {message.sender.role}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {getTypeText(message.type)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {message.urgent && (
                                <Badge variant="destructive" className="text-xs">
                                  紧急
                                </Badge>
                              )}
                              {!message.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <span className="text-sm text-gray-500">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-700 leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
