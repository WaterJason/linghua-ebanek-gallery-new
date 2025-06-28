/**
 * 操作历史管理器 - 支持撤销/重做功能
 * 与API架构集成，支持复杂操作序列
 */

import React from 'react'

export interface OperationStep {
  id: string
  type: 'create' | 'update' | 'delete' | 'batch'
  entity: 'product' | 'category'
  timestamp: Date
  description: string
  data: {
    before?: any
    after?: any
    ids?: number[]
    apiEndpoint: string
    method: string
    payload?: any
  }
  undoAction?: () => Promise<void>
  redoAction?: () => Promise<void>
}

export interface OperationGroup {
  id: string
  name: string
  steps: OperationStep[]
  timestamp: Date
  completed: boolean
}

class OperationHistoryManager {
  private history: OperationGroup[] = []
  private currentIndex: number = -1
  private maxHistorySize: number = 50
  private listeners: Set<() => void> = new Set()

  // 添加操作组
  addOperationGroup(group: OperationGroup) {
    // 如果当前不在历史末尾，删除后续历史
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    // 添加新操作组
    this.history.push(group)
    this.currentIndex = this.history.length - 1

    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize)
      this.currentIndex = this.history.length - 1
    }

    this.notifyListeners()
  }

  // 创建产品操作
  createProductOperation(
    type: 'create' | 'update' | 'delete',
    productData: any,
    beforeData?: any
  ): OperationGroup {
    const operationId = `product_${type}_${Date.now()}`

    let undoAction: () => Promise<void>
    let redoAction: () => Promise<void>
    let description: string

    switch (type) {
      case 'create':
        description = `创建产品: ${artworkData.name}`
        undoAction = async () => {
          await fetch(`/api/products/${artworkData.id}`, { method: 'DELETE' })
        }
        redoAction = async () => {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          })
        }
        break

      case 'update':
        description = `更新产品: ${artworkData.name}`
        undoAction = async () => {
          await fetch(`/api/products/${artworkData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(beforeData)
          })
        }
        redoAction = async () => {
          await fetch(`/api/products/${artworkData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          })
        }
        break

      case 'delete':
        description = `删除产品: ${beforeData.name}`
        undoAction = async () => {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(beforeData)
          })
        }
        redoAction = async () => {
          await fetch(`/api/products/${beforeData.id}`, { method: 'DELETE' })
        }
        break
    }

    const step: OperationStep = {
      id: `${operationId}_step_1`,
      type,
      entity: 'product',
      timestamp: new Date(),
      description,
      data: {
        before: beforeData,
        after: productData,
        apiEndpoint: type === 'create' ? '/api/products' : `/api/products/${artworkData.id || beforeData.id}`,
        method: type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE',
        payload: type === 'delete' ? undefined : productData
      },
      undoAction,
      redoAction
    }

    return {
      id: operationId,
      name: description,
      steps: [step],
      timestamp: new Date(),
      completed: true
    }
  }

  // 创建批量操作
  createBatchOperation(
    type: 'batch_update' | 'batch_delete',
    ids: number[],
    updateData?: any,
    beforeData?: any[]
  ): OperationGroup {
    const operationId = `batch_${type}_${Date.now()}`

    let undoAction: () => Promise<void>
    let redoAction: () => Promise<void>
    let description: string

    switch (type) {
      case 'batch_update':
        description = `批量更新 ${ids.length} 个产品`
        undoAction = async () => {
          // 恢复每个产品的原始数据
          if (beforeData) {
            for (const originalProduct of beforeData) {
              await fetch(`/api/products/${originalProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(originalProduct)
              })
            }
          }
        }
        redoAction = async () => {
          await fetch('/api/products/batch-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, fields: updateData })
          })
        }
        break

      case 'batch_delete':
        description = `批量删除 ${ids.length} 个产品`
        undoAction = async () => {
          // 重新创建所有删除的产品
          if (beforeData) {
            for (const artwork of beforeData) {
              await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
              })
            }
          }
        }
        redoAction = async () => {
          for (const id of ids) {
            await fetch(`/api/products/${id}`, { method: 'DELETE' })
          }
        }
        break
    }

    const step: OperationStep = {
      id: `${operationId}_step_1`,
      type: 'batch',
      entity: 'product',
      timestamp: new Date(),
      description,
      data: {
        before: beforeData,
        after: updateData,
        ids,
        apiEndpoint: type === 'batch_update' ? '/api/products/batch-update' : '/api/products/batch-delete',
        method: 'POST',
        payload: type === 'batch_update' ? { ids, fields: updateData } : { ids }
      },
      undoAction,
      redoAction
    }

    return {
      id: operationId,
      name: description,
      steps: [step],
      timestamp: new Date(),
      completed: true
    }
  }

  // 撤销操作
  async undo(): Promise<boolean> {
    if (!this.canUndo()) return false

    const operation = this.history[this.currentIndex]

    try {
      // 执行撤销操作
      for (const step of operation.steps.reverse()) {
        if (step.undoAction) {
          await step.undoAction()
        }
      }

      this.currentIndex--
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Undo operation failed:', error)
      return false
    }
  }

  // 重做操作
  async redo(): Promise<boolean> {
    if (!this.canRedo()) return false

    this.currentIndex++
    const operation = this.history[this.currentIndex]

    try {
      // 执行重做操作
      for (const step of operation.steps) {
        if (step.redoAction) {
          await step.redoAction()
        }
      }

      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Redo operation failed:', error)
      this.currentIndex--
      return false
    }
  }

  // 检查是否可以撤销
  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  // 检查是否可以重做
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  // 获取历史记录
  getHistory(): OperationGroup[] {
    return [...this.history]
  }

  // 获取当前状态
  getCurrentState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      historyLength: this.history.length,
      currentOperation: this.currentIndex >= 0 ? this.history[this.currentIndex] : null,
      nextOperation: this.currentIndex < this.history.length - 1 ? this.history[this.currentIndex + 1] : null
    }
  }

  // 清空历史
  clear() {
    this.history = []
    this.currentIndex = -1
    this.notifyListeners()
  }

  // 添加监听器
  addListener(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // 通知监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }
}

// 全局实例
export const operationHistory = new OperationHistoryManager()

// React Hook
export function useOperationHistory() {
  const [state, setState] = React.useState(operationHistory.getCurrentState())

  React.useEffect(() => {
    const unsubscribe = operationHistory.addListener(() => {
      setState(operationHistory.getCurrentState())
    })
    return unsubscribe
  }, [])

  return {
    ...state,
    undo: () => operationHistory.undo(),
    redo: () => operationHistory.redo(),
    clear: () => operationHistory.clear(),
    addOperation: (operation: OperationGroup) => operationHistory.addOperationGroup(operation),
    createProductOperation: (type: any, productData: any, beforeData?: any) =>
      operationHistory.createProductOperation(type, artworkData, beforeData),
    createBatchOperation: (type: any, ids: number[], updateData?: any, beforeData?: any[]) =>
      operationHistory.createBatchOperation(type, ids, updateData, beforeData)
  }
}
