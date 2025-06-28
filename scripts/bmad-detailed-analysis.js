#!/usr/bin/env node

/**
 * BMAD详细分析脚本
 * 基于诊断报告生成详细的问题分析和修复建议
 */

const fs = require('fs');
const path = require('path');

class BMadDetailedAnalysis {
  constructor() {
    this.reportPath = './bmad-diagnosis-report.json';
    this.analysisResult = {
      summary: {},
      prioritizedIssues: [],
      fixPlan: {},
      recommendations: []
    };
  }

  async runAnalysis() {
    console.log('📊 BMAD详细分析开始...\n');
    
    if (!fs.existsSync(this.reportPath)) {
      console.log('❌ 诊断报告不存在，请先运行系统诊断');
      return;
    }
    
    const report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
    
    this.analyzeSummary(report);
    this.categorizeIssues(report);
    this.generateFixPlan(report);
    this.generateRecommendations(report);
    
    this.displayAnalysis();
    this.saveAnalysis();
  }

  analyzeSummary(report) {
    const totalIssues = report.critical.length + report.high.length + report.medium.length;
    
    this.analysisResult.summary = {
      timestamp: report.timestamp,
      totalIssues,
      breakdown: {
        critical: report.critical.length,
        high: report.high.length,
        medium: report.medium.length
      },
      riskLevel: this.calculateRiskLevel(report),
      estimatedFixTime: this.estimateFixTime(report)
    };
  }

  calculateRiskLevel(report) {
    if (report.critical.length > 0) return 'HIGH';
    if (report.high.length > 5) return 'MEDIUM-HIGH';
    if (report.high.length > 0) return 'MEDIUM';
    if (report.medium.length > 50) return 'LOW-MEDIUM';
    return 'LOW';
  }

  estimateFixTime(report) {
    const criticalTime = report.critical.length * 4; // 4小时每个关键问题
    const highTime = report.high.length * 2; // 2小时每个高优先级问题
    const mediumTime = report.medium.length * 0.5; // 30分钟每个中等问题
    
    return {
      hours: criticalTime + highTime + mediumTime,
      days: Math.ceil((criticalTime + highTime + mediumTime) / 8),
      breakdown: {
        critical: `${criticalTime}小时`,
        high: `${highTime}小时`,
        medium: `${mediumTime}小时`
      }
    };
  }

  categorizeIssues(report) {
    const allIssues = [
      ...report.critical.map(issue => ({...issue, priority: 'critical'})),
      ...report.high.map(issue => ({...issue, priority: 'high'})),
      ...report.medium.map(issue => ({...issue, priority: 'medium'}))
    ];

    // 按类型分组
    const issuesByType = {};
    allIssues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });

    // 按文件分组
    const issuesByFile = {};
    allIssues.forEach(issue => {
      if (issue.file) {
        const dir = path.dirname(issue.file);
        if (!issuesByFile[dir]) {
          issuesByFile[dir] = [];
        }
        issuesByFile[dir].push(issue);
      }
    });

    this.analysisResult.prioritizedIssues = {
      byType: issuesByType,
      byFile: issuesByFile,
      topPriority: allIssues.filter(issue => issue.priority === 'critical' || issue.priority === 'high')
    };
  }

  generateFixPlan(report) {
    this.analysisResult.fixPlan = {
      phase1: {
        name: '紧急修复阶段',
        duration: '立即执行',
        issues: report.critical.concat(report.high),
        actions: [
          '修复对象显示问题',
          '解决关键组件状态同步',
          '添加必要的错误处理'
        ]
      },
      phase2: {
        name: '系统优化阶段',
        duration: '1-2周',
        issues: report.medium.slice(0, 20), // 前20个中等问题
        actions: [
          '完善组件状态管理',
          '优化API错误处理',
          '改进用户体验'
        ]
      },
      phase3: {
        name: '质量提升阶段',
        duration: '2-4周',
        issues: report.medium.slice(20), // 剩余中等问题
        actions: [
          '代码重构和优化',
          '增加测试覆盖',
          '性能优化'
        ]
      }
    };
  }

  generateRecommendations(report) {
    const recommendations = [];

    // 基于问题类型生成建议
    const typeCount = {};
    [...report.critical, ...report.high, ...report.medium].forEach(issue => {
      typeCount[issue.type] = (typeCount[issue.type] || 0) + 1;
    });

    if (typeCount.frontend > 50) {
      recommendations.push({
        category: '前端架构',
        priority: 'high',
        suggestion: '考虑重构前端状态管理架构，使用Context API或Redux统一管理状态',
        impact: '减少70%的状态同步问题'
      });
    }

    if (typeCount.api > 10) {
      recommendations.push({
        category: 'API设计',
        priority: 'medium',
        suggestion: '实现统一的API错误处理中间件',
        impact: '提高API稳定性和错误处理一致性'
      });
    }

    recommendations.push({
      category: '开发流程',
      priority: 'high',
      suggestion: '集成BMAD持续监控，建立自动化质量检查流程',
      impact: '预防90%的常见问题，提高开发效率'
    });

    recommendations.push({
      category: '测试策略',
      priority: 'medium',
      suggestion: '增加组件单元测试和API集成测试',
      impact: '提前发现问题，减少生产环境BUG'
    });

    this.analysisResult.recommendations = recommendations;
  }

  displayAnalysis() {
    console.log('📊 === BMAD详细分析报告 ===\n');
    
    // 摘要信息
    console.log('🎯 系统健康摘要:');
    console.log(`   总问题数: ${this.analysisResult.summary.totalIssues}`);
    console.log(`   风险等级: ${this.analysisResult.summary.riskLevel}`);
    console.log(`   预估修复时间: ${this.analysisResult.summary.estimatedFixTime.days}天 (${this.analysisResult.summary.estimatedFixTime.hours}小时)`);
    console.log('');

    // 问题分布
    console.log('📈 问题分布:');
    Object.entries(this.analysisResult.prioritizedIssues.byType).forEach(([type, issues]) => {
      console.log(`   ${type}: ${issues.length}个问题`);
    });
    console.log('');

    // 修复计划
    console.log('🗓️ 修复计划:');
    Object.entries(this.analysisResult.fixPlan).forEach(([phase, plan]) => {
      console.log(`   ${plan.name} (${plan.duration}):`);
      console.log(`     - 问题数: ${plan.issues.length}`);
      plan.actions.forEach(action => {
        console.log(`     - ${action}`);
      });
      console.log('');
    });

    // 重要建议
    console.log('💡 关键建议:');
    this.analysisResult.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : '🟡';
      console.log(`   ${index + 1}. ${priorityIcon} ${rec.category}:`);
      console.log(`      ${rec.suggestion}`);
      console.log(`      预期效果: ${rec.impact}`);
      console.log('');
    });

    // 立即行动建议
    console.log('🚀 立即行动建议:');
    console.log('   1. 运行自动修复: node scripts/bmad-targeted-fix.js');
    console.log('   2. 启动监控系统: node scripts/bmad-system-monitor.js');
    console.log('   3. 测试关键功能: npm run test');
    console.log('   4. 检查修复效果: 访问产品管理页面验证标签显示');
  }

  saveAnalysis() {
    const analysisPath = './bmad-detailed-analysis.json';
    fs.writeFileSync(analysisPath, JSON.stringify(this.analysisResult, null, 2));
    console.log(`\n📄 详细分析报告已保存到: ${analysisPath}`);
  }
}

// 运行分析
if (require.main === module) {
  const analysis = new BMadDetailedAnalysis();
  analysis.runAnalysis().catch(console.error);
}

module.exports = BMadDetailedAnalysis;
