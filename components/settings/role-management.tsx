"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UserRoleManagement } from "@/components/user/user-role-management"
import { PermissionList } from "@/components/settings/permission-list"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { PlusIcon, ShieldIcon, LockIcon, RefreshCwIcon } from "lucide-react"
import { Role, Permission } from "@/types/user"

/**
 * 角色管理组件
 */
export function RoleManagement() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("roles")
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 加载角色和权限数据
  const loadData = async () => {
    setIsLoading(true)

    try {
      // 加载角色
      const rolesResponse = await fetch("/api/roles")
      if (!rolesResponse.ok) {
        throw new Error("加载角色数据失败")
      }
      const rolesData = await rolesResponse.json()
      setRoles(rolesData)

      // 加载权限
      const permissionsResponse = await fetch("/api/permissions")
      if (!permissionsResponse.ok) {
        throw new Error("加载权限数据失败")
      }
      const permissionsData = await permissionsResponse.json()
      setPermissions(permissionsData)
    } catch (error) {
      console.error("加载数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载角色和权限数据，请稍后再试",
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4" />
              角色管理
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <LockIcon className="h-4 w-4" />
              权限列表
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
        
        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>角色管理</CardTitle>
              <CardDescription>
                管理系统角色和权限分配
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
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>权限列表</CardTitle>
              <CardDescription>
                查看系统所有可用权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionList
                permissions={permissions}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
