"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { ResponsiveDataGrid } from "@/components/responsive-data-grid"
import {
  PlusIcon, SearchIcon, ShieldIcon, UsersIcon,
  KeyIcon, EditIcon, Trash2Icon, CheckIcon
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { getRoles, createRole, updateRole, deleteRole, getPermissions, getRolePermissions, updateRolePermissions } from "@/lib/actions/role-actions";
import { getUsersBasic, getUserRoles, updateUserRoles } from "@/lib/actions/user-actions";

// 权限模块定义
const PERMISSION_MODULES = [
  {
    id: "dashboard",
    name: "仪表盘",
    permissions: [
      { id: "dashboard.view", name: "查看仪表盘" },
    ]
  },
  {
    id: "products",
    name: "产品管理",
    permissions: [
      { id: "products.view", name: "查看产品" },
      { id: "products.create", name: "创建产品" },
      { id: "products.edit", name: "编辑产品" },
      { id: "products.delete", name: "删除产品" },
    ]
  },
  {
    id: "inventory",
    name: "库存管理",
    permissions: [
      { id: "inventory.view", name: "查看库存" },
      { id: "inventory.create", name: "创建库存记录" },
      { id: "inventory.edit", name: "编辑库存" },
      { id: "inventory.delete", name: "删除库存记录" },
    ]
  },
  {
    id: "purchase",
    name: "采购管理",
    permissions: [
      { id: "purchase.view", name: "查看采购" },
      { id: "purchase.create", name: "创建采购订单" },
      { id: "purchase.edit", name: "编辑采购订单" },
      { id: "purchase.delete", name: "删除采购订单" },
      { id: "purchase.receive", name: "采购入库" },
      { id: "purchase.supplier", name: "管理供应商" },
    ]
  },
  {
    id: "sales",
    name: "销售管理",
    permissions: [
      { id: "sales.view", name: "查看销售" },
      { id: "sales.create", name: "创建销售" },
      { id: "sales.edit", name: "编辑销售" },
      { id: "sales.delete", name: "删除销售" },
    ]
  },
  {
    id: "production",
    name: "生产管理",
    permissions: [
      { id: "production.view", name: "查看生产" },
      { id: "production.create", name: "创建生产记录" },
      { id: "production.edit", name: "编辑生产" },
      { id: "production.delete", name: "删除生产记录" },
    ]
  },
  {
    id: "employees",
    name: "员工管理",
    permissions: [
      { id: "employees.view", name: "查看员工" },
      { id: "employees.create", name: "创建员工" },
      { id: "employees.edit", name: "编辑员工" },
      { id: "employees.delete", name: "删除员工" },
    ]
  },
  {
    id: "reports",
    name: "报表管理",
    permissions: [
      { id: "reports.view", name: "查看报表" },
      { id: "reports.export", name: "导出报表" },
    ]
  },
  {
    id: "settings",
    name: "系统设置",
    permissions: [
      { id: "settings.view", name: "查看设置" },
      { id: "settings.edit", name: "编辑设置" },
    ]
  },
  {
    id: "users",
    name: "用户管理",
    permissions: [
      { id: "users.view", name: "查看用户" },
      { id: "users.create", name: "创建用户" },
      { id: "users.edit", name: "编辑用户" },
      { id: "users.delete", name: "删除用户" },
    ]
  },
  {
    id: "permissions",
    name: "权限管理",
    permissions: [
      { id: "permissions.view", name: "查看权限" },
      { id: "permissions.create", name: "创建角色" },
      { id: "permissions.edit", name: "编辑角色" },
      { id: "permissions.delete", name: "删除角色" },
      { id: "permissions.assign", name: "分配权限" },
    ]
  },
]

export function PermissionManagement() {
  const [activeTab, setActiveTab] = useState("roles")
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false)
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedPermissions, setSelectedPermissions] = useState({})
  const isMobile = useIsMobile()

  // 加载角色和用户数据
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // 并行加载角色和用户数据
        const [rolesResult, usersResult] = await Promise.allSettled([
          getRoles(),
          getUsersBasic()
        ]);

        // 处理角色数据
        if (rolesResult.status === 'fulfilled') {
          setRoles(rolesResult.value || []);
        } else {
          console.error("Failed to fetch roles:", rolesResult.reason);
          toast({
            title: "加载失败",
            description: "无法加载角色数据",
            variant: "destructive",
          });
        }

        // 处理用户数据
        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value || []);
        } else {
          console.error("Failed to fetch users:", usersResult.reason);
          toast({
            title: "加载失败",
            description: "无法加载用户数据",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading permission data:", error);
        toast({
          title: "加载失败",
          description: "无法加载权限数据",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [])

  // 角色表格列定义
  const roleColumns = [
    {
      key: "id",
      title: "ID",
      width: 80,
      hideOnMobile: true,
    },
    {
      key: "name",
      title: "角色名称",
      width: 150,
    },
    {
      key: "description",
      title: "描述",
      width: 250,
      hideOnMobile: true,
    },
    {
      key: "userCount",
      title: "用户数",
      width: 100,
    },
    {
      key: "actions",
      title: "操作",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditPermissions(record)
            }}
          >
            <KeyIcon className="h-4 w-4 mr-2" />
            权限
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleEditRole(record)
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteRole(record)
            }}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // 用户表格列定义
  const userColumns = [
    {
      key: "id",
      title: "ID",
      width: 80,
      hideOnMobile: true,
    },
    {
      key: "name",
      title: "用户名",
      width: 150,
    },
    {
      key: "email",
      title: "邮箱",
      width: 200,
      hideOnMobile: true,
    },
    {
      key: "roles",
      title: "角色",
      width: 200,
      render: (value, record) => {
        const userRoles = roles.filter(role => record.roles.includes(role.id))
        return (
          <div className="flex flex-wrap gap-1">
            {userRoles.map(role => (
              <span
                key={role.id}
                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {role.name}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: "status",
      title: "状态",
      width: 100,
      render: (value) => (
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          value === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        )}>
          {value === "active" ? "启用" : "禁用"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      width: 120,
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
            分配角色
          </Button>
        </div>
      ),
    },
  ]

  // 处理添加角色
  const handleAddRole = async (data) => {
    try {
      const roleData = {
        name: data.name,
        code: data.code || data.name.toLowerCase().replace(/\s+/g, "_"),
        description: data.description,
        isSystem: false,
      };

      const newRole = await createRole(roleData);
      setRoles([...roles, { ...newRole, userCount: 0 }]);
      setIsAddRoleOpen(false);

      toast({
        title: "添加成功",
        description: "角色已成功添加",
      });
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "添加失败",
        description: error.message || "无法添加角色",
        variant: "destructive",
      });
    }
  }

  // 处理编辑角色
  const handleEditRole = (role) => {
    setSelectedRole(role);
    setIsAddRoleOpen(true);
  }

  // 处理保存编辑角色
  const handleSaveEditRole = async (data) => {
    try {
      const roleData = {
        name: data.name,
        description: data.description,
      };

      const updatedRole = await updateRole(selectedRole.id, roleData);
      setRoles(roles.map(role =>
        role.id === selectedRole.id
          ? { ...updatedRole, userCount: role.userCount }
          : role
      ));
      setIsAddRoleOpen(false);

      toast({
        title: "保存成功",
        description: "角色已成功更新",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "保存失败",
        description: error.message || "无法更新角色",
        variant: "destructive",
      });
    }
  }

  // 处理删除角色
  const handleDeleteRole = async (role) => {
    if (role.userCount > 0) {
      toast({
        title: "无法删除",
        description: `有${role.userCount}个用户正在使用此角色`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`确定要删除角色 "${role.name}" 吗？`)) return;

    try {
      await deleteRole(role.id);
      setRoles(roles.filter(r => r.id !== role.id));

      toast({
        title: "删除成功",
        description: "角色已成功删除",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "删除失败",
        description: error.message || "无法删除角色",
        variant: "destructive",
      });
    }
  }

  // 处理编辑权限
  const handleEditPermissions = async (role) => {
    setSelectedRole(role);
    setIsLoading(true);

    try {
      // 并行获取所有权限和角色权限
      const [allPermissions, rolePermissions] = await Promise.all([
        getPermissions(),
        getRolePermissions(role.id)
      ]);

      // 构建权限映射
      const permissionsMap = {};
      allPermissions.forEach(permission => {
        permissionsMap[permission.code] = false;
      });

      // 标记角色拥有的权限
      rolePermissions.forEach(permission => {
        permissionsMap[permission.code] = true;
      });

      setSelectedPermissions(permissionsMap);
      setIsEditPermissionsOpen(true);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast({
        title: "加载失败",
        description: error.message || "无法加载角色权限",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 处理保存权限
  const handleSavePermissions = async () => {
    try {
      // 获取所有权限
      const allPermissions = await getPermissions();

      // 找出选中的权限ID
      const selectedPermissionIds = [];
      for (const [code, isSelected] of Object.entries(selectedPermissions)) {
        if (isSelected) {
          const permission = allPermissions.find(p => p.code === code);
          if (permission) {
            selectedPermissionIds.push(permission.id);
          }
        }
      }

      // 保存角色权限
      await updateRolePermissions(selectedRole.id, selectedPermissionIds);
      setIsEditPermissionsOpen(false);

      toast({
        title: "保存成功",
        description: "角色权限已成功更新",
      });
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        title: "保存失败",
        description: error.message || "无法保存角色权限",
        variant: "destructive",
      });
    }
  }

  // 处理分配角色
  const handleAssignRoles = async (user) => {
    setSelectedUser(user);
    setIsLoading(true);

    try {
      // 获取用户角色
      const userRolesData = await getUserRoles(user.id);

      // 设置用户角色ID列表
      const userRoleIds = userRolesData.roleIds || [];

      // 创建选中角色状态
      const selectedRolesMap = {};
      roles.forEach(role => {
        selectedRolesMap[role.id] = userRoleIds.includes(role.id);
      });

      setSelectedRoles(selectedRolesMap);
      setIsAssignRolesOpen(true);
    } catch (error) {
      console.error("Error loading user roles:", error);
      toast({
        title: "加载失败",
        description: error.message || "无法加载用户角色",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 处理保存用户角色
  const handleSaveUserRoles = async () => {
    try {
      // 找出选中的角色ID
      const roleIds = [];
      for (const [id, isSelected] of Object.entries(selectedRoles)) {
        if (isSelected) {
          roleIds.push(Number(id));
        }
      }

      // 保存用户角色
      await updateUserRoles(selectedUser.id, roleIds);

      // 更新本地用户数据
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return { ...user, roles: roleIds };
        }
        return user;
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
          <TabsTrigger value="roles">角色管理</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">系统角色</h3>
            <Button onClick={() => {
              setSelectedRole(null)
              setIsAddRoleOpen(true)
            }}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加角色
            </Button>
          </div>

          <ResponsiveDataGrid
            data={roles}
            columns={roleColumns}
            searchable={true}
            searchKeys={["name", "description"]}
            loading={isLoading}
            emptyText="暂无角色数据"
            onRowClick={(role) => handleEditRole(role)}
          />

          {/* 添加/编辑角色对话框 */}
          <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedRole ? "编辑角色" : "添加角色"}</DialogTitle>
                <DialogDescription>
                  {selectedRole ? "修改角色信息" : "添加新角色到系统"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">角色名称</Label>
                  <Input
                    id="roleName"
                    placeholder="输入角色名称"
                    defaultValue={selectedRole?.name || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleDescription">角色描述</Label>
                  <Input
                    id="roleDescription"
                    placeholder="输入角色描述"
                    defaultValue={selectedRole?.description || ""}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                  取消
                </Button>
                <Button type="submit" onClick={() => {
                  const data = {
                    name: document.getElementById("roleName").value,
                    description: document.getElementById("roleDescription").value,
                  }

                  if (selectedRole) {
                    // 编辑角色
                    handleSaveEditRole(data)
                  } else {
                    // 添加角色
                    handleAddRole(data)
                  }
                }}>
                  {selectedRole ? "保存修改" : "添加角色"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 编辑权限对话框 */}
          <Dialog open={isEditPermissionsOpen} onOpenChange={setIsEditPermissionsOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>编辑角色权限</DialogTitle>
                <DialogDescription>
                  为角色 "{selectedRole?.name}" 分配权限
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {PERMISSION_MODULES.map(module => (
                  <div key={module.code} className="mb-6">
                    <h4 className="text-sm font-medium mb-2">{module.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {module.permissions.map(permission => {
                        const permissionCode = `${module.code}.${permission.code}`
                        return (
                          <div key={permissionCode} className="flex items-center space-x-2">
                            <Checkbox
                              id={permissionCode}
                              checked={selectedPermissions[permissionCode] || false}
                              onCheckedChange={(checked) => {
                                setSelectedPermissions({
                                  ...selectedPermissions,
                                  [permissionCode]: checked
                                })
                              }}
                            />
                            <Label htmlFor={permissionCode} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditPermissionsOpen(false)}>
                  取消
                </Button>
                <Button type="submit" onClick={handleSavePermissions}>
                  保存权限
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
