/**
 * 数据库存储优化管理器
 * 
 * 提供优化的数据库操作接口，支持：
 * - 批量操作优化
 * - 查询缓存
 * - 连接池管理
 * - 事务处理
 */

import prisma from '@/lib/db'
import { storage } from './local-storage'

interface BatchOperation {
  type: 'create' | 'update' | 'delete'
  model: string
  data: any
  where?: any
}

interface QueryCache {
  key: string
  result: any
  timestamp: number
  expiry: number
}

class DatabaseStorageManager {
  private queryCache = new Map<string, QueryCache>()
  private readonly cacheExpiry = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 批量用户偏好操作
   */
  async batchUserPreferences(userId: string, operations: Array<{
    category: string
    key: string
    value: any
    action: 'upsert' | 'delete'
  }>) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const promises = operations.map(op => {
          if (op.action === 'upsert') {
            return tx.userPreference.upsert({
              where: {
                userId_category_key: {
                  userId,
                  category: op.category,
                  key: op.key
                }
              },
              update: {
                value: op.value,
                updatedAt: new Date()
              },
              create: {
                userId,
                category: op.category,
                key: op.key,
                value: op.value
              }
            })
          } else {
            return tx.userPreference.deleteMany({
              where: {
                userId,
                category: op.category,
                key: op.key
              }
            })
          }
        })

        return Promise.all(promises)
      })

      // 清除相关缓存
      this.clearUserPreferencesCache(userId)
      
      return results
    } catch (error) {
      console.error('Batch user preferences error:', error)
      throw error
    }
  }

  /**
   * 优化的用户偏好查询
   */
  async getUserPreferences(userId: string, category?: string) {
    const cacheKey = `user_prefs_${userId}_${category || 'all'}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const where: any = { userId }
      if (category) where.category = category

      const preferences = await prisma.userPreference.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })

      // 缓存结果
      this.setCache(cacheKey, preferences)
      
      // 同时缓存到本地存储
      storage.setUserPreference(`db_prefs_${userId}_${category || 'all'}`, preferences)

      return preferences
    } catch (error) {
      console.error('Get user preferences error:', error)
      
      // 尝试从本地存储获取
      const fallback = storage.getUserPreference(`db_prefs_${userId}_${category || 'all'}`)
      return fallback || []
    }
  }

  /**
   * 批量仪表盘布局操作
   */
  async batchDashboardLayouts(userId: string, operations: Array<{
    id?: string
    name: string
    layout: any
    isDefault?: boolean
    action: 'create' | 'update' | 'delete'
  }>) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const promises = operations.map(op => {
          switch (op.action) {
            case 'create':
              return tx.dashboardLayout.create({
                data: {
                  userId,
                  name: op.name,
                  layout: op.layout,
                  isDefault: op.isDefault || false
                }
              })
            
            case 'update':
              if (!op.id) throw new Error('ID required for update')
              return tx.dashboardLayout.update({
                where: { id: op.id },
                data: {
                  name: op.name,
                  layout: op.layout,
                  isDefault: op.isDefault,
                  updatedAt: new Date()
                }
              })
            
            case 'delete':
              if (!op.id) throw new Error('ID required for delete')
              return tx.dashboardLayout.delete({
                where: { id: op.id }
              })
            
            default:
              throw new Error(`Unknown action: ${op.action}`)
          }
        })

        return Promise.all(promises)
      })

      // 清除相关缓存
      this.clearDashboardLayoutsCache(userId)
      
      return results
    } catch (error) {
      console.error('Batch dashboard layouts error:', error)
      throw error
    }
  }

  /**
   * 优化的仪表盘布局查询
   */
  async getDashboardLayouts(userId: string) {
    const cacheKey = `dashboard_layouts_${userId}`
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const layouts = await prisma.dashboardLayout.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // 缓存结果
      this.setCache(cacheKey, layouts)
      
      // 同时缓存到本地存储
      storage.setDashboardLayout(`db_layouts_${userId}`, layouts)

      return layouts
    } catch (error) {
      console.error('Get dashboard layouts error:', error)
      
      // 尝试从本地存储获取
      const fallback = storage.getDashboardLayout(`db_layouts_${userId}`)
      return fallback || []
    }
  }

  /**
   * 批量收藏操作
   */
  async batchFavorites(userId: string, operations: Array<{
    id?: string
    type: string
    title: string
    url?: string
    icon?: string
    category?: string
    description?: string
    config?: any
    action: 'create' | 'update' | 'delete' | 'access'
  }>) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const promises = operations.map(op => {
          switch (op.action) {
            case 'create':
              return tx.userFavorite.create({
                data: {
                  userId,
                  type: op.type,
                  title: op.title,
                  url: op.url,
                  icon: op.icon,
                  category: op.category,
                  description: op.description,
                  config: op.config,
                  sortOrder: 0,
                  accessCount: 0
                }
              })
            
            case 'update':
              if (!op.id) throw new Error('ID required for update')
              return tx.userFavorite.update({
                where: { id: op.id },
                data: {
                  title: op.title,
                  url: op.url,
                  icon: op.icon,
                  category: op.category,
                  description: op.description,
                  config: op.config,
                  updatedAt: new Date()
                }
              })
            
            case 'delete':
              if (!op.id) throw new Error('ID required for delete')
              return tx.userFavorite.delete({
                where: { id: op.id }
              })
            
            case 'access':
              if (!op.id) throw new Error('ID required for access')
              return tx.userFavorite.update({
                where: { id: op.id },
                data: {
                  accessCount: { increment: 1 },
                  lastAccess: new Date()
                }
              })
            
            default:
              throw new Error(`Unknown action: ${op.action}`)
          }
        })

        return Promise.all(promises)
      })

      // 清除相关缓存
      this.clearFavoritesCache(userId)
      
      return results
    } catch (error) {
      console.error('Batch favorites error:', error)
      throw error
    }
  }

  /**
   * 缓存管理方法
   */
  private setCache(key: string, value: any) {
    this.queryCache.set(key, {
      key,
      result: value,
      timestamp: Date.now(),
      expiry: Date.now() + this.cacheExpiry
    })
  }

  private getFromCache(key: string) {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() < cached.expiry) {
      return cached.result
    }
    
    if (cached) {
      this.queryCache.delete(key)
    }
    
    return null
  }

  private clearUserPreferencesCache(userId: string) {
    const keysToDelete = Array.from(this.queryCache.keys())
      .filter(key => key.includes(`user_prefs_${userId}`))
    
    keysToDelete.forEach(key => this.queryCache.delete(key))
  }

  private clearDashboardLayoutsCache(userId: string) {
    this.queryCache.delete(`dashboard_layouts_${userId}`)
  }

  private clearFavoritesCache(userId: string) {
    this.queryCache.delete(`favorites_${userId}`)
  }

  /**
   * 清理过期缓存
   */
  cleanupCache() {
    const now = Date.now()
    for (const [key, cache] of this.queryCache.entries()) {
      if (now > cache.expiry) {
        this.queryCache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    const total = this.queryCache.size
    const expired = Array.from(this.queryCache.values())
      .filter(cache => Date.now() > cache.expiry).length
    
    return {
      total,
      active: total - expired,
      expired
    }
  }
}

// 创建单例实例
export const databaseStorage = new DatabaseStorageManager()

// 定期清理缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    databaseStorage.cleanupCache()
  }, 60 * 1000) // 每分钟清理一次
}
