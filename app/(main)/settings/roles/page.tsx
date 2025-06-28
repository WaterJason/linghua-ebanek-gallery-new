"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  ShieldIcon,
  RefreshCwIcon,
  UsersIcon,
  KeyIcon,
  MoreHorizontalIcon,
  CheckIcon,
  XIcon
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { ModernPageContainer } from "@/components/modern-page-container"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Role {
  id: number
  name: string
  code: string
  description?: string
  isSystem: boolean
  userCount: number
  level: number // 角色层级，数字越大权限越高
  parentId?: number // 父角色ID
  children?: Role[] // 子角色
  createdAt: string
  updatedAt: string
  permissions: Permission[]
}

interface Permission {
  id: number
  name: string
  code: string
  module: string
  description?: string
}

interface PermissionModule {
  module: string
  permissions: Permission[]
}

export default function RolesPage() {
  const enhancedOps = useEnhancedOperations()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  // 对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    level: 1,
    parentId: undefined as number | undefined,
  })
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [showHierarchy, setShowHierarchy] = useState(false)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        toast({
          title: "错误",
          description: "获取角色列表失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取角色列表失败:", error)
      toast({
        title: "错误",
        description: "获取角色列表失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions")
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)

        // 按模块分组权限
        const modules = data.reduce((acc: { [key: string]: Permission[] }, permission: Permission) => {
          if (!acc[permission.module]) {
            acc[permission.module] = []
          }
          acc[permission.module].push(permission)
          return acc
        }, {})

        const moduleList = Object.entries(modules).map(([module, perms]) => ({
          module,
          permissions: perms
        }))

        setPermissionModules(moduleList)
      }
    } catch (error) {
      console.error("获取权限列表失败:", error)
    }
  }

  // 角色层级辅助函数
  const buildRoleHierarchy = (roles: Role[]): Role[] => {
    const roleMap = new Map<number, Role>()
    const rootRoles: Role[] = []

    // 创建角色映射
    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] })
    })

    // 构建层级关系
    roles.forEach(role => {
      const roleWithChildren = roleMap.get(role.id)!
      if (role.parentId && roleMap.has(role.parentId)) {
        const parent = roleMap.get(role.parentId)!
        parent.children!.push(roleWithChildren)
      } else {
        rootRoles.push(roleWithChildren)
      }
    })

    return rootRoles
  }

  const getAvailableParentRoles = (currentRoleId?: number): Role[] => {
    return roles.filter(role =>
      role.id !== currentRoleId &&
      !role.isSystem &&
      role.level < (formData.level || 1)
    )
  }

  const getRoleLevelBadge = (level: number) => {
    const levelNames = {
      1: "基础",
      2: "中级",
      3: "高级",
      4: "管理",
      5: "超级"
    }
    return (
      <Badge variant={level >= 4 ? "default" : "secondary"}>
        {levelNames[level] || `L${level}`}
      </Badge>
    )
  }

  // 处理函数
  const handleCreateRole = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      level: 1,
      parentId: undefined
    })
    setSelectedPermissions([])
    setShowCreateDialog(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || "",
      level: role.level || 1,
      parentId: role.parentId,
    })
    setSelectedPermissions(role.permissions.map(p => p.id))
    setShowEditDialog(true)
  }

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role)
    setShowDeleteDialog(true)
  }

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions.map(p => p.id))
    setShowPermissionsDialog(true)
  }

  const handleRefresh = () => {
    fetchRoles()
    fetchPermissions()
  }

  const confirmCreateRole = async () => {
    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              permissionIds: selectedPermissions
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "创建角色失败")
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `角色 "${formData.name}" 创建成功`,
          enableUndo: true,
          undoTags: ['create', 'role'],
          undoPriority: 7
        }
      )

      setShowCreateDialog(false)
      fetchRoles()
    } catch (error) {
      console.error("创建角色失败:", error)
    }
  }

  const confirmEditRole = async () => {
    if (!selectedRole) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/roles/${selectedRole.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              permissionIds: selectedPermissions
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "更新角色失败")
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `角色 "${formData.name}" 更新成功`,
          enableUndo: true,
          undoTags: ['edit', 'role'],
          undoPriority: 7
        }
      )

      setShowEditDialog(false)
      setSelectedRole(null)
      fetchRoles()
    } catch (error) {
      console.error("更新角色失败:", error)
    }
  }

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/roles/${roleToDelete.id}`, {
            method: "DELETE"
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "删除角色失败")
          }

          return roleToDelete
        },
        {
          playSound: true,
          soundType: 'warning',
          feedbackMessage: `角色 "${roleToDelete.name}" 已删除`,
          enableUndo: true,
          undoTags: ['delete', 'role'],
          undoPriority: 9
        }
      )

      setShowDeleteDialog(false)
      setRoleToDelete(null)
      fetchRoles()
    } catch (error) {
      console.error("删除角色失败:", error)
    }
  }

  const confirmUpdatePermissions = async () => {
    if (!selectedRole) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permissionIds: selectedPermissions })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "更新权限失败")
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `角色 "${selectedRole.name}" 权限更新成功`,
          enableUndo: true,
          undoTags: ['permissions', 'role'],
          undoPriority: 7
        }
      )

      setShowPermissionsDialog(false)
      setSelectedRole(null)
      fetchRoles()
    } catch (error) {
      console.error("更新权限失败:", error)
    }
  }

  // 权限选择处理
  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleModuleToggle = (modulePermissions: Permission[]) => {
    const modulePermissionIds = modulePermissions.map(p => p.id)
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))

    if (allSelected) {
      // 取消选择该模块的所有权限
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)))
    } else {
      // 选择该模块的所有权限
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])])
    }
  }

  // 过滤角色
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" ||
                       (typeFilter === "system" && role.isSystem) ||
                       (typeFilter === "custom" && !role.isSystem)

    return matchesSearch && matchesType
  })

  const getRoleTypeBadge = (isSystem: boolean) => {
    return isSystem ? (
      <Badge variant="secondary">系统角色</Badge>
    ) : (
      <Badge variant="outline">自定义角色</Badge>
    )
  }

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
      title="角色与权限管理"
      description="管理系统角色和权限设置"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={handleCreateRole}>
            <PlusIcon className="mr-2 h-4 w-4" />
            新建角色
          </Button>
        </div>
      }
    >
      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>
            使用筛选条件快速查找角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色名称、代码或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="system">系统角色</SelectItem>
                <SelectItem value="custom">自定义角色</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || typeFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已筛选 {filteredRoles.length} / {roles.length} 个角色
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setTypeFilter("all")
                }}
              >
                清除筛选
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 角色列表 */}
      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <CardDescription>
            共 {filteredRoles.length} 个角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>层级</TableHead>
                <TableHead>用户数量</TableHead>
                <TableHead>权限数量</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {searchTerm || typeFilter !== "all"
                      ? "没有找到符合条件的角色"
                      : "暂无角色数据"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <ShieldIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {role.code}
                      </code>
                    </TableCell>
                    <TableCell>{getRoleTypeBadge(role.isSystem)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleLevelBadge(role.level || 1)}
                        {role.parentId && (
                          <span className="text-xs text-muted-foreground">
                            继承自: {roles.find(r => r.id === role.parentId)?.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4 text-muted-foreground" />
                        {role.userCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <KeyIcon className="w-4 h-4 text-muted-foreground" />
                        {role.permissions.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(role.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleManagePermissions(role)}>
                            <KeyIcon className="mr-2 h-4 w-4" />
                            管理权限
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditRole(role)}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            编辑角色
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteRole(role)}
                                className="text-destructive"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                删除角色
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 创建角色对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建新角色</DialogTitle>
            <DialogDescription>
              创建一个新的系统角色并分配相应权限
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入角色名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">角色代码</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="输入角色代码"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">角色层级</Label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择层级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">基础 (Level 1)</SelectItem>
                    <SelectItem value="2">中级 (Level 2)</SelectItem>
                    <SelectItem value="3">高级 (Level 3)</SelectItem>
                    <SelectItem value="4">管理 (Level 4)</SelectItem>
                    <SelectItem value="5">超级 (Level 5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">父角色 (可选)</Label>
                <Select
                  value={formData.parentId?.toString() || "none"}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    parentId: value === "none" ? undefined : parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择父角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无父角色</SelectItem>
                    {getAvailableParentRoles().map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name} ({getRoleLevelBadge(role.level || 1)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入角色描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>权限设置</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                {permissionModules.map((module) => {
                  const modulePermissionIds = module.permissions.map(p => p.id)
                  const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                  const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id))

                  return (
                    <div key={module.module} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected
                          }}
                          onCheckedChange={() => handleModuleToggle(module.permissions)}
                        />
                        <Label className="font-medium">{module.module}</Label>
                      </div>
                      <div className="ml-6 space-y-1">
                        {module.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                            />
                            <Label className="text-sm">{permission.name}</Label>
                            {permission.description && (
                              <span className="text-xs text-muted-foreground">
                                ({permission.description})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button
              onClick={confirmCreateRole}
              disabled={!formData.name || !formData.code}
            >
              创建角色
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑角色对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>
              修改角色信息和权限设置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">角色名称</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入角色名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">角色代码</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="输入角色代码"
                  disabled={selectedRole?.isSystem}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level">角色层级</Label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
                  disabled={selectedRole?.isSystem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择层级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">基础 (Level 1)</SelectItem>
                    <SelectItem value="2">中级 (Level 2)</SelectItem>
                    <SelectItem value="3">高级 (Level 3)</SelectItem>
                    <SelectItem value="4">管理 (Level 4)</SelectItem>
                    <SelectItem value="5">超级 (Level 5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent">父角色 (可选)</Label>
                <Select
                  value={formData.parentId?.toString() || "none"}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    parentId: value === "none" ? undefined : parseInt(value)
                  }))}
                  disabled={selectedRole?.isSystem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择父角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无父角色</SelectItem>
                    {getAvailableParentRoles(selectedRole?.id).map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name} ({getRoleLevelBadge(role.level || 1)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入角色描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>权限设置</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                {permissionModules.map((module) => {
                  const modulePermissionIds = module.permissions.map(p => p.id)
                  const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                  const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id))

                  return (
                    <div key={module.module} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected
                          }}
                          onCheckedChange={() => handleModuleToggle(module.permissions)}
                        />
                        <Label className="font-medium">{module.module}</Label>
                      </div>
                      <div className="ml-6 space-y-1">
                        {module.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                            />
                            <Label className="text-sm">{permission.name}</Label>
                            {permission.description && (
                              <span className="text-xs text-muted-foreground">
                                ({permission.description})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button
              onClick={confirmEditRole}
              disabled={!formData.name || !formData.code}
            >
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 权限管理对话框 */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>管理权限 - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              为角色分配或移除权限
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              {permissionModules.map((module) => {
                const modulePermissionIds = module.permissions.map(p => p.id)
                const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id))

                return (
                  <div key={module.module} className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 border-b pb-2">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected
                        }}
                        onCheckedChange={() => handleModuleToggle(module.permissions)}
                      />
                      <Label className="font-medium text-base">{module.module}</Label>
                      <Badge variant="outline" className="ml-auto">
                        {module.permissions.filter(p => selectedPermissions.includes(p.id)).length} / {module.permissions.length}
                      </Badge>
                    </div>
                    <div className="ml-6 grid grid-cols-1 gap-2">
                      {module.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                          <Checkbox
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{permission.name}</Label>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground">
                                {permission.description}
                              </div>
                            )}
                          </div>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {permission.code}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>已选择 {selectedPermissions.length} 个权限</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions([])}
                >
                  <XIcon className="w-4 h-4 mr-1" />
                  清除所有
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions(permissions.map(p => p.id))}
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  选择所有
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmUpdatePermissions}>
              保存权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除角色</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除角色 "{roleToDelete?.name}" 吗？
              {roleToDelete?.userCount && roleToDelete.userCount > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  警告：该角色当前有 {roleToDelete.userCount} 个用户，删除后这些用户将失去该角色的权限。
                </div>
              )}
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModernPageContainer>
  )
}