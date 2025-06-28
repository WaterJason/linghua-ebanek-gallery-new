"use client"

/**
 * 进度指示器系统
 * 
 * 为ERP系统提供详细的进度显示功能
 * 支持百分比进度、阶段显示、预估时间等
 */

import React from 'react'

// 进度状态定义
export interface ProgressState {
  id: string
  title: string
  description?: string
  progress: number // 0-100
  stage?: string // 当前阶段
  stages?: string[] // 所有阶段
  currentStage?: number // 当前阶段索引
  processed?: number // 已处理数量
  total?: number // 总数量
  startTime: Date
  estimatedEndTime?: Date
  canCancel: boolean
  status: 'running' | 'completed' | 'cancelled' | 'error'
  error?: string
}

// 进度更新回调
export type ProgressCallback = (progress: ProgressState) => void

// 进度管理器
class ProgressManager {
  private activeProgress: Map<string, ProgressState> = new Map()
  private listeners: Map<string, Set<ProgressCallback>> = new Map()
  private globalListeners: Set<(progresses: ProgressState[]) => void> = new Set()

  // 开始进度跟踪
  startProgress(config: {
    id: string
    title: string
    description?: string
    stages?: string[]
    total?: number
    canCancel?: boolean
  }): ProgressState {
    const progress: ProgressState = {
      id: config.id,
      title: config.title,
      description: config.description,
      progress: 0,
      stages: config.stages,
      currentStage: config.stages ? 0 : undefined,
      stage: config.stages?.[0],
      processed: 0,
      total: config.total,
      startTime: new Date(),
      canCancel: config.canCancel || false,
      status: 'running',
    }

    this.activeProgress.set(config.id, progress)
    this.notifyListeners(config.id, progress)
    this.notifyGlobalListeners()
    
    return progress
  }

  // 更新进度
  updateProgress(id: string, updates: Partial<ProgressState>) {
    const progress = this.activeProgress.get(id)
    if (!progress) return

    const updatedProgress = { ...progress, ...updates }
    
    // 自动计算进度百分比
    if (updates.processed !== undefined && progress.total) {
      updatedProgress.progress = Math.round((updates.processed / progress.total) * 100)
    }
    
    // 自动更新阶段
    if (updates.currentStage !== undefined && progress.stages) {
      updatedProgress.stage = progress.stages[updates.currentStage]
    }
    
    // 计算预估完成时间
    if (updatedProgress.progress > 0 && updatedProgress.progress < 100) {
      const elapsed = Date.now() - progress.startTime.getTime()
      const estimatedTotal = (elapsed / updatedProgress.progress) * 100
      updatedProgress.estimatedEndTime = new Date(progress.startTime.getTime() + estimatedTotal)
    }

    this.activeProgress.set(id, updatedProgress)
    this.notifyListeners(id, updatedProgress)
    this.notifyGlobalListeners()
  }

  // 完成进度
  completeProgress(id: string, success: boolean = true, error?: string) {
    const progress = this.activeProgress.get(id)
    if (!progress) return

    const updatedProgress: ProgressState = {
      ...progress,
      progress: 100,
      status: success ? 'completed' : 'error',
      error,
    }

    this.activeProgress.set(id, updatedProgress)
    this.notifyListeners(id, updatedProgress)
    this.notifyGlobalListeners()

    // 自动清理已完成的进度（延迟清理）
    setTimeout(() => {
      this.removeProgress(id)
    }, 5000)
  }

  // 取消进度
  cancelProgress(id: string) {
    const progress = this.activeProgress.get(id)
    if (!progress || !progress.canCancel) return

    const updatedProgress: ProgressState = {
      ...progress,
      status: 'cancelled',
    }

    this.activeProgress.set(id, updatedProgress)
    this.notifyListeners(id, updatedProgress)
    this.notifyGlobalListeners()

    // 自动清理已取消的进度
    setTimeout(() => {
      this.removeProgress(id)
    }, 2000)
  }

  // 移除进度
  removeProgress(id: string) {
    this.activeProgress.delete(id)
    this.listeners.delete(id)
    this.notifyGlobalListeners()
  }

  // 获取进度状态
  getProgress(id: string): ProgressState | undefined {
    return this.activeProgress.get(id)
  }

  // 获取所有活动进度
  getAllProgress(): ProgressState[] {
    return Array.from(this.activeProgress.values())
  }

