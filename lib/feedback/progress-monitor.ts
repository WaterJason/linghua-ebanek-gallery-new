// 阶段4操作反馈增强 - 进度监控器
// 提供实时进度更新、时间预估、可取消操作等功能

import { 
  ProgressInfo, 
  ProgressOptions, 
  ProgressUpdate, 
  ProgressEvent 
} from '@/lib/types/feedback-types'

export class ProgressMonitor {
  private progressMap: Map<string, ProgressInfo>
  private subscribers: Set<(event: ProgressEvent) => void>
  private speedCalculators: Map<string, SpeedCalculator>

  constructor() {
    this.progressMap = new Map()
    this.subscribers = new Set()
    this.speedCalculators = new Map()
  }

  /**
   * 开始进度监控
   */
  startProgress(options: ProgressOptions): string {
    const id = this.generateId()
    const now = Date.now()
    
    const progressInfo: ProgressInfo = {
      id,
      title: options.title,
      current: 0,
      total: options.total,
      percentage: 0,
      status: 'running',
      startTime: now,
      message: '开始处理...'
    }

    this.progressMap.set(id, progressInfo)
    this.speedCalculators.set(id, new SpeedCalculator())

    this.notifySubscribers({
      type: 'start',
      progressId: id,
      timestamp: now
    })

    return id
  }

  /**
   * 更新进度
   */
  updateProgress(id: string, update: ProgressUpdate): void {
    const progress = this.progressMap.get(id)
    if (!progress || progress.status !== 'running') {
      return
    }

    const now = Date.now()
    const speedCalc = this.speedCalculators.get(id)!
    
    // 更新基本信息
    progress.current = update.current
    progress.percentage = Math.min((update.current / progress.total) * 100, 100)
    progress.message = update.message || progress.message

    // 计算速度和预估时间
    speedCalc.addDataPoint(update.current, now)
    progress.speed = speedCalc.getCurrentSpeed()
    
    if (progress.speed && progress.speed > 0) {
      const remaining = progress.total - progress.current
      progress.remainingTime = (remaining / progress.speed) * 1000 // 转换为毫秒
      progress.estimatedEndTime = now + progress.remainingTime
    }

    // 更新详细信息
    if (update.details) {
      progress.details = { ...progress.details, ...update.details }
    }

    this.progressMap.set(id, progress)

    this.notifySubscribers({
      type: 'update',
      progressId: id,
      data: update,
      timestamp: now
    })
  }

  /**
   * 完成进度
   */
  completeProgress(id: string, message?: string): void {
    const progress = this.progressMap.get(id)
    if (!progress) {
      return
    }

    progress.status = 'completed'
    progress.current = progress.total
    progress.percentage = 100
    progress.message = message || '处理完成'
    progress.remainingTime = 0

    this.progressMap.set(id, progress)
    this.speedCalculators.delete(id)

    this.notifySubscribers({
      type: 'complete',
      progressId: id,
      data: message,
      timestamp: Date.now()
    })

    // 自动清理完成的进度（延迟3秒）
    setTimeout(() => {
      this.progressMap.delete(id)
    }, 3000)
  }

  /**
   * 取消进度
   */
  cancelProgress(id: string): void {
    const progress = this.progressMap.get(id)
    if (!progress) {
      return
    }

    progress.status = 'cancelled'
    progress.message = '操作已取消'

    this.progressMap.set(id, progress)
    this.speedCalculators.delete(id)

    this.notifySubscribers({
      type: 'cancel',
      progressId: id,
      timestamp: Date.now()
    })

    // 自动清理取消的进度（延迟1秒）
    setTimeout(() => {
      this.progressMap.delete(id)
    }, 1000)
  }

  /**
   * 标记进度失败
   */
  failProgress(id: string, error: string): void {
    const progress = this.progressMap.get(id)
    if (!progress) {
      return
    }

    progress.status = 'failed'
    progress.message = `处理失败: ${error}`

    this.progressMap.set(id, progress)
    this.speedCalculators.delete(id)

    this.notifySubscribers({
      type: 'error',
      progressId: id,
      data: error,
      timestamp: Date.now()
    })
  }

