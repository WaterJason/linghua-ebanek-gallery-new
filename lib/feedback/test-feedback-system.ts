// 阶段4操作反馈增强 - 系统测试文件
// 用于测试反馈系统的各项功能

import { 
  feedbackSystem, 
  undoRedoManager, 
  progressMonitor, 
  animationManager, 
  operationTracker,
  debugFeedbackSystem,
  getFeedbackSystemPerformance,
  cleanupFeedbackSystem
} from './index'

/**
 * 测试反馈系统基本功能
 */
export async function testFeedbackSystem() {
  console.log('🧪 开始测试聆花ERP反馈系统...')
  
  try {
    // 1. 测试反馈消息
    console.log('📢 测试反馈消息系统...')
    const successId = feedbackSystem.showSuccess('测试成功消息')
    const errorId = feedbackSystem.showError('测试错误消息')
    const warningId = feedbackSystem.showWarning('测试警告消息')
    const infoId = feedbackSystem.showInfo('测试信息消息')
    
    console.log('✅ 反馈消息测试完成，消息数量:', feedbackSystem.getMessages().length)
    
    // 2. 测试撤销重做功能
    console.log('↩️ 测试撤销重做功能...')
    await undoRedoManager.execute({
      id: 'test-action-1',
      type: 'test',
      timestamp: Date.now(),
      data: {
        before: { value: 'old' },
        after: { value: 'new' },
        target: 'test-target'
      },
      description: '测试操作1',
      canUndo: true,
      canRedo: false
    })
    
    await undoRedoManager.execute({
      id: 'test-action-2',
      type: 'test',
      timestamp: Date.now(),
      data: {
        before: { value: 'old2' },
        after: { value: 'new2' },
        target: 'test-target2'
      },
      description: '测试操作2',
      canUndo: true,
      canRedo: false
    })
    
    console.log('撤销重做状态:', undoRedoManager.getState())
    console.log('✅ 撤销重做测试完成')
    
    // 3. 测试进度监控
    console.log('📊 测试进度监控功能...')
    const progressId = progressMonitor.startProgress({
      title: '测试进度',
      total: 100,
      showETA: true,
      cancellable: true
    })
    
    // 模拟进度更新
    for (let i = 0; i <= 100; i += 20) {
      progressMonitor.updateProgress(progressId, {
        current: i,
        message: `处理中... ${i}%`
      })
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    progressMonitor.completeProgress(progressId, '测试完成')
    console.log('✅ 进度监控测试完成')
    
    // 4. 测试动画系统
    console.log('✨ 测试动画系统...')
    console.log('动画系统状态:', {
      enabled: animationManager.isGlobalAnimationEnabled(),
      presets: animationManager.getPresets().length
    })
    console.log('✅ 动画系统测试完成')
    
    // 5. 测试操作跟踪
    console.log('📝 测试操作跟踪功能...')
    await operationTracker.executeOperation(
      {
        module: '测试模块',
        action: '测试操作',
        target: '测试目标',
        userId: 'test-user'
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return { success: true, data: 'test result' }
      },
      {
        showProgress: true,
        showFeedback: true,
        enableUndo: true,
        progressTitle: '执行测试操作'
      }
    )
    
    console.log('操作统计:', operationTracker.getOperationStats())
    console.log('✅ 操作跟踪测试完成')
    
    // 6. 显示系统性能
    console.log('📈 系统性能监控:')
    console.log(getFeedbackSystemPerformance())
    
    // 7. 显示调试信息
    debugFeedbackSystem()
    
    console.log('🎉 所有测试完成！反馈系统运行正常。')
    
    return true
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    return false
  }
}

/**
 * 测试批量操作
 */
export async function testBatchOperations() {
  console.log('🔄 测试批量操作功能...')
  
  const testItems = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `测试项目${i + 1}` }))
  
  try {
    const results = await operationTracker.executeBatchOperation(
      {
        module: '测试模块',
        action: '批量处理',
        userId: 'test-user'
      },
      testItems,
      async (item, index) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return { ...item, processed: true, index }
      },
      {
        showProgress: true,
        showFeedback: true,
        batchSize: 3,
        progressTitle: '批量处理测试项目'
      }
    )
    
    console.log('✅ 批量操作测试完成，处理了', results.length, '个项目')
    return results
    
  } catch (error) {
    console.error('❌ 批量操作测试失败:', error)
    throw error
  }
}

