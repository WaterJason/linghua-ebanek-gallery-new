#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

const prisma = new PrismaClient();

async function improvedSystemDiagnostics() {
  console.log('🔧 改进的系统诊断工具');
  console.log('========================\n');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    version: '2.0',
    reportType: 'ERP系统改进诊断报告',
    overall: 'unknown',
    summary: {
      healthyCount: 0,
      warningCount: 0,
      errorCount: 0,
      totalChecks: 0
    },
    components: [],
    recommendations: [],
    metadata: {
      diagnosticDuration: 0,
      retryAttempts: 3,
      timeoutSeconds: 10
    }
  };
  
  const startTime = Date.now();
  let healthyCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  
  // 辅助函数：重试机制
  async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`   重试 ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // 1. Docker容器状态检查
  console.log('🐳 1. Docker容器状态检查...');
  
  const dockerCheck = {
    id: 'docker-container',
    name: 'Docker PostgreSQL容器',
    status: 'unknown',
    priority: 'P0',
    details: {},
    suggestions: []
  };
  
  try {
    const containerInfo = await retryOperation(() => {
      const status = execSync('docker ps --filter name=linghua-postgres --format "{{.Status}}"', { encoding: 'utf8' }).trim();
      const ports = execSync('docker port linghua-postgres', { encoding: 'utf8' }).trim();
      return { status, ports };
    });
    
    if (containerInfo.status.includes('Up')) {
      dockerCheck.status = 'healthy';
      dockerCheck.details = {
        status: containerInfo.status,
        ports: containerInfo.ports,
        message: 'PostgreSQL容器运行正常'
      };
      console.log(`   ✅ PostgreSQL容器正常: ${containerInfo.status}`);
      healthyCount++;
    } else {
      dockerCheck.status = 'error';
      dockerCheck.details = { status: containerInfo.status, message: 'PostgreSQL容器未运行' };
      dockerCheck.suggestions = ['重启Docker容器: docker restart linghua-postgres'];
      console.log(`   ❌ PostgreSQL容器异常: ${containerInfo.status}`);
      errorCount++;
    }
  } catch (error) {
    dockerCheck.status = 'error';
    dockerCheck.details = { error: error.message, message: '无法检查Docker容器状态' };
    dockerCheck.suggestions = ['检查Docker服务是否运行', '验证容器名称是否正确'];
    console.log(`   ❌ Docker检查失败: ${error.message}`);
    errorCount++;
  }
  
  diagnostics.components.push(dockerCheck);
  
  // 2. Next.js应用服务检查
  console.log('\n🚀 2. Next.js应用服务检查...');
  
  const nextjsCheck = {
    id: 'nextjs-app',
    name: 'Next.js应用服务',
    status: 'unknown',
    priority: 'P0',
    details: {},
    suggestions: []
  };
  
  try {
    const processInfo = await retryOperation(() => {
      const processes = execSync('ps aux | grep -E "(next|node.*3000)" | grep -v grep', { encoding: 'utf8' }).trim();
      const portCheck = execSync('lsof -i :3000 | grep LISTEN', { encoding: 'utf8' }).trim();
      return { processes, portCheck };
    });
    
    if (processInfo.processes && processInfo.portCheck) {
      nextjsCheck.status = 'healthy';
      nextjsCheck.details = {
        processRunning: true,
        portListening: true,
        message: 'Next.js应用服务运行正常'
      };
      console.log('   ✅ Next.js应用服务正常运行');
      healthyCount++;
    } else {
      nextjsCheck.status = 'error';
      nextjsCheck.details = {
        processRunning: !!processInfo.processes,
        portListening: !!processInfo.portCheck,
        message: 'Next.js应用服务异常'
      };
      nextjsCheck.suggestions = ['重启Next.js应用: npm run dev', '检查端口3000是否被占用'];
      console.log('   ❌ Next.js应用服务异常');
      errorCount++;
    }
  } catch (error) {
    nextjsCheck.status = 'error';
    nextjsCheck.details = { error: error.message, message: '无法检查Next.js应用服务' };
    nextjsCheck.suggestions = ['检查Node.js是否安装', '验证应用是否正确启动'];
    console.log(`   ❌ Next.js检查失败: ${error.message}`);
    errorCount++;
  }
  
  diagnostics.components.push(nextjsCheck);
  
  // 3. API端点连接检查
  console.log('\n🌐 3. API端点连接检查...');
  
  const apiEndpoints = [
    { id: 'health-api', name: '健康检查API', url: 'http://localhost:3000/api/health', expectedStatus: 200 },
    { id: 'system-info-api', name: '系统信息API', url: 'http://localhost:3000/api/system-info', expectedStatus: 200 },
    { id: 'auth-api', name: '认证API', url: 'http://localhost:3000/api/auth/check-permissions', expectedStatus: 401 } // 401是正常的
  ];
  
  for (const endpoint of apiEndpoints) {
    const apiCheck = {
      id: endpoint.id,
      name: endpoint.name,
      status: 'unknown',
      priority: 'P0',
      details: {},
      suggestions: []
    };
    
    try {
      const result = await retryOperation(async () => {
        const startTime = Date.now();
        const httpCode = execSync(`curl -s -o /dev/null -w "%{http_code}" ${endpoint.url}`, { encoding: 'utf8' }).trim();
        const responseTime = Date.now() - startTime;
        return { httpCode: parseInt(httpCode), responseTime };
      });
      
      if (result.httpCode === endpoint.expectedStatus) {
        apiCheck.status = 'healthy';
        apiCheck.details = {
          httpCode: result.httpCode,
          responseTime: result.responseTime,
          message: `API响应正常 (${result.responseTime}ms)`
        };
        console.log(`   ✅ ${endpoint.name}: HTTP ${result.httpCode} (${result.responseTime}ms)`);
        healthyCount++;
      } else {
        apiCheck.status = 'warning';
        apiCheck.details = {
          httpCode: result.httpCode,
          expectedCode: endpoint.expectedStatus,
          responseTime: result.responseTime,
          message: `API响应状态码异常`
        };
        apiCheck.suggestions = ['检查API路由配置', '验证服务器状态'];
        console.log(`   ⚠️  ${endpoint.name}: HTTP ${result.httpCode} (期望${endpoint.expectedStatus})`);
        warningCount++;
      }
    } catch (error) {
      apiCheck.status = 'error';
      apiCheck.details = { error: error.message, message: 'API连接失败' };
      apiCheck.suggestions = ['检查网络连接', '验证API服务状态', '重启应用服务'];
      console.log(`   ❌ ${endpoint.name}: 连接失败`);
      errorCount++;
    }
    
    diagnostics.components.push(apiCheck);
  }
  
  // 4. 数据库连接检查
  console.log('\n🗄️  4. 数据库连接检查...');
  
  const dbCheck = {
    id: 'database-connection',
    name: '数据库连接',
    status: 'unknown',
    priority: 'P0',
    details: {},
    suggestions: []
  };
  
  try {
    const dbResult = await retryOperation(async () => {
      const startTime = Date.now();
      await prisma.$connect();
      const connectionTime = Date.now() - startTime;
      
      const counts = {
        users: await prisma.user.count(),
        employees: await prisma.employee.count(),
        customers: await prisma.customer.count()
      };
      
      return { connectionTime, counts };
    });
    
    dbCheck.status = 'healthy';
    dbCheck.details = {
      connectionTime: dbResult.connectionTime,
      dataCounts: dbResult.counts,
      message: `数据库连接正常 (${dbResult.connectionTime}ms)`
    };
    console.log(`   ✅ 数据库连接正常 (${dbResult.connectionTime}ms)`);
    console.log(`   数据统计: 用户${dbResult.counts.users}, 员工${dbResult.counts.employees}, 客户${dbResult.counts.customers}`);
    healthyCount++;
    
  } catch (error) {
    dbCheck.status = 'error';
    dbCheck.details = { error: error.message, message: '数据库连接失败' };
    dbCheck.suggestions = ['检查PostgreSQL容器状态', '验证数据库连接配置', '重启数据库服务'];
    console.log(`   ❌ 数据库连接失败: ${error.message}`);
    errorCount++;
  } finally {
    await prisma.$disconnect();
  }
  
  diagnostics.components.push(dbCheck);
  
  // 5. 关键业务功能检查
  console.log('\n🧪 5. 关键业务功能检查...');
  
  const businessCheck = {
    id: 'business-functions',
    name: '关键业务功能',
    status: 'unknown',
    priority: 'P1',
    details: {},
    suggestions: []
  };
  
  try {
    const businessResult = await retryOperation(async () => {
      await prisma.$connect();
      
      // 测试排班查询
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const schedules = await prisma.schedule.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        include: { employee: true }
      });
      
      // 测试客户查询
      const customers = await prisma.customer.findMany({
        take: 5,
        orderBy: { id: 'asc' }
      });
      
      return { scheduleCount: schedules.length, customerCount: customers.length };
    });
    
    businessCheck.status = 'healthy';
    businessCheck.details = {
      scheduleQuery: businessResult.scheduleCount,
      customerQuery: businessResult.customerCount,
      message: '关键业务功能正常'
    };
    console.log(`   ✅ getSchedulesByDate: ${businessResult.scheduleCount}条记录`);
    console.log(`   ✅ getCustomers: ${businessResult.customerCount}条记录`);
    healthyCount++;
    
  } catch (error) {
    businessCheck.status = 'error';
    businessCheck.details = { error: error.message, message: '业务功能测试失败' };
    businessCheck.suggestions = ['检查数据库数据完整性', '验证Prisma配置', '重新生成Prisma客户端'];
    console.log(`   ❌ 业务功能测试失败: ${error.message}`);
    errorCount++;
  } finally {
    await prisma.$disconnect();
  }
  
  diagnostics.components.push(businessCheck);
  
  // 计算总结
  const totalChecks = diagnostics.components.length;
  diagnostics.summary = {
    healthyCount,
    warningCount,
    errorCount,
    totalChecks
  };
  
  // 设置整体状态
  if (errorCount === 0 && warningCount === 0) {
    diagnostics.overall = 'healthy';
  } else if (errorCount === 0) {
    diagnostics.overall = 'warning';
  } else {
    diagnostics.overall = 'error';
  }
  
  // 生成建议
  if (diagnostics.overall === 'healthy') {
    diagnostics.recommendations = [
      '系统运行状态良好，所有组件正常',
      '建议继续定期监控',
      '保持当前的维护计划'
    ];
  } else {
    diagnostics.recommendations = [
      '立即处理发现的错误问题',
      '监控警告状态的组件',
      '执行相关组件的修复建议'
    ];
  }
  
  diagnostics.metadata.diagnosticDuration = Date.now() - startTime;
  
  // 保存报告
  const reportPath = `reports/improved-diagnostics-${Date.now()}.json`;
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  fs.writeFileSync(reportPath, JSON.stringify(diagnostics, null, 2));
  
  // 输出总结
  console.log('\n📊 改进诊断总结:');
  console.log(`   整体状态: ${diagnostics.overall === 'healthy' ? '✅ 健康' : diagnostics.overall === 'warning' ? '⚠️  警告' : '❌ 错误'}`);
  console.log(`   健康组件: ${healthyCount}/${totalChecks}`);
  console.log(`   警告组件: ${warningCount}/${totalChecks}`);
  console.log(`   错误组件: ${errorCount}/${totalChecks}`);
  console.log(`   诊断耗时: ${diagnostics.metadata.diagnosticDuration}ms`);
  
  if (errorCount > 0 || warningCount > 0) {
    console.log('\n🔧 需要关注的组件:');
    diagnostics.components.forEach(component => {
      if (component.status !== 'healthy') {
        console.log(`   ${component.status === 'error' ? '❌' : '⚠️'} ${component.name}: ${component.details.message}`);
      }
    });
  }
  
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  
  return diagnostics;
}

// 运行改进诊断
improvedSystemDiagnostics()
  .then((report) => {
    console.log('\n✅ 改进系统诊断完成');
    if (report.overall === 'healthy') {
      console.log('🎉 系统状态完全健康');
      process.exit(0);
    } else if (report.overall === 'warning') {
      console.log('⚠️  系统有警告，但可正常运行');
      process.exit(0);
    } else {
      console.log('❌ 系统有严重问题，需要立即处理');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 改进诊断失败:', error);
    process.exit(1);
  });
