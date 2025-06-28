#!/usr/bin/env node

/**
 * 采购管理模块完整流程集成测试
 * 测试：导入→审批→验收→入库→财务集成的完整流程
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// 测试配置
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TARGET_RESPONSE_TIME = 120 // ms

// 测试数据
const testData = {
  supplier: {
    id: 1,
    name: "景德镇珐琅工艺厂"
  },
  employee: {
    id: 1,
    name: "张经理"
  },
  warehouse: {
    id: 1,
    name: "主仓库"
  },
  products: [
    { name: "珐琅杯", quantity: 10, price: 25.00 },
    { name: "珐琅盘", quantity: 5, price: 45.00 },
    { name: "珐琅碗", quantity: 8, price: 35.00 }
  ]
}

// 测试状态
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  purchaseOrderId: null,
  startTime: Date.now()
}

// 执行HTTP请求
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Integration-Test-Script/1.0',
        ...headers
      }
    }

    const req = client.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        let parsedData = null
        try {
          parsedData = JSON.parse(responseData)
        } catch (e) {
          // 非JSON响应
        }
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: parsedData || responseData,
          headers: res.headers
        })
      })
    })

    req.on('error', (error) => {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      reject({
        error: error.message,
        responseTime
      })
    })

    if (data && method !== 'GET') {
      req.write(typeof data === 'string' ? data : JSON.stringify(data))
    }
    
    req.end()
  })
}

// 记录测试结果
function recordTest(testName, success, responseTime, error = null) {
  testResults.totalTests++
  
  if (success) {
    testResults.passedTests++
    console.log(`✅ ${testName} - 通过 (${responseTime}ms)`)
  } else {
    testResults.failedTests++
    console.log(`❌ ${testName} - 失败 (${responseTime}ms)`)
    if (error) {
      console.log(`   错误: ${error}`)
      testResults.errors.push({ test: testName, error })
    }
  }
  
  // 检查响应时间
  if (responseTime > TARGET_RESPONSE_TIME) {
    console.log(`⚠️  ${testName} - 响应时间超标: ${responseTime}ms > ${TARGET_RESPONSE_TIME}ms`)
  }
}

// 创建测试CSV文件
function createTestCSV() {
  const csvContent = [
    "产品名称,数量,单价,备注",
    ...testData.products.map(p => `${p.name},${p.quantity},${p.price},测试商品`)
  ].join('\n')
  
  const filePath = path.join(__dirname, 'test-import.csv')
  fs.writeFileSync(filePath, csvContent, 'utf8')
  return filePath
}

// 测试1: 创建采购订单
async function testCreatePurchaseOrder() {
  try {
    const orderData = {
      supplierId: testData.supplier.id,
      employeeId: testData.employee.id,
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: testData.products.map(p => ({
        productName: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      notes: "集成测试订单"
    }
    
    const response = await makeRequest(`${BASE_URL}/api/purchase-orders`, 'POST', orderData)
    
    if (response.statusCode === 201 && response.data.success) {
      testResults.purchaseOrderId = response.data.data.id
      recordTest("创建采购订单", true, response.responseTime)
      return response.data.data
    } else {
      recordTest("创建采购订单", false, response.responseTime, response.data.error || "创建失败")
      return null
    }
  } catch (error) {
    recordTest("创建采购订单", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 测试2: 提交审批
async function testSubmitApproval(purchaseOrderId) {
  try {
    const approvalData = {
      action: "submit_for_approval",
      comments: "集成测试提交审批"
    }
    
    const response = await makeRequest(
      `${BASE_URL}/api/purchase-orders/${purchaseOrderId}/approve`, 
      'POST', 
      approvalData
    )
    
    const success = response.statusCode === 200 && response.data.success
    recordTest("提交审批", success, response.responseTime, success ? null : response.data.error)
    return success ? response.data.data : null
  } catch (error) {
    recordTest("提交审批", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 测试3: 审批通过
async function testApproveOrder(purchaseOrderId) {
  try {
    const approvalData = {
      action: "approve",
      comments: "集成测试审批通过"
    }
    
    const response = await makeRequest(
      `${BASE_URL}/api/purchase-orders/${purchaseOrderId}/approve`, 
      'POST', 
      approvalData
    )
    
    const success = response.statusCode === 200 && response.data.success
    recordTest("审批通过", success, response.responseTime, success ? null : response.data.error)
    return success ? response.data.data : null
  } catch (error) {
    recordTest("审批通过", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 测试4: 到货验收
async function testReceiveGoods(purchaseOrderId) {
  try {
    const receiveData = {
      warehouseId: testData.warehouse.id,
      items: testData.products.map((p, index) => ({
        id: index + 1, // 假设的订单项目ID
        receiveQuantity: p.quantity,
        notes: "集成测试验收"
      }))
    }
    
    const response = await makeRequest(
      `${BASE_URL}/api/purchase-orders/${purchaseOrderId}/receive`, 
      'POST', 
      receiveData
    )
    
    const success = response.statusCode === 200 && response.data.success
    recordTest("到货验收", success, response.responseTime, success ? null : response.data.error)
    return success ? response.data : null
  } catch (error) {
    recordTest("到货验收", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 测试5: 库存同步
async function testInventorySync(purchaseOrderId) {
  try {
    const syncData = {
      warehouseId: testData.warehouse.id,
      syncType: "auto"
    }
    
    const response = await makeRequest(
      `${BASE_URL}/api/purchase-orders/${purchaseOrderId}/inventory-sync`, 
      'POST', 
      syncData
    )
    
    const success = response.statusCode === 200 && response.data.success
    recordTest("库存同步", success, response.responseTime, success ? null : response.data.error)
    return success ? response.data : null
  } catch (error) {
    recordTest("库存同步", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 测试6: 财务集成
async function testFinanceIntegration(purchaseOrderId) {
  try {
    const financeData = {
      action: "integrate",
      notes: "集成测试财务记录"
    }
    
    const response = await makeRequest(
      `${BASE_URL}/api/purchase-orders/${purchaseOrderId}/finance`, 
      'POST', 
      financeData
    )
    
    const success = response.statusCode === 200 && response.data.success
    recordTest("财务集成", success, response.responseTime, success ? null : response.data.error)
    return success ? response.data : null
  } catch (error) {
    recordTest("财务集成", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 测试7: 获取完整状态
async function testGetOrderStatus(purchaseOrderId) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/purchase-orders/${purchaseOrderId}`)
    
    const success = response.statusCode === 200 && response.data.success
    recordTest("获取订单状态", success, response.responseTime, success ? null : response.data.error)
    return success ? response.data.data : null
  } catch (error) {
    recordTest("获取订单状态", false, error.responseTime || 0, error.error || error.message)
    return null
  }
}

// 运行完整集成测试
async function runIntegrationTests() {
  console.log('🚀 开始采购管理模块完整流程集成测试')
  console.log(`🎯 目标响应时间: ≤${TARGET_RESPONSE_TIME}ms`)
  console.log(`🌐 测试环境: ${BASE_URL}`)
  console.log('=' * 60)
  
  try {
    // 测试1: 创建采购订单
    console.log('\n📝 步骤1: 创建采购订单')
    const purchaseOrder = await testCreatePurchaseOrder()
    if (!purchaseOrder) {
      console.log('❌ 创建采购订单失败，终止测试')
      return
    }
    
    const purchaseOrderId = purchaseOrder.id
    console.log(`✅ 采购订单创建成功，ID: ${purchaseOrderId}`)
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试2: 提交审批
    console.log('\n📋 步骤2: 提交审批')
    const submitResult = await testSubmitApproval(purchaseOrderId)
    if (!submitResult) {
      console.log('⚠️ 提交审批失败，跳过后续审批步骤')
    }
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试3: 审批通过（模拟）
    console.log('\n✅ 步骤3: 审批通过')
    const approveResult = await testApproveOrder(purchaseOrderId)
    if (!approveResult) {
      console.log('⚠️ 审批失败，但继续测试其他功能')
    }
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试4: 到货验收
    console.log('\n📦 步骤4: 到货验收')
    const receiveResult = await testReceiveGoods(purchaseOrderId)
    if (!receiveResult) {
      console.log('⚠️ 到货验收失败，但继续测试')
    }
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试5: 库存同步
    console.log('\n🏪 步骤5: 库存同步')
    const syncResult = await testInventorySync(purchaseOrderId)
    if (!syncResult) {
      console.log('⚠️ 库存同步失败，但继续测试')
    }
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试6: 财务集成
    console.log('\n💰 步骤6: 财务集成')
    const financeResult = await testFinanceIntegration(purchaseOrderId)
    if (!financeResult) {
      console.log('⚠️ 财务集成失败，但继续测试')
    }
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试7: 获取最终状态
    console.log('\n📊 步骤7: 获取最终状态')
    const finalStatus = await testGetOrderStatus(purchaseOrderId)
    if (finalStatus) {
      console.log(`📋 最终订单状态: ${finalStatus.status}`)
      console.log(`💰 订单金额: ¥${finalStatus.totalAmount}`)
    }
    
  } catch (error) {
    console.error('❌ 集成测试执行失败:', error)
  }
  
  // 生成测试报告
  generateTestReport()
}

// 生成测试报告
function generateTestReport() {
  const totalTime = Date.now() - testResults.startTime
  
  console.log('\n' + '=' * 60)
  console.log('📊 集成测试报告')
  console.log('=' * 60)
  
  console.log(`\n📈 总体统计:`)
  console.log(`   测试总数: ${testResults.totalTests}`)
  console.log(`   通过数量: ${testResults.passedTests}/${testResults.totalTests} (${(testResults.passedTests/testResults.totalTests*100).toFixed(1)}%)`)
  console.log(`   失败数量: ${testResults.failedTests}/${testResults.totalTests} (${(testResults.failedTests/testResults.totalTests*100).toFixed(1)}%)`)
  console.log(`   总耗时: ${totalTime}ms`)
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ 失败详情:`)
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`)
    })
  }
  
  // 测试评级
  console.log(`\n🏆 测试评级:`)
  const successRate = testResults.passedTests / testResults.totalTests
  if (successRate === 1) {
    console.log('   🥇 优秀 - 所有测试都通过')
  } else if (successRate >= 0.8) {
    console.log('   🥈 良好 - 大部分测试通过')
  } else if (successRate >= 0.6) {
    console.log('   🥉 一般 - 部分测试需要修复')
  } else {
    console.log('   ⚠️  需要改进 - 多个功能存在问题')
  }
  
  console.log('\n✨ 集成测试完成!')
  
  // 清理测试文件
  try {
    const csvPath = path.join(__dirname, 'test-import.csv')
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath)
    }
  } catch (e) {
    // 忽略清理错误
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ 集成测试执行失败:', error)
    process.exit(1)
  })
}

module.exports = { runIntegrationTests }
