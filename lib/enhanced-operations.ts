"use client"

/**
 * 增强操作工具函数
 * 
 * 为ERP系统提供统一的操作增强功能
 * 包括撤销/重做、反馈、进度等功能的便捷包装器
 */

import { 
  withFormFeedback, 
  withDeleteFeedback, 
  withBatchFeedback,
  feedbackManager 
} from "@/lib/feedback-system"
import { 
  withProgress, 
  withImportProgress, 
  withReportProgress,
  withBatchProgress 
} from "@/lib/progress-system"
import { 
  undoRedoManager, 
  createFormAction, 
  createBatchAction 
} from "@/lib/undo-redo-system"

// 通用操作类型定义
export interface EnhancedOperationConfig {
  module: string
  operationType: 'create' | 'update' | 'delete' | 'batch' | 'import' | 'export' | 'report'
  itemName: string
  requiresConfirmation?: boolean
  canUndo?: boolean
  showProgress?: boolean
}

// 增强的表单操作
export async function enhancedFormOperation<T>(
  config: EnhancedOperationConfig,
  operation: () => Promise<T>,
  beforeData?: any,
  afterData?: any
): Promise<T> {
  const operationId = `${config.module}_${config.operationType}_${Date.now()}`
  
  return withFormFeedback(
    operationId,
    async () => {
      const result = await operation()
      
      // 如果支持撤销，创建撤销操作
      if (config.canUndo !== false && beforeData && afterData) {
        const undoAction = createFormAction(
          config.module,
          `${config.operationType === 'create' ? '创建' : '更新'}${config.itemName}`,
          beforeData,
          afterData,
          async () => {
            // 这里需要具体的撤销逻辑，由调用方提供
            console.log('Undo operation for:', config.itemName)
          },
          async () => {
            // 重做逻辑
            console.log('Redo operation for:', config.itemName)
          }
        )
        undoRedoManager.addAction(undoAction)
      }
      
      return result
    },
    config.itemName
  )
}

// 增强的删除操作
export async function enhancedDeleteOperation<T>(
  config: EnhancedOperationConfig,
  operation: () => Promise<T>,
  deletedData?: any
): Promise<T> {
  return withDeleteFeedback(
    async () => {
      const result = await operation()
      
      // 如果支持撤销，创建撤销操作
      if (config.canUndo !== false && deletedData) {
        const undoAction = createFormAction(
          config.module,
          `删除${config.itemName}`,
          deletedData,
          null,
          async () => {
            // 恢复删除的数据
            console.log('Restore deleted item:', config.itemName)
          },
          async () => {
            // 重新删除
            console.log('Re-delete item:', config.itemName)
          }
        )
        undoRedoManager.addAction(undoAction)
      }
      
      return result
    },
    config.itemName,
    config.requiresConfirmation !== false
  )
}

// 增强的批量操作
export async function enhancedBatchOperation<T>(
  config: EnhancedOperationConfig,
  items: any[],
  operation: (item: any, index: number) => Promise<void>
): Promise<void> {
  const operationName = `${config.operationType === 'delete' ? '删除' : '处理'}${config.itemName}`
  
  return withBatchProgress(
    operationName,
    items,
    async (item, index, updateProgress) => {
      await operation(item, index)
      updateProgress(index + 1)
    }
  )
}

// 增强的导入操作
export async function enhancedImportOperation<T>(
  config: EnhancedOperationConfig,
  filename: string,
  operation: (updateProgress: (processed: number, total: number, currentItem?: string) => void) => Promise<T>
): Promise<T> {
  return withImportProgress(filename, operation)
}

// 增强的导出操作
export async function enhancedExportOperation<T>(
  config: EnhancedOperationConfig,
  operation: (updateProgress: (progress: number, description?: string) => void) => Promise<T>
): Promise<T> {
  const progressId = `export_${config.module}_${Date.now()}`
  
  return withProgress({
    id: progressId,
    title: `导出${config.itemName}`,
    description: `正在导出${config.itemName}数据...`,
    stages: ["收集数据", "格式化", "生成文件", "下载准备"],
    canCancel: true,
  }, async (updateProgress) => {
    return operation((progress, description) => {
      updateProgress({
        progress,
        description,
      })
    })
  })
}

