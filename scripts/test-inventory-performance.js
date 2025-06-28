/**
 * 产品库存模块性能测试脚本
 * 验证API响应时间、并发处理能力和数据一致性
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// 测试配置
const TEST_CONFIG = {
  warehouseId: 1,
  concurrentRequests: 10,
  maxResponseTime: 120, // ms
  testDataSize: 100
}

// 性能测试结果
const testResults = {
  apiResponseTimes: [],
  concurrentTestResults: [],
  dataConsistencyResults: [],
  errors: []
}

/**
 * 测试API响应时间
 */
async function testApiResponseTime() {
  console.log('🚀 开始API响应时间测试...')
  
  const testCases = [
    {
      name: '获取产品库存列表',
      url: `/api/inventory/products?warehouseId=${TEST_CONFIG.warehouseId}`,
      method: 'GET'
    },
    {
      name: '更新库存数量',
      url: `/api/inventory/products/1`,
      method: 'PATCH',
      body: {
        field: 'quantity',
        value: 100,
        warehouseId: TEST_CONFIG.warehouseId,
        timestamp: Date.now()
      }
    },
    {
      name: '数据同步验证',
      url: `/api/inventory/sync?action=validate`,
      method: 'GET'
    }
  ]

  for (const testCase of testCases) {
    try {
      const startTime = Date.now()
      
      const response = await fetch(`${API_BASE_URL}${testCase.url}`, {
        method: testCase.method,
        headers: testCase.body ? { 'Content-Type': 'application/json' } : {},
        body: testCase.body ? JSON.stringify(testCase.body) : undefined
      })
      
      const responseTime = Date.now() - startTime
      const isSuccess = response.ok
      
      testResults.apiResponseTimes.push({
        name: testCase.name,
        responseTime,
        isSuccess,
        status: response.status
      })
      
      console.log(`  ✓ ${testCase.name}: ${responseTime}ms (${response.status})`)
      
      if (responseTime > TEST_CONFIG.maxResponseTime) {
        console.warn(`  ⚠️  响应时间超过${TEST_CONFIG.maxResponseTime}ms阈值`)
      }
      
    } catch (error) {
      console.error(`  ❌ ${testCase.name}: ${error.message}`)
      testResults.errors.push({
        test: testCase.name,
        error: error.message
      })
    }
  }
}

/**
 * 测试并发处理能力
 */
