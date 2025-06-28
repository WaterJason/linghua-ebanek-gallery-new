"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "@/hooks/use-toast"
import {
  SearchIcon,
  ShieldIcon,
  SaveIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  KeyIcon,
  CheckIcon,
  XIcon
} from "lucide-react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { PermissionGuard } from "@/components/auth/permission-guard"

export default function PermissionsPage() {
  const enhancedOps = useEnhancedOperations()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [permissionModules, setPermissionModules] = useState([])
  const [rolePermissions, setRolePermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [saving, setSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/permissions")
      ])

      if (rolesResponse.ok && permissionsResponse.ok) {
        const rolesData = await rolesResponse.json()
        const permissionsData = await permissionsResponse.json()

        console.log("🔍 API响应调试信息:")
        console.log("角色数据:", rolesData)
        console.log("权限数据:", permissionsData)
        console.log("权限数据长度:", permissionsData.length)

        setRoles(rolesData)
        setPermissions(permissionsData)

        // 按模块分组权限
        const modules = permissionsData.reduce((acc, permission) => {
          const module = permission.module || '其他'
          if (!acc[module]) {
            acc[module] = []
          }
          acc[module].push(permission)
          return acc
        }, {})

        const moduleList = Object.entries(modules).map(([module, perms]) => ({
          module,
          permissions: perms
        }))

        console.log("🔍 模块分组结果:", moduleList)
        console.log("模块数量:", moduleList.length)

        setPermissionModules(moduleList)

        // 构建角色权限映射
        const rolePermMap = {}
        rolesData.forEach(role => {
          rolePermMap[role.id] = role.permissions?.map(p => p.id) || []
        })
        setRolePermissions(rolePermMap)

        // 默认展开所有模块
        setExpandedModules(new Set(moduleList.map(m => m.module)))
      } else {
        toast({
          title: "错误",
          description: "获取数据失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取数据失败:", error)
      toast({
        title: "错误",
        description: "获取数据失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (roleId, permissionId, checked) => {
    setRolePermissions(prev => {
      const rolePerms = prev[roleId] || []
      if (checked) {
        return {
          ...prev,
          [roleId]: [...rolePerms, permissionId]
        }
      } else {
        return {
          ...prev,
          [roleId]: rolePerms.filter(id => id !== permissionId)
        }
      }
    })
  }

  const handleSave = async () => {
    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch("/api/permissions/assign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ rolePermissions }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "更新权限分配失败")
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: "权限分配已更新",
          enableUndo: true,
          undoTags: ['permissions', 'assign'],
          undoPriority: 8
        }
      )
    } catch (error) {
      console.error("保存失败:", error)
    }
  }

  // 模块展开/折叠
  const toggleModule = (module) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(module)) {
      newExpanded.delete(module)
    } else {
      newExpanded.add(module)
    }
    setExpandedModules(newExpanded)
  }

  // 批量权限操作
  const handleModulePermissionChange = (module, roleId, checked) => {
    const modulePermissions = permissionModules.find(m => m.module === module)?.permissions || []
    const permissionIds = modulePermissions.map(p => p.id)

    setRolePermissions(prev => {
      const rolePerms = prev[roleId] || []
      if (checked) {
        // 添加模块所有权限
        const newPerms = [...new Set([...rolePerms, ...permissionIds])]
        return { ...prev, [roleId]: newPerms }
      } else {
        // 移除模块所有权限
        const newPerms = rolePerms.filter(id => !permissionIds.includes(id))
        return { ...prev, [roleId]: newPerms }
      }
    })
  }

  // 过滤权限
  const filteredPermissions = permissions.filter(permission =>
    permission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageContainer
      title="权限分配"
      description="为角色分配系统权限，支持模块化权限管理"
      actions={
        <PermissionGuard permission="permissions.edit">
          <Button onClick={handleSave} disabled={saving}>
            <SaveIcon className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存更改"}
          </Button>
        </PermissionGuard>
      }
    >

      {/* 搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>权限搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索权限名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* 权限树结构 */}
      <Card>
        <CardHeader>
          <CardTitle>权限分配矩阵</CardTitle>
          <CardDescription>
            按模块组织的权限分配，支持批量操作和权限继承
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">权限模块</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <ShieldIcon className="h-4 w-4" />
                        <span className="text-xs">{role.name}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionModules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={roles.length + 1} className="text-center text-muted-foreground">
                      暂无权限数据
                    </TableCell>
                  </TableRow>
                ) : (
                  permissionModules.map((moduleData) => {
                    const isExpanded = expandedModules.has(moduleData.module)
                    const filteredModulePermissions = searchTerm
                      ? moduleData.permissions.filter(permission =>
                          permission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      : moduleData.permissions

                    if (searchTerm && filteredModulePermissions.length === 0) {
                      return null
                    }

                    return (
                      <React.Fragment key={moduleData.module}>
                        {/* 模块标题行 */}
                        <TableRow className="bg-muted/50">
                          <TableCell>
                            <Collapsible>
                              <CollapsibleTrigger
                                className="flex items-center gap-2 w-full text-left"
                                onClick={() => toggleModule(moduleData.module)}
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4" />
                                )}
                                <FolderIcon className="h-4 w-4" />
                                <span className="font-medium">{moduleData.module}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {moduleData.permissions.length} 个权限
                                </Badge>
                              </CollapsibleTrigger>
                            </Collapsible>
                          </TableCell>
                          {roles.map((role) => {
                            const modulePermissionIds = moduleData.permissions.map(p => p.id)
                            const rolePerms = rolePermissions[role.id] || []
                            const hasAllPermissions = modulePermissionIds.every(id => rolePerms.includes(id))
                            const hasSomePermissions = modulePermissionIds.some(id => rolePerms.includes(id))

                            return (
                              <TableCell key={role.id} className="text-center">
                                <Checkbox
                                  checked={hasAllPermissions}
                                  ref={(el) => {
                                    if (el) el.indeterminate = hasSomePermissions && !hasAllPermissions
                                  }}
                                  onCheckedChange={(checked) =>
                                    handleModulePermissionChange(moduleData.module, role.id, checked)
                                  }
                                />
                              </TableCell>
                            )
                          })}
                        </TableRow>

                        {/* 权限详细行 */}
                        {isExpanded && filteredModulePermissions.map((permission) => (
                          <TableRow key={permission.id} className="border-l-2 border-l-muted">
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-2">
                                <KeyIcon className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">{permission.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </div>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {permission.code}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            {roles.map((role) => (
                              <TableCell key={role.id} className="text-center">
                                <Checkbox
                                  checked={rolePermissions[role.id]?.includes(permission.id) || false}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(role.id, permission.id, checked)
                                  }
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 角色权限统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldIcon className="h-5 w-5" />
                {role.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rolePermissions[role.id]?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                已分配权限
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ModernPageContainer>
  )
}
