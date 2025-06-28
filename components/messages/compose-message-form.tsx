"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { SendIcon, UserIcon, AlertTriangleIcon, XIcon } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  position: string
  department: string
}

export function ComposeMessageForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/api/messages/users")
        if (!response.ok) {
          throw new Error("获取用户列表失败")
        }
        const data = await response.json()
        setUsers(data.users || [])
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          title: "加载失败",
          description: "无法加载用户列表",
          variant: "destructive",
        })
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const messageData = {
        recipientIds: selectedUsers.map(user => user.id),
        subject: formData.get("subject") as string,
        content: formData.get("content") as string,
        type: formData.get("type") as string,
        priority: formData.get("urgent") === "on" ? "urgent" : "normal",
      }

      if (selectedUsers.length === 0) {
        toast({
          title: "请选择接收者",
          description: "至少需要选择一个接收者",
          variant: "destructive",
        })
        return
      }

      // 调用API发送消息
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "发送失败")
      }

      toast({
        title: "消息发送成功",
        description: `消息已发送给 ${selectedUsers.length} 位收件人`,
      })

      router.push("/messages")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "无法发送消息，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 收件人信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            收件人
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">选择收件人 *</Label>
            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Select onValueChange={(value) => {
                  const user = users.find(u => u.id === value)
                  if (user) addUser(user)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收件人" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        disabled={selectedUsers.some(u => u.id === user.id)}
                      >
                        {user.name} - {user.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 已选择的收件人 */}
                {selectedUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      已选择 {selectedUsers.length} 位收件人：
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                          {user.name}
                          <button
                            type="button"
                            onClick={() => removeUser(user.id)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 消息内容 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SendIcon className="w-5 h-5" />
            消息内容
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">主题 *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="请输入消息主题"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">消息类型 *</Label>
            <Select name="type" defaultValue="announcement">
              <SelectTrigger>
                <SelectValue placeholder="选择消息类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">公告通知</SelectItem>
                <SelectItem value="system">系统消息</SelectItem>
                <SelectItem value="chat">普通消息</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">消息内容 *</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="请输入消息内容"
              rows={6}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="urgent" name="urgent" />
            <Label htmlFor="urgent" className="flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
              标记为紧急消息
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "发送中..." : "发送消息"}
        </Button>
      </div>
    </form>
  )
}
