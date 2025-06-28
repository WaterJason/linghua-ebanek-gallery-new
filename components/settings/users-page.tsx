"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  CheckIcon,
  XIcon
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 临时用户数据
const DEMO_USERS = [
  {
    id: 1,
    name: "管理员",
    email: "admin@linghua.com",
    role: "admin",
    status: "active",
    lastLogin: "2023-07-01 09:15:00",
    createdAt: "2023-01-01",
  },
  {
    id: 2,
    name: "张三",
    email: "zhangsan@linghua.com",
    role: "manager",
    status: "active",
    lastLogin: "2023-07-01 08:30:00",
    createdAt: "2023-01-15",
  },
  {
    id: 3,
    name: "李四",
    email: "lisi@linghua.com",
    role: "employee",
    status: "active",
    lastLogin: "2023-06-30 17:45:00",
    createdAt: "2023-02-01",
  },
  {
    id: 4,
    name: "王五",
    email: "wangwu@linghua.com",
    role: "employee",
    status: "inactive",
    lastLogin: "2023-06-15 10:20:00",
    createdAt: "2023-03-01",
  },
]

export function UsersPage() {
  const [users, setUsers] = useState(DEMO_USERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // 过滤用户
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 处理添加用户
  const handleAddUser = (userData: any) => {
    setUsers([...users, { ...userData, id: users.length + 1, createdAt: new Date().toISOString().split('T')[0] }])
    setIsAddUserOpen(false)
  }

  // 处理编辑用户
  const handleEditUser = (userData: any) => {
    setUsers(users.map(user => user.id === userData.id ? { ...user, ...userData } : user))
    setIsEditUserOpen(false)
  }

  // 处理删除用户
  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId))
    setIsDeleteUserOpen(false)
  }

  // 处理用户状态切换
  const handleToggleUserStatus = (userId: number) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    ))
  }

  // 表格列定义
  const columns = [
    {
      accessorKey: "name",
      header: "用户名",
    },
    {
      accessorKey: "email",
      header: "邮箱",
    },
    {
      accessorKey: "role",
      header: "角色",
      cell: ({ row }: any) => {
        const role = row.original.role
        return (
          <Badge variant={role === "admin" ? "destructive" : role === "manager" ? "default" : "secondary"}>
            {role === "admin" ? "管理员" : role === "manager" ? "经理" : "员工"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }: any) => {
        const status = row.original.status
        return (
          <Badge variant={status === "active" ? "outline" : "secondary"}>
            {status === "active" ? "启用" : "禁用"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastLogin",
      header: "最近登录",
    },
    {
      accessorKey: "createdAt",
      header: "创建日期",
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user)
                  setIsEditUserOpen(true)
                }}
              >
                <EditIcon className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleUserStatus(user.id)}
              >
                {user.status === "active" ? (
                  <>
                    <LockIcon className="mr-2 h-4 w-4" />
                    禁用
                  </>
                ) : (
                  <>
                    <UnlockIcon className="mr-2 h-4 w-4" />
                    启用
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user)
                  setIsDeleteUserOpen(true)
                }}
                className="text-red-600"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Link href="/settings" className="text-muted-foreground hover:text-foreground">
            系统设置
          </Link>
          <span className="text-muted-foreground">/</span>
          <h2 className="text-2xl font-bold">用户管理</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddUserOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            添加用户
          </Button>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            导出用户
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索用户名、邮箱或角色..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <FilterIcon className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>用户列表</CardTitle>
          <CardDescription>管理系统用户账号</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredUsers}
            noResultsMessage="没有找到匹配的用户"
          />
        </CardContent>
      </Card>

      {/* 添加用户对话框 */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
            <DialogDescription>
              创建新的系统用户账号。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <Input placeholder="输入用户名" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <Input type="email" placeholder="输入邮箱地址" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <Input type="password" placeholder="输入密码" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">角色</label>
              <Select defaultValue="employee">
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                  <SelectItem value="employee">员工</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>取消</Button>
            <Button onClick={() => handleAddUser({
              name: "新用户",
              email: "newuser@linghua.com",
              role: "employee",
              status: "active",
              lastLogin: "-",
            })}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户账号信息。
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">用户名</label>
                <Input defaultValue={selectedUser.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <Input type="email" defaultValue={selectedUser.email} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">角色</label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="manager">经理</SelectItem>
                    <SelectItem value="employee">员工</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">状态</label>
                <Select defaultValue={selectedUser.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>取消</Button>
            <Button onClick={() => handleEditUser({
              ...selectedUser,
              name: selectedUser.name, // 实际应该从表单获取
            })}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>
              确定要删除此用户账号吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p>
                您即将删除用户 <strong>{selectedUser.name}</strong> ({selectedUser.email})。
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}>
              <TrashIcon className="mr-2 h-4 w-4" />
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
