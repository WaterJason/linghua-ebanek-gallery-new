"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, LinkIcon, UnlinkIcon, UserIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EmployeeUserLinkProps {
  employeeId: number
  employeeName: string
}

export function EmployeeUserLink({ employeeId, employeeName }: EmployeeUserLinkProps) {
  const [users, setUsers] = useState<any[]>([])
  const [linkedUser, setLinkedUser] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  // 获取所有用户和当前关联的用户
  useEffect(() => {
    async function fetchData() {
      try {
        // 获取所有用户
        const usersResponse = await fetch("/api/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
        }

        // 获取当前关联的用户
        const linkedUserResponse = await fetch(`/api/employees/${employeeId}/user`)
        if (linkedUserResponse.ok) {
          const linkedUserData = await linkedUserResponse.json()
          setLinkedUser(linkedUserData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "获取数据失败",
          description: "无法获取用户数据，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employeeId])

  // 关联用户
  const handleLinkUser = async () => {
    if (!selectedUserId) return

    setLinking(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "关联用户失败")
      }

      const updatedUser = await response.json()
      setLinkedUser(updatedUser)
      setSelectedUserId("")

      toast({
        title: "关联成功",
        description: `已成功将员工 ${employeeName} 与用户 ${updatedUser.name} 关联`,
      })
    } catch (error) {
      console.error("Error linking user:", error)
      toast({
        title: "关联失败",
        description: error.message || "无法关联用户，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLinking(false)
    }
  }

  // 解除关联
  const handleUnlinkUser = async () => {
    if (!linkedUser) return

    setUnlinking(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/user`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "解除关联失败")
      }

      setLinkedUser(null)

      toast({
        title: "解除关联成功",
        description: `已成功解除员工 ${employeeName} 与用户的关联`,
      })
    } catch (error) {
      console.error("Error unlinking user:", error)
      toast({
        title: "解除关联失败",
        description: error.message || "无法解除关联，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setUnlinking(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">加载中...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          系统账号关联
        </CardTitle>
        <CardDescription>
          将员工与系统用户账号关联，使员工可以登录系统
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkedUser ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>当前关联账号</AlertTitle>
              <AlertDescription className="flex flex-col gap-1">
                <span><strong>用户名:</strong> {linkedUser.name}</span>
                <span><strong>邮箱:</strong> {linkedUser.email}</span>
                <span><strong>角色:</strong> {linkedUser.role === "admin" ? "管理员" : linkedUser.role === "manager" ? "经理" : "普通用户"}</span>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              该员工当前未关联任何系统账号，请选择一个用户进行关联
            </p>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => !user.employeeId) // 只显示未关联员工的用户
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role === "admin" ? "管理员" : user.role === "manager" ? "经理" : "普通用户"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {linkedUser ? (
          <Button variant="destructive" onClick={handleUnlinkUser} disabled={unlinking}>
            <UnlinkIcon className="mr-2 h-4 w-4" />
            {unlinking ? "解除关联中..." : "解除关联"}
          </Button>
        ) : (
          <Button onClick={handleLinkUser} disabled={!selectedUserId || linking}>
            <LinkIcon className="mr-2 h-4 w-4" />
            {linking ? "关联中..." : "关联用户"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
