"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { 
  MoreHorizontalIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  CalendarIcon
} from "lucide-react"
import { User, Role } from "@/types/user"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface UserListProps {
  users: User[]
  roles: Role[]
  isLoading: boolean
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

/**
 * 用户列表组件
 */
export function UserList({ 
  users, 
  roles, 
  isLoading, 
  onEdit, 
  onDelete 
}: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // 过滤用户
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      (user.name?.toLowerCase().includes(query) || false) ||
      (user.email?.toLowerCase().includes(query) || false) ||
      (user.employeeName?.toLowerCase().includes(query) || false) ||
      user.roles.some(r => r.role.name.toLowerCase().includes(query))
    )
  })
  
  // 获取角色名称
  const getRoleNames = (user: User) => {
    return user.roles.map(r => r.role.name).join(", ") || user.role
  }
  
  // 获取角色徽章颜色
  const getRoleBadgeColor = (roleCode: string) => {
    switch (roleCode) {
      case "super_admin":
        return "bg-red-500"
      case "admin":
        return "bg-orange-500"
      case "manager":
        return "bg-yellow-500"
      case "employee":
        return "bg-green-500"
      case "finance":
        return "bg-blue-500"
      case "sales":
        return "bg-purple-500"
      case "inventory":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-lg font-medium">暂无用户</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "没有符合搜索条件的用户" : "系统中还没有用户，请添加用户"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户信息</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>员工信息</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium">{user.name || "未设置姓名"}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MailIcon className="mr-1 h-3 w-3" />
                        {user.email || "未设置邮箱"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((userRole) => (
                          <Badge 
                            key={userRole.id} 
                            variant="outline"
                            className={`${getRoleBadgeColor(userRole.role.code)} text-white`}
                          >
                            {userRole.role.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">{user.role}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.employeeName ? (
                      <div className="flex flex-col">
                        <div className="font-medium">{user.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.employeePosition || "未设置职位"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">未关联员工</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(user.createdAt), { 
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGuard permission="users.edit">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard permission="users.delete">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => onDelete(user.id)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
