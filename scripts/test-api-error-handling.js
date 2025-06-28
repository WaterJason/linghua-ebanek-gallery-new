/**
 * 测试API错误处理修复
 * 验证数据库操作失败错误是否已修复
 */

async function testApiErrorHandling() {
  console.log('🧪 测试API错误处理修复');
  console.log('=========================\n');

  const testReport = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    }
  };

  // 测试1: 正常API调用
  console.log('📋 1. 测试正常API调用...');
  try {
    const response = await fetch('http://localhost:3003/api/products');
    const data = await response.json();

    testReport.tests.push({
      name: '正常API调用',
      status: 'passed',
      details: `成功获取 ${data.products?.length || 0} 个产品`
    });

    console.log(`   ✅ 成功: 获取到 ${data.products?.length || 0} 个产品`);
  } catch (error) {
    testReport.tests.push({
      name: '正常API调用',
      status: 'failed',
      error: error.message
    });

    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试2: 测试产品创建
  console.log('\n📋 2. 测试产品创建API...');
  try {
    const productData = {
      name: '测试产品_' + Date.now(),
      price: 99.99,
      description: '这是一个测试产品',
      material: '珐琅',
      unit: '套'
    };

    const response = await fetch('http://localhost:3003/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      const result = await response.json();
      testReport.tests.push({
        name: '产品创建API',
        status: 'passed',
        details: `成功创建产品 ID: ${result.product?.id}`
      });

      console.log(`   ✅ 成功: 创建产品 ID ${result.product?.id}`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '产品创建API',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });

      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '产品创建API',
      status: 'failed',
      error: error.message
    });

    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试3: 测试分类API
  console.log('\n📋 3. 测试产品分类API...');
  try {
    const response = await fetch('http://localhost:3003/api/product-categories');

    if (response.ok) {
      const data = await response.json();
      testReport.tests.push({
        name: '产品分类API',
        status: 'passed',
        details: `成功获取 ${data.categories?.length || 0} 个分类`
      });

      console.log(`   ✅ 成功: 获取到 ${data.categories?.length || 0} 个分类`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '产品分类API',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });

      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '产品分类API',
      status: 'failed',
      error: error.message
    });

    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试4: 测试错误处理
  console.log('\n📋 4. 测试错误处理机制...');
  try {
    const response = await fetch('http://localhost:3003/api/products/999999');

    if (response.status === 404) {
      testReport.tests.push({
        name: '404错误处理',
        status: 'passed',
        details: '正确返回404状态码'
      });

      console.log(`   ✅ 成功: 正确处理404错误`);
    } else {
      testReport.tests.push({
        name: '404错误处理',
        status: 'failed',
        error: `期望404，实际收到 ${response.status}`
      });

      console.log(`   ❌ 失败: 期望404，实际收到 ${response.status}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '404错误处理',
      status: 'failed',
      error: error.message
    });

    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试5: 测试数据库连接
  console.log('\n📋 5. 测试数据库连接...');
  try {
    const response = await fetch('http://localhost:3003/api/health');

    if (response.ok) {
      const data = await response.json();
      testReport.tests.push({
        name: '数据库连接',
        status: 'passed',
        details: '数据库连接正常'
      });

      console.log(`   ✅ 成功: 数据库连接正常`);
    } else {
      testReport.tests.push({
        name: '数据库连接',
        status: 'failed',
        error: `HTTP ${response.status}`
      });

      console.log(`   ❌ 失败: 数据库连接异常 HTTP ${response.status}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '数据库连接',
      status: 'failed',
      error: error.message
    });

    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 计算测试结果
  testReport.summary.total = testReport.tests.length;
  testReport.summary.passed = testReport.tests.filter(t => t.status === 'passed').length;
  testReport.summary.failed = testReport.tests.filter(t => t.status === 'failed').length;
  testReport.summary.errors = testReport.tests.filter(t => t.status === 'failed').map(t => t.error);

  // 输出测试总结
  console.log('\n📊 测试总结');
  console.log('===========');
  console.log(`总测试数: ${testReport.summary.total}`);
  console.log(`通过: ${testReport.summary.passed}`);
  console.log(`失败: ${testReport.summary.failed}`);
  console.log(`成功率: ${((testReport.summary.passed / testReport.summary.total) * 100).toFixed(1)}%`);

  if (testReport.summary.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testReport.summary.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // 保存测试报告
  const fs = require('fs');
  const reportPath = `reports/api-error-handling-test-${Date.now()}.json`;

  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportPath}`);

  // 根据结果设置退出码
  if (testReport.summary.passed === testReport.summary.total) {
    console.log('\n🎉 所有测试通过！API错误处理修复成功！');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步检查');
    process.exit(1);
  }
}

// 运行测试
testApiErrorHandling().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
