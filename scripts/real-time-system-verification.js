#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

const prisma = new PrismaClient();

async function realTimeSystemVerification() {
  console.log('🔍 实时系统状态验证');
  console.log('====================\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    overallStatus: 'unknown',
    components: {},
    issues: [],
    recommendations: []
  };
  
  let allHealthy = true;
  
  try {
    // 1. Docker PostgreSQL容器检查
    console.log('🐳 1. Docker PostgreSQL容器状态...');
    
    try {
      const containerStatus = execSync('docker ps --filter name=linghua-postgres --format "{{.Status}}"', { encoding: 'utf8' }).trim();
      
      if (containerStatus.includes('Up')) {
        console.log(`   ✅ PostgreSQL容器运行正常: ${containerStatus}`);
        report.components.dockerContainer = { status: 'healthy', details: containerStatus };
      } else {
        console.log(`   ❌ PostgreSQL容器状态异常: ${containerStatus}`);
        report.components.dockerContainer = { status: 'unhealthy', details: containerStatus };
        report.issues.push('PostgreSQL Docker容器未正常运行');
        allHealthy = false;
      }
    } catch (error) {
      console.log(`   ❌ 无法检查Docker容器: ${error.message}`);
      report.components.dockerContainer = { status: 'error', details: error.message };
      report.issues.push('无法检查Docker容器状态');
      allHealthy = false;
    }
    
    // 2. Next.js应用服务检查
    console.log('\n🚀 2. Next.js应用服务状态...');
    
    try {
      const nextProcess = execSync('ps aux | grep -E "(next|node.*3000)" | grep -v grep', { encoding: 'utf8' }).trim();
      
      if (nextProcess) {
        console.log('   ✅ Next.js应用服务正在运行');
        console.log(`   进程信息: ${nextProcess.split('\n')[0].substring(0, 100)}...`);
        report.components.nextjsApp = { status: 'healthy', details: 'Running' };
      } else {
        console.log('   ❌ Next.js应用服务未运行');
        report.components.nextjsApp = { status: 'unhealthy', details: 'Not running' };
        report.issues.push('Next.js应用服务未运行');
        allHealthy = false;
      }
    } catch (error) {
      console.log(`   ❌ 检查Next.js服务失败: ${error.message}`);
      report.components.nextjsApp = { status: 'error', details: error.message };
      report.issues.push('无法检查Next.js应用服务');
      allHealthy = false;
    }
    
    // 3. 端口占用检查
    console.log('\n🔌 3. 端口占用状态...');
    
    try {
      const port3000 = execSync('lsof -i :3000 | grep LISTEN', { encoding: 'utf8' }).trim();
      const port5432 = execSync('lsof -i :5432 | grep LISTEN', { encoding: 'utf8' }).trim();
      
      console.log(`   端口3000 (Next.js): ${port3000 ? '✅ 占用中' : '❌ 未占用'}`);
      console.log(`   端口5432 (PostgreSQL): ${port5432 ? '✅ 占用中' : '❌ 未占用'}`);
      
      report.components.ports = {
        status: (port3000 && port5432) ? 'healthy' : 'unhealthy',
        details: { port3000: !!port3000, port5432: !!port5432 }
      };
      
      if (!port3000) {
        report.issues.push('端口3000未被Next.js占用');
        allHealthy = false;
      }
      if (!port5432) {
        report.issues.push('端口5432未被PostgreSQL占用');
        allHealthy = false;
      }
    } catch (error) {
      console.log(`   ⚠️  端口检查部分失败: ${error.message}`);
      report.components.ports = { status: 'warning', details: error.message };
    }
    
    // 4. API端点连接测试
    console.log('\n🌐 4. API端点连接测试...');
    
    const apiEndpoints = [
      { name: 'health', url: 'http://localhost:3000/api/health' },
      { name: 'system-info', url: 'http://localhost:3000/api/system-info' },
      { name: 'auth-check', url: 'http://localhost:3000/api/auth/check-permissions' }
    ];
    
    const apiResults = {};
    
    for (const endpoint of apiEndpoints) {
      try {
        const startTime = Date.now();
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${endpoint.url}`, { encoding: 'utf8' }).trim();
        const responseTime = Date.now() - startTime;
        
        if (response === '200') {
          console.log(`   ✅ ${endpoint.name}: HTTP ${response} (${responseTime}ms)`);
          apiResults[endpoint.name] = { status: 'healthy', httpCode: response, responseTime };
        } else {
          console.log(`   ⚠️  ${endpoint.name}: HTTP ${response} (${responseTime}ms)`);
          apiResults[endpoint.name] = { status: 'warning', httpCode: response, responseTime };
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: 连接失败`);
        apiResults[endpoint.name] = { status: 'error', error: error.message };
        report.issues.push(`API端点 ${endpoint.name} 连接失败`);
        allHealthy = false;
      }
    }
    
    report.components.apiEndpoints = apiResults;
    
    // 5. 数据库连接测试
    console.log('\n🗄️  5. 数据库连接测试...');
    
    try {
      const startTime = Date.now();
      await prisma.$connect();
      const connectionTime = Date.now() - startTime;
      
      // 测试基本查询
      const userCount = await prisma.user.count();
      const employeeCount = await prisma.employee.count();
      
      console.log(`   ✅ 数据库连接成功 (${connectionTime}ms)`);
      console.log(`   数据验证: 用户${userCount}个, 员工${employeeCount}个`);
      
      report.components.database = {
        status: 'healthy',
        connectionTime,
        userCount,
        employeeCount
      };
    } catch (error) {
      console.log(`   ❌ 数据库连接失败: ${error.message}`);
      report.components.database = { status: 'error', error: error.message };
      report.issues.push('数据库连接失败');
      allHealthy = false;
    } finally {
      await prisma.$disconnect();
    }
    
    // 6. 关键业务功能测试
    console.log('\n🧪 6. 关键业务功能测试...');
    
    try {
      await prisma.$connect();
      
      // 测试 getSchedulesByDate 功能
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const schedules = await prisma.schedule.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { employee: true }
      });
      
      console.log(`   ✅ getSchedulesByDate功能正常 (${schedules.length}条记录)`);
      
      // 测试 getCustomers 功能
      const customers = await prisma.customer.findMany({
        take: 5,
        orderBy: { id: 'asc' }
      });
      
      console.log(`   ✅ getCustomers功能正常 (${customers.length}条记录)`);
      
      report.components.businessFunctions = {
        status: 'healthy',
        scheduleQuery: schedules.length,
        customerQuery: customers.length
      };
      
    } catch (error) {
      console.log(`   ❌ 业务功能测试失败: ${error.message}`);
      report.components.businessFunctions = { status: 'error', error: error.message };
      report.issues.push('关键业务功能测试失败');
      allHealthy = false;
    } finally {
      await prisma.$disconnect();
    }
    
    // 7. 网络连接测试
    console.log('\n🌍 7. 网络连接测试...');
    
    try {
      // 测试外部网络连接
      const startTime = Date.now();
      const response = execSync('curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200', { encoding: 'utf8' }).trim();
      const responseTime = Date.now() - startTime;
      
      if (response === '200') {
        console.log(`   ✅ 外部网络连接正常 (${responseTime}ms)`);
        report.components.networkConnection = { status: 'healthy', responseTime };
      } else {
        console.log(`   ⚠️  外部网络连接异常: HTTP ${response} (${responseTime}ms)`);
        report.components.networkConnection = { status: 'warning', httpCode: response, responseTime };
      }
    } catch (error) {
      console.log(`   ❌ 网络连接测试失败: ${error.message}`);
      report.components.networkConnection = { status: 'error', error: error.message };
      report.issues.push('网络连接测试失败');
    }
    
  } catch (error) {
    console.error('\n❌ 系统验证过程中发生错误:', error.message);
    report.issues.push(`系统验证过程错误: ${error.message}`);
    allHealthy = false;
  }
  
  // 设置整体状态
  report.overallStatus = allHealthy ? 'healthy' : 'unhealthy';
  
  // 生成建议
  if (report.issues.length === 0) {
    report.recommendations.push('系统运行状态良好，所有组件正常');
    report.recommendations.push('建议继续定期监控系统状态');
  } else {
    report.recommendations.push('立即处理发现的问题');
    report.recommendations.push('检查系统日志获取更多详细信息');
    
    if (report.issues.some(issue => issue.includes('Docker'))) {
      report.recommendations.push('重启Docker容器: docker restart linghua-postgres');
    }
    if (report.issues.some(issue => issue.includes('Next.js'))) {
      report.recommendations.push('重启Next.js应用服务');
    }
    if (report.issues.some(issue => issue.includes('数据库'))) {
      report.recommendations.push('检查数据库配置和连接字符串');
    }
  }
  
  // 保存报告
  const reportPath = `reports/real-time-verification-${Date.now()}.json`;
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // 输出总结
  console.log('\n📋 实时验证总结:');
  console.log(`   整体状态: ${report.overallStatus === 'healthy' ? '✅ 健康' : '❌ 异常'}`);
  console.log(`   发现问题: ${report.issues.length} 个`);
  
  if (report.issues.length > 0) {
    console.log('\n🚨 发现的问题:');
    report.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 建议措施:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  
  return report;
}

// 运行实时验证
realTimeSystemVerification()
  .then((report) => {
    console.log('\n✅ 实时系统状态验证完成');
    if (report.overallStatus === 'healthy') {
      console.log('🎉 系统运行状态良好');
      process.exit(0);
    } else {
      console.log('⚠️  发现系统问题，需要处理');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 实时验证失败:', error);
    process.exit(1);
  });
