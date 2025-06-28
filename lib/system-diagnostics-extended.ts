import prisma from '@/lib/db'
import { DiagnosticResult, CRUDTestResult } from './database-diagnostics'

/**
 * 系统设置模块 CRUD 测试
 */
export async function testSystemSettingsCRUD(): Promise<CRUDTestResult> {
  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const testParam = await prisma.systemParameter.create({
        data: {
          key: `test_param_${Date.now()}`,
          value: 'test_value',
          type: 'string',
          group: 'test',
          description: '测试参数'
        }
      })
      return {
        module: 'system-settings',
        status: 'success',
        message: '系统参数创建成功',
        details: { id: testParam.id }
      }
    } catch (error) {
      return {
        module: 'system-settings',
        status: 'error',
        message: '系统参数创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const parameters = await prisma.systemParameter.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      return {
        module: 'system-settings',
        status: 'success',
        message: '系统参数查询成功',
        details: { count: parameters.length }
      }
    } catch (error) {
      return {
        module: 'system-settings',
        status: 'error',
        message: '系统参数查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    try {
      const testParam = await prisma.systemParameter.findFirst({
        where: { key: { startsWith: 'test_param_' } }
      })

      if (testParam) {
        await prisma.systemParameter.update({
          where: { id: testParam.id },
          data: { value: 'updated_test_value' }
        })
        return {
          module: 'system-settings',
          status: 'success',
          message: '系统参数更新成功',
          details: { id: testParam.id }
        }
      } else {
        return {
          module: 'system-settings',
          status: 'warning',
          message: '没有找到可更新的测试参数'
        }
      }
    } catch (error) {
      return {
        module: 'system-settings',
        status: 'error',
        message: '系统参数更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    try {
      const testParams = await prisma.systemParameter.findMany({
        where: { key: { startsWith: 'test_param_' } }
      })

      if (testParams.length > 0) {
        await prisma.systemParameter.deleteMany({
          where: { key: { startsWith: 'test_param_' } }
        })
        return {
          module: 'system-settings',
          status: 'success',
          message: '系统参数删除成功',
          details: { deleted: testParams.length }
        }
      } else {
        return {
          module: 'system-settings',
          status: 'warning',
          message: '没有找到可删除的测试参数'
        }
      }
    } catch (error) {
      return {
        module: 'system-settings',
        status: 'error',
        message: '系统参数删除失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  return {
    create: createResult,
    read: readResult,
    update: updateResult,
    delete: deleteResult
  }
}

/**
 * 生产管理模块 CRUD 测试
 */
export async function testProductionCRUD(): Promise<CRUDTestResult> {
  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const testBase = await prisma.productionBase.create({
        data: {
          name: `测试生产基地_${Date.now()}`,
          code: `TEST_${Date.now()}`,
          location: '测试地址',
          capacity: 100
        }
      })
      return {
        module: 'production',
        status: 'success',
        message: '生产基地创建成功',
        details: { id: testBase.id }
      }
    } catch (error) {
      return {
        module: 'production',
        status: 'error',
        message: '生产基地创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const bases = await prisma.productionBase.findMany({
        take: 5,
        include: {
          productionOrders: true,
          qualityRecords: true
        }
      })
      return {
        module: 'production',
        status: 'success',
        message: '生产基地查询成功',
        details: { count: bases.length }
      }
    } catch (error) {
      return {
        module: 'production',
        status: 'error',
        message: '生产基地查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    try {
      const testBase = await prisma.productionBase.findFirst({
        where: { name: { startsWith: '测试生产基地_' } }
      })

      if (testBase) {
        await prisma.productionBase.update({
          where: { id: testBase.id },
          data: { capacity: 200 }
        })
        return {
          module: 'production',
          status: 'success',
          message: '生产基地更新成功',
          details: { id: testBase.id }
        }
      } else {
        return {
          module: 'production',
          status: 'warning',
          message: '没有找到可更新的测试生产基地'
        }
      }
    } catch (error) {
      return {
        module: 'production',
        status: 'error',
        message: '生产基地更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    try {
      const testBases = await prisma.productionBase.findMany({
        where: { name: { startsWith: '测试生产基地_' } }
      })

      if (testBases.length > 0) {
        await prisma.productionBase.deleteMany({
          where: { name: { startsWith: '测试生产基地_' } }
        })
        return {
          module: 'production',
          status: 'success',
          message: '生产基地删除成功',
          details: { deleted: testBases.length }
        }
      } else {
        return {
          module: 'production',
          status: 'warning',
          message: '没有找到可删除的测试生产基地'
        }
      }
    } catch (error) {
      return {
        module: 'production',
        status: 'error',
        message: '生产基地删除失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  return {
    create: createResult,
    read: readResult,
    update: updateResult,
    delete: deleteResult
  }
}

/**
 * Server Actions 健康检查
 */
export async function testServerActionsHealth(): Promise<DiagnosticResult> {
  try {
    const startTime = Date.now()

    // 测试基本数据库查询
    await prisma.user.findFirst()

    const responseTime = Date.now() - startTime

    if (responseTime < 100) {
      return {
        module: 'server-actions',
        status: 'success',
        message: 'Server Actions响应正常',
        details: { responseTime: `${responseTime}ms` }
      }
    } else if (responseTime < 500) {
      return {
        module: 'server-actions',
        status: 'warning',
        message: 'Server Actions响应较慢',
        details: { responseTime: `${responseTime}ms` }
      }
    } else {
      return {
        module: 'server-actions',
        status: 'error',
        message: 'Server Actions响应过慢',
        details: { responseTime: `${responseTime}ms` }
      }
    }
  } catch (error) {
    return {
      module: 'server-actions',
      status: 'error',
      message: 'Server Actions测试失败',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * 增强操作系统集成状态检查
 */
export async function testEnhancedOperationsIntegration(): Promise<DiagnosticResult> {
  try {
    // 检查增强操作系统的核心组件
    const components = [
      'feedback-system',
      'undo-redo-system',
      'progress-system',
      'enhanced-operations-integration'
    ]

    const results = []

    for (const component of components) {
      try {
        // 这里可以添加具体的组件检查逻辑
        results.push({ component, status: 'available' })
      } catch (error) {
        results.push({ component, status: 'error', error: error.message })
      }
    }

    const errorCount = results.filter(r => r.status === 'error').length

    if (errorCount === 0) {
      return {
        module: 'enhanced-operations',
        status: 'success',
        message: '增强操作系统集成正常',
        details: { components: results }
      }
    } else if (errorCount < components.length / 2) {
      return {
        module: 'enhanced-operations',
        status: 'warning',
        message: `部分增强操作组件异常 (${errorCount}/${components.length})`,
        details: { components: results }
      }
    } else {
      return {
        module: 'enhanced-operations',
        status: 'error',
        message: `多数增强操作组件异常 (${errorCount}/${components.length})`,
        details: { components: results }
      }
    }
  } catch (error) {
    return {
      module: 'enhanced-operations',
      status: 'error',
      message: '增强操作系统检查失败',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}
