import {
  checkDatabaseConnection,
  checkTablesExist,
  testProductsCRUD,
  testEmployeesCRUD,
  testInventoryCRUD,
  DiagnosticResult,
  ModuleDiagnostic
} from './database-diagnostics'

import {
  testFinanceCRUD,
  testPayrollCRUD,
  testSalesCRUD,
  testPurchaseCRUD,
  testChannelsCRUD
} from './database-diagnostics-extended'

import {
  testSystemSettingsCRUD,
  testProductionCRUD,
  testServerActionsHealth,
  testEnhancedOperationsIntegration
} from './system-diagnostics-extended'

export interface SystemDiagnosticReport {
  timestamp: string
  overall: 'healthy' | 'warning' | 'critical'
  database: {
    connection: DiagnosticResult
    tables: DiagnosticResult
  }
  modules: ModuleDiagnostic[]
  serverActions: DiagnosticResult
  enhancedOperations: DiagnosticResult
  summary: {
    total: number
    healthy: number
    warning: number
    critical: number
  }
  recommendations: string[]
}

/**
 * 执行完整的系统数据库诊断
 */
export async function runFullDatabaseDiagnostic(): Promise<SystemDiagnosticReport> {
  console.log('🔍 开始数据库系统诊断...')

  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  // 1. 基础数据库连接检查
  console.log('📡 检查数据库连接...')
  const connectionResult = await checkDatabaseConnection()

  console.log('📋 检查数据表结构...')
  const tablesResult = await checkTablesExist()

  // 2. 各模块 CRUD 测试
  const modules: ModuleDiagnostic[] = []

  const moduleTests = [
    { name: 'products', test: testProductsCRUD },
    { name: 'employees', test: testEmployeesCRUD },
    { name: 'inventory', test: testInventoryCRUD },
    { name: 'finance', test: testFinanceCRUD },
    { name: 'payroll', test: testPayrollCRUD },
    { name: 'sales', test: testSalesCRUD },
    { name: 'purchase', test: testPurchaseCRUD },
    { name: 'channels', test: testChannelsCRUD },
    { name: 'system-settings', test: testSystemSettingsCRUD },
    { name: 'production', test: testProductionCRUD }
  ]

  for (const { name, test } of moduleTests) {
    console.log(`🧪 测试 ${name} 模块...`)

    try {
      const crudResults = await test()

      // 评估模块整体健康状况
      const results = [crudResults.create, crudResults.read, crudResults.update, crudResults.delete]
      const errorCount = results.filter(r => r.status === 'error').length
      const warningCount = results.filter(r => r.status === 'warning').length

      let overall: 'healthy' | 'warning' | 'critical'
      if (errorCount >= 3) {
        overall = 'critical'
      } else if (errorCount >= 1 || warningCount >= 2) {
        overall = 'warning'
      } else {
        overall = 'healthy'
      }

      modules.push({
        module: name,
        connection: {
          module: name,
          status: overall === 'critical' ? 'error' : 'success',
          message: `${name} 模块连接${overall === 'critical' ? '异常' : '正常'}`
        },
        crud: crudResults,
        overall
      })

    } catch (error) {
      console.error(`❌ ${name} 模块测试失败:`, error)

      const errorResult: DiagnosticResult = {
        module: name,
        status: 'error',
        message: `${name} 模块测试异常`,
        error: error instanceof Error ? error : new Error('Unknown error')
      }

      modules.push({
        module: name,
        connection: errorResult,
        crud: {
          create: errorResult,
          read: errorResult,
          update: errorResult,
          delete: errorResult
        },
        overall: 'critical'
      })
    }
  }

  // 3. Server Actions 和增强操作系统检查
  console.log('🔧 检查 Server Actions 健康状态...')
  const serverActionsHealth = await testServerActionsHealth()

  console.log('⚡ 检查增强操作系统集成...')
  const enhancedOperationsHealth = await testEnhancedOperationsIntegration()

  // 4. 生成总体评估
  const summary = {
    total: modules.length,
    healthy: modules.filter(m => m.overall === 'healthy').length,
    warning: modules.filter(m => m.overall === 'warning').length,
    critical: modules.filter(m => m.overall === 'critical').length
  }

  let overall: 'healthy' | 'warning' | 'critical'
  if (connectionResult.status === 'error' || summary.critical > 0 || serverActionsHealth.status === 'error') {
    overall = 'critical'
  } else if (tablesResult.status === 'warning' || summary.warning > 0 ||
             serverActionsHealth.status === 'warning' || enhancedOperationsHealth.status === 'warning') {
    overall = 'warning'
  } else {
    overall = 'healthy'
  }

  // 4. 生成建议
  const recommendations: string[] = []

  if (connectionResult.status === 'error') {
    recommendations.push('🔴 数据库连接失败，请检查数据库服务和连接配置')
  }

  if (tablesResult.status === 'warning') {
    recommendations.push('🟡 部分数据表缺失，建议运行数据库迁移')
  }

  modules.forEach(module => {
    if (module.overall === 'critical') {
      recommendations.push(`🔴 ${module.module} 模块存在严重问题，需要立即修复`)
    } else if (module.overall === 'warning') {
      recommendations.push(`🟡 ${module.module} 模块存在警告，建议检查相关配置`)
    }
  })

  // 添加 Server Actions 和增强操作系统的建议
  if (serverActionsHealth.status === 'error') {
    recommendations.push('🔴 Server Actions 响应异常，请检查服务器配置和数据库连接')
  } else if (serverActionsHealth.status === 'warning') {
    recommendations.push('🟡 Server Actions 响应较慢，建议优化数据库查询或增加服务器资源')
  }

  if (enhancedOperationsHealth.status === 'error') {
    recommendations.push('🔴 增强操作系统集成异常，部分用户体验功能可能不可用')
  } else if (enhancedOperationsHealth.status === 'warning') {
    recommendations.push('🟡 增强操作系统部分组件异常，建议检查相关配置')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 所有模块运行正常，系统状态良好')
  }

  const endTime = Date.now()
  console.log(`✅ 诊断完成，耗时 ${endTime - startTime}ms`)

  return {
    timestamp,
    overall,
    database: {
      connection: connectionResult,
      tables: tablesResult
    },
    modules,
    serverActions: serverActionsHealth,
    enhancedOperations: enhancedOperationsHealth,
    summary,
    recommendations
  }
}