  // 监听特定进度变化
  onProgressChange(id: string, callback: ProgressCallback) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set())
    }
    this.listeners.get(id)!.add(callback)

    // 返回取消监听的函数
    return () => {
      this.listeners.get(id)?.delete(callback)
    }
  }

  // 监听全局进度变化
  onGlobalProgressChange(callback: (progresses: ProgressState[]) => void) {
    this.globalListeners.add(callback)

    // 返回取消监听的函数
    return () => {
      this.globalListeners.delete(callback)
    }
  }

  // 通知特定进度监听器
  private notifyListeners(id: string, progress: ProgressState) {
    this.listeners.get(id)?.forEach(callback => callback(progress))
  }

  // 通知全局监听器
  private notifyGlobalListeners() {
    const progresses = this.getAllProgress()
    this.globalListeners.forEach(callback => callback(progresses))
  }
}

// 创建全局实例
export const progressManager = new ProgressManager()

// 便捷函数：包装带进度的异步操作
export async function withProgress<T>(
  config: {
    id: string
    title: string
    description?: string
    stages?: string[]
    canCancel?: boolean
  },
  operation: (updateProgress: (updates: Partial<ProgressState>) => void) => Promise<T>
): Promise<T> {
  const progress = progressManager.startProgress(config)
  
  try {
    const updateProgress = (updates: Partial<ProgressState>) => {
      progressManager.updateProgress(config.id, updates)
    }
    
    const result = await operation(updateProgress)
    progressManager.completeProgress(config.id, true)
    return result
  } catch (error) {
    progressManager.completeProgress(config.id, false, error instanceof Error ? error.message : String(error))
    throw error
  }
}

// 便捷函数：数据导入进度
export async function withImportProgress<T>(
  filename: string,
  operation: (updateProgress: (processed: number, total: number, currentItem?: string) => void) => Promise<T>
): Promise<T> {
  const progressId = `import_${Date.now()}`
  
  return withProgress({
    id: progressId,
    title: "数据导入",
    description: `正在导入文件：${filename}`,
    stages: ["读取文件", "验证数据", "保存数据", "完成导入"],
    canCancel: true,
  }, async (updateProgress) => {
    return operation((processed, total, currentItem) => {
      updateProgress({
        processed,
        total,
        description: currentItem ? `正在处理：${currentItem}` : undefined,
      })
    })
  })
}

// 便捷函数：报表生成进度
export async function withReportProgress<T>(
  reportName: string,
  operation: (updateProgress: (stage: number, description?: string) => void) => Promise<T>
): Promise<T> {
  const progressId = `report_${Date.now()}`
  
  return withProgress({
    id: progressId,
    title: "生成报表",
    description: `正在生成：${reportName}`,
    stages: ["收集数据", "计算统计", "生成图表", "渲染报表"],
    canCancel: false,
  }, async (updateProgress) => {
    return operation((stage, description) => {
      updateProgress({
        currentStage: stage,
        description,
      })
    })
  })
}

// 便捷函数：批量操作进度
export async function withBatchProgress<T>(
  operationName: string,
  items: any[],
  operation: (item: any, index: number, updateProgress: (processed: number) => void) => Promise<void>
): Promise<void> {
  const progressId = `batch_${Date.now()}`
  
  return withProgress({
    id: progressId,
    title: `批量${operationName}`,
    description: `共 ${items.length} 项待处理`,
    canCancel: true,
  }, async (updateProgress) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await operation(item, i, (processed) => {
        updateProgress({
          processed: processed || i + 1,
          total: items.length,
          description: `正在处理第 ${i + 1} 项，共 ${items.length} 项`,
        })
      })
    }
  })
}

// React Hook：使用进度状态
export function useProgress(id: string) {
  const [progress, setProgress] = React.useState<ProgressState | undefined>()
  
  React.useEffect(() => {
    const unsubscribe = progressManager.onProgressChange(id, setProgress)
    setProgress(progressManager.getProgress(id))
    return unsubscribe
  }, [id])
  
  return progress
}

// React Hook：使用全局进度状态
export function useGlobalProgress() {
  const [progresses, setProgresses] = React.useState<ProgressState[]>([])
  
  React.useEffect(() => {
    const unsubscribe = progressManager.onGlobalProgressChange(setProgresses)
    setProgresses(progressManager.getAllProgress())
    return unsubscribe
  }, [])
  
  return progresses
}