/**
 * 测试文件上传模拟
 */
export async function testFileUpload() {
  console.log('📁 测试文件上传功能...')
  
  // 创建模拟文件
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
  
  try {
    const result = await operationTracker.executeFileUpload(
      {
        module: '文件管理',
        action: '文件上传',
        userId: 'test-user'
      },
      mockFile,
      async (file, onProgress) => {
        // 模拟上传进度
        for (let progress = 0; progress <= 100; progress += 10) {
          onProgress(progress)
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        return { fileId: 'test-file-id', url: '/uploads/test.txt' }
      },
      {
        showFeedback: true
      }
    )
    
    console.log('✅ 文件上传测试完成:', result)
    return result
    
  } catch (error) {
    console.error('❌ 文件上传测试失败:', error)
    throw error
  }
}

/**
 * 压力测试
 */
export async function stressTest() {
  console.log('💪 开始压力测试...')
  
  const startTime = Date.now()
  
  try {
    // 大量反馈消息
    for (let i = 0; i < 50; i++) {
      feedbackSystem.showInfo(`压力测试消息 ${i + 1}`)
    }
    
    // 大量撤销重做操作
    for (let i = 0; i < 20; i++) {
      await undoRedoManager.execute({
        id: `stress-test-${i}`,
        type: 'stress-test',
        timestamp: Date.now(),
        data: {
          before: { value: i },
          after: { value: i + 1 },
          target: 'stress-test'
        },
        description: `压力测试操作 ${i + 1}`,
        canUndo: true,
        canRedo: false
      })
    }
    
    // 多个并发进度
    const progressPromises = Array.from({ length: 5 }, async (_, i) => {
      const progressId = progressMonitor.startProgress({
        title: `并发进度 ${i + 1}`,
        total: 50
      })
      
      for (let j = 0; j <= 50; j += 5) {
        progressMonitor.updateProgress(progressId, {
          current: j,
          message: `进度 ${i + 1}: ${j}/50`
        })
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      
      progressMonitor.completeProgress(progressId)
    })
    
    await Promise.all(progressPromises)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`✅ 压力测试完成，耗时: ${duration}ms`)
    console.log('最终性能状态:', getFeedbackSystemPerformance())
    
    return { duration, performance: getFeedbackSystemPerformance() }
    
  } catch (error) {
    console.error('❌ 压力测试失败:', error)
    throw error
  }
}

/**
 * 清理测试数据
 */
export function cleanupTestData() {
  console.log('🧹 清理测试数据...')
  cleanupFeedbackSystem()
  console.log('✅ 测试数据清理完成')
}

/**
 * 运行完整测试套件
 */
export async function runFullTestSuite() {
  console.log('🚀 开始运行完整测试套件...')
  
  try {
    // 基础功能测试
    await testFeedbackSystem()
    
    // 批量操作测试
    await testBatchOperations()
    
    // 文件上传测试
    await testFileUpload()
    
    // 压力测试
    await stressTest()
    
    console.log('🎊 完整测试套件运行成功！')
    
    // 清理测试数据
    cleanupTestData()
    
    return true
    
  } catch (error) {
    console.error('💥 测试套件运行失败:', error)
    cleanupTestData()
    return false
  }
}

// 导出测试函数供外部调用
export const feedbackSystemTests = {
  basic: testFeedbackSystem,
  batch: testBatchOperations,
  fileUpload: testFileUpload,
  stress: stressTest,
  cleanup: cleanupTestData,
  full: runFullTestSuite
}
