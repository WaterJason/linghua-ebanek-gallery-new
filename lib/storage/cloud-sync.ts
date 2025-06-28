/**
 * 云端同步管理器
 * 
 * 提供跨设备配置同步功能，支持：
 * - 增量同步
 * - 冲突解决
 * - 离线队列
 * - 版本控制
 */

import { storage } from './local-storage'
import { databaseStorage } from './database-storage'

interface SyncItem {
  id: string
  type: 'preference' | 'layout' | 'favorite'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  deviceId: string
  version: number
}

interface SyncConflict {
  localItem: SyncItem
  remoteItem: SyncItem
  resolution: 'local' | 'remote' | 'merge' | 'manual'
}

interface SyncStatus {
  lastSync: number
  pendingItems: number
  conflicts: number
  isOnline: boolean
  isSyncing: boolean
}

class CloudSyncManager {
  private syncQueue: SyncItem[] = []
  private deviceId: string
  private isOnline = true
  private isSyncing = false
  private lastSyncTime = 0
  private syncInterval = 30 * 1000 // 30秒同步间隔

  constructor() {
    this.deviceId = this.getOrCreateDeviceId()
    this.loadSyncQueue()
    this.setupNetworkMonitoring()
    this.startAutoSync()
  }

  /**
   * 添加项目到同步队列
   */
  async queueSync(item: Omit<SyncItem, 'id' | 'timestamp' | 'deviceId' | 'version'>) {
    const syncItem: SyncItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      deviceId: this.deviceId,
      version: 1
    }

    this.syncQueue.push(syncItem)
    this.saveSyncQueue()

