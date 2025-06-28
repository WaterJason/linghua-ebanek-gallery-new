"use client"

import { UndoRedoAction, UndoBranch, SelectiveUndoOptions, undoRedoManager } from './undo-redo-system'
import { toast } from "@/hooks/use-toast"

/**
 * 高级撤销功能扩展
 * 
 * 为撤销系统添加分支撤销、选择性撤销等高级功能
 */

class AdvancedUndoManager {
  private branches: Map<string, UndoBranch> = new Map()
  private currentBranchId = 'main'
  private actionGroups: Map<string, UndoRedoAction[]> = new Map()

  constructor() {
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

  /**
   * 创建新分支
   */
  createBranch(name: string, description: string = '', parentBranchId: string = 'main'): string {
    const branchId = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const parentBranch = this.branches.get(parentBranchId)
    if (!parentBranch) {
      throw new Error(`父分支不存在: ${parentBranchId}`)
    }

    const newBranch: UndoBranch = {
      id: branchId,
      name,
      description,
      createdAt: new Date(),
      actions: [...parentBranch.actions], // 复制父分支的操作
      parentBranchId
    }

    this.branches.set(branchId, newBranch)
    
    toast({
      title: "分支已创建",
      description: `新分支 "${name}" 已创建`,
    })

    return branchId
  }

  /**
   * 切换分支
   */
  switchBranch(branchId: string): boolean {
    const branch = this.branches.get(branchId)
    if (!branch) {
      toast({
        title: "切换失败",
        description: `分支不存在: ${branchId}`,
        variant: "destructive",
      })
      return false
    }

    this.currentBranchId = branchId
    
    toast({
      title: "分支已切换",
      description: `已切换到分支: ${branch.name}`,
    })

    return true
  }

  /**
   * 获取所有分支
   */
  getBranches(): UndoBranch[] {
    return Array.from(this.branches.values())
  }

  /**
   * 获取当前分支
   */
  getCurrentBranch(): UndoBranch | undefined {
    return this.branches.get(this.currentBranchId)
  }

  /**
   * 选择性撤销
   */
  async selectiveUndo(options: SelectiveUndoOptions): Promise<boolean> {
    const { actionIds, skipDependencies = false, createBranch = false, branchName } = options

    // 检查依赖关系
    if (!skipDependencies) {
      const allActionIds = this.resolveDependencies(actionIds)
      if (allActionIds.length > actionIds.length) {
        const confirmed = await this.showConfirmDialog(
          '发现依赖操作',
          `需要同时撤销 ${allActionIds.length - actionIds.length} 个依赖操作，是否继续？`
        )
        if (!confirmed) {
          return false
        }
        options.actionIds = allActionIds
      }
    }

    // 创建分支（如果需要）
    if (createBranch && branchName) {
      this.createBranch(branchName, `选择性撤销分支: ${new Date().toLocaleString()}`)
    }

    try {
      const undoStack = undoRedoManager.getUndoStack()
      const actionsToUndo = undoStack.filter(action => actionIds.includes(action.id))

      // 按时间倒序撤销
      actionsToUndo.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      for (const action of actionsToUndo) {
        await action.undoFunction()
      }

      toast({
        title: "选择性撤销成功",
        description: `已撤销 ${actionsToUndo.length} 个操作`,
      })

      return true
    } catch (error) {
      toast({
        title: "选择性撤销失败",
        description: error instanceof Error ? error.message : "撤销过程中发生错误",
        variant: "destructive",
      })
      return false
    }
  }

  /**
   * 按标签撤销
   */
  async undoByTag(tag: string): Promise<boolean> {
    const undoStack = undoRedoManager.getUndoStack()
    const taggedActions = undoStack.filter(action => action.tags?.includes(tag))

    if (taggedActions.length === 0) {
      toast({
        title: "没有找到操作",
        description: `没有找到标签为 "${tag}" 的操作`,
        variant: "destructive",
      })
      return false
    }

    return this.selectiveUndo({
      actionIds: taggedActions.map(action => action.id)
    })
  }

  /**
   * 按模块撤销
   */
  async undoByModule(module: string): Promise<boolean> {
    const undoStack = undoRedoManager.getUndoStack()
    const moduleActions = undoStack.filter(action => action.module === module)

    if (moduleActions.length === 0) {
      toast({
        title: "没有找到操作",
        description: `没有找到模块 "${module}" 的操作`,
        variant: "destructive",
      })
      return false
    }

    return this.selectiveUndo({
      actionIds: moduleActions.map(action => action.id)
    })
  }

  /**
   * 检查依赖关系
   */
  checkDependencies(actionId: string): string[] {
    const undoStack = undoRedoManager.getUndoStack()
    const action = undoStack.find(a => a.id === actionId)
    
    if (!action || !action.dependencies) {
      return []
    }

    return action.dependencies.filter(depId => 
      undoStack.some(a => a.id === depId)
    )
  }

  /**
   * 解析依赖关系
   */
  resolveDependencies(actionIds: string[]): string[] {
    const resolved = new Set(actionIds)
    const undoStack = undoRedoManager.getUndoStack()
    
    let changed = true
    while (changed) {
      changed = false
      
      for (const actionId of Array.from(resolved)) {
        const dependencies = this.checkDependencies(actionId)
        for (const depId of dependencies) {
          if (!resolved.has(depId)) {
            resolved.add(depId)
            changed = true
          }
        }
      }
    }

    return Array.from(resolved)
  }

  /**
   * 显示确认对话框
   */
  private async showConfirmDialog(title: string, description: string): Promise<boolean> {
    return new Promise((resolve) => {
      const result = confirm(`${title}\n\n${description}`)
      resolve(result)
    })
  }

  /**
   * 添加操作到组
   */
  addToGroup(groupId: string, action: UndoRedoAction): void {
    if (!this.actionGroups.has(groupId)) {
      this.actionGroups.set(groupId, [])
    }
    
    this.actionGroups.get(groupId)!.push(action)
  }

  /**
   * 创建操作组
   */
  createGroup(groupId: string, actions: UndoRedoAction[]): void {
    this.actionGroups.set(groupId, [...actions])
  }
}

// 创建全局实例
export const advancedUndoManager = new AdvancedUndoManager()

// 便捷函数：创建带高级功能的操作
export function createAdvancedAction(
  baseAction: Omit<UndoRedoAction, 'id' | 'timestamp'>,
  options: {
    parentId?: string
    branchId?: string
    dependencies?: string[]
    tags?: string[]
    priority?: number
    groupId?: string
  } = {}
): UndoRedoAction {
  const action: UndoRedoAction = {
    id: `${baseAction.module}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...baseAction,
    ...options
  }

  // 添加到组（如果指定）
  if (options.groupId) {
    advancedUndoManager.addToGroup(options.groupId, action)
  }

  return action
}
