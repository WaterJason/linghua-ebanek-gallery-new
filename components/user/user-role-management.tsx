"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ShieldIcon,
  LockIcon
} from "lucide-react"
import { Role, Permission } from "@/types/user"
import { RoleForm } from "@/components/user/role-form"

interface UserRoleManagementProps {
  roles: Role[]
  isLoading: boolean
  onRefresh: () => void
}

/**
 * 用户角色管理组件
 */
export function UserRoleManagement({ 
  roles, 
  isLoading, 
  onRefresh 
}: UserRoleManagementProps) {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [expandedRoles, setExpandedRoles] = useState<string[]>([])
  
  // 加载权限数据
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await fetch("/api/permissions")
        if (response.ok) {
          const data = await response.json()
          setPermissions(data)
        }
      } catch (error) {
        console.error("加载权限数据失败:", error)
      }
    }
    
    loadPermissions()
  }, [])
  
  // 处理添加角色
  const handleAddRole = () => {
    setSelectedRole(null)
    setIsFormOpen(true)
  }
  
  // 处理编辑角色
  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsFormOpen(true)
  }
  
  // 处理删除角色
  const handleDeleteRole = async (roleId: number) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("删除角色失败")
      }
      
      toast({
        title: "删除成功",
        description: "角色已成功删除",
      })
      
      onRefresh()
    } catch (error) {
      console.error("删除角色失败:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除角色失败，请稍后再试",
        variant: "destructive",
      })
    }
  }
  
  // 处理表单提交
  const handleFormSubmit = async (roleData: any) => {
    try {
      let response
      
      if (selectedRole) {
        // 更新角色
        response = await fetch(`/api/roles/${selectedRole.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(roleData),
        })
      } else {
        // 创建角色
        response = await fetch("/api/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(roleData),
        })
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "操作失败")
      }
      
      toast({
        title: selectedRole ? "更新成功" : "创建成功",
        description: selectedRole ? "角色已成功更新" : "角色已成功创建",
      })
      
      setIsFormOpen(false)
      onRefresh()
    } catch (error) {
      console.error("保存角色失败:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存角色失败，请稍后再试",
        variant: "destructive",
      })
    }
  }
  
  // 处理表单取消
  const handleFormCancel = () => {
    setIsFormOpen(false)
  }
  
  // 获取模块权限
  const getModulePermissions = (role: Role, module: string) => {
    return role.permissions?.filter(p => p.module === module) || []
  }
  
  // 获取所有模块
  const getModules = () => {
    const modules = new Set<string>()
    permissions.forEach(p => modules.add(p.module))
    return Array.from(modules).sort()
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PermissionGuard permission="permissions.create">
          <Button onClick={handleAddRole}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加角色
          </Button>
        </PermissionGuard>
      </div>
      
      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-lg font-medium">暂无角色</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            系统中还没有角色，请添加角色
          </p>
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={expandedRoles}
          onValueChange={setExpandedRoles}
          className="space-y-2"
        >
          {roles.map((role) => (
            <AccordionItem
              key={role.id}
              value={role.id.toString()}
              className="border rounded-md"
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4" />
                    <span className="font-medium">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="outline" className="ml-2">
                        系统角色
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <PermissionGuard permission="permissions.edit">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRole(role)
                        }}
                        disabled={role.isSystem}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="permissions.delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRole(role.id)
                        }}
                        disabled={role.isSystem}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-2">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {role.description || `角色代码: ${role.code}`}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">权限列表</h4>
                    {getModules().map((module) => {
                      const modulePermissions = getModulePermissions(role, module)
                      if (modulePermissions.length === 0) return null
                      
                      return (
                        <div key={module} className="border rounded-md p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <LockIcon className="h-4 w-4" />
                            <span className="font-medium">{module}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {modulePermissions.map((permission) => (
                              <Badge key={permission.id} variant="secondary">
                                {permission.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      
      {isFormOpen && (
        <RoleForm
          role={selectedRole}
          permissions={permissions}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  )
}
