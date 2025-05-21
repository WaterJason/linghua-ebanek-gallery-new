"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ResponsiveDataGrid } from "@/components/responsive-data-grid"
import {
  PlusIcon, SearchIcon, ShieldIcon, UsersIcon,
  KeyIcon, EditIcon, Trash2Icon, CheckIcon, UserIcon
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { getUsers, createUser, updateUser, getUserRoles, updateUserRoles } from "@/lib/actions/user-actions";
import { getRoles } from "@/lib/actions/role-actions";

export function AccountManagement() {
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useIsMobile()

  // 加载用户和角色数据
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)

      // 定义默认角色，以防服务器操作失败
      const defaultRoles = [
        { id: 1, name: "管理员", code: "admin", description: "系统管理员", isSystem: true, userCount: 0 },
        { id: 2, name: "普通用户", code: "user", description: "普通用户", isSystem: true, userCount: 0 }
      ];

      try {
        // 并行加载用户和角色数据
        const [usersResult, rolesResult] = await Promise.allSettled([
          getUsers(),
          getRoles()
        ]);

        // 处理用户数据
        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value || []);
        } else {
          console.error("Failed to fetch users:", usersResult.reason);
          setUsers([]);
          toast({
            title: "加载失败",
            description: "无法加载用户数据，请刷新页面重试",
            variant: "destructive",
          });
        }

        // 处理角色数据
        if (rolesResult.status === 'fulfilled') {
          // 确保返回的数据是数组且不为空
          if (Array.isArray(rolesResult.value) && rolesResult.value.length > 0) {
            setRoles(rolesResult.value);
          } else {
            console.warn("Roles server action returned empty array, using default roles");
            setRoles(defaultRoles);
          }
        } else {
          console.error("Failed to fetch roles:", rolesResult.reason);
          // 使用默认角色数据作为回退
          setRoles(defaultRoles);
          toast({
            title: "角色数据加载失败",
            description: "使用默认角色数据，部分功能可能受限",
            variant: "warning",
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // 使用默认角色数据作为回退
        setRoles(defaultRoles);
        setUsers([]);
        toast({
          title: "加载失败",
          description: "加载数据时出错，请刷新页面重试",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [])

  // 用户表格列定义
  const userColumns = [
    {
      key: "name",
      title: "用户名",
      width: 150,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {record.image ? (
              <img src={record.image} alt={record.name} className="w-8 h-8 rounded-full" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs text-muted-foreground">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "系统角色",
      width: 120,
      render: (value) => (
        <div className="flex items-center">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs",
            value === "admin" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
            value === "manager" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          )}>
            {value === "admin" ? "管理员" :
             value === "manager" ? "经理" : "普通用户"}
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      title: "角色",
      width: 200,
      render: (value, record) => {
        const userRoleIds = record.roles || []
        const userRoles = roles.filter(role => userRoleIds.includes(role.id))

        return (
          <div className="flex flex-wrap gap-1">
            {userRoles.length > 0 ? (
              userRoles.map(role => (
                <div key={role.id} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                  {role.name}
                </div>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">无角色</span>
            )}
          </div>
        )
      },
    },
    {
      key: "employee",
      title: "关联员工",
      width: 150,
      render: (_, record) => (
        record.employee ? (
          <div className="flex items-center gap-2">
            <div className="font-medium">{record.employee.name}</div>
            <div className="text-xs text-muted-foreground">{record.employee.position}</div>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">未关联</span>
        )
      ),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 150,
      render: (value) => new Date(value).toLocaleString("zh-CN"),
    },
    {
      key: "actions",
      title: "操作",
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleAssignRoles(record)
            }}
          >
            <ShieldIcon className="h-4 w-4 mr-2" />
            角色
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleEditUser(record)
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteUser(record)
            }}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // 处理添加用户
  const handleAddUser = async (data) => {
    try {
      const newUser = await createUser(data);
      setUsers([...users, newUser]);
      setIsAddUserOpen(false);

      toast({
        title: "添加成功",
        description: "用户已成功添加",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "添加失败",
        description: error.message || "无法添加用户",
        variant: "destructive",
      });
    }
  }

  // 处理编辑用户
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsAddUserOpen(true);
  }

  // 处理保存编辑用户
  const handleSaveEditUser = async (data) => {
    try {
      console.log("保存编辑用户数据:", data);

      // 确保角色字段存在
      if (!data.role) {
        console.warn("角色字段为空，使用默认值 'user'");
        data.role = "user";
      }

      const updatedUser = await updateUser(selectedUser.id, data);
      console.log("用户更新成功:", updatedUser);

      // 更新本地用户列表
      setUsers(users.map(user => user.id === selectedUser.id ? updatedUser : user));
      setIsAddUserOpen(false);

      toast({
        title: "保存成功",
        description: "用户已成功更新",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "保存失败",
        description: error.message || "无法更新用户",
        variant: "destructive",
      });
    }
  }

  // 处理删除用户
  const handleDeleteUser = async (user) => {
    if (!confirm(`确定要删除用户 "${user.name}" 吗？`)) return

    try {
      // 使用服务器操作删除用户
      const result = await deleteUser(user.id)

      if (result.success) {
        setUsers(users.filter(u => u.id !== user.id))

        toast({
          title: "删除成功",
          description: "用户已成功删除",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "删除失败",
        description: error.message || "无法删除用户",
        variant: "destructive",
      })
    }
  }

  // 处理分配角色
  const handleAssignRoles = async (user) => {
    // 先设置为空数组，避免在加载过程中出现undefined
    setSelectedRoles([]);
    setSelectedUser(user);
    setIsLoading(true);

    try {
      // 确保角色数据已加载
      if (!roles || roles.length === 0) {
        console.warn("No roles available, using default roles");
        // 如果没有角色数据，使用默认角色
        const defaultRoles = [
          { id: 1, name: "管理员", code: "admin", description: "系统管理员", isSystem: true, userCount: 0 },
          { id: 2, name: "普通用户", code: "user", description: "普通用户", isSystem: true, userCount: 0 }
        ];
        setRoles(defaultRoles);
      }

      // 获取用户角色
      try {
        const userRolesData = await getUserRoles(user.id);
        // 使用roleIds，这是一个数字数组
        const roleIds = userRolesData?.roleIds || userRolesData?.legacyRoles || [];
        // 确保roleIds是数字数组
        const normalizedRoleIds = Array.isArray(roleIds)
          ? roleIds.map(id => typeof id === 'number' ? id : parseInt(id)).filter(id => !isNaN(id))
          : [];
        setSelectedRoles(normalizedRoleIds);
      } catch (error) {
        console.error("Error fetching user roles:", error);
        // 如果出错，使用用户对象中的roles字段（兼容旧版本）
        const userRoles = user.roles || [];
        // 确保userRoles是数字数组
        const normalizedRoleIds = Array.isArray(userRoles)
          ? userRoles.map(id => typeof id === 'number' ? id : parseInt(id)).filter(id => !isNaN(id))
          : [];
        setSelectedRoles(normalizedRoleIds);
        console.warn("Failed to fetch user roles, using roles from user object");
      }
    } catch (error) {
      console.error("Error in handleAssignRoles:", error);
      // 如果出错，使用空数组
      setSelectedRoles([]);
      toast({
        title: "角色加载失败",
        description: "无法加载用户角色，请重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAssignRolesOpen(true);
    }
  }

  // 处理保存用户角色
  const handleSaveUserRoles = async () => {
    try {
      const result = await updateUserRoles(selectedUser.id, selectedRoles);

      // 更新本地用户数据
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return { ...user, roles: selectedRoles }
        }
        return user
      });

      setUsers(updatedUsers);
      setIsAssignRolesOpen(false);

      toast({
        title: "保存成功",
        description: "用户角色已成功更新",
      });
    } catch (error) {
      console.error("Error saving user roles:", error);
      toast({
        title: "保存失败",
        description: error.message || "无法保存用户角色",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">用户管理</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索用户名或邮箱..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => {
              setSelectedUser(null)
              setIsAddUserOpen(true)
            }}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加用户
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <ResponsiveDataGrid
                data={users.filter(user =>
                  searchQuery === "" ||
                  user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                columns={userColumns}
                loading={isLoading}
                emptyText="暂无用户数据"
                onRowClick={(user) => handleEditUser(user)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加/编辑用户对话框 */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "编辑用户" : "添加用户"}</DialogTitle>
            <DialogDescription>
              {selectedUser ? "修改用户信息" : "添加新用户到系统"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">用户名</Label>
              <Input
                id="userName"
                placeholder="输入用户名"
                defaultValue={selectedUser?.name || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">邮箱</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="输入邮箱地址"
                defaultValue={selectedUser?.email || ""}
              />
            </div>

            {!selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="userPassword">密码</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="输入密码"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="userRole">系统角色</Label>
              <Select defaultValue={selectedUser?.role || "user"}>
                <SelectTrigger>
                  <SelectValue placeholder="选择系统角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="manager">经理</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              取消
            </Button>
            <Button type="submit" onClick={() => {
              // 模拟表单提交
              const userName = document.getElementById("userName")?.value || ""
              const userEmail = document.getElementById("userEmail")?.value || ""
              const userPassword = document.getElementById("userPassword")?.value

              // 安全地获取角色值，提供默认值
              const roleElement = document.querySelector("[data-radix-select-value]")
              const userRole = roleElement ? roleElement.getAttribute("data-value") : "user"

              // 验证必填字段
              if (!userName.trim()) {
                toast({
                  title: "验证失败",
                  description: "用户名不能为空",
                  variant: "destructive",
                })
                return
              }

              if (!userEmail.trim()) {
                toast({
                  title: "验证失败",
                  description: "邮箱不能为空",
                  variant: "destructive",
                })
                return
              }

              // 如果是新用户，验证密码
              if (!selectedUser && !userPassword) {
                toast({
                  title: "验证失败",
                  description: "密码不能为空",
                  variant: "destructive",
                })
                return
              }

              const userData = {
                name: userName,
                email: userEmail,
                role: userRole,
              }

              if (userPassword) {
                userData.password = userPassword
              }

              if (selectedUser) {
                // 编辑用户
                handleSaveEditUser(userData)
              } else {
                // 添加用户
                handleAddUser(userData)
              }
            }}>
              {selectedUser ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分配角色对话框 */}
      <Dialog open={isAssignRolesOpen} onOpenChange={setIsAssignRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配角色</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.name} 分配系统角色
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    checked={Array.isArray(selectedRoles) && selectedRoles.includes(role.id)}
                    onChange={(e) => {
                      if (!Array.isArray(selectedRoles)) {
                        // 如果selectedRoles不是数组，初始化为空数组
                        setSelectedRoles(e.target.checked ? [role.id] : []);
                      } else if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.id]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor={`role-${role.id}`} className="text-sm font-medium">
                    {role.name}
                  </label>
                  <span className="text-xs text-muted-foreground">{role.description}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRolesOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveUserRoles}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
