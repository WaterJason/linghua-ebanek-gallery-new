declare module "next-auth" {
  /**
   * 用户角色类型
   */
  interface UserRole {
    id: number
    name: string
    code: string
  }

  /**
   * 扩展Session类型，添加用户角色和员工信息
   */
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      image?: string
      employeeId?: number
      employeeName?: string
      employeePosition?: string
      roles?: UserRole[]
      hasPermission: (permissionCode: string) => boolean
    }
  }

  /**
   * 扩展User类型，添加角色和员工信息
   */
  interface User {
    id: string
    name: string
    email: string
    role: string
    image?: string
    employeeId?: number
    employeeName?: string
    employeePosition?: string
    roles?: UserRole[]
  }

  /**
   * 扩展Account类型
   */
  interface Account {
    provider: string
    type: string
    providerAccountId: string
    access_token?: string
    expires_at?: number
    refresh_token?: string
    token_type?: string
    scope?: string
    id_token?: string
    session_state?: string
  }

  /**
   * 扩展Profile类型
   */
  interface Profile {
    id?: string
    name?: string
    email?: string
    image?: string
    [key: string]: any
  }
}

declare module "next-auth/jwt" {
  /**
   * 扩展JWT类型，添加角色和员工信息
   */
  interface JWT {
    id: string
    role: string
    employeeId?: number
    employeeName?: string
    employeePosition?: string
    roles?: {
      id: number
      name: string
      code: string
    }[]
    provider?: string
    permissions?: string[]
  }
}