  /**
   * 获取进度信息
   */
  getProgress(id: string): ProgressInfo | undefined {
    return this.progressMap.get(id)
  }

  /**
   * 获取所有活跃的进度
   */
  getActiveProgress(): ProgressInfo[] {
    return Array.from(this.progressMap.values())
      .filter(progress => progress.status === 'running')
      .sort((a, b) => b.startTime - a.startTime)
  }

  /**
   * 获取所有进度
   */
  getAllProgress(): ProgressInfo[] {
    return Array.from(this.progressMap.values())
      .sort((a, b) => b.startTime - a.startTime)
  }

  /**
   * 订阅进度事件
   */
  subscribe(callback: (event: ProgressEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 批量进度监控
   */
  createBatchProgress(title: string, items: any[]): string {
    const id = this.startProgress({
      title,
      total: items.length,
      cancellable: true
    })

    return id
  }

  /**
   * 文件上传进度监控
   */
  createFileUploadProgress(fileName: string, fileSize: number): string {
    return this.startProgress({
      title: `上传文件: ${fileName}`,
      total: fileSize,
      showETA: true,
      showSpeed: true,
      cancellable: true
    })
  }

  /**
   * 数据导入进度监控
   */
  createDataImportProgress(dataType: string, recordCount: number): string {
    return this.startProgress({
      title: `导入${dataType}数据`,
      total: recordCount,
      showETA: true,
      cancellable: true
    })
  }

  /**
   * 报表生成进度监控
   */
  createReportProgress(reportName: string): string {
    return this.startProgress({
      title: `生成${reportName}报表`,
      total: 100, // 使用百分比
      showETA: true,
      cancellable: false
    })
  }

  /**
   * 清理所有进度
   */
  clearAll(): void {
    this.progressMap.clear()
    this.speedCalculators.clear()
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(event: ProgressEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in progress subscriber:', error)
      }
    })
  }
}

/**
 * 速度计算器
 */
class SpeedCalculator {
  private dataPoints: Array<{ value: number; timestamp: number }>
  private maxPoints: number

  constructor(maxPoints: number = 10) {
    this.dataPoints = []
    this.maxPoints = maxPoints
  }

  addDataPoint(value: number, timestamp: number): void {
    this.dataPoints.push({ value, timestamp })
    
    // 保持数据点数量在限制内
    if (this.dataPoints.length > this.maxPoints) {
      this.dataPoints.shift()
    }
  }

  getCurrentSpeed(): number {
    if (this.dataPoints.length < 2) {
      return 0
    }

    const recent = this.dataPoints.slice(-5) // 使用最近5个数据点
    if (recent.length < 2) {
      return 0
    }

    const first = recent[0]
    const last = recent[recent.length - 1]
    
    const valueDiff = last.value - first.value
    const timeDiff = (last.timestamp - first.timestamp) / 1000 // 转换为秒

    return timeDiff > 0 ? valueDiff / timeDiff : 0
  }

  getAverageSpeed(): number {
    if (this.dataPoints.length < 2) {
      return 0
    }

    const first = this.dataPoints[0]
    const last = this.dataPoints[this.dataPoints.length - 1]
    
    const valueDiff = last.value - first.value
    const timeDiff = (last.timestamp - first.timestamp) / 1000

    return timeDiff > 0 ? valueDiff / timeDiff : 0
  }
}

// 全局实例
export const progressMonitor = new ProgressMonitor()

// 工具函数
export function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return '< 1秒'
  }

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

export function formatSpeed(speed: number, unit: string = '项'): string {
  if (speed < 1) {
    return `${(speed * 60).toFixed(1)} ${unit}/分钟`
  } else {
    return `${speed.toFixed(1)} ${unit}/秒`
  }
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