/**
 * 快速健康检查（仅检查连接和基本查询）
 * 返回统一的诊断结果格式
 */
export async function quickHealthCheck(): Promise<{
  databaseConnection: { status: 'success' | 'warning' | 'error', message: string, priority: 'P0' | 'P1' | 'P2' | 'P3' }
  basicQueries: { status: 'success' | 'warning' | 'error', message: string, priority: 'P0' | 'P1' | 'P2' | 'P3' }
  serverActions: { status: 'success' | 'warning' | 'error', message: string, priority: 'P0' | 'P1' | 'P2' | 'P3' }
}> {
  try {
    console.log('🔍 执行系统数据操作快速检查...')

    // 1. 数据库连接检查
    const connectionResult = await checkDatabaseConnection()
    const databaseConnection = {
      status: connectionResult.status === 'error' ? 'error' as const : 'success' as const,
      message: connectionResult.message,
      priority: connectionResult.status === 'error' ? 'P0' as const : 'P3' as const
    }

    // 2. 基础查询测试
    let basicQueries
    try {
      const testQueries = [
        { name: 'products', query: () => import('./db').then(db => db.default.product.count()) },
        { name: 'employees', query: () => import('./db').then(db => db.default.employee.count()) },
        { name: 'users', query: () => import('./db').then(db => db.default.user.count()) }
      ]

      const results = await Promise.allSettled(
        testQueries.map(async ({ name, query }) => {
          const count = await query()
          return { name, count }
        })
      )

      const failures = results.filter(r => r.status === 'rejected').length
      const successes = results.filter(r => r.status === 'fulfilled').length

      if (failures === 0) {
        basicQueries = {
          status: 'success' as const,
          message: `所有 ${successes} 个基础查询正常`,
          priority: 'P3' as const
        }
      } else if (failures < testQueries.length) {
        basicQueries = {
          status: 'warning' as const,
          message: `${failures}/${testQueries.length} 个基础查询失败`,
          priority: 'P1' as const
        }
      } else {
        basicQueries = {
          status: 'error' as const,
          message: '所有基础查询失败',
          priority: 'P0' as const
        }
      }
    } catch (error) {
      basicQueries = {
        status: 'error' as const,
        message: '基础查询测试异常',
        priority: 'P0' as const
      }
    }

    // 3. Server Actions 健康检查
    let serverActions
    try {
      const serverActionsHealth = await testServerActionsHealth()
      serverActions = {
        status: serverActionsHealth.status === 'error' ? 'error' as const :
                serverActionsHealth.status === 'warning' ? 'warning' as const : 'success' as const,
        message: serverActionsHealth.message,
        priority: serverActionsHealth.status === 'error' ? 'P0' as const :
                 serverActionsHealth.status === 'warning' ? 'P1' as const : 'P3' as const
      }
    } catch (error) {
      serverActions = {
        status: 'error' as const,
        message: 'Server Actions 检查异常',
        priority: 'P0' as const
      }
    }

    console.log('✅ 系统数据操作快速检查完成')

    return {
      databaseConnection,
      basicQueries,
      serverActions
    }

  } catch (error) {
    console.error('❌ 系统数据操作快速检查失败:', error)

    return {
      databaseConnection: {
        status: 'error' as const,
        message: '数据库连接检查异常',
        priority: 'P0' as const
      },
      basicQueries: {
        status: 'error' as const,
        message: '基础查询检查异常',
        priority: 'P0' as const
      },
      serverActions: {
        status: 'error' as const,
        message: 'Server Actions 检查异常',
        priority: 'P0' as const
      }
    }
  }
}

