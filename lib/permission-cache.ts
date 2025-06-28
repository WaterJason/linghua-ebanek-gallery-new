/**
 * 权限缓存管理器
 * 提供权限检查结果缓存、角色权限缓存、智能失效机制
 */

import prisma from "@/lib/db"

interface UserPermissions {
  userId: string
  permissions: string[]
  roles: string[]
  lastUpdate: Date
}

interface RolePermissions {
  roleId: number
  permissions: string[]
  lastUpdate: Date
}

interface PermissionCheckResult {
  hasPermission: boolean
  timestamp: Date
}

class PermissionCache {
  private static instance: PermissionCache
  private userPermissionsCache: Map<string, UserPermissions> = new Map()
  private rolePermissionsCache: Map<number, RolePermissions> = new Map()
  private permissionCheckCache: Map<string, PermissionCheckResult> = new Map()
  private cacheTimeout: number = 10 * 60 * 1000 // 10分钟缓存超时
  private checkCacheTimeout: number = 5 * 60 * 1000 // 5分钟权限检查缓存超时

  private constructor() {}

  public static getInstance(): PermissionCache {
    if (!PermissionCache.instance) {
      PermissionCache.instance = new PermissionCache()
    }
    return PermissionCache.instance
  }

  /**
   * 获取用户权限（带缓存）
   */
  public async getUserPermissions(userId: string): Promise<string[]> {
    const cached = this.userPermissionsCache.get(userId)

    // 检查缓存是否有效
    if (cached && !this.isExpired(cached.lastUpdate, this.cacheTimeout)) {
      return cached.permissions
    }

    // 从数据库获取用户权限
    const permissions = await this.fetchUserPermissionsFromDB(userId)

    // 更新缓存
    this.userPermissionsCache.set(userId, {
      userId,
      permissions,
      roles: [], // 这里可以扩展获取用户角色
      lastUpdate: new Date()
    })

    console.log(`用户 ${userId} 权限缓存已更新，权限数量: ${permissions.length}`)
    return permissions
  }

  /**
   * 获取角色权限（带缓存）
   */
  public async getRolePermissions(roleId: number): Promise<string[]> {
    const cached = this.rolePermissionsCache.get(roleId)

    // 检查缓存是否有效
    if (cached && !this.isExpired(cached.lastUpdate, this.cacheTimeout)) {
      return cached.permissions
    }

    // 从数据库获取角色权限
    const permissions = await this.fetchRolePermissionsFromDB(roleId)

    // 更新缓存
    this.rolePermissionsCache.set(roleId, {
      roleId,
      permissions,
      lastUpdate: new Date()
    })

    console.log(`角色 ${roleId} 权限缓存已更新，权限数量: ${permissions.length}`)
    return permissions
  }

  /**
   * 检查用户权限（带缓存）
   */
  public async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    const cacheKey = `${userId}:${permission}`
    const cached = this.permissionCheckCache.get(cacheKey)

    // 检查权限检查缓存
    if (cached && !this.isExpired(cached.timestamp, this.checkCacheTimeout)) {
      return cached.hasPermission
    }

    // 获取用户权限并检查
    const userPermissions = await this.getUserPermissions(userId)
    const hasPermission = userPermissions.includes(permission) || userPermissions.includes('*')

    // 缓存检查结果
    this.permissionCheckCache.set(cacheKey, {
      hasPermission,
      timestamp: new Date()
    })

