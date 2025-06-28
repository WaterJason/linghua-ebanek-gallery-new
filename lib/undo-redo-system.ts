"use client"

/**
 * 撤销/重做系统
 *
 * 为ERP系统提供完整的撤销/重做功能
 * 支持表单数据、批量操作、状态变更等的撤销
 */

import { toast } from "@/hooks/use-toast"

// 操作类型定义
export interface UndoRedoAction {
  id: string
  type: 'form' | 'batch' | 'status' | 'create' | 'update' | 'delete'
  module: string // 模块名称：products, orders, employees等
  description: string // 操作描述
  timestamp: Date
  data: {
    before?: any // 操作前的数据
    after?: any // 操作后的数据
    context?: any // 上下文信息
  }
  undoFunction: () => Promise<void> // 撤销函数
  redoFunction: () => Promise<void> // 重做函数
  canUndo: boolean // 是否可以撤销
  requiresConfirmation?: boolean // 是否需要确认
  // 高级撤销功能字段
  parentId?: string // 父操作ID，用于分支撤销
  branchId?: string // 分支ID
  dependencies?: string[] // 依赖的操作ID
  tags?: string[] // 标签，用于分类和筛选
  priority?: number // 优先级 (1-10)
  groupId?: string // 操作组ID，用于批量撤销
}

// 撤销分支定义
export interface UndoBranch {
  id: string
  name: string
  description: string
  createdAt: Date
  actions: UndoRedoAction[]
  parentBranchId?: string
}

// 选择性撤销选项
export interface SelectiveUndoOptions {
  actionIds: string[]
  skipDependencies?: boolean
  createBranch?: boolean
  branchName?: string
}

// 撤销/重做管理器
class UndoRedoManager {
  private undoStack: UndoRedoAction[] = []
  private redoStack: UndoRedoAction[] = []
  private maxHistorySize = 10
  private storageKey = 'erp_undo_redo_history'
  private listeners: Set<() => void> = new Set()
  // 高级功能相关
  private branches: Map<string, UndoBranch> = new Map()
  private currentBranchId = 'main'
  private actionGroups: Map<string, UndoRedoAction[]> = new Map()

  constructor() {
    this.loadFromStorage()
    this.setupKeyboardShortcuts()
    this.initializeMainBranch()
  }

  // 初始化主分支
  private initializeMainBranch() {
    if (!this.branches.has('main')) {
      this.branches.set('main', {
        id: 'main',
        name: '主分支',
        description: '默认操作分支',
        createdAt: new Date(),
        actions: []
      })
    }
  }

  // 添加操作到撤销栈
  addAction(action: UndoRedoAction) {
    // 清空重做栈
    this.redoStack = []

    // 添加到撤销栈
    this.undoStack.push(action)

    // 限制历史记录大小
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }

    this.saveToStorage()
    this.notifyListeners()