/**
 * 生成诊断报告的可读格式
 */
export function formatDiagnosticReport(report: SystemDiagnosticReport): string {
  const lines: string[] = []

  lines.push('📊 数据库系统诊断报告')
  lines.push('=' .repeat(50))
  lines.push(`🕐 时间: ${new Date(report.timestamp).toLocaleString()}`)
  lines.push(`📈 总体状态: ${getStatusEmoji(report.overall)} ${report.overall.toUpperCase()}`)
  lines.push('')

  lines.push('🔗 数据库连接')
  lines.push(`  连接状态: ${getStatusEmoji(report.database.connection.status)} ${report.database.connection.message}`)
  lines.push(`  表结构: ${getStatusEmoji(report.database.tables.status)} ${report.database.tables.message}`)
  lines.push('')

  lines.push('📦 模块状态')
  report.modules.forEach(module => {
    lines.push(`  ${module.module}: ${getStatusEmoji(module.overall)} ${module.overall}`)
    lines.push(`    创建: ${getStatusEmoji(module.crud.create.status)} ${module.crud.create.message}`)
    lines.push(`    查询: ${getStatusEmoji(module.crud.read.status)} ${module.crud.read.message}`)
    lines.push(`    更新: ${getStatusEmoji(module.crud.update.status)} ${module.crud.update.message}`)
    lines.push(`    删除: ${getStatusEmoji(module.crud.delete.status)} ${module.crud.delete.message}`)
    lines.push('')
  })

  lines.push('📋 统计摘要')
  lines.push(`  总模块数: ${report.summary.total}`)
  lines.push(`  健康模块: ${report.summary.healthy}`)
  lines.push(`  警告模块: ${report.summary.warning}`)
  lines.push(`  异常模块: ${report.summary.critical}`)
  lines.push('')

  lines.push('💡 建议措施')
  report.recommendations.forEach(rec => {
    lines.push(`  ${rec}`)
  })

  return lines.join('\n')
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'success':
    case 'healthy':
      return '✅'
    case 'warning':
      return '⚠️'
    case 'error':
    case 'critical':
      return '❌'
    default:
      return '❓'
  }
}