    return hasPermission
  }

  /**
   * 批量检查用户权限
   */
  public async checkUserPermissions(userId: string, permissions: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    // 并行检查所有权限
    const checks = permissions.map(async (permission) => {
      const hasPermission = await this.checkUserPermission(userId, permission)
      results[permission] = hasPermission
    })

    await Promise.all(checks)
    return results
  }

  /**
   * 使用户权限缓存失效
   */
  public invalidateUserPermissions(userId: string): void {
    this.userPermissionsCache.delete(userId)

    // 清除相关的权限检查缓存
    for (const [key] of this.permissionCheckCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCheckCache.delete(key)
      }
    }

    console.log(`用户 ${userId} 权限缓存已失效`)
  }

  /**
   * 使角色权限缓存失效
   */
  public invalidateRolePermissions(roleId: number): void {
    this.rolePermissionsCache.delete(roleId)

    // 清除所有用户的权限缓存（因为角色权限变更会影响所有拥有该角色的用户）
    this.userPermissionsCache.clear()
    this.permissionCheckCache.clear()

    console.log(`角色 ${roleId} 权限缓存已失效，所有用户权限缓存已清空`)
  }

  /**
   * 使所有权限缓存失效
   */
  public invalidateAllPermissions(): void {
    this.userPermissionsCache.clear()
    this.rolePermissionsCache.clear()
    this.permissionCheckCache.clear()

    console.log("所有权限缓存已失效")
  }

  /**
   * 预热用户权限缓存
   */
  public async warmupUserPermissions(userIds: string[]): Promise<void> {
    console.log(`开始预热 ${userIds.length} 个用户的权限缓存`)

    const warmupPromises = userIds.map(userId => this.getUserPermissions(userId))
    await Promise.all(warmupPromises)

    console.log("用户权限缓存预热完成")
  }

  /**
   * 从数据库获取用户权限
   */
  private async fetchUserPermissionsFromDB(userId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!user) {
        return []
      }

      // 收集所有权限
      const permissions = new Set<string>()

      for (const userRole of user.userRoles) {
        for (const rolePermission of userRole.role.rolePermissions) {
          permissions.add(rolePermission.permission.code)
        }
      }

      return Array.from(permissions)
    } catch (error) {
      console.error(`获取用户 ${userId} 权限失败:`, error)
      return []
    }
  }

  /**
   * 从数据库获取角色权限
   */
  private async fetchRolePermissionsFromDB(roleId: number): Promise<string[]> {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      })

      if (!role) {
        return []
      }

      return role.rolePermissions.map(rp => rp.permission.code)
    } catch (error) {
      console.error(`获取角色 ${roleId} 权限失败:`, error)
      return []
    }
  }

  /**
   * 检查时间是否过期
   */
  private isExpired(timestamp: Date, timeout: number): boolean {
    return Date.now() - timestamp.getTime() > timeout
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    userPermissions: number
    rolePermissions: number
    permissionChecks: number
    cacheTimeout: number
    checkCacheTimeout: number
  } {
    return {
      userPermissions: this.userPermissionsCache.size,
      rolePermissions: this.rolePermissionsCache.size,
      permissionChecks: this.permissionCheckCache.size,
      cacheTimeout: this.cacheTimeout,
      checkCacheTimeout: this.checkCacheTimeout
    }
  }

  /**
   * 清理过期缓存
   */
  public cleanupExpiredCache(): void {
    const now = Date.now()

    // 清理用户权限缓存
    for (const [userId, cached] of this.userPermissionsCache.entries()) {
      if (this.isExpired(cached.lastUpdate, this.cacheTimeout)) {
        this.userPermissionsCache.delete(userId)
      }
    }

    // 清理角色权限缓存
    for (const [roleId, cached] of this.rolePermissionsCache.entries()) {
      if (this.isExpired(cached.lastUpdate, this.cacheTimeout)) {
        this.rolePermissionsCache.delete(roleId)
      }
    }

    // 清理权限检查缓存
    for (const [key, cached] of this.permissionCheckCache.entries()) {
      if (this.isExpired(cached.timestamp, this.checkCacheTimeout)) {
        this.permissionCheckCache.delete(key)
      }
    }

    console.log("过期权限缓存清理完成")
  }
}

// 导出单例实例
export const permissionCache = PermissionCache.getInstance()

// 定期清理过期缓存
if (typeof window === 'undefined') {
  setInterval(() => {
    permissionCache.cleanupExpiredCache()
  }, 5 * 60 * 1000) // 每5分钟清理一次
}
