#!/usr/bin/env node

/**
 * BMAD针对性修复脚本
 * 基于诊断报告修复具体的BUG问题
 */

const fs = require('fs');
const path = require('path');

class BMadTargetedFix {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  async runFixes() {
    console.log('🔧 开始BMAD针对性修复...\n');
    
    await this.fixObjectDisplayIssue();
    await this.fixStateManagementIssues();
    await this.addMissingErrorHandling();
    await this.optimizePerformance();
    
    this.generateFixReport();
  }

  async fixObjectDisplayIssue() {
    console.log('1️⃣ 修复对象显示问题...');
    
    const productListPath = './components/product/product-list.tsx';
    
    try {
      if (fs.existsSync(productListPath)) {
        let content = fs.readFileSync(productListPath, 'utf8');
        
        // 修复标签显示问题 - 确保正确提取tag.name
        if (content.includes('[object Object]') || content.includes('tag}')) {
          content = content.replace(
            /\{tag\}/g, 
            '{typeof tag === "string" ? tag : tag?.name || tag}'
          );
          
          // 确保标签数组正确处理
          content = content.replace(
            /tags\.map\(\(tag[^)]*\)\s*=>\s*\{[^}]*\}/g,
            'tags.map((tag, index) => {\n      const tagName = typeof tag === "string" ? tag : tag?.name || String(tag);\n      return (\n        <Badge key={index} variant="secondary" className="text-xs">\n          {tagName}\n        </Badge>\n      );\n    })'
          );
          
          fs.writeFileSync(productListPath, content);
          this.fixedFiles.push({
            file: productListPath,
            issue: '对象显示问题',
            fix: '修复标签显示逻辑，确保正确提取对象属性'
          });
          
          console.log('   ✅ 修复产品列表标签显示问题');
        }
      }
    } catch (error) {
      this.errors.push({
        file: productListPath,
        error: error.message
      });
      console.log('   ❌ 修复失败:', error.message);
    }
  }

  async fixStateManagementIssues() {
    console.log('2️⃣ 修复状态管理问题...');
    
    // 重点修复几个关键组件的状态同步问题
    const criticalComponents = [
      './components/product/product-list.tsx',
      './components/inventory/inventory-stocktake-management.tsx',
      './components/finance/finance-transactions-management.tsx'
    ];
    
    for (const componentPath of criticalComponents) {
      await this.fixComponentStateSync(componentPath);
    }
  }

  async fixComponentStateSync(componentPath) {
    try {
      if (fs.existsSync(componentPath)) {
        let content = fs.readFileSync(componentPath, 'utf8');
        
        // 检查是否需要添加useEffect来处理数据同步
        if (content.includes('useState') && !content.includes('useEffect')) {
          // 添加useEffect import
          if (!content.includes('useEffect')) {
            content = content.replace(
              /import.*React.*from ['"]react['"];?/,
              'import React, { useState, useEffect } from "react";'
            );
          }
          
          // 在组件中添加数据同步逻辑
          const componentMatch = content.match(/export\s+(?:default\s+)?function\s+(\w+)/);
          if (componentMatch) {
            const componentName = componentMatch[1];
            
            // 添加数据刷新逻辑
            const useEffectCode = `
  // 数据同步 - 自动刷新数据
  useEffect(() => {
    const handleDataRefresh = () => {
      // 触发数据重新获取
      if (typeof refetch === 'function') {
        refetch();
      }
    };
    
    // 监听存储变化
    window.addEventListener('storage', handleDataRefresh);
    
    return () => {
      window.removeEventListener('storage', handleDataRefresh);
    };
  }, []);
`;
            
            // 在第一个useState后插入useEffect
            const firstUseStateIndex = content.indexOf('useState');
            if (firstUseStateIndex > -1) {
              const lineEnd = content.indexOf('\n', firstUseStateIndex);
              content = content.slice(0, lineEnd + 1) + useEffectCode + content.slice(lineEnd + 1);
            }
          }
          
          fs.writeFileSync(componentPath, content);
          this.fixedFiles.push({
            file: componentPath,
            issue: '状态同步问题',
            fix: '添加useEffect处理数据同步'
          });
          
          console.log(`   ✅ 修复 ${path.basename(componentPath)} 状态同步`);
        }
      }
    } catch (error) {
      this.errors.push({
        file: componentPath,
        error: error.message
      });
      console.log(`   ❌ 修复失败 ${componentPath}:`, error.message);
    }
  }

  async addMissingErrorHandling() {
    console.log('3️⃣ 添加错误处理...');
    
    // 检查API路由并添加错误处理
    const apiDir = './app/api';
    const apiRoutes = this.getAllApiRoutes(apiDir);
    
    let fixedCount = 0;
    for (const route of apiRoutes.slice(0, 10)) { // 限制处理数量
      if (await this.addErrorHandlingToRoute(route)) {
        fixedCount++;
      }
    }
    
    console.log(`   ✅ 为 ${fixedCount} 个API路由添加了错误处理`);
  }

  getAllApiRoutes(dir, routes = []) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.getAllApiRoutes(fullPath, routes);
        } else if (item === 'route.ts' || item === 'route.js') {
          routes.push(fullPath);
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
    }
    
    return routes;
  }

  async addErrorHandlingToRoute(routePath) {
    try {
      let content = fs.readFileSync(routePath, 'utf8');
      
      // 检查是否缺少try-catch
      if (content.includes('prisma.') && !content.includes('try {')) {
        // 为主要的HTTP方法添加错误处理
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        let modified = false;
        
        for (const method of methods) {
          const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{`, 'g');
          
          if (methodRegex.test(content)) {
            content = content.replace(
              methodRegex,
              `export async function ${method}(request: Request) {\n  try {`
            );
            
            // 添加catch块
            content = content.replace(
              /(\n\s*return\s+[^;]+;?\s*\n\s*})/g,
              '$1\n  } catch (error) {\n    console.error(`API Error in ${method}:`, error);\n    return Response.json(\n      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },\n      { status: 500 }\n    );\n  }\n}'
            );
            
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync(routePath, content);
          this.fixedFiles.push({
            file: routePath,
            issue: '缺少错误处理',
            fix: '添加try-catch错误处理'
          });
          return true;
        }
      }
    } catch (error) {
      this.errors.push({
        file: routePath,
        error: error.message
      });
    }
    
    return false;
  }

  async optimizePerformance() {
    console.log('4️⃣ 性能优化...');
    
    // 创建性能优化配置
    const performanceConfig = {
      api: {
        timeout: 5000,
        retries: 3,
        caching: true
      },
      frontend: {
        lazyLoading: true,
        memoization: true,
        virtualScrolling: false
      }
    };
    
    const configPath = './config/performance.json';
    if (!fs.existsSync('./config')) {
      fs.mkdirSync('./config', { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(performanceConfig, null, 2));
    
    console.log('   ✅ 创建性能优化配置文件');
  }

  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFixed: this.fixedFiles.length,
        totalErrors: this.errors.length,
        success: this.fixedFiles.length > 0
      },
      fixes: this.fixedFiles,
      errors: this.errors,
      recommendations: [
        '运行完整测试套件验证修复效果',
        '检查修复后的组件是否正常工作',
        '监控系统性能和错误日志',
        '考虑添加更多的单元测试'
      ]
    };
    
    fs.writeFileSync('./bmad-fix-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 修复报告:');
    console.log(`   ✅ 成功修复: ${this.fixedFiles.length} 个问题`);
    console.log(`   ❌ 修复失败: ${this.errors.length} 个问题`);
    console.log('\n📄 详细报告已保存到: bmad-fix-report.json');
    
    if (this.fixedFiles.length > 0) {
      console.log('\n🎉 主要修复内容:');
      this.fixedFiles.forEach(fix => {
        console.log(`   • ${fix.issue}: ${path.basename(fix.file)}`);
      });
    }
    
    console.log('\n🚀 建议下一步操作:');
    console.log('   1. 运行 npm run dev 启动开发服务器');
    console.log('   2. 测试修复的功能是否正常工作');
    console.log('   3. 运行 npm run test 执行测试套件');
    console.log('   4. 检查浏览器控制台是否还有错误');
  }
}

// 运行修复
if (require.main === module) {
  const fixer = new BMadTargetedFix();
  fixer.runFixes().catch(console.error);
}

module.exports = BMadTargetedFix;