// 增强的报表生成操作
export async function enhancedReportOperation<T>(
  config: EnhancedOperationConfig,
  reportName: string,
  operation: (updateProgress: (stage: number, description?: string) => void) => Promise<T>
): Promise<T> {
  return withReportProgress(reportName, operation)
}

// 通用的API调用包装器
export async function enhancedApiCall<T>(
  config: {
    module: string
    operation: string
    itemName?: string
    showLoading?: boolean
    showSuccess?: boolean
    showError?: boolean
  },
  apiCall: () => Promise<T>
): Promise<T> {
  const operationId = `${config.module}_${config.operation}_${Date.now()}`
  
  try {
    if (config.showLoading !== false) {
      feedbackManager.startOperation(operationId, `正在${config.operation}${config.itemName || ''}`)
    }
    
    const result = await apiCall()
    
    if (config.showSuccess !== false) {
      feedbackManager.completeOperation(operationId, {
        title: `${config.operation}成功`,
        description: config.itemName ? `${config.itemName}${config.operation}成功` : undefined,
      })
    }
    
    return result
  } catch (error) {
    if (config.showError !== false) {
      feedbackManager.failOperation(operationId, {
        title: `${config.operation}失败`,
        description: config.itemName ? `${config.itemName}${config.operation}失败` : undefined,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
    throw error
  }
}

// 页面级别的操作增强Hook
export function useEnhancedOperations(module: string) {
  const createOperation = (operationType: string, itemName: string) => ({
    // 表单操作
    form: async <T>(
      operation: () => Promise<T>,
      beforeData?: any,
      afterData?: any,
      options?: { canUndo?: boolean; requiresConfirmation?: boolean }
    ) => enhancedFormOperation(
      {
        module,
        operationType: operationType as any,
        itemName,
        ...options
      },
      operation,
      beforeData,
      afterData
    ),
    
    // 删除操作
    delete: async <T>(
      operation: () => Promise<T>,
      deletedData?: any,
      options?: { canUndo?: boolean; requiresConfirmation?: boolean }
    ) => enhancedDeleteOperation(
      {
        module,
        operationType: 'delete',
        itemName,
        ...options
      },
      operation,
      deletedData
    ),
    
    // 批量操作
    batch: async (
      items: any[],
      operation: (item: any, index: number) => Promise<void>
    ) => enhancedBatchOperation(
      {
        module,
        operationType: 'batch',
        itemName,
      },
      items,
      operation
    ),
    
    // API调用
    api: async <T>(
      operation: string,
      apiCall: () => Promise<T>,
      options?: { showLoading?: boolean; showSuccess?: boolean; showError?: boolean }
    ) => enhancedApiCall(
      {
        module,
        operation,
        itemName,
        ...options
      },
      apiCall
    ),
  })
  
  return {
    // 便捷方法
    create: (itemName: string) => createOperation('create', itemName),
    update: (itemName: string) => createOperation('update', itemName),
    delete: (itemName: string) => createOperation('delete', itemName),
    
    // 导入导出
    import: async <T>(
      filename: string,
      operation: (updateProgress: (processed: number, total: number, currentItem?: string) => void) => Promise<T>
    ) => enhancedImportOperation(
      { module, operationType: 'import', itemName: '数据' },
      filename,
      operation
    ),
    
    export: async <T>(
      itemName: string,
      operation: (updateProgress: (progress: number, description?: string) => void) => Promise<T>
    ) => enhancedExportOperation(
      { module, operationType: 'export', itemName },
      operation
    ),
    
    // 报表生成
    report: async <T>(
      reportName: string,
      operation: (updateProgress: (stage: number, description?: string) => void) => Promise<T>
    ) => enhancedReportOperation(
      { module, operationType: 'report', itemName: reportName },
      reportName,
      operation
    ),
  }
}

// 快速操作的增强包装器
export function enhanceQuickAction<T>(
  module: string,
  actionName: string,
  operation: () => Promise<T>,
  options?: {
    itemName?: string
    canUndo?: boolean
    beforeData?: any
    afterData?: any
  }
): Promise<T> {
  return enhancedFormOperation(
    {
      module,
      operationType: 'create',
      itemName: options?.itemName || actionName,
      canUndo: options?.canUndo,
    },
    operation,
    options?.beforeData,
    options?.afterData
  )
}
