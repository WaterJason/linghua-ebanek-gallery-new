"use client"

import React, { useState, useEffect } from 'react'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"

export interface OperationProgress {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error' | 'warning'
  progress: number
  startTime: Date
  endTime?: Date
  responseTime?: number
  details?: string
  metadata?: {
    recordsProcessed?: number
    totalRecords?: number
    apiCalls?: number
    cacheHits?: number
  }
}

interface OperationProgressProps {
  operations: OperationProgress[]
  showDetails?: boolean
  maxVisible?: number
}

export function OperationProgressTracker({ 
  operations, 
  showDetails = true, 
  maxVisible = 5 
}: OperationProgressProps) {
  const [visibleOperations, setVisibleOperations] = useState<OperationProgress[]>([])

  useEffect(() => {
    // 显示最近的操作，优先显示正在进行的操作
    const sortedOps = [...operations]
      .sort((a, b) => {
        // 正在进行的操作优先
        if (a.status === 'running' && b.status !== 'running') return -1
        if (b.status === 'running' && a.status !== 'running') return 1
        // 然后按时间排序
        return b.startTime.getTime() - a.startTime.getTime()
      })
      .slice(0, maxVisible)
    
    setVisibleOperations(sortedOps)
  }, [operations, maxVisible])

  const getStatusIcon = (status: OperationProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: OperationProgress['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'running':
        return 'default'
      case 'success':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - startTime.getTime()
    
    if (duration < 1000) {
      return `${duration}ms`
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`
    } else {
      return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
    }
  }

  if (visibleOperations.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          操作进度监控
          <Badge variant="outline" className="ml-auto">
            {operations.filter(op => op.status === 'running').length} 进行中
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleOperations.map((operation) => (
          <div key={operation.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(operation.status)}
                <span className="text-sm font-medium">{operation.name}</span>
                <Badge variant={getStatusColor(operation.status)} className="text-xs">
                  {operation.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDuration(operation.startTime, operation.endTime)}
              </div>
            </div>

            {operation.status === 'running' && (
              <Progress value={operation.progress} className="h-2" />
            )}

            {showDetails && (operation.details || operation.metadata) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {operation.details && (
                  <div>{operation.details}</div>
                )}
                {operation.metadata && (
                  <div className="flex gap-4">
                    {operation.metadata.recordsProcessed !== undefined && (
                      <span>
                        记录: {operation.metadata.recordsProcessed}
                        {operation.metadata.totalRecords && `/${operation.metadata.totalRecords}`}
                      </span>
                    )}
                    {operation.metadata.apiCalls !== undefined && (
                      <span>API调用: {operation.metadata.apiCalls}</span>
                    )}
                    {operation.metadata.cacheHits !== undefined && (
                      <span>缓存命中: {operation.metadata.cacheHits}</span>
                    )}
                    {operation.responseTime !== undefined && (
                      <span 
                        className={operation.responseTime > 120 ? 'text-yellow-600' : 'text-green-600'}
                      >
                        响应: {operation.responseTime}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {operations.length > maxVisible && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            还有 {operations.length - maxVisible} 个操作未显示
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 操作进度管理器
class OperationProgressManager {
  private operations: Map<string, OperationProgress> = new Map()
  private listeners: Set<(operations: OperationProgress[]) => void> = new Set()

  // 开始操作
  startOperation(id: string, name: string, totalRecords?: number): void {
    const operation: OperationProgress = {
      id,
      name,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      metadata: totalRecords ? { totalRecords } : undefined
    }
    
    this.operations.set(id, operation)
    this.notifyListeners()
  }

  // 更新进度
  updateProgress(id: string, progress: number, details?: string, metadata?: Partial<OperationProgress['metadata']>): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.progress = Math.min(100, Math.max(0, progress))
      if (details) operation.details = details
      if (metadata) {
        operation.metadata = { ...operation.metadata, ...metadata }
      }
      this.notifyListeners()
    }
  }

  // 完成操作
  completeOperation(id: string, status: 'success' | 'error' | 'warning', responseTime?: number, details?: string): void {
    const operation = this.operations.get(id)
    if (operation) {
      operation.status = status
      operation.progress = 100
      operation.endTime = new Date()
      operation.responseTime = responseTime
      if (details) operation.details = details
      this.notifyListeners()

      // 5秒后自动清理成功的操作
      if (status === 'success') {
        setTimeout(() => {
          this.operations.delete(id)
          this.notifyListeners()
        }, 5000)
      }
    }
  }

  // 获取所有操作
  getOperations(): OperationProgress[] {
    return Array.from(this.operations.values())
  }

  // 清理操作
  clearOperation(id: string): void {
    this.operations.delete(id)
    this.notifyListeners()
  }

  // 清理所有操作
  clearAll(): void {
    this.operations.clear()
    this.notifyListeners()
  }

  // 添加监听器
  addListener(listener: (operations: OperationProgress[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // 通知监听器
  private notifyListeners(): void {
    const operations = this.getOperations()
    this.listeners.forEach(listener => listener(operations))
  }
}

// 全局实例
export const operationProgressManager = new OperationProgressManager()

// React Hook
export function useOperationProgress() {
  const [operations, setOperations] = useState<OperationProgress[]>([])

  useEffect(() => {
    const unsubscribe = operationProgressManager.addListener(setOperations)
    setOperations(operationProgressManager.getOperations())
    return unsubscribe
  }, [])

  return {
    operations,
    startOperation: (id: string, name: string, totalRecords?: number) => 
      operationProgressManager.startOperation(id, name, totalRecords),
    updateProgress: (id: string, progress: number, details?: string, metadata?: any) =>
      operationProgressManager.updateProgress(id, progress, details, metadata),
    completeOperation: (id: string, status: 'success' | 'error' | 'warning', responseTime?: number, details?: string) =>
      operationProgressManager.completeOperation(id, status, responseTime, details),
    clearOperation: (id: string) => operationProgressManager.clearOperation(id),
    clearAll: () => operationProgressManager.clearAll()
  }
}
