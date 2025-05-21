"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserList } from "@/components/user/user-list"
import { UserForm } from "@/components/user/user-form"
import { UserRoleManagement } from "@/components/user/user-role-management"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { PlusIcon, UsersIcon, ShieldIcon, RefreshCwIcon } from "lucide-react"
import { User, Role } from "@/types/user"

interface UserManagementProps {
  onError?: (error: string | null) => void
}

/**
 * 用户管理组件
 */
export function UserManagement({ onError }: UserManagementProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // 加载用户和角色数据
  const loadData = async () => {
    setIsLoading(true)
    if (onError) onError(null)

    try {
      // 加载用户
      const usersResponse = await fetch("/api/users")
      if (!usersResponse.ok) {
        throw new Error("加载用户数据失败")
      }
      const usersData = await usersResponse.json()
      setUsers(usersData)

      // 加载角色
      const rolesResponse = await fetch("/api/roles")
      if (!rolesResponse.ok) {
        throw new Error("加载角色数据失败")
      }
      const rolesData = await rolesResponse.json()
      setRoles(rolesData)
    } catch (error) {
      console.error("加载数据失败:", error)
      if (onError) onError(error instanceof Error ? error.message : "加载数据失败")
      toast({
        title: "加载失败",
        description: "无法加载用户数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    loadData()
  }, [])

  // 处理刷新
  const handleRefresh = () => {
    loadData()
  }

  // 处理添加用户
  const handleAddUser = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  // 处理编辑用户
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  // 处理删除用户
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("删除用户失败")
      }

      // 更新用户列表
      setUsers(users.filter(user => user.id !== userId))

      toast({
        title: "删除成功",
        description: "用户已成功删除",
      })
    } catch (error) {
      console.error("删除用户失败:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除用户失败，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 处理表单提交
  const handleFormSubmit = async (userData: any) => {
    try {
      let response
      
      if (selectedUser) {
        // 更新用户
        response = await fetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })
      } else {
        // 创建用户
        response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "操作失败")
      }

      const result = await response.json()

      // 更新用户列表
      if (selectedUser) {
        setUsers(users.map(user => user.id === result.id ? result : user))
        toast({
          title: "更新成功",
          description: "用户信息已成功更新",
        })
      } else {
        setUsers([...users, result])
        toast({
          title: "创建成功",
          description: "用户已成功创建",
        })
      }

      // 关闭表单
      setIsFormOpen(false)
    } catch (error) {
      console.error("保存用户失败:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存用户失败，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 处理表单取消
  const handleFormCancel = () => {
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              用户列表
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4" />
              角色管理
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              刷新
            </Button>
            
            <PermissionGuard permission="users.create">
              <Button
                size="sm"
                onClick={handleAddUser}
                disabled={isLoading}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                添加用户
              </Button>
            </PermissionGuard>
          </div>
        </div>
        
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>用户管理</CardTitle>
              <CardDescription>
                管理系统用户，包括创建、编辑和删除用户。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserList
                users={users}
                roles={roles}
                isLoading={isLoading}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-4">
          <PermissionGuard permission="permissions.view">
            <Card>
              <CardHeader>
                <CardTitle>角色管理</CardTitle>
                <CardDescription>
                  管理系统角色和权限分配。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRoleManagement
                  roles={roles}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
              </CardContent>
            </Card>
          </PermissionGuard>
        </TabsContent>
      </Tabs>
      
      {isFormOpen && (
        <UserForm
          user={selectedUser}
          roles={roles}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  )
}
