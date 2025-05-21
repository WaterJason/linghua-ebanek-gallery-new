/**
 * 用户类型定义
 */
export interface User {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  role: string
  employeeId: number | null
  employeeName: string | null
  employeePosition: string | null
  createdAt: Date
  updatedAt: Date
  roles: UserRole[]
}

/**
 * 用户角色类型定义
 */
export interface UserRole {
  id: number
  userId: string
  roleId: number
  role: Role
  createdAt: Date
  updatedAt: Date
}

/**
 * 角色类型定义
 */
export interface Role {
  id: number
  name: string
  code: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  permissions?: Permission[]
}

/**
 * 权限类型定义
 */
export interface Permission {
  id: number
  name: string
  code: string
  module: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户表单数据类型
 */
export interface UserFormData {
  name: string
  email: string
  password?: string
  role: string
  employeeId?: number | null
  roleIds: number[]
}

/**
 * 角色表单数据类型
 */
export interface RoleFormData {
  name: string
  code: string
  description?: string
  permissionIds: number[]
}

/**
 * 用户登录历史类型
 */
export interface UserLoginHistory {
  id: number
  userId: string
  ipAddress: string
  userAgent: string
  loginTime: Date
  status: string
  createdAt: Date
}

/**
 * 用户设置类型
 */
export interface UserSettings {
  id: number
  userId: string
  theme: string
  language: string
  enableNotifications: boolean
  enableTwoFactorAuth: boolean
  twoFactorAuthSecret?: string
  createdAt: Date
  updatedAt: Date
}
