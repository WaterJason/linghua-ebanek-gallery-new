"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import {
  SearchIcon,
  ShieldIcon,
  PlusIcon,
  Pencil2Icon,
  TrashIcon,
  UsersIcon,
  RefreshCwIcon
} from "lucide-react"
import { getRoles, deleteRole } from "@/lib/actions/role-actions"
import { AddRoleDialog } from "@/components/settings/add-role-dialog"
import { EditRoleDialog } from "@/components/settings/edit-role-dialog"

interface Role {
  id: number
  name: string
  code: string
  description: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export function RoleList() {
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // 加载角色数据
  const loadRoles = async () => {
    setIsLoading(true)
    try {
      const data = await getRoles()
      setRoles(data)
      setFilteredRoles(data)
    } catch (error) {
      console.error("加载角色失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载角色数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    loadRoles()
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRoles(roles)
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = roles.filter(
      role =>
        role.name.toLowerCase().includes(lowerSearchTerm) ||
        role.code.toLowerCase().includes(lowerSearchTerm) ||
        role.description.toLowerCase().includes(lowerSearchTerm)
    )
    setFilteredRoles(filtered)
  }, [searchTerm, roles])

  // 处理添加角色
  const handleAddRole = () => {
    setIsAddDialogOpen(true)
  }

  // 处理编辑角色
  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsEditDialogOpen(true)
  }

  // 处理删除角色
  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("确定要删除此角色吗？此操作不可撤销。")) {
      return
    }

    try {
      await deleteRole(roleId)
      toast({
        title: "删除成功",
        description: "角色已成功删除",
      })
      loadRoles()
    } catch (error) {
      console.error("删除角色失败:", error)
      toast({
        title: "删除失败",
        description: "无法删除角色，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 处理角色添加完成
  const handleRoleAdded = () => {
    setIsAddDialogOpen(false)
    loadRoles()
  }

  // 处理角色编辑完成
  const handleRoleEdited = () => {
    setIsEditDialogOpen(false)
    setSelectedRole(null)
    loadRoles()
  }

  // 表格列定义
  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "角色名称",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <ShieldIcon className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.name}</span>
          {row.original.isSystem && (
            <Badge variant="secondary" className="ml-2">系统</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "角色代码",
    },
    {
      accessorKey: "description",
      header: "描述",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditRole(row.original)}
            disabled={row.original.isSystem}
          >
            <Pencil2Icon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteRole(row.original.id)}
            disabled={row.original.isSystem}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>角色管理</CardTitle>
              <CardDescription>管理系统角色和权限</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddRole}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加角色
              </Button>
              <Button variant="outline" onClick={loadRoles}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRoles}
            isLoading={isLoading}
            noResultsMessage="暂无角色数据"
          />
        </CardContent>
      </Card>

      {/* 添加角色对话框 */}
      <AddRoleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onRoleAdded={handleRoleAdded}
      />

      {/* 编辑角色对话框 */}
      {selectedRole && (
        <EditRoleDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onRoleEdited={handleRoleEdited}
          role={selectedRole}
        />
      )}
    </>
  )
}
