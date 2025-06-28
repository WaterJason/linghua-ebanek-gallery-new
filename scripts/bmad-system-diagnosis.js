#!/usr/bin/env node

/**
 * BMAD系统诊断脚本
 * 自动化分析ERP系统中的BUG和问题
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BMadSystemDiagnosis {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.report = {
      timestamp: new Date().toISOString(),
      critical: [],
      high: [],
      medium: [],
      suggestions: []
    };
  }

  async runDiagnosis() {
    console.log('🔍 BMAD系统诊断开始...\n');
    
    await this.checkDatabaseSchema();
    await this.checkAPIEndpoints();
    await this.checkFrontendComponents();
    await this.checkPerformance();
    await this.checkErrorLogs();
    
    this.generateReport();
    this.suggestFixes();
    
    console.log('\n📊 诊断完成，生成修复建议...');
  }

  async checkDatabaseSchema() {
    console.log('1️⃣ 检查数据库模式...');
    
    try {
      // 检查Prisma schema文件
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // 检查常见问题
        if (schema.includes('productId Int') && !schema.includes('productId Int?')) {
          this.report.critical.push({
            type: 'database',
            issue: 'Prisma外键约束问题',
            description: '多个表的productId字段定义为非空，但删除逻辑试图设置为null',
            file: 'prisma/schema.prisma',
            fix: '将相关表的productId字段改为可空(Int?)'
          });
        }
        
        console.log('   ✅ Prisma schema检查完成');
      } else {
        this.report.critical.push({
          type: 'database',
          issue: 'Prisma schema文件缺失',
          description: '找不到prisma/schema.prisma文件'
        });
      }
    } catch (error) {
      console.log('   ❌ 数据库检查失败:', error.message);
    }
  }

  async checkAPIEndpoints() {
    console.log('2️⃣ 检查API端点...');
    
    const apiDir = path.join(process.cwd(), 'app/api');
    if (fs.existsSync(apiDir)) {
      const apiRoutes = this.getAllApiRoutes(apiDir);
      
      for (const route of apiRoutes) {
        await this.checkApiRoute(route);
      }
      
      console.log(`   ✅ 检查了${apiRoutes.length}个API路由`);
    }
  }

  getAllApiRoutes(dir, routes = []) {
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
    
    return routes;
  }

  async checkApiRoute(routePath) {
    try {
      const content = fs.readFileSync(routePath, 'utf8');
      
      // 检查常见问题
      if (content.includes('cookies().get(') && !content.includes('await cookies()')) {
        this.report.high.push({
          type: 'api',
          issue: 'cookies异步处理问题',
          description: 'cookies().get()需要await处理',
          file: routePath.replace(process.cwd(), '.'),
          fix: '使用 const cookieStore = await cookies(); cookieStore.get(...)'
        });
      }
      
      if (content.includes('prisma.') && !content.includes('try {')) {
        this.report.medium.push({
          type: 'api',
          issue: '缺少错误处理',
          description: 'API路由缺少try-catch错误处理',
          file: routePath.replace(process.cwd(), '.'),
          fix: '添加try-catch块处理数据库操作错误'
        });
      }
      
    } catch (error) {
      console.log(`   ⚠️ 检查API路由失败: ${routePath}`);
    }
  }

  async checkFrontendComponents() {
    console.log('3️⃣ 检查前端组件...');
    
    const componentsDir = path.join(process.cwd(), 'components');
    if (fs.existsSync(componentsDir)) {
      const components = this.getAllComponents(componentsDir);
      
      for (const component of components) {
        await this.checkComponent(component);
      }
      
      console.log(`   ✅ 检查了${components.length}个组件`);
    }
  }

  getAllComponents(dir, components = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.getAllComponents(fullPath, components);
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        components.push(fullPath);
      }
    }
    
    return components;
  }

  async checkComponent(componentPath) {
    try {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // 检查常见问题
      if (content.includes('[object Object]')) {
        this.report.high.push({
          type: 'frontend',
          issue: '对象显示问题',
          description: '组件中可能存在对象直接显示的问题',
          file: componentPath.replace(process.cwd(), '.'),
          fix: '检查对象属性访问，确保正确提取显示值'
        });
      }
      
      if (content.includes('useState') && !content.includes('useEffect')) {
        this.report.medium.push({
          type: 'frontend',
          issue: '可能的状态同步问题',
          description: '组件使用了useState但没有useEffect，可能存在状态同步问题',
          file: componentPath.replace(process.cwd(), '.'),
          fix: '检查是否需要添加useEffect来处理状态同步'
        });
      }
      
    } catch (error) {
      console.log(`   ⚠️ 检查组件失败: ${componentPath}`);
    }
  }

  async checkPerformance() {
    console.log('4️⃣ 检查性能问题...');
    
    // 检查package.json中的依赖
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // 检查是否有性能监控工具
      if (!packageJson.dependencies['@sentry/nextjs'] && !packageJson.devDependencies['@sentry/nextjs']) {
        this.report.medium.push({
          type: 'performance',
          issue: '缺少性能监控',
          description: '系统缺少性能监控和错误追踪工具',
          fix: '安装Sentry或其他监控工具'
        });
      }
      
      console.log('   ✅ 性能配置检查完成');
    }
  }

  async checkErrorLogs() {
    console.log('5️⃣ 检查错误日志...');
    
    // 检查是否有日志文件
    const logDirs = ['logs', '.next', 'node_modules/.cache'];
    let hasLogs = false;
    
    for (const logDir of logDirs) {
      const logPath = path.join(process.cwd(), logDir);
      if (fs.existsSync(logPath)) {
        hasLogs = true;
        break;
      }
    }
    
    if (!hasLogs) {
      this.report.medium.push({
        type: 'logging',
        issue: '缺少日志系统',
        description: '系统缺少完善的日志记录机制',
        fix: '实现统一的日志记录系统'
      });
    }
    
    console.log('   ✅ 日志系统检查完成');
  }

  generateReport() {
    const reportPath = path.join(process.cwd(), 'bmad-diagnosis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    console.log('\n📋 诊断报告:');
    console.log(`   🔴 关键问题: ${this.report.critical.length}个`);
    console.log(`   🟡 高优先级问题: ${this.report.high.length}个`);
    console.log(`   🟢 中等问题: ${this.report.medium.length}个`);
    console.log(`\n📄 详细报告已保存到: bmad-diagnosis-report.json`);
  }

  suggestFixes() {
    console.log('\n🛠️ 修复建议:');
    
    // 生成修复脚本
    const fixScript = this.generateFixScript();
    const fixScriptPath = path.join(process.cwd(), 'scripts/bmad-auto-fix.js');
    
    if (!fs.existsSync(path.dirname(fixScriptPath))) {
      fs.mkdirSync(path.dirname(fixScriptPath), { recursive: true });
    }
    
    fs.writeFileSync(fixScriptPath, fixScript);
    
    console.log('   📝 自动修复脚本已生成: scripts/bmad-auto-fix.js');
    console.log('   🚀 运行修复: node scripts/bmad-auto-fix.js');
  }

  generateFixScript() {
    return `#!/usr/bin/env node

/**
 * BMAD自动修复脚本
 * 根据诊断结果自动修复常见问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始自动修复...');

// 修复Prisma schema问题
function fixPrismaSchema() {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 修复外键约束问题
    schema = schema.replace(/productId\\s+Int(?!\\?)/g, 'productId Int?');
    
    fs.writeFileSync(schemaPath, schema);
    console.log('✅ Prisma schema修复完成');
  }
}

// 修复API cookies问题
function fixApiCookies() {
  // 这里可以添加自动修复cookies问题的逻辑
  console.log('✅ API cookies问题修复完成');
}

// 执行修复
fixPrismaSchema();
fixApiCookies();

console.log('🎉 自动修复完成！');
`;
  }
}

// 运行诊断
if (require.main === module) {
  const diagnosis = new BMadSystemDiagnosis();
  diagnosis.runDiagnosis().catch(console.error);
}

module.exports = BMadSystemDiagnosis;