    // 如果在线，立即尝试同步
    if (this.isOnline && !this.isSyncing) {
      await this.performSync()
    }
  }

  /**
   * 执行同步操作
   */
  async performSync(): Promise<boolean> {
    if (this.isSyncing || !this.isOnline) {
      return false
    }

    this.isSyncing = true

    try {
      // 1. 上传本地更改
      await this.uploadLocalChanges()

      // 2. 下载远程更改
      await this.downloadRemoteChanges()

      // 3. 解决冲突
      await this.resolveConflicts()

      // 4. 更新同步时间
      this.lastSyncTime = Date.now()
      storage.setTempData('last_sync_time', this.lastSyncTime)

      // 5. 清理已同步的项目
      this.cleanupSyncQueue()

      return true
    } catch (error) {
      console.error('Sync failed:', error)
      return false
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 上传本地更改
   */
  private async uploadLocalChanges() {
    if (this.syncQueue.length === 0) return

    try {
      const response = await fetch('/api/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: this.syncQueue,
          deviceId: this.deviceId,
          lastSync: this.lastSyncTime
        })
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // 处理上传结果
      if (result.conflicts) {
        await this.handleUploadConflicts(result.conflicts)
      }

      // 标记已上传的项目
      this.markItemsAsUploaded(result.uploadedIds || [])
      
    } catch (error) {
      console.error('Upload local changes failed:', error)
      throw error
    }
  }

  /**
   * 下载远程更改
   */
  private async downloadRemoteChanges() {
    try {
      const response = await fetch(`/api/sync/download?lastSync=${this.lastSyncTime}&deviceId=${this.deviceId}`)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.items && result.items.length > 0) {
        await this.applyRemoteChanges(result.items)
      }
      
    } catch (error) {
      console.error('Download remote changes failed:', error)
      throw error
    }
  }

  /**
   * 应用远程更改
   */
  private async applyRemoteChanges(items: SyncItem[]) {
    for (const item of items) {
      try {
        switch (item.type) {
          case 'preference':
            await this.applyPreferenceChange(item)
            break
          case 'layout':
            await this.applyLayoutChange(item)
            break
          case 'favorite':
            await this.applyFavoriteChange(item)
            break
        }
      } catch (error) {
        console.error(`Failed to apply remote change for item ${item.id}:`, error)
      }
    }
  }

  /**
   * 应用偏好设置更改
   */
  private async applyPreferenceChange(item: SyncItem) {
    const { action, data } = item
    
    if (action === 'delete') {
      // 删除偏好设置
      storage.setUserPreference(data.key, null)
    } else {
      // 创建或更新偏好设置
      storage.setUserPreference(data.key, data.value)
    }
  }

  /**
   * 应用布局更改
   */
  private async applyLayoutChange(item: SyncItem) {
    const { action, data } = item
    
    if (action === 'delete') {
      // 删除布局
      storage.setDashboardLayout(data.id, null)
    } else {
      // 创建或更新布局
      storage.setDashboardLayout(data.id, data)
    }
  }

  /**
   * 应用收藏更改
   */
  private async applyFavoriteChange(item: SyncItem) {
    const { action, data } = item
    
    const favorites = storage.getFavoritesCache() || []
    
    if (action === 'delete') {
      // 删除收藏
      const filtered = favorites.filter((fav: any) => fav.id !== data.id)
      storage.setFavoritesCache(filtered)
    } else {
      // 创建或更新收藏
      const existingIndex = favorites.findIndex((fav: any) => fav.id === data.id)
      
      if (existingIndex >= 0) {
        favorites[existingIndex] = data
      } else {
        favorites.push(data)
      }
      
      storage.setFavoritesCache(favorites)
    }
  }

  /**
   * 解决冲突
   */
  private async resolveConflicts() {
    const conflicts = this.detectConflicts()
    
    for (const conflict of conflicts) {
      const resolution = await this.getConflictResolution(conflict)
      await this.applyConflictResolution(conflict, resolution)
    }
  }

  /**
   * 检测冲突
   */
  private detectConflicts(): SyncConflict[] {
    // 这里应该实现冲突检测逻辑
    // 比较本地和远程的时间戳、版本号等
    return []
  }

  /**
   * 获取冲突解决方案
   */
  private async getConflictResolution(conflict: SyncConflict): Promise<'local' | 'remote' | 'merge'> {
    // 简单的冲突解决策略：使用最新的时间戳
    if (conflict.localItem.timestamp > conflict.remoteItem.timestamp) {
      return 'local'
    } else {
      return 'remote'
    }
  }

  /**
   * 应用冲突解决方案
   */
  private async applyConflictResolution(conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge') {
    switch (resolution) {
      case 'local':
        // 保持本地版本，标记为需要上传
        await this.queueSync(conflict.localItem)
        break
      case 'remote':
        // 应用远程版本
        await this.applyRemoteChanges([conflict.remoteItem])
        break
      case 'merge':
        // 合并两个版本（需要具体实现）
        const merged = this.mergeItems(conflict.localItem, conflict.remoteItem)
        await this.applyRemoteChanges([merged])
        break
    }
  }

  /**
   * 合并项目
   */
  private mergeItems(local: SyncItem, remote: SyncItem): SyncItem {
    // 简单的合并策略：合并数据对象
    return {
      ...remote,
      data: { ...local.data, ...remote.data },
      version: Math.max(local.version, remote.version) + 1
    }
  }

  /**
   * 获取或创建设备ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = storage.getTempData('device_id')
    
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      storage.setTempData('device_id', deviceId, 365 * 24 * 60 * 60 * 1000) // 1年
    }
    
    return deviceId
  }

  /**
   * 加载同步队列
   */
  private loadSyncQueue() {
    const saved = storage.getTempData('sync_queue')
    if (saved && Array.isArray(saved)) {
      this.syncQueue = saved
    }
  }

  /**
   * 保存同步队列
   */
  private saveSyncQueue() {
    storage.setTempData('sync_queue', this.syncQueue)
  }

  /**
   * 清理同步队列
   */
  private cleanupSyncQueue() {
    // 移除已上传的项目
    this.syncQueue = this.syncQueue.filter(item => !item.id.startsWith('uploaded_'))
    this.saveSyncQueue()
  }

  /**
   * 标记项目为已上传
   */
  private markItemsAsUploaded(uploadedIds: string[]) {
    this.syncQueue = this.syncQueue.map(item => 
      uploadedIds.includes(item.id) 
        ? { ...item, id: 'uploaded_' + item.id }
        : item
    )
    this.saveSyncQueue()
  }

  /**
   * 处理上传冲突
   */
  private async handleUploadConflicts(conflicts: any[]) {
    // 处理上传时发现的冲突
    for (const conflict of conflicts) {
      console.warn('Upload conflict detected:', conflict)
      // 可以实现更复杂的冲突处理逻辑
    }
  }

  /**
   * 设置网络监控
   */
  private setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      
      window.addEventListener('online', () => {
        this.isOnline = true
        this.performSync() // 网络恢复时立即同步
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  /**
   * 启动自动同步
   */
  private startAutoSync() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
          this.performSync()
        }
      }, this.syncInterval)
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return {
      lastSync: this.lastSyncTime,
      pendingItems: this.syncQueue.length,
      conflicts: 0, // 需要实现冲突计数
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    }
  }

  /**
   * 强制同步
   */
  async forceSync(): Promise<boolean> {
    return await this.performSync()
  }
}

// 创建单例实例
export const cloudSync = new CloudSyncManager()

// 导出便捷方法
export const syncManager = {
  queuePreferenceSync: (action: 'create' | 'update' | 'delete', data: any) =>
    cloudSync.queueSync({ type: 'preference', action, data }),
  
  queueLayoutSync: (action: 'create' | 'update' | 'delete', data: any) =>
    cloudSync.queueSync({ type: 'layout', action, data }),
  
  queueFavoriteSync: (action: 'create' | 'update' | 'delete', data: any) =>
    cloudSync.queueSync({ type: 'favorite', action, data }),
  
  getStatus: () => cloudSync.getSyncStatus(),
  forceSync: () => cloudSync.forceSync()
}
