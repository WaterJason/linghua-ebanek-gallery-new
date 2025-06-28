#!/usr/bin/env node

/**
 * BMAD系统监控脚本
 * 持续监控系统状态，自动检测和修复问题
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BMadSystemMonitor {
  constructor() {
    this.monitoringActive = false;
    this.checkInterval = 30000; // 30秒检查一次
    this.healthStatus = {
      database: 'unknown',
      api: 'unknown',
      frontend: 'unknown',
      performance: 'unknown'
    };
    this.issues = [];
    this.autoFixEnabled = true;
  }

  async startMonitoring() {
    console.log('🔍 BMAD系统监控启动...\n');
    this.monitoringActive = true;
    
    // 初始健康检查
    await this.performHealthCheck();
    
    // 设置定期检查
    const intervalId = setInterval(async () => {
      if (!this.monitoringActive) {
        clearInterval(intervalId);
        return;
      }
      
      await this.performHealthCheck();
      
      if (this.autoFixEnabled && this.issues.length > 0) {
        await this.attemptAutoFix();
      }
      
    }, this.checkInterval);
    
    console.log(`📊 监控已启动，每${this.checkInterval/1000}秒检查一次系统状态`);
    console.log('按 Ctrl+C 停止监控\n');
    
    // 优雅退出处理
    process.on('SIGINT', () => {
      console.log('\n🛑 停止系统监控...');
      this.monitoringActive = false;
      this.generateMonitoringReport();
      process.exit(0);
    });
  }

  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [${timestamp}] 执行健康检查...`);
    
    this.issues = []; // 重置问题列表
    
    await this.checkDatabase();
    await this.checkApiEndpoints();
    await this.checkFrontendHealth();
    await this.checkPerformance();
    
    this.displayHealthStatus();
    this.logHealthStatus();
  }

  async checkDatabase() {
    try {
      // 检查数据库连接
      const { stdout, stderr } = await execAsync('npx prisma db pull --preview-feature', {
        timeout: 10000
      });
      
      if (stderr && !stderr.includes('warning')) {
        this.healthStatus.database = 'error';
        this.issues.push({
          type: 'database',
          severity: 'high',
          message: '数据库连接失败',
          details: stderr
        });
      } else {
        this.healthStatus.database = 'healthy';
      }
    } catch (error) {
      this.healthStatus.database = 'error';
      this.issues.push({
        type: 'database',
        severity: 'critical',
        message: '数据库检查失败',
        details: error.message
      });
    }
  }

  async checkApiEndpoints() {
    const testEndpoints = [
      '/api/health',
      '/api/products',
      '/api/inventory',
      '/api/users'
    ];
    
    let healthyCount = 0;
    const baseUrl = 'http://localhost:3001';
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          healthyCount++;
        } else {
          this.issues.push({
            type: 'api',
            severity: 'medium',
            message: `API端点响应异常: ${endpoint}`,
            details: `状态码: ${response.status}`
          });
        }
      } catch (error) {
        this.issues.push({
          type: 'api',
          severity: 'high',
          message: `API端点无法访问: ${endpoint}`,
          details: error.message
        });
      }
    }
    
    if (healthyCount === testEndpoints.length) {
      this.healthStatus.api = 'healthy';
    } else if (healthyCount > 0) {
      this.healthStatus.api = 'degraded';
    } else {
      this.healthStatus.api = 'error';
    }
  }

  async checkFrontendHealth() {
    try {
      // 检查Next.js构建状态
      const nextConfigPath = './next.config.mjs';
      const packageJsonPath = './package.json';
      
      if (!fs.existsSync(nextConfigPath)) {
        this.issues.push({
          type: 'frontend',
          severity: 'medium',
          message: 'Next.js配置文件缺失',
          details: 'next.config.mjs文件不存在'
        });
      }
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // 检查关键依赖
        const criticalDeps = ['next', 'react', '@prisma/client'];
        for (const dep of criticalDeps) {
          if (!packageJson.dependencies[dep]) {
            this.issues.push({
              type: 'frontend',
              severity: 'high',
              message: `关键依赖缺失: ${dep}`,
              details: '可能影响系统正常运行'
            });
          }
        }
      }
      
      // 检查构建文件
      const buildPath = './.next';
      if (fs.existsSync(buildPath)) {
        this.healthStatus.frontend = 'healthy';
      } else {
        this.healthStatus.frontend = 'warning';
        this.issues.push({
          type: 'frontend',
          severity: 'medium',
          message: '前端构建文件缺失',
          details: '需要运行 npm run build'
        });
      }
      
    } catch (error) {
      this.healthStatus.frontend = 'error';
      this.issues.push({
        type: 'frontend',
        severity: 'high',
        message: '前端健康检查失败',
        details: error.message
      });
    }
  }

  async checkPerformance() {
    try {
      // 检查内存使用
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memUsageMB > 500) {
        this.issues.push({
          type: 'performance',
          severity: 'medium',
          message: '内存使用过高',
          details: `当前使用: ${memUsageMB}MB`
        });
        this.healthStatus.performance = 'warning';
      } else {
        this.healthStatus.performance = 'healthy';
      }
      
      // 检查磁盘空间
      try {
        const { stdout } = await execAsync('df -h .');
        const diskInfo = stdout.split('\n')[1];
        const usage = diskInfo.match(/(\d+)%/);
        
        if (usage && parseInt(usage[1]) > 90) {
          this.issues.push({
            type: 'performance',
            severity: 'high',
            message: '磁盘空间不足',
            details: `使用率: ${usage[1]}%`
          });
        }
      } catch (error) {
        // 忽略磁盘检查错误
      }
      
    } catch (error) {
      this.healthStatus.performance = 'error';
      this.issues.push({
        type: 'performance',
        severity: 'medium',
        message: '性能检查失败',
        details: error.message
      });
    }
  }

  displayHealthStatus() {
    const statusIcons = {
      healthy: '✅',
      warning: '⚠️',
      degraded: '🟡',
      error: '❌',
      unknown: '❓'
    };
    
    console.log('📊 系统健康状态:');
    console.log(`   数据库: ${statusIcons[this.healthStatus.database]} ${this.healthStatus.database}`);
    console.log(`   API服务: ${statusIcons[this.healthStatus.api]} ${this.healthStatus.api}`);
    console.log(`   前端应用: ${statusIcons[this.healthStatus.frontend]} ${this.healthStatus.frontend}`);
    console.log(`   系统性能: ${statusIcons[this.healthStatus.performance]} ${this.healthStatus.performance}`);
    
    if (this.issues.length > 0) {
      console.log(`\n🚨 发现 ${this.issues.length} 个问题:`);
      this.issues.forEach((issue, index) => {
        const severityIcon = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢'
        };
        console.log(`   ${index + 1}. ${severityIcon[issue.severity]} ${issue.message}`);
      });
    } else {
      console.log('\n🎉 系统运行正常，未发现问题');
    }
    
    console.log(''); // 空行分隔
  }

  async attemptAutoFix() {
    console.log('🔧 尝试自动修复问题...');
    
    for (const issue of this.issues) {
      try {
        await this.fixIssue(issue);
      } catch (error) {
        console.log(`   ❌ 自动修复失败: ${issue.message}`);
      }
    }
  }

  async fixIssue(issue) {
    switch (issue.type) {
      case 'database':
        if (issue.message.includes('连接失败')) {
          console.log('   🔄 尝试重新连接数据库...');
          await execAsync('npx prisma generate');
        }
        break;
        
      case 'frontend':
        if (issue.message.includes('构建文件缺失')) {
          console.log('   🔄 重新构建前端应用...');
          await execAsync('npm run build');
        }
        break;
        
      case 'performance':
        if (issue.message.includes('内存使用过高')) {
          console.log('   🔄 触发垃圾回收...');
          if (global.gc) {
            global.gc();
          }
        }
        break;
    }
  }

  logHealthStatus() {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: this.healthStatus,
      issues: this.issues,
      issueCount: this.issues.length
    };
    
    const logPath = './logs/health-monitor.log';
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true });
    }
    
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  generateMonitoringReport() {
    const report = {
      monitoringSession: {
        startTime: new Date().toISOString(),
        duration: 'N/A',
        checksPerformed: 'N/A'
      },
      finalStatus: this.healthStatus,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync('./bmad-monitoring-report.json', JSON.stringify(report, null, 2));
    console.log('📄 监控报告已保存到: bmad-monitoring-report.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.healthStatus.database === 'error') {
      recommendations.push('检查数据库连接配置和服务状态');
    }
    
    if (this.healthStatus.api === 'error') {
      recommendations.push('检查API服务是否正常启动');
    }
    
    if (this.healthStatus.frontend === 'warning') {
      recommendations.push('运行 npm run build 重新构建前端应用');
    }
    
    if (this.healthStatus.performance === 'warning') {
      recommendations.push('考虑优化内存使用和清理临时文件');
    }
    
    return recommendations;
  }
}

// 运行监控
if (require.main === module) {
  const monitor = new BMadSystemMonitor();
  monitor.startMonitoring().catch(console.error);
}

module.exports = BMadSystemMonitor;
