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
  UserIcon,
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  MoreHorizontalIcon,
  UserCheckIcon,
  UserXIcon,
  KeyIcon,
  MailIcon,
  LinkIcon,
  UnlinkIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UsersIcon
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { ModernPageContainer } from "@/components/modern-page-container"
import { AddUserDialog } from "@/components/settings/add-user-dialog"
import { EditUserDialog } from "@/components/settings/edit-user-dialog"
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

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt?: string
  lastLoginAt?: string
  lastLogin?: string
  roles?: Array<{ id: string; name: string; code: string }>
  employee?: {
    id: number
    name: string
    position: string
  }
  failedLoginAttempts?: number
  lockedUntil?: string
}

interface Role {
  id: number
  name: string
  code: string
  description?: string
}

export default function UsersPage() {
  const enhancedOps = useEnhancedOperations()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showBatchActions, setShowBatchActions] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast({
          title: "错误",
          description: "获取用户列表失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("获取用户列表失败:", error)
      toast({
        title: "错误",
        description: "获取用户列表失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("获取角色列表失败:", error)
    }
  }

  const handleAddUser = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleRefresh = () => {
    fetchUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    setUserToDelete(user || null)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/users/${userToDelete.id}`, {
            method: "DELETE",
          })

          if (!response.ok) {
            throw new Error("删除用户时发生错误")
          }

          return userToDelete
        },
        {
          playSound: true,
          soundType: 'warning',
          feedbackMessage: `用户 "${userToDelete?.name || '未知'}" 已删除`,
          enableUndo: true,
          undoTags: ['delete', 'user'],
          undoPriority: 9
        }
      )

      setUsers(users.filter(user => user.id !== userToDelete.id))
      setShowDeleteDialog(false)
      setUserToDelete(null)
    } catch (error) {
      console.error("删除用户失败:", error)
      // 错误已由增强操作系统处理
    }
  }

  // 批量操作
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleBatchDelete = async () => {
    if (selectedUsers.length === 0) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const promises = selectedUsers.map(userId =>
            fetch(`/api/users/${userId}`, { method: "DELETE" })
          )

          const responses = await Promise.all(promises)
          const failedDeletes = responses.filter(r => !r.ok)

          if (failedDeletes.length > 0) {
            throw new Error(`${failedDeletes.length} 个用户删除失败`)
          }

          return selectedUsers
        },
        {
          playSound: true,
          soundType: 'warning',
          feedbackMessage: `已删除 ${selectedUsers.length} 个用户`,
          enableUndo: true,
          undoTags: ['batch-delete', 'user'],
          undoPriority: 9
        }
      )

      setUsers(users.filter(user => !selectedUsers.includes(user.id)))
      setSelectedUsers([])
    } catch (error) {
      console.error("批量删除用户失败:", error)
    }
  }

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedUsers.length === 0) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const promises = selectedUsers.map(userId =>
            fetch(`/api/users/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus })
            })
          )

          const responses = await Promise.all(promises)
          const failedUpdates = responses.filter(r => !r.ok)

          if (failedUpdates.length > 0) {
            throw new Error(`${failedUpdates.length} 个用户状态更新失败`)
          }

          return { userIds: selectedUsers, newStatus }
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `已更新 ${selectedUsers.length} 个用户状态`,
          enableUndo: true,
          undoTags: ['batch-status', 'user'],
          undoPriority: 7
        }
      )

      // 更新本地状态
      setUsers(users.map(user =>
        selectedUsers.includes(user.id)
          ? { ...user, status: newStatus }
          : user
      ))
      setSelectedUsers([])
    } catch (error) {
      console.error("批量更新用户状态失败:", error)
    }
  }

  // 导出用户数据
  const handleExportUsers = () => {
    const csvContent = [
      ['姓名', '邮箱', '角色', '状态', '创建时间', '最后登录'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.roles?.map(r => r.name).join(', ') || user.role,
        user.status,
        user.createdAt ? formatDate(user.createdAt) : '',
        user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `用户列表_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleUserAdded = () => {
    setIsAddDialogOpen(false)
    fetchUsers()
  }

  const handleUserEdited = () => {
    setIsEditDialogOpen(false)
    setSelectedUser(null)
    fetchUsers()
  }

  // 关联员工
  const handleLinkEmployee = async (userId: string) => {
    // 这里可以打开一个对话框选择要关联的员工
    // 或者跳转到账号迁移页面
    window.open('/settings/account-migration', '_blank')
  }

  // 解除关联员工
  const handleUnlinkEmployee = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user || !user.employee) return

    try {
      await enhancedOps.executeOperation(
        async () => {
          const response = await fetch(`/api/employees/batch-link`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unlinkPairs: [{
                employeeId: user.employee!.id,
                userId: user.id
              }]
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '解除关联失败')
          }

          return await response.json()
        },
        {
          playSound: true,
          soundType: 'warning',
          feedbackMessage: `已解除用户 "${user.name}" 与员工 "${user.employee.name}" 的关联`,
          enableUndo: true,
          undoTags: ['unlink', 'user-employee'],
          undoPriority: 7
        }
      )

      // 刷新用户列表
      fetchUsers()
    } catch (error) {
      console.error('解除关联失败:', error)
    }
  }

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    const matchesRole = roleFilter === "all" ||
                       user.roles?.some(role => role.code === roleFilter) ||
                       user.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">活跃</Badge>
      case "inactive":
        return <Badge variant="secondary">非活跃</Badge>
      case "suspended":
        return <Badge variant="destructive">已暂停</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
      title="用户管理"
      description="管理系统用户账户和权限"
      actions={
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  批量操作 ({selectedUsers.length})
                  <MoreHorizontalIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>批量操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBatchStatusChange("active")}>
                  <UserCheckIcon className="mr-2 h-4 w-4" />
                  激活用户
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBatchStatusChange("inactive")}>
                  <UserXIcon className="mr-2 h-4 w-4" />
                  停用用户
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleBatchDelete}
                  className="text-destructive"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  删除用户
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportUsers}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <PermissionGuard permission="users.create">
            <Button onClick={handleAddUser}>
              <PlusIcon className="mr-2 h-4 w-4" />
              新建用户
            </Button>
          </PermissionGuard>
        </div>
      }
    >

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>
            使用筛选条件快速查找用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户姓名、邮箱或员工姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">非活跃</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
                <SelectItem value="locked">已锁定</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="manager">经理</SelectItem>
                <SelectItem value="employee">员工</SelectItem>
                <SelectItem value="finance">财务</SelectItem>
                <SelectItem value="sales">销售</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.code}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || roleFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已筛选 {filteredUsers.length} / {users.length} 个用户
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setRoleFilter("all")
                }}
              >
                清除筛选
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            共 {filteredUsers.length} 个用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>用户</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>员工信息</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                      ? "没有找到符合条件的用户"
                      : "暂无用户数据"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.failedLoginAttempts && user.failedLoginAttempts > 0 && (
                            <div className="text-xs text-destructive">
                              失败登录: {user.failedLoginAttempts} 次
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MailIcon className="w-4 h-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.employee ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <div className="text-sm">
                              <div className="font-medium">{user.employee.name}</div>
                              <div className="text-muted-foreground">{user.employee.position}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUnlinkEmployee(user.id)}
                            title="解除关联"
                          >
                            <UnlinkIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <AlertCircleIcon className="h-4 w-4 text-orange-500" />
                            <span className="text-muted-foreground text-sm">未关联员工</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleLinkEmployee(user.id)}
                            title="关联员工"
                          >
                            <LinkIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.createdAt ? formatDate(user.createdAt) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.lastLoginAt || user.lastLogin ?
                          formatDate(user.lastLoginAt || user.lastLogin!, "yyyy-MM-dd HH:mm") :
                          <span className="text-muted-foreground">从未登录</span>
                        }
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
                          <PermissionGuard permission="users.edit">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <EditIcon className="mr-2 h-4 w-4" />
                              编辑用户
                            </DropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="users.edit">
                            <DropdownMenuItem>
                              <KeyIcon className="mr-2 h-4 w-4" />
                              重置密码
                            </DropdownMenuItem>
                          </PermissionGuard>
                          <DropdownMenuSeparator />
                          <PermissionGuard permission="users.delete">
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              删除用户
                            </DropdownMenuItem>
                          </PermissionGuard>
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

      {/* 对话框 */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onUserAdded={handleUserAdded}
      />

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUserEdited={handleUserEdited}
        user={selectedUser}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除用户 "{userToDelete?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
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
