/**
 * BMAD调试代理设置脚本
 * 用于系统化分析和修复ERP系统中的BUG
 */

const fs = require('fs');
const path = require('path');

// 创建BMAD调试配置
const bmadDebugConfig = {
  project: "聆花文化ERP系统",
  phase: "BUG修复和系统优化",
  agents: {
    "bug-hunter": {
      role: "BUG分析专家",
      tasks: ["识别BUG模式", "分析根本原因", "制定修复策略"],
      focus: ["数据库错误", "API问题", "前端功能异常"]
    },
    "code-doctor": {
      role: "代码修复专家", 
      tasks: ["修复代码缺陷", "优化性能", "重构问题代码"],
      focus: ["Prisma操作", "Next.js API", "React组件"]
    },
    "test-engineer": {
      role: "测试工程师",
      tasks: ["编写测试用例", "验证修复效果", "回归测试"],
      focus: ["API测试", "功能测试", "集成测试"]
    }
  }
};

// 分析当前系统的主要问题
const systemIssues = {
  critical: [
    "产品删除API外键约束错误",
    "产品创建功能不工作", 
    "认证系统cookies警告",
    "标签显示[object Object]问题"
  ],
  high: [
    "API响应时间过长",
    "数据跨页面同步问题",
    "深色主题显示异常",
    "错误处理不完善"
  ],
  medium: [
    "性能优化需求",
    "代码重复问题",
    "文档不完整",
    "测试覆盖率低"
  ]
};

console.log('🔧 BMAD调试代理配置完成');
console.log('📊 系统问题分析:', JSON.stringify(systemIssues, null, 2));

module.exports = { bmadDebugConfig, systemIssues };
