/**
 * 数据同步管理器
 * 处理用户-员工关联、权限变更级联更新、跨模块通知等
 */

import prisma from "@/lib/db"
import { permissionCache } from "@/lib/permission-cache"
import { configManager } from "@/lib/config-manager"

interface SyncEvent {
  type: 'user_role_changed' | 'role_permission_changed' | 'user_employee_linked' | 'config_changed'
  entityId: string | number
  data?: any
  timestamp: Date
}

interface SyncListener {
  (event: SyncEvent): Promise<void> | void
}

class SyncManager {
  private static instance: SyncManager
  private listeners: Map<string, SyncListener[]> = new Map()
  private eventQueue: SyncEvent[] = []
  private processing: boolean = false

  private constructor() {
    this.initializeListeners()
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  /**
   * 初始化内置监听器
   */
  private initializeListeners(): void {
    // 用户角色变更监听器
    this.addListener('user_role_changed', async (event) => {
      const userId = event.entityId as string
      console.log(`用户 ${userId} 角色发生变更，清除权限缓存`)
      permissionCache.invalidateUserPermissions(userId)
      
      // 同步用户-员工关联数据
      await this.syncUserEmployeeData(userId)
    })

    // 角色权限变更监听器
    this.addListener('role_permission_changed', async (event) => {
      const roleId = event.entityId as number
      console.log(`角色 ${roleId} 权限发生变更，清除相关缓存`)
      permissionCache.invalidateRolePermissions(roleId)
      
      // 通知所有拥有该角色的用户
      await this.notifyRoleUsers(roleId)
    })

    // 用户-员工关联监听器
    this.addListener('user_employee_linked', async (event) => {
      const { userId, employeeId } = event.data
      console.log(`用户 ${userId} 与员工 ${employeeId} 关联发生变更`)
      await this.syncUserEmployeePermissions(userId, employeeId)
    })

    // 配置变更监听器
    this.addListener('config_changed', async (event) => {
      const configKey = event.data?.key
      console.log(`配置 ${configKey} 发生变更，通知相关模块`)
      await this.notifyConfigChange(configKey, event.data?.oldValue, event.data?.newValue)
    })
  }

  /**
   * 添加同步监听器
   */
  public addListener(eventType: string, listener: SyncListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(listener)
  }

  /**
   * 移除同步监听器
   */
  public removeListener(eventType: string, listener: SyncListener): void {
    const eventListeners = this.listeners.get(eventType)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发同步事件
   */
  public async triggerEvent(event: SyncEvent): Promise<void> {
    this.eventQueue.push(event)
    
    if (!this.processing) {
      await this.processEventQueue()
    }
  }

  /**
   * 处理事件队列
   */
  private async processEventQueue(): Promise<void> {
    this.processing = true
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      await this.processEvent(event)
    }
    
    this.processing = false
  }

  /**
   * 处理单个事件
   */
  private async processEvent(event: SyncEvent): Promise<void> {
    const eventListeners = this.listeners.get(event.type) || []
    const globalListeners = this.listeners.get('*') || []
    
    const allListeners = [...eventListeners, ...globalListeners]
    
    for (const listener of allListeners) {
      try {
        await listener(event)
      } catch (error) {
        console.error(`同步事件监听器执行失败:`, error)
      }
    }
  }

  /**
   * 同步用户-员工数据
   */
  private async syncUserEmployeeData(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true }
      })

      if (user?.employee) {
        // 同步用户信息到员工记录
        await prisma.employee.update({
          where: { id: user.employee.id },
          data: {
            email: user.email,
            updatedAt: new Date()
          }
        })

        console.log(`用户 ${userId} 的员工数据已同步`)
      }
    } catch (error) {
      console.error(`同步用户-员工数据失败:`, error)
    }
  }

  /**
   * 同步用户-员工权限
   */
  private async syncUserEmployeePermissions(userId: string, employeeId: string): Promise<void> {
    try {
      // 获取用户权限
      const userPermissions = await permissionCache.getUserPermissions(userId)
      
      // 更新员工的权限相关字段（如果有的话）
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          updatedAt: new Date()
          // 这里可以添加更多权限相关的同步逻辑
        }
      })

      console.log(`用户 ${userId} 与员工 ${employeeId} 的权限已同步`)
    } catch (error) {
      console.error(`同步用户-员工权限失败:`, error)
    }
  }

  /**
   * 通知角色用户
   */
  private async notifyRoleUsers(roleId: number): Promise<void> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: { roleId },
        include: { user: true }
      })

      for (const userRole of userRoles) {
        // 清除用户权限缓存
        permissionCache.invalidateUserPermissions(userRole.userId)
        
        // 这里可以添加更多通知逻辑，如发送实时通知
        console.log(`已通知用户 ${userRole.userId} 角色权限变更`)
      }
    } catch (error) {
      console.error(`通知角色用户失败:`, error)
    }
  }

  /**
   * 通知配置变更
   */
  private async notifyConfigChange(configKey: string, oldValue: any, newValue: any): Promise<void> {
    try {
      // 根据配置类型执行不同的通知逻辑
      if (configKey.startsWith('security.')) {
        // 安全配置变更，清除所有权限缓存
        permissionCache.invalidateAllPermissions()
        console.log('安全配置变更，已清除所有权限缓存')
      } else if (configKey.startsWith('system.')) {
        // 系统配置变更，记录日志
        await this.logConfigChange(configKey, oldValue, newValue)
      }
      
      // 这里可以添加更多配置变更的处理逻辑
    } catch (error) {
      console.error(`处理配置变更通知失败:`, error)
    }
  }

  /**
   * 记录配置变更日志
   */
  private async logConfigChange(configKey: string, oldValue: any, newValue: any): Promise<void> {
    try {
      await prisma.systemLog.create({
        data: {
          module: 'config',
          level: 'info',
          message: `配置变更: ${configKey}`,
          details: JSON.stringify({
            key: configKey,
            oldValue,
            newValue,
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error(`记录配置变更日志失败:`, error)
    }
  }

  /**
   * 执行数据一致性检查
   */
  public async performConsistencyCheck(): Promise<{
    issues: string[]
    fixed: string[]
  }> {
    const issues: string[] = []
    const fixed: string[] = []

    try {
      // 检查用户-员工关联一致性
      const usersWithoutEmployee = await prisma.user.findMany({
        where: {
          employee: null,
          email: { not: { startsWith: 'system_' } }
        }
      })

      for (const user of usersWithoutEmployee) {
        issues.push(`用户 ${user.email} 没有关联的员工记录`)
      }

      // 检查角色权限一致性
      const rolesWithoutPermissions = await prisma.role.findMany({
        where: {
          permissions: { none: {} },
          isSystem: false
        }
      })

      for (const role of rolesWithoutPermissions) {
        issues.push(`角色 ${role.name} 没有分配任何权限`)
      }

      // 检查孤立的权限记录
      const orphanedPermissions = await prisma.rolePermission.findMany({
        where: {
          role: null
        }
      })

      if (orphanedPermissions.length > 0) {
        // 清理孤立的权限记录
        await prisma.rolePermission.deleteMany({
          where: {
            role: null
          }
        })
        fixed.push(`清理了 ${orphanedPermissions.length} 个孤立的权限记录`)
      }

      console.log(`数据一致性检查完成: ${issues.length} 个问题, ${fixed.length} 个已修复`)
      
    } catch (error) {
      console.error('数据一致性检查失败:', error)
      issues.push('数据一致性检查执行失败')
    }

    return { issues, fixed }
  }

  /**
   * 获取同步统计信息
   */
  public getSyncStats(): {
    queueSize: number
    processing: boolean
    listenerCount: number
  } {
    return {
      queueSize: this.eventQueue.length,
      processing: this.processing,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0)
    }
  }
}

// 导出单例实例
export const syncManager = SyncManager.getInstance()

// 便捷函数
export const triggerUserRoleChange = (userId: string, data?: any) =>
  syncManager.triggerEvent({
    type: 'user_role_changed',
    entityId: userId,
    data,
    timestamp: new Date()
  })

export const triggerRolePermissionChange = (roleId: number, data?: any) =>
  syncManager.triggerEvent({
    type: 'role_permission_changed',
    entityId: roleId,
    data,
    timestamp: new Date()
  })

export const triggerUserEmployeeLink = (userId: string, employeeId: string) =>
  syncManager.triggerEvent({
    type: 'user_employee_linked',
    entityId: userId,
    data: { userId, employeeId },
    timestamp: new Date()
  })

export const triggerConfigChange = (key: string, oldValue: any, newValue: any) =>
  syncManager.triggerEvent({
    type: 'config_changed',
    entityId: key,
    data: { key, oldValue, newValue },
    timestamp: new Date()
  })
