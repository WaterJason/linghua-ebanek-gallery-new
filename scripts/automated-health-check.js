#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

const prisma = new PrismaClient();

async function automatedHealthCheck() {
  console.log('🏥 自动化数据库健康检查');
  console.log('==========================\n');

  const healthReport = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: [],
    alerts: [],
    recommendations: []
  };

  let overallHealth = true;

  try {
    // 1. Docker容器状态检查
    console.log('🐳 1. 检查Docker容器状态...');

    try {
      const containerStatus = execSync('docker ps --filter name=linghua-postgres --format "{{.Status}}"', { encoding: 'utf8' }).trim();

      if (containerStatus.includes('Up')) {
        console.log('   ✅ PostgreSQL容器正在运行');
        healthReport.checks.push({ name: 'docker_container', status: 'healthy', details: containerStatus });
      } else {
        console.log('   ❌ PostgreSQL容器未运行');
        healthReport.checks.push({ name: 'docker_container', status: 'unhealthy', details: containerStatus });
        healthReport.alerts.push('PostgreSQL Docker容器未运行');
        overallHealth = false;
      }
    } catch (error) {
      console.log('   ❌ 无法检查Docker容器状态');
      healthReport.checks.push({ name: 'docker_container', status: 'error', details: error.message });
      healthReport.alerts.push('无法检查Docker容器状态');
      overallHealth = false;
    }

    // 2. 数据库连接检查
    console.log('\n🔗 2. 检查数据库连接...');

    try {
      const startTime = Date.now();
      await prisma.$connect();
      const connectionTime = Date.now() - startTime;

      console.log(`   ✅ 数据库连接成功 (${connectionTime}ms)`);
      healthReport.checks.push({
        name: 'database_connection',
        status: 'healthy',
        details: { connectionTime: `${connectionTime}ms` }
      });

      if (connectionTime > 5000) {
        healthReport.alerts.push(`数据库连接时间过长: ${connectionTime}ms`);
      }
    } catch (error) {
      console.log('   ❌ 数据库连接失败');
      healthReport.checks.push({ name: 'database_connection', status: 'unhealthy', details: error.message });
      healthReport.alerts.push('数据库连接失败');
      overallHealth = false;
    }

    // 3. 核心表数据检查
    console.log('\n📊 3. 检查核心表数据...');

    try {
      const coreTables = {
        users: await prisma.user.count(),
        employees: await prisma.employee.count(),
        customers: await prisma.customer.count(),
        products: await prisma.product.count(),
        orders: await prisma.order.count(),
        schedules: await prisma.schedule.count()
      };

      console.log('   核心表记录统计:');
      Object.entries(coreTables).forEach(([table, count]) => {
        console.log(`   - ${table}: ${count} 条记录`);
      });

      healthReport.checks.push({
        name: 'core_tables',
        status: 'healthy',
        details: coreTables
      });

      // 检查是否有异常的空表
      if (coreTables.users === 0) {
        healthReport.alerts.push('用户表为空');
      }
      if (coreTables.employees === 0) {
        healthReport.alerts.push('员工表为空');
      }

    } catch (error) {
      console.log('   ❌ 核心表检查失败');
      healthReport.checks.push({ name: 'core_tables', status: 'error', details: error.message });
      healthReport.alerts.push('核心表检查失败');
      overallHealth = false;
    }

    // 4. 关键功能测试
    console.log('\n🧪 4. 测试关键功能...');

    try {
      // 测试今日排班查询
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todaySchedules = await prisma.schedule.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { employee: true }
      });

      console.log(`   ✅ 今日排班查询成功 (${todaySchedules.length} 条记录)`);

      // 测试客户查询
      const customers = await prisma.customer.findMany({
        take: 5,
        orderBy: { id: 'asc' }
      });

      console.log(`   ✅ 客户查询成功 (${customers.length} 条记录)`);

      healthReport.checks.push({
        name: 'key_functions',
        status: 'healthy',
        details: {
          scheduleQuery: `${todaySchedules.length} records`,
          customerQuery: `${customers.length} records`
        }
      });

    } catch (error) {
      console.log('   ❌ 关键功能测试失败');
      healthReport.checks.push({ name: 'key_functions', status: 'error', details: error.message });
      healthReport.alerts.push('关键功能测试失败');
      overallHealth = false;
    }

    // 5. 性能指标检查
    console.log('\n⚡ 5. 检查性能指标...');

    try {
      // 检查数据库大小
      const dbSize = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size('linghua_enamel_gallery')) as size;
      `;

      console.log(`   数据库大小: ${dbSize[0].size}`);

      // 检查连接数
      const connections = await prisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active';
      `;

      console.log(`   活跃连接数: ${connections[0].active_connections}`);

      healthReport.checks.push({
        name: 'performance_metrics',
        status: 'healthy',
        details: {
          databaseSize: dbSize[0].size,
          activeConnections: Number(connections[0].active_connections)
        }
      });

      if (parseInt(connections[0].active_connections) > 50) {
        healthReport.alerts.push(`活跃连接数过多: ${connections[0].active_connections}`);
      }

    } catch (error) {
      console.log('   ❌ 性能指标检查失败');
      healthReport.checks.push({ name: 'performance_metrics', status: 'error', details: error.message });
      healthReport.alerts.push('性能指标检查失败');
    }

    // 6. 备份状态检查
    console.log('\n💾 6. 检查备份状态...');

    try {
      const backupDir = 'backups/database';
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.endsWith('.sql'))
          .map(file => {
            const stats = fs.statSync(`${backupDir}/${file}`);
            return {
              name: file,
              size: stats.size,
              modified: stats.mtime
            };
          })
          .sort((a, b) => b.modified - a.modified);

        if (backupFiles.length > 0) {
          const latestBackup = backupFiles[0];
          const backupAge = Date.now() - latestBackup.modified.getTime();
          const hoursOld = Math.floor(backupAge / (1000 * 60 * 60));

          console.log(`   ✅ 最新备份: ${latestBackup.name} (${hoursOld}小时前)`);

          healthReport.checks.push({
            name: 'backup_status',
            status: 'healthy',
            details: {
              latestBackup: latestBackup.name,
              backupAge: `${hoursOld} hours`,
              totalBackups: backupFiles.length
            }
          });

          if (hoursOld > 24) {
            healthReport.alerts.push(`备份文件过旧: ${hoursOld}小时前`);
          }
        } else {
          console.log('   ⚠️  未找到备份文件');
          healthReport.checks.push({ name: 'backup_status', status: 'warning', details: 'No backup files found' });
          healthReport.alerts.push('未找到备份文件');
        }
      } else {
        console.log('   ⚠️  备份目录不存在');
        healthReport.checks.push({ name: 'backup_status', status: 'warning', details: 'Backup directory does not exist' });
        healthReport.alerts.push('备份目录不存在');
      }
    } catch (error) {
      console.log('   ❌ 备份状态检查失败');
      healthReport.checks.push({ name: 'backup_status', status: 'error', details: error.message });
      healthReport.alerts.push('备份状态检查失败');
    }

  } catch (error) {
    console.error('\n❌ 健康检查过程中发生错误:', error.message);
    healthReport.alerts.push(`健康检查过程错误: ${error.message}`);
    overallHealth = false;
  } finally {
    await prisma.$disconnect();
  }

  // 设置整体状态
  healthReport.status = overallHealth ? 'healthy' : 'unhealthy';

  // 生成建议
  if (healthReport.alerts.length === 0) {
    healthReport.recommendations.push('数据库运行状态良好，继续保持定期监控');
  } else {
    healthReport.recommendations.push('立即处理发现的告警问题');
    healthReport.recommendations.push('增加监控频率直到问题解决');
    if (healthReport.alerts.some(alert => alert.includes('连接') || alert.includes('容器'))) {
      healthReport.recommendations.push('检查网络和Docker配置');
    }
    if (healthReport.alerts.some(alert => alert.includes('备份'))) {
      healthReport.recommendations.push('立即执行数据库备份');
    }
  }

  // 保存健康报告
  const reportPath = `reports/health-check-${Date.now()}.json`;
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  fs.writeFileSync(reportPath, JSON.stringify(healthReport, null, 2));

  // 输出总结
  console.log('\n📋 健康检查总结:');
  console.log(`   整体状态: ${healthReport.status === 'healthy' ? '✅ 健康' : '❌ 不健康'}`);
  console.log(`   完成检查: ${healthReport.checks.length} 项`);
  console.log(`   发现告警: ${healthReport.alerts.length} 个`);

  if (healthReport.alerts.length > 0) {
    console.log('\n🚨 告警信息:');
    healthReport.alerts.forEach((alert, index) => {
      console.log(`   ${index + 1}. ${alert}`);
    });
  }

  if (healthReport.recommendations.length > 0) {
    console.log('\n💡 建议措施:');
    healthReport.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log(`\n📄 详细报告已保存到: ${reportPath}`);

  return healthReport;
}

// 运行自动化健康检查
automatedHealthCheck()
  .then((report) => {
    console.log('\n✅ 自动化健康检查完成');
    if (report.status === 'healthy') {
      console.log('🎉 数据库健康状态良好');
      process.exit(0);
    } else {
      console.log('⚠️  发现健康问题，需要立即处理');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 自动化健康检查失败:', error);
    process.exit(1);
  });
