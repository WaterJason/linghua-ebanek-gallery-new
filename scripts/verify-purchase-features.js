#!/usr/bin/env node

/**
 * 采购管理模块功能验证脚本
 * 验证：导入功能、审批机制、组件集成的完整性
 */

const fs = require('fs')
const path = require('path')

// 验证结果
let verificationResults = {
  totalChecks: 0,
  passedChecks: 0,
  failedChecks: 0,
  warnings: [],
  errors: [],
  startTime: Date.now()
}

// 记录验证结果
function recordCheck(checkName, success, details = null) {
  verificationResults.totalChecks++
  
  if (success) {
    verificationResults.passedChecks++
    console.log(`✅ ${checkName}`)
  } else {
    verificationResults.failedChecks++
    console.log(`❌ ${checkName}`)
    if (details) {
      console.log(`   详情: ${details}`)
      verificationResults.errors.push({ check: checkName, details })
    }
  }
}

// 记录警告
function recordWarning(checkName, message) {
  console.log(`⚠️  ${checkName}: ${message}`)
  verificationResults.warnings.push({ check: checkName, message })
}

// 检查文件是否存在
function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  recordCheck(`${description} - 文件存在`, exists, exists ? null : `文件不存在: ${filePath}`)
  return exists
}

// 检查文件内容
function checkFileContent(filePath, patterns, description) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    recordCheck(`${description} - 内容检查`, false, `文件不存在: ${filePath}`)
    return false
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    let allPatternsFound = true
    let missingPatterns = []
    
    for (const [patternName, pattern] of Object.entries(patterns)) {
      const found = typeof pattern === 'string' 
        ? content.includes(pattern)
        : pattern.test(content)
      
      if (!found) {
        allPatternsFound = false
        missingPatterns.push(patternName)
      }
    }
    
    recordCheck(
      `${description} - 内容检查`, 
      allPatternsFound, 
      allPatternsFound ? null : `缺少内容: ${missingPatterns.join(', ')}`
    )
    
    return allPatternsFound
  } catch (error) {
    recordCheck(`${description} - 内容检查`, false, `读取文件失败: ${error.message}`)
    return false
  }
}

// 验证1: 导入功能集成
function verifyImportFeature() {
  console.log('\n📊 验证1: 导入功能集成')
  
  // 检查ExcelImportDialog组件
  checkFileExists('components/purchase/excel-import-dialog.tsx', 'Excel导入对话框组件')
  
  // 检查PurchaseOrderManagement组件中的导入集成
  checkFileContent(
    'components/purchase-order-management.tsx',
    {
      'ExcelImportDialog导入': 'import { ExcelImportDialog }',
      '导入状态管理': 'isImportDialogOpen',
      '导入处理函数': 'handleImportOrders',
      '导入完成处理': 'handleImportComplete',
      '批量导入按钮': '批量导入',
      'FileSpreadsheet图标': 'FileSpreadsheet'
    },
    'PurchaseOrderManagement组件导入功能集成'
  )
  
  // 检查导入API路由
  checkFileExists('app/api/purchase-orders/import/route.ts', '批量导入API路由')
  
  if (checkFileExists('app/api/purchase-orders/import/route.ts', '')) {
    checkFileContent(
      'app/api/purchase-orders/import/route.ts',
      {
        'POST方法': 'export async function POST',
        '文件上传处理': 'FormData',
        '批量创建': 'createMany\\|Promise\\.all',
        '错误处理': 'try.*catch'
      },
      '批量导入API实现'
    )
  }
}

