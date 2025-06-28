/**
 * 测试Prisma字段修复
 * 验证修复后的Prisma操作是否正常工作
 */

async function testPrismaFixes() {
  console.log('🧪 测试Prisma字段修复');
  console.log('===================\n');
  
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

  // 测试1: 测试采购订单创建（已修复orderNumber问题）
  console.log('📋 1. 测试采购订单创建...');
  try {
    const response = await fetch('http://localhost:3003/api/purchase-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supplierId: 1,
        employeeId: 1,
        orderDate: new Date().toISOString(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: '测试采购订单',
        items: [
          {
            productId: 1,
            quantity: 10,
            price: 100
          }
        ]
      }),
    });

    if (response.ok) {
      const result = await response.json();
      testReport.tests.push({
        name: '采购订单创建',
        status: 'passed',
        details: `成功创建采购订单，订单号: ${result.purchaseOrder?.orderNumber || 'N/A'}`
      });
      
      console.log(`   ✅ 成功: 创建采购订单，订单号 ${result.purchaseOrder?.orderNumber || 'N/A'}`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '采购订单创建',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });
      
      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '采购订单创建',
      status: 'failed',
      error: error.message
    });
    
    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试2: 测试渠道创建（已修复type字段问题）
  console.log('\n📋 2. 测试渠道创建...');
  try {
    const response = await fetch('http://localhost:3003/api/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '测试渠道_' + Date.now(),
        code: 'TEST_' + Date.now(),
        type: 'retail',
        description: '这是一个测试渠道',
        contactName: '张三',
        contactPhone: '13800138000',
        status: 'active'
      }),
    });

    if (response.ok) {
      const result = await response.json();
      testReport.tests.push({
        name: '渠道创建',
        status: 'passed',
        details: `成功创建渠道: ${result.channel?.name || 'N/A'}`
      });
      
      console.log(`   ✅ 成功: 创建渠道 ${result.channel?.name || 'N/A'}`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '渠道创建',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });
      
      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '渠道创建',
      status: 'failed',
      error: error.message
    });
    
    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试3: 测试团建订单创建（已修复name, startTime, endTime字段问题）
  console.log('\n📋 3. 测试团建订单创建...');
  try {
    const response = await fetch('http://localhost:3003/api/workshops', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '测试团建活动_' + Date.now(),
        employee: '1',
        date: new Date().toISOString(),
        startTime: '14:00',
        endTime: '16:00',
        role: 'jewelry_workshop',
        locationType: 'in_gallery',
        location: '聆花珐琅馆',
        participants: '10',
        duration: '2'
      }),
    });

    if (response.ok) {
      const result = await response.json();
      testReport.tests.push({
        name: '团建订单创建',
        status: 'passed',
        details: `成功创建团建订单: ${result.name || 'N/A'}`
      });
      
      console.log(`   ✅ 成功: 创建团建订单 ${result.name || 'N/A'}`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '团建订单创建',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });
      
      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '团建订单创建',
      status: 'failed',
      error: error.message
    });
    
    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试4: 测试产品材质添加（验证price字段）
  console.log('\n📋 4. 测试产品材质添加...');
  try {
    const response = await fetch('http://localhost:3003/api/products/materials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material: '测试材质_' + Date.now()
      }),
    });

    if (response.ok) {
      const result = await response.json();
      testReport.tests.push({
        name: '产品材质添加',
        status: 'passed',
        details: `成功添加材质: ${result.material?.name || 'N/A'}`
      });
      
      console.log(`   ✅ 成功: 添加材质 ${result.material?.name || 'N/A'}`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '产品材质添加',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });
      
      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '产品材质添加',
      status: 'failed',
      error: error.message
    });
    
    console.log(`   ❌ 失败: ${error.message}`);
  }

  // 测试5: 测试产品单位添加（验证price字段）
  console.log('\n📋 5. 测试产品单位添加...');
  try {
    const response = await fetch('http://localhost:3003/api/products/units', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unit: '测试单位_' + Date.now()
      }),
    });

    if (response.ok) {
      const result = await response.json();
      testReport.tests.push({
        name: '产品单位添加',
        status: 'passed',
        details: `成功添加单位: ${result.unit?.name || 'N/A'}`
      });
      
      console.log(`   ✅ 成功: 添加单位 ${result.unit?.name || 'N/A'}`);
    } else {
      const errorData = await response.json();
      testReport.tests.push({
        name: '产品单位添加',
        status: 'failed',
        error: errorData.error || `HTTP ${response.status}`
      });
      
      console.log(`   ❌ 失败: ${errorData.error || `HTTP ${response.status}`}`);
    }
  } catch (error) {
    testReport.tests.push({
      name: '产品单位添加',
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
  const reportPath = `reports/prisma-fixes-test-${Date.now()}.json`;
  
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportPath}`);

  // 根据结果设置退出码
  if (testReport.summary.passed === testReport.summary.total) {
    console.log('\n🎉 所有Prisma修复测试通过！');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步检查');
    process.exit(1);
  }
}

// 运行测试
testPrismaFixes().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