    // 显示操作确认
    toast({
      title: "操作已记录",
      description: `${action.description}（可撤销）`,
      duration: 2000,
    })
  }

  // 撤销操作
  async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) {
      toast({
        title: "无法撤销",
        description: "没有可撤销的操作",
        variant: "destructive",
      })
      return false
    }

    const action = this.undoStack.pop()!

    // 检查是否需要确认
    if (action.requiresConfirmation) {
      const confirmed = await this.showConfirmDialog(
        `确认撤销操作：${action.description}？`,
        "此操作可能影响相关数据，请谨慎操作。"
      )
      if (!confirmed) {
        this.undoStack.push(action) // 放回栈中
        return false
      }
    }

    try {
      await action.undoFunction()
      this.redoStack.push(action)
      this.saveToStorage()
      this.notifyListeners()

      toast({
        title: "撤销成功",
        description: `已撤销：${action.description}`,
      })
      return true
    } catch (error) {
      console.error('Undo failed:', error)
      this.undoStack.push(action) // 放回栈中
      toast({
        title: "撤销失败",
        description: error instanceof Error ? error.message : "撤销操作时发生错误",
        variant: "destructive",
      })
      return false
    }
  }

  // 重做操作
  async redo(): Promise<boolean> {
    if (this.redoStack.length === 0) {
      toast({
        title: "无法重做",
        description: "没有可重做的操作",
        variant: "destructive",
      })
      return false
    }

    const action = this.redoStack.pop()!

    try {
      await action.redoFunction()
      this.undoStack.push(action)
      this.saveToStorage()
      this.notifyListeners()

      toast({
        title: "重做成功",
        description: `已重做：${action.description}`,
      })
      return true
    } catch (error) {
      console.error('Redo failed:', error)
      this.redoStack.push(action) // 放回栈中
      toast({
        title: "重做失败",
        description: error instanceof Error ? error.message : "重做操作时发生错误",
        variant: "destructive",
      })
      return false
    }
  }

  // 获取撤销栈状态
  getUndoStack(): UndoRedoAction[] {
    return [...this.undoStack]
  }

  // 获取重做栈状态
  getRedoStack(): UndoRedoAction[] {
    return [...this.redoStack]
  }

  // 检查是否可以撤销
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  // 检查是否可以重做
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  // 清空历史记录
  clear() {
    this.undoStack = []
    this.redoStack = []
    this.saveToStorage()
    this.notifyListeners()
  }

  // 添加状态变化监听器
  addListener(listener: () => void) {
    this.listeners.add(listener)
  }

  // 移除状态变化监听器
  removeListener(listener: () => void) {
    this.listeners.delete(listener)
  }

  // 通知所有监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  // 保存到本地存储
  private saveToStorage() {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      const data = {
        undoStack: this.undoStack.map(action => ({
          ...action,
          undoFunction: undefined, // 不保存函数
          redoFunction: undefined,
        })),
        redoStack: this.redoStack.map(action => ({
          ...action,
          undoFunction: undefined,
          redoFunction: undefined,
        })),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save undo/redo history to storage:', error)
    }
  }

  // 从本地存储加载
  private loadFromStorage() {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      const data = localStorage.getItem(this.storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        // 注意：从存储加载的操作无法执行，只用于显示历史
        // 实际的撤销/重做功能需要重新注册
      }
    } catch (error) {
      console.warn('Failed to load undo/redo history from storage:', error)
    }
  }

  // 设置键盘快捷键
  private setupKeyboardShortcuts() {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          this.undo()
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault()
          this.redo()
        }
      })
    }
  }

  // 显示确认对话框
  private async showConfirmDialog(title: string, description: string): Promise<boolean> {
    return new Promise((resolve) => {
      // 这里应该显示一个确认对话框
      // 暂时使用浏览器原生确认框
      const result = confirm(`${title}\n\n${description}`)
      resolve(result)
    })
  }
}

// 创建全局实例
export const undoRedoManager = new UndoRedoManager()

// 便捷函数：创建表单操作
export function createFormAction(
  module: string,
  description: string,
  beforeData: any,
  afterData: any,
  undoFn: () => Promise<void>,
  redoFn: () => Promise<void>
): UndoRedoAction {
  return {
    id: `${module}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'form',
    module,
    description,
    timestamp: new Date(),
    data: {
      before: beforeData,
      after: afterData,
    },
    undoFunction: undoFn,
    redoFunction: redoFn,
    canUndo: true,
  }
}

// 便捷函数：创建批量操作
export function createBatchAction(
  module: string,
  description: string,
  items: any[],
  undoFn: () => Promise<void>,
  redoFn: () => Promise<void>
): UndoRedoAction {
  return {
    id: `${module}_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'batch',
    module,
    description,
    timestamp: new Date(),
    data: {
      context: { items, count: items.length },
    },
    undoFunction: undoFn,
    redoFunction: redoFn,
    canUndo: true,
  }
}

// 扩展 UndoRedoManager 类以支持高级功能
declare module './undo-redo-system' {
  interface UndoRedoManager {
    // 分支撤销功能
    createBranch(name: string, description?: string, parentBranchId?: string): string
    switchBranch(branchId: string): boolean
    getBranches(): UndoBranch[]
    getCurrentBranch(): UndoBranch | undefined
    mergeBranch(sourceBranchId: string, targetBranchId: string): boolean
    deleteBranch(branchId: string): boolean

    // 选择性撤销功能
    selectiveUndo(options: SelectiveUndoOptions): Promise<boolean>
    undoByTag(tag: string): Promise<boolean>
    undoByModule(module: string): Promise<boolean>
    undoGroup(groupId: string): Promise<boolean>

    // 依赖管理
    checkDependencies(actionId: string): string[]
    resolveDependencies(actionIds: string[]): string[]

    // 高级查询
    findActions(filter: Partial<UndoRedoAction>): UndoRedoAction[]
    getActionsByTimeRange(startTime: Date, endTime: Date): UndoRedoAction[]
    getActionsByPriority(minPriority: number): UndoRedoAction[]
  }
}