// 验证2: 审批机制集成
function verifyApprovalMechanism() {
  console.log('\n🔍 验证2: 审批机制集成')
  
  // 检查ApprovalWorkflowPanel组件
  checkFileExists('components/purchase/approval-workflow-panel.tsx', '审批工作流面板组件')
  
  // 检查PurchaseOrderManagement组件中的审批集成
  checkFileContent(
    'components/purchase-order-management.tsx',
    {
      'ApprovalWorkflowPanel导入': 'import { ApprovalWorkflowPanel }',
      'useSession导入': 'import { useSession }',
      'session数据获取': 'const { data: session } = useSession()',
      '审批面板使用': 'ApprovalWorkflowPanel',
      '用户ID传递': 'currentUserId={session.user.id}',
      '审批完成处理': 'onApprovalComplete'
    },
    'PurchaseOrderManagement组件审批功能集成'
  )
  
  // 检查采购订单详情页面
  checkFileExists('app/(main)/purchase/orders/[id]/page.tsx', '采购订单详情页面')
  
  if (checkFileExists('app/(main)/purchase/orders/[id]/page.tsx', '')) {
    checkFileContent(
      'app/(main)/purchase/orders/[id]/page.tsx',
      {
        'ApprovalWorkflowPanel导入': 'import { ApprovalWorkflowPanel }',
        'ReceivingDialog导入': 'import { ReceivingDialog }',
        'InventorySyncPanel导入': 'import { InventorySyncPanel }',
        '审批面板渲染': '<ApprovalWorkflowPanel',
        '到货验收面板': '<ReceivingDialog',
        '库存同步面板': '<InventorySyncPanel'
      },
      '采购订单详情页面审批功能'
    )
  }
  
  // 检查审批API路由
  checkFileExists('app/api/purchase-orders/[id]/approve/route.ts', '审批API路由')
  
  if (checkFileExists('app/api/purchase-orders/[id]/approve/route.ts', '')) {
    checkFileContent(
      'app/api/purchase-orders/[id]/approve/route.ts',
      {
        '权限检查': 'checkApprovalPermission',
        '工作流处理': 'processPurchaseOrderApproval',
        '审批动作': 'approve.*reject.*submit_for_approval'
      },
      '审批API实现'
    )
  }
}

// 验证3: 组件依赖和集成
function verifyComponentIntegration() {
  console.log('\n🔧 验证3: 组件依赖和集成')
  
  // 检查关键组件文件
  const components = [
    'components/purchase/approval-workflow-panel.tsx',
    'components/purchase/receiving-dialog.tsx', 
    'components/purchase/inventory-sync-panel.tsx',
    'components/purchase/excel-import-dialog.tsx'
  ]
  
  components.forEach(component => {
    const componentName = path.basename(component, '.tsx')
    checkFileExists(component, `${componentName}组件`)
  })
  
  // 检查导航配置
  if (checkFileExists('config/navigation.ts', '导航配置文件')) {
    checkFileContent(
      'config/navigation.ts',
      {
        '采购管理': '采购管理',
        '采购订单': '采购订单',
        '供应商管理': '供应商管理'
      },
      '导航配置中的采购模块'
    )
  }
  
  // 检查页面路由
  checkFileExists('app/(main)/purchase/page.tsx', '采购管理主页面')
  
  if (checkFileExists('app/(main)/purchase/page.tsx', '')) {
    checkFileContent(
      'app/(main)/purchase/page.tsx',
      {
        'PurchaseOrderManagement导入': 'import { PurchaseOrderManagement }',
        '采购订单标签页': 'PurchaseOrderManagement'
      },
      '采购管理主页面组件集成'
    )
  }
}

// 验证4: API路由完整性
function verifyAPIRoutes() {
  console.log('\n🌐 验证4: API路由完整性')
  
  const apiRoutes = [
    'app/api/purchase-orders/route.ts',
    'app/api/purchase-orders/[id]/route.ts',
    'app/api/purchase-orders/[id]/approve/route.ts',
    'app/api/purchase-orders/[id]/receive/route.ts',
    'app/api/purchase-orders/[id]/inventory-sync/route.ts',
    'app/api/purchase-orders/[id]/finance/route.ts',
    'app/api/purchase-orders/import/route.ts'
  ]
  
  apiRoutes.forEach(route => {
    const routeName = route.replace('app/api/purchase-orders/', '').replace('/route.ts', '') || 'main'
    checkFileExists(route, `${routeName} API路由`)
  })
  
  // 检查集成服务
  const services = [
    'lib/services/inventory-integration.ts',
    'lib/services/finance-integration.ts', 
    'lib/services/purchase-permissions.ts'
  ]
  
  services.forEach(service => {
    const serviceName = path.basename(service, '.ts')
    checkFileExists(service, `${serviceName}服务`)
  })
}