async function testConcurrentRequests() {
  console.log('🔄 开始并发处理能力测试...')
  
  const requests = Array.from({ length: TEST_CONFIG.concurrentRequests }, (_, i) => {
    return async () => {
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/products?warehouseId=${TEST_CONFIG.warehouseId}`, {
          method: 'GET'
        })
        
        const responseTime = Date.now() - startTime
        
        return {
          requestId: i + 1,
          responseTime,
          isSuccess: response.ok,
          status: response.status
        }
      } catch (error) {
        return {
          requestId: i + 1,
          responseTime: Date.now() - startTime,
          isSuccess: false,
          error: error.message
        }
      }
    }
  })

  try {
    const startTime = Date.now()
    const results = await Promise.all(requests.map(req => req()))
    const totalTime = Date.now() - startTime
    
    testResults.concurrentTestResults = results
    
    const successCount = results.filter(r => r.isSuccess).length
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    
    console.log(`  ✓ 并发请求完成: ${successCount}/${TEST_CONFIG.concurrentRequests} 成功`)
    console.log(`  ✓ 平均响应时间: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`  ✓ 总耗时: ${totalTime}ms`)
    
    if (avgResponseTime > TEST_CONFIG.maxResponseTime) {
      console.warn(`  ⚠️  平均响应时间超过${TEST_CONFIG.maxResponseTime}ms阈值`)
    }
    
  } catch (error) {
    console.error(`  ❌ 并发测试失败: ${error.message}`)
    testResults.errors.push({
      test: '并发处理测试',
      error: error.message
    })
  }
}

/**
 * 测试数据一致性
 */
async function testDataConsistency() {
  console.log('🔍 开始数据一致性测试...')
  
  try {
    // 验证数据一致性
    const response = await fetch(`${API_BASE_URL}/api/inventory/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'validate_consistency'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    testResults.dataConsistencyResults.push(result)
    
    if (result.success) {
      console.log('  ✓ 数据一致性验证通过')
      if (result.data?.inconsistencies?.length > 0) {
        console.warn(`  ⚠️  发现 ${result.data.inconsistencies.length} 个数据不一致问题`)
      }
    } else {
      console.error('  ❌ 数据一致性验证失败')
    }
    
  } catch (error) {
    console.error(`  ❌ 数据一致性测试失败: ${error.message}`)
    testResults.errors.push({
      test: '数据一致性测试',
      error: error.message
    })
  }
}

/**
 * 测试移动端兼容性
 */
async function testMobileCompatibility() {
  console.log('📱 开始移动端兼容性测试...')
  
  // 模拟移动端User-Agent
  const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory/products?warehouseId=${TEST_CONFIG.warehouseId}`, {
      method: 'GET',
      headers: {
        'User-Agent': mobileUserAgent
      }
    })
    
    if (response.ok) {
      console.log('  ✓ 移动端API访问正常')
    } else {
      console.error(`  ❌ 移动端API访问失败: ${response.status}`)
    }
    
  } catch (error) {
    console.error(`  ❌ 移动端兼容性测试失败: ${error.message}`)
    testResults.errors.push({
      test: '移动端兼容性测试',
      error: error.message
    })
  }
}

/**
 * 生成测试报告
 */
function generateTestReport() {
  console.log('\n📊 测试报告生成中...')
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.apiResponseTimes.length + testResults.concurrentTestResults.length + testResults.dataConsistencyResults.length,
      errors: testResults.errors.length,
      avgApiResponseTime: testResults.apiResponseTimes.length > 0 
        ? testResults.apiResponseTimes.reduce((sum, r) => sum + r.responseTime, 0) / testResults.apiResponseTimes.length 
        : 0,
      concurrentTestSuccess: testResults.concurrentTestResults.filter(r => r.isSuccess).length,
      dataConsistencyPassed: testResults.dataConsistencyResults.every(r => r.success)
    },
    details: testResults
  }
  
  console.log('\n📋 测试总结:')
  console.log(`  总测试数: ${report.summary.totalTests}`)
  console.log(`  错误数: ${report.summary.errors}`)
  console.log(`  平均API响应时间: ${report.summary.avgApiResponseTime.toFixed(2)}ms`)
  console.log(`  并发测试成功率: ${(report.summary.concurrentTestSuccess / TEST_CONFIG.concurrentRequests * 100).toFixed(1)}%`)
  console.log(`  数据一致性: ${report.summary.dataConsistencyPassed ? '通过' : '失败'}`)
  
  // 性能评估
  if (report.summary.avgApiResponseTime <= TEST_CONFIG.maxResponseTime) {
    console.log('  🎉 性能测试通过！')
  } else {
    console.log('  ⚠️  性能需要优化')
  }
  
  return report
}

/**
 * 主测试函数
 */
async function runPerformanceTests() {
  console.log('🧪 产品库存模块性能测试开始\n')
  
  try {
    await testApiResponseTime()
    console.log('')
    
    await testConcurrentRequests()
    console.log('')
    
    await testDataConsistency()
    console.log('')
    
    await testMobileCompatibility()
    console.log('')
    
    const report = generateTestReport()
    
    // 保存测试报告
    const fs = require('fs')
    const path = require('path')
    
    const reportPath = path.join(__dirname, '../docs/performance-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`\n📄 详细报告已保存到: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runPerformanceTests()
}

module.exports = {
  runPerformanceTests,
  testApiResponseTime,
  testConcurrentRequests,
  testDataConsistency,
  generateTestReport
}
