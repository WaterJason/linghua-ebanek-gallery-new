"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, LinkIcon, UnlinkIcon, UserIcon, ShieldIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"

interface EmployeeUserRoleProps {
  employeeId: number
  employeeName: string
}

export function EmployeeUserRole({ employeeId, employeeName }: EmployeeUserRoleProps) {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [linkedUser, setLinkedUser] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])

  // 获取所有用户、角色和当前关联的用户
  useEffect(() => {
    async function fetchData() {
      try {
        // 获取所有用户
        const usersResponse = await fetch("/api/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
        }

        // 获取所有角色
        const rolesResponse = await fetch("/api/roles")
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setRoles(rolesData)
        } else {
          // 如果API不存在，使用模拟数据
          const mockRoles = [
            { id: 1, name: "管理员", description: "系统管理员，拥有所有权限" },
            { id: 2, name: "销售人员", description: "负责销售相关工作" },
            { id: 3, name: "库存管理员", description: "负责库存管理" },
            { id: 4, name: "生产人员", description: "负责生产管理" },
            { id: 5, name: "财务人员", description: "负责财务管理" },
          ]
          setRoles(mockRoles)
        }

        // 获取当前关联的用户
        const linkedUserResponse = await fetch(`/api/employees/${employeeId}/user`)
        if (linkedUserResponse.ok) {
          const linkedUserData = await linkedUserResponse.json()

          if (linkedUserData) {
            setLinkedUser(linkedUserData)

            // 获取用户角色信息
            try {
              const userRolesResponse = await fetch(`/api/users/${linkedUserData.id}/roles`)
              if (userRolesResponse.ok) {
                const userRolesData = await userRolesResponse.json()
                // 使用roleIds数组，这是API返回的角色ID列表
                setSelectedRoles(userRolesData.roleIds || [])

                // 更新linkedUser对象，添加完整的角色信息
                setLinkedUser({
                  ...linkedUserData,
                  roles: userRolesData.roleIds || [],
                  roleDetails: userRolesData.roles || []
                })
              }
            } catch (roleError) {
              console.error("Error fetching user roles:", roleError)
              // 如果获取角色失败，使用用户对象中的roles字段（如果有的话）
              setSelectedRoles(linkedUserData.roles || [])
            }
          }
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

      // 关联用户后，获取用户角色信息
      try {
        const userRolesResponse = await fetch(`/api/users/${updatedUser.id}/roles`)
        if (userRolesResponse.ok) {
          const userRolesData = await userRolesResponse.json()
          // 使用roleIds数组，这是API返回的角色ID列表
          setSelectedRoles(userRolesData.roleIds || [])

          // 更新linkedUser对象，添加完整的角色信息
          setLinkedUser({
            ...updatedUser,
            roles: userRolesData.roleIds || [],
            roleDetails: userRolesData.roles || []
          })
        } else {
          // 如果获取角色失败，使用用户对象中的roles字段（如果有的话）
          setSelectedRoles(updatedUser.roles || [])
        }
      } catch (roleError) {
        console.error("Error fetching user roles after linking:", roleError)
        // 如果获取角色失败，使用用户对象中的roles字段（如果有的话）
        setSelectedRoles(updatedUser.roles || [])
      }

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
      setSelectedRoles([])

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

  // 保存用户角色
  const handleSaveUserRoles = async () => {
    if (!linkedUser) return

    try {
      // 实际API调用
      const response = await fetch(`/api/users/${linkedUser.id}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleIds: selectedRoles }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "保存角色失败")
      }

      const updatedData = await response.json()

      // 使用API返回的完整角色信息更新本地状态
      setLinkedUser({
        ...linkedUser,
        roles: updatedData.roleIds || [],
        roleDetails: updatedData.roles || []
      })

      setIsAssignRolesOpen(false)

      toast({
        title: "保存成功",
        description: "用户角色已成功更新",
      })
    } catch (error) {
      console.error("Error saving user roles:", error)
      toast({
        title: "保存失败",
        description: error.message || "无法保存用户角色，请稍后再试",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="p-4 text-center">加载中...</div>
  }

  // 获取角色名称
  const getRoleNames = (roleIds) => {
    if (!roleIds || roleIds.length === 0) return "无角色"

    // 确保roleIds是数组
    const ids = Array.isArray(roleIds) ? roleIds : []

    return ids.map(id => {
      // 尝试从角色列表中查找角色
      const role = roles.find(r => r.id === id)
      return role ? role.name : `角色${id}`
    }).join(", ")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          系统账号关联与角色
        </CardTitle>
        <CardDescription>
          将员工与系统用户账号关联，并分配适当的角色
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
                <span><strong>系统角色:</strong> {linkedUser.roleDetails && linkedUser.roleDetails.length > 0
                  ? linkedUser.roleDetails.map(r => r.name).join(", ")
                  : getRoleNames(linkedUser.roles)}</span>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => {
                setSelectedRoles(linkedUser.roles || [])
                setIsAssignRolesOpen(true)
              }}>
                <ShieldIcon className="mr-2 h-4 w-4" />
                管理角色
              </Button>
            </div>
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

      {/* 分配角色对话框 */}
      <Dialog open={isAssignRolesOpen} onOpenChange={setIsAssignRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配用户角色</DialogTitle>
            <DialogDescription>
              为用户 "{linkedUser?.name}" 分配系统角色
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) => {
                      const newRoles = checked
                        ? [...selectedRoles, role.id]
                        : selectedRoles.filter(id => id !== role.id)
                      setSelectedRoles(newRoles)
                    }}
                  />
                  <div>
                    <Label htmlFor={`role-${role.id}`} className="text-sm font-medium">
                      {role.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRolesOpen(false)}>
              取消
            </Button>
            <Button type="submit" onClick={handleSaveUserRoles}>
              保存角色
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