// 验证5: 数据库集成
function verifyDatabaseIntegration() {
  console.log('\n🗄️  验证5: 数据库集成')
  
  // 检查Prisma schema
  if (checkFileExists('prisma/schema.prisma', 'Prisma数据库模式')) {
    checkFileContent(
      'prisma/schema.prisma',
      {
        'PurchaseOrder模型': 'model PurchaseOrder',
        'PurchaseOrderItem模型': 'model PurchaseOrderItem',
        'PurchaseOrderApproval模型': 'model PurchaseOrderApproval',
        'InventoryTransaction模型': 'model InventoryTransaction',
        'FinanceRecord模型': 'model FinanceRecord'
      },
      'Prisma schema中的采购相关模型'
    )
  }
  
  // 检查工作流集成
  checkFileExists('lib/workflow/purchase-order-workflow.ts', '采购订单工作流')
  
  if (checkFileExists('lib/workflow/purchase-order-workflow.ts', '')) {
    checkFileContent(
      'lib/workflow/purchase-order-workflow.ts',
      {
        '权限检查集成': 'checkApprovalPermission',
        '下一级审批人': 'getNextApprover',
        '工作流处理': 'processPurchaseOrderApproval'
      },
      '采购订单工作流实现'
    )
  }
}

// 生成验证报告
function generateReport() {
  const totalTime = Date.now() - verificationResults.startTime
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 采购管理模块功能验证报告')
  console.log('='.repeat(60))
  
  console.log(`\n📊 验证统计:`)
  console.log(`   检查总数: ${verificationResults.totalChecks}`)
  console.log(`   通过数量: ${verificationResults.passedChecks}/${verificationResults.totalChecks} (${(verificationResults.passedChecks/verificationResults.totalChecks*100).toFixed(1)}%)`)
  console.log(`   失败数量: ${verificationResults.failedChecks}/${verificationResults.totalChecks} (${(verificationResults.failedChecks/verificationResults.totalChecks*100).toFixed(1)}%)`)
  console.log(`   验证耗时: ${totalTime}ms`)
  
  if (verificationResults.warnings.length > 0) {
    console.log(`\n⚠️  警告信息:`)
    verificationResults.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning.check}: ${warning.message}`)
    })
  }
  
  if (verificationResults.errors.length > 0) {
    console.log(`\n❌ 错误详情:`)
    verificationResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.check}: ${error.details}`)
    })
  }
  
  // 功能完整性评级
  console.log(`\n🏆 功能完整性评级:`)
  const completeness = verificationResults.passedChecks / verificationResults.totalChecks
  if (completeness === 1) {
    console.log('   🥇 完美 - 所有功能都已正确集成')
  } else if (completeness >= 0.9) {
    console.log('   🥈 优秀 - 绝大部分功能已集成')
  } else if (completeness >= 0.8) {
    console.log('   🥉 良好 - 大部分功能已集成')
  } else if (completeness >= 0.7) {
    console.log('   ⚠️  一般 - 部分功能需要完善')
  } else {
    console.log('   ❌ 需要改进 - 多个功能缺失或有问题')
  }
  
  console.log('\n✨ 功能验证完成!')
  
  // 返回验证结果用于CI/CD
  return {
    success: completeness >= 0.8,
    completeness: completeness * 100,
    totalChecks: verificationResults.totalChecks,
    passedChecks: verificationResults.passedChecks,
    failedChecks: verificationResults.failedChecks
  }
}

// 运行完整验证
async function runVerification() {
  console.log('🔍 开始采购管理模块功能验证')
  console.log('🎯 验证范围: 导入功能、审批机制、组件集成')
  console.log('=' * 60)
  
  try {
    // 执行各项验证
    verifyImportFeature()
    verifyApprovalMechanism()
    verifyComponentIntegration()
    verifyAPIRoutes()
    verifyDatabaseIntegration()
    
    // 生成报告
    const result = generateReport()
    
    // 如果是CI环境，设置退出码
    if (process.env.CI && !result.success) {
      process.exit(1)
    }
    
    return result
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runVerification().catch(error => {
    console.error('❌ 验证失败:', error)
    process.exit(1)
  })
}

module.exports = { runVerification }
