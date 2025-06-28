/**
 * 系统配置管理器
 * 提供配置缓存、实时生效、变更通知等功能
 */

import prisma from "@/lib/db"

interface SystemConfig {
  [key: string]: string | number | boolean
}

interface ConfigChangeListener {
  (key: string, oldValue: any, newValue: any): void
}

class ConfigManager {
  private static instance: ConfigManager
  private cache: Map<string, any> = new Map()
  private listeners: Map<string, ConfigChangeListener[]> = new Map()
  private lastUpdate: Date = new Date(0)
  private cacheTimeout: number = 5 * 60 * 1000 // 5分钟缓存超时

  private constructor() {
    this.initializeCache()
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * 初始化配置缓存
   */
  private async initializeCache(): Promise<void> {
    try {
      const parameters = await prisma.systemParameter.findMany()

      for (const param of parameters) {
        let value: any = param.value

        // 根据类型转换值
        switch (param.type) {
          case 'boolean':
            value = param.value === 'true'
            break
          case 'number':
            value = parseFloat(param.value) || 0
            break
          case 'json':
            try {
              value = JSON.parse(param.value)
            } catch {
              value = param.value
            }
            break
          default:
            value = param.value
        }

        this.cache.set(param.key, value)
      }

      this.lastUpdate = new Date()
      console.log(`配置缓存初始化完成，加载了 ${parameters.length} 个参数`)
    } catch (error) {
      console.error("初始化配置缓存失败:", error)
    }
  }

  /**
   * 获取配置值
   */
  public async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    // 检查缓存是否过期
    if (this.isCacheExpired()) {
      await this.refreshCache()
    }

    const value = this.cache.get(key)
    return value !== undefined ? value : defaultValue
  }

  /**
   * 批量获取配置
   */
  public async getMultiple(keys: string[]): Promise<SystemConfig> {
    if (this.isCacheExpired()) {
      await this.refreshCache()
    }

    const result: SystemConfig = {}
    for (const key of keys) {
      const value = this.cache.get(key)
      if (value !== undefined) {
        result[key] = value
      }
    }
    return result
  }

  /**
   * 获取分组配置
   */
  public async getGroup(group: string): Promise<SystemConfig> {
    if (this.isCacheExpired()) {
      await this.refreshCache()
    }

    const result: SystemConfig = {}
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${group}.`)) {
        result[key] = value
      }
    }
    return result
  }

  /**
   * 设置配置值
   */
  public async set(key: string, value: any, type: string = 'string'): Promise<void> {
    const oldValue = this.cache.get(key)

    try {
      // 转换值为字符串存储
      let stringValue: string
      switch (type) {
        case 'boolean':
          stringValue = Boolean(value).toString()
          break
        case 'number':
          stringValue = Number(value).toString()
          break
        case 'json':
          stringValue = JSON.stringify(value)
          break
        default:
          stringValue = String(value)
      }

      // 更新数据库
      await prisma.systemParameter.upsert({
        where: { key },
        update: {
          value: stringValue,
          updatedAt: new Date()
        },
        create: {
          key,
          value: stringValue,
          description: `参数 ${key}`,
          group: key.split('.')[0] || 'general',
          type
        }
      })

      // 更新缓存
      let cacheValue: any = value
      switch (type) {
        case 'boolean':
          cacheValue = Boolean(value)
          break
        case 'number':
          cacheValue = Number(value)
          break
        case 'json':
          cacheValue = typeof value === 'string' ? JSON.parse(value) : value
          break
      }

      this.cache.set(key, cacheValue)
      this.lastUpdate = new Date()

      // 触发变更监听器
      this.notifyListeners(key, oldValue, cacheValue)

      console.log(`配置 ${key} 已更新: ${oldValue} -> ${cacheValue}`)
    } catch (error) {
      console.error(`设置配置 ${key} 失败:`, error)
      throw error
    }
  }

  /**
   * 批量设置配置
   */
  public async setMultiple(configs: Record<string, any>): Promise<void> {
    const updates = Object.entries(configs).map(async ([key, value]) => {
      const oldValue = this.cache.get(key)

      // 推断类型
      let type = 'string'
      if (typeof value === 'boolean') type = 'boolean'
      else if (typeof value === 'number') type = 'number'
      else if (typeof value === 'object') type = 'json'

      await this.set(key, value, type)
    })

    await Promise.all(updates)
  }

  /**
   * 删除配置
   */
  public async delete(key: string): Promise<void> {
    const oldValue = this.cache.get(key)

    try {
      await prisma.systemParameter.delete({
        where: { key }
      })

      this.cache.delete(key)
      this.notifyListeners(key, oldValue, undefined)

      console.log(`配置 ${key} 已删除`)
    } catch (error) {
      console.error(`删除配置 ${key} 失败:`, error)
      throw error
    }
  }

  /**
   * 刷新缓存
   */
  public async refreshCache(): Promise<void> {
    console.log("刷新配置缓存...")
    await this.initializeCache()
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear()
    this.lastUpdate = new Date(0)
    console.log("配置缓存已清空")
  }

  /**
   * 检查缓存是否过期
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.lastUpdate.getTime() > this.cacheTimeout
  }

  /**
   * 添加配置变更监听器
   */
  public addListener(key: string, listener: ConfigChangeListener): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    this.listeners.get(key)!.push(listener)
  }

  /**
   * 移除配置变更监听器
   */
  public removeListener(key: string, listener: ConfigChangeListener): void {
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      const index = keyListeners.indexOf(listener)
      if (index > -1) {
        keyListeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知配置变更监听器
   */
  private notifyListeners(key: string, oldValue: any, newValue: any): void {
    const keyListeners = this.listeners.get(key) || []
    const globalListeners = this.listeners.get('*') || []

    const allListeners = [...keyListeners, ...globalListeners]
    allListeners.forEach(listener => {
      try {
        listener(key, oldValue, newValue)
      } catch (error) {
        console.error(`配置变更监听器执行失败:`, error)
      }
    })

    // 触发同步管理器的配置变更事件
    if (typeof window === 'undefined') {
      // 只在服务器端触发同步事件
      import('./sync-manager').then(({ triggerConfigChange }) => {
        triggerConfigChange(key, oldValue, newValue)
      }).catch(error => {
        console.error('触发配置变更同步事件失败:', error)
      })
    }
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    size: number
    lastUpdate: Date
    isExpired: boolean
  } {
    return {
      size: this.cache.size,
      lastUpdate: this.lastUpdate,
      isExpired: this.isCacheExpired()
    }
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance()

// 便捷函数
export const getConfig = <T = any>(key: string, defaultValue?: T): Promise<T> =>
  configManager.get(key, defaultValue)

export const setConfig = (key: string, value: any, type?: string): Promise<void> =>
  configManager.set(key, value, type)

export const getConfigGroup = (group: string): Promise<SystemConfig> =>
  configManager.getGroup(group)

export const refreshConfig = (): Promise<void> =>
  configManager.refreshCache()
