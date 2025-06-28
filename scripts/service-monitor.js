#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

class ServiceMonitor {
  constructor() {
    this.services = [
      {
        name: 'PostgreSQL Docker容器',
        id: 'postgres-docker',
        checkCommand: 'docker ps --filter name=linghua-postgres --format "{{.Status}}"',
        restartCommand: 'docker restart linghua-postgres',
        healthCheck: (output) => output.includes('Up'),
        priority: 'critical'
      },
      {
        name: 'Next.js应用服务',
        id: 'nextjs-app',
        checkCommand: 'lsof -i :3000 | grep LISTEN',
        restartCommand: null, // 需要手动重启
        healthCheck: (output) => output.trim().length > 0,
        priority: 'critical'
      }
    ];
    
    this.monitorLog = [];
    this.alertThreshold = 3; // 连续失败3次后触发告警
    this.checkInterval = 30000; // 30秒检查一次
  }
  
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.monitorLog.push(logEntry);
    
    const prefix = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌',
      'success': '✅'
    }[level] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    // 保持日志大小
    if (this.monitorLog.length > 1000) {
      this.monitorLog = this.monitorLog.slice(-500);
    }
  }
  
  async checkService(service) {
    try {
      const output = execSync(service.checkCommand, { encoding: 'utf8', timeout: 10000 });
      const isHealthy = service.healthCheck(output);
      
      if (isHealthy) {
        this.log(`${service.name} 运行正常`, 'success');
        return { service: service.id, status: 'healthy', output };
      } else {
        this.log(`${service.name} 状态异常: ${output}`, 'warning');
        return { service: service.id, status: 'unhealthy', output };
      }
    } catch (error) {
      this.log(`${service.name} 检查失败: ${error.message}`, 'error');
      return { service: service.id, status: 'error', error: error.message };
    }
  }
  
  async restartService(service) {
    if (!service.restartCommand) {
      this.log(`${service.name} 需要手动重启`, 'warning');
      return false;
    }
    
    try {
      this.log(`正在重启 ${service.name}...`, 'info');
      execSync(service.restartCommand, { encoding: 'utf8', timeout: 30000 });
      
      // 等待服务启动
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 验证重启是否成功
      const checkResult = await this.checkService(service);
      if (checkResult.status === 'healthy') {
        this.log(`${service.name} 重启成功`, 'success');
        return true;
      } else {
        this.log(`${service.name} 重启后仍然异常`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`${service.name} 重启失败: ${error.message}`, 'error');
      return false;
    }
  }
  
  async runHealthCheck() {
    this.log('开始服务健康检查...', 'info');
    
    const results = [];
    let allHealthy = true;
    
    for (const service of this.services) {
      const result = await this.checkService(service);
      results.push(result);
      
      if (result.status !== 'healthy') {
        allHealthy = false;
        
        if (service.priority === 'critical') {
          this.log(`关键服务 ${service.name} 异常，尝试自动修复...`, 'warning');
          
          if (service.restartCommand) {
            const restartSuccess = await this.restartService(service);
            if (!restartSuccess) {
              this.log(`关键服务 ${service.name} 自动修复失败，需要人工干预`, 'error');
            }
          }
        }
      }
    }
    
    // 生成健康报告
    const healthReport = {
      timestamp: new Date().toISOString(),
      overallStatus: allHealthy ? 'healthy' : 'unhealthy',
      services: results,
      recommendations: []
    };
    
    if (!allHealthy) {
      healthReport.recommendations.push('检查异常服务的详细日志');
      healthReport.recommendations.push('如果问题持续，请联系技术支持');
    }
    
    // 保存健康报告
    const reportPath = `reports/service-monitor-${Date.now()}.json`;
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports');
    }
    fs.writeFileSync(reportPath, JSON.stringify(healthReport, null, 2));
    
    this.log(`健康检查完成，报告保存到: ${reportPath}`, 'info');
    
    return healthReport;
  }
  
  async startMonitoring() {
    this.log('启动服务监控...', 'info');
    this.log(`检查间隔: ${this.checkInterval / 1000}秒`, 'info');
    
    // 立即执行一次检查
    await this.runHealthCheck();
    
    // 设置定期检查
    setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        this.log(`监控过程中发生错误: ${error.message}`, 'error');
      }
    }, this.checkInterval);
    
    this.log('服务监控已启动，按 Ctrl+C 停止', 'info');
  }
  
  async runOnceCheck() {
    this.log('执行一次性服务检查...', 'info');
    const report = await this.runHealthCheck();
    
    console.log('\n📊 服务状态总结:');
    console.log(`整体状态: ${report.overallStatus === 'healthy' ? '✅ 健康' : '❌ 异常'}`);
    
    report.services.forEach(service => {
      const status = service.status === 'healthy' ? '✅' : service.status === 'unhealthy' ? '⚠️' : '❌';
      console.log(`${status} ${service.service}`);
    });
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
    return report;
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const monitor = new ServiceMonitor();

if (args.includes('--monitor') || args.includes('-m')) {
  // 持续监控模式
  monitor.startMonitoring().catch(error => {
    console.error('监控启动失败:', error);
    process.exit(1);
  });
  
  // 优雅退出处理
  process.on('SIGINT', () => {
    monitor.log('收到退出信号，停止监控...', 'info');
    process.exit(0);
  });
} else {
  // 一次性检查模式
  monitor.runOnceCheck()
    .then(report => {
      if (report.overallStatus === 'healthy') {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('服务检查失败:', error);
      process.exit(1);
    });
}

module.exports = ServiceMonitor;
