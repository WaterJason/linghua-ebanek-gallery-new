"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { PencilIcon, TrashIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react"
import { format } from "date-fns"
import { AddUserDialog } from "@/components/add-user-dialog"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { toast } from "@/components/ui/use-toast"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error("Failed to fetch users")

        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "获取用户列表失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleAddUser = () => {
    setIsAddDialogOpen(true)
  }

  const handleEditUser = (user) => {
    setCurrentUser(user)
    setIsEditDialogOpen(true)
  }

  const handleDeleteUser = async (id) => {
    if (confirm("确定要删除这个用户吗？")) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Failed to delete user")

        setUsers(users.filter((user) => user.id !== id))
        toast({
          title: "删除成功",
          description: "用户已成功删除",
        })
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "删除失败",
          description: "删除用户时出错",
          variant: "destructive",
        })
      }
    }
  }

  const handleUserAdded = (newUser) => {
    setUsers([...users, newUser])
    setIsAddDialogOpen(false)
    toast({
      title: "添加成功",
      description: "新用户已成功添加",
    })
  }

  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    setIsEditDialogOpen(false)
    toast({
      title: "更新成功",
      description: "用户信息已成功更新",
    })
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      default:
        return "secondary"
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "管理员"
      case "manager":
        return "经理"
      default:
        return "普通用户"
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载用户数据中...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">用户管理</h1>
        <Button onClick={handleAddUser}>
          <PlusIcon className="mr-2 h-4 w-4" />
          添加用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>管理系统用户和权限</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>关联员工</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.employee ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50">
                              {user.employee.name} ({user.employee.position})
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">未关联</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                              <TrashIcon className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddUserDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onUserAdded={handleUserAdded} />

      {currentUser && (
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={currentUser}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  )
}
