#!/usr/bin/env node

/**
 * 采购管理模块API性能测试脚本
 * 测试所有API的响应时间是否≤120ms
 */

const https = require('https')
const http = require('http')

// 测试配置
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TARGET_RESPONSE_TIME = 120 // ms

// 测试用例
const testCases = [
  {
    name: "导入历史记录API",
    method: "GET",
    path: "/api/purchase-orders/import?limit=10&offset=0"
  },
  {
    name: "审批历史记录API", 
    method: "GET",
    path: "/api/purchase-orders/1/approve"
  },
  {
    name: "验收记录API",
    method: "GET", 
    path: "/api/purchase-orders/1/receive"
  },
  {
    name: "库存同步状态API",
    method: "GET",
    path: "/api/purchase-orders/1/inventory-sync"
  }
]

// 执行HTTP请求
function makeRequest(url, method = 'GET', data = null) {
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
        'User-Agent': 'API-Test-Script/1.0'
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
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: responseData,
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
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// 运行单个测试
async function runTest(testCase) {
  const url = `${BASE_URL}${testCase.path}`
  
  console.log(`\n🧪 测试: ${testCase.name}`)
  console.log(`📍 URL: ${testCase.method} ${testCase.path}`)
  
  try {
    const result = await makeRequest(url, testCase.method, testCase.data)
    
    const isSuccess = result.statusCode >= 200 && result.statusCode < 400
    const isPerformant = result.responseTime <= TARGET_RESPONSE_TIME
    
    console.log(`⏱️  响应时间: ${result.responseTime}ms`)
    console.log(`📊 状态码: ${result.statusCode}`)
    console.log(`✅ 性能达标: ${isPerformant ? '是' : '否'} (目标: ≤${TARGET_RESPONSE_TIME}ms)`)
    
    if (!isSuccess) {
      console.log(`❌ 请求失败: HTTP ${result.statusCode}`)
      if (result.data) {
        try {
          const errorData = JSON.parse(result.data)
          console.log(`📝 错误信息: ${errorData.error || errorData.message || '未知错误'}`)
        } catch (e) {
          console.log(`📝 响应内容: ${result.data.substring(0, 200)}...`)
        }
      }
    }
    
    return {
      name: testCase.name,
      success: isSuccess,
      responseTime: result.responseTime,
      performant: isPerformant,
      statusCode: result.statusCode
    }
    
  } catch (error) {
    console.log(`❌ 请求失败: ${error.error}`)
    console.log(`⏱️  响应时间: ${error.responseTime}ms`)
    
    return {
      name: testCase.name,
      success: false,
      responseTime: error.responseTime,
      performant: error.responseTime <= TARGET_RESPONSE_TIME,
      error: error.error
    }
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始采购管理模块API性能测试')
  console.log(`🎯 目标响应时间: ≤${TARGET_RESPONSE_TIME}ms`)
  console.log(`🌐 测试环境: ${BASE_URL}`)
  console.log('=' * 50)
  
  const results = []
  
  for (const testCase of testCases) {
    const result = await runTest(testCase)
    results.push(result)
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 生成测试报告
  console.log('\n' + '=' * 50)
  console.log('📊 测试报告')
  console.log('=' * 50)
  
  const successCount = results.filter(r => r.success).length
  const performantCount = results.filter(r => r.performant).length
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  
  console.log(`\n📈 总体统计:`)
  console.log(`   测试总数: ${results.length}`)
  console.log(`   成功数量: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`)
  console.log(`   性能达标: ${performantCount}/${results.length} (${(performantCount/results.length*100).toFixed(1)}%)`)
  console.log(`   平均响应时间: ${avgResponseTime.toFixed(1)}ms`)
  
  console.log(`\n📋 详细结果:`)
  results.forEach(result => {
    const statusIcon = result.success ? '✅' : '❌'
    const perfIcon = result.performant ? '🚀' : '🐌'
    console.log(`   ${statusIcon} ${perfIcon} ${result.name}: ${result.responseTime}ms`)
    if (result.error) {
      console.log(`      错误: ${result.error}`)
    }
  })
  
  // 性能评级
  console.log(`\n🏆 性能评级:`)
  if (performantCount === results.length) {
    console.log('   🥇 优秀 - 所有API响应时间都达标')
  } else if (performantCount >= results.length * 0.8) {
    console.log('   🥈 良好 - 大部分API响应时间达标')
  } else if (performantCount >= results.length * 0.6) {
    console.log('   🥉 一般 - 部分API需要优化')
  } else {
    console.log('   ⚠️  需要改进 - 多个API响应时间超标')
  }
  
  console.log('\n✨ 测试完成!')
  
  // 返回测试结果
  return {
    totalTests: results.length,
    successCount,
    performantCount,
    avgResponseTime,
    results
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ 测试执行失败:', error)
    process.exit(1)
  })
}

module.exports = { runAllTests, runTest, makeRequest }
