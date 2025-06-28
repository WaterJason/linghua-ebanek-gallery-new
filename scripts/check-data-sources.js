const fs = require('fs');
const path = require('path');

function checkDataSources() {
  console.log('🔍 数据源检查 - 模拟数据 vs 真实数据');
  console.log('==========================================\n');

  const results = {
    realDataComponents: [],
    mockDataComponents: [],
    mixedDataComponents: [],
    apiRouteComponents: [],
    serverActionComponents: []
  };

  // 检查的组件文件
  const componentFiles = [
    'components/production/production-management-with-tabs.tsx',
    'components/production/modern-production-management.tsx',
    'components/production/production-orders-list.tsx',
    'components/production/production-dashboard.tsx',
    'components/production/production-kanban-view.tsx',
    'components/production/production-gantt-view.tsx',
    'components/production/production-alerts.tsx',
    'components/production/production-reports.tsx',
    'components/production-base-management.tsx',
    'components/production-management.tsx'
  ];

  console.log('1. 📄 组件数据源分析\n');

  componentFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  文件不存在: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(filePath);
    
    // 检查数据获取方式
    const hasApiRoutes = content.includes('fetch(') && content.includes('/api/');
    const hasServerActions = content.includes('import') && content.includes('actions');
    const hasMockData = content.includes('mockData') || 
                       content.includes('// Mock') || 
                       content.includes('// 模拟') ||
                       content.includes('const data = [') ||
                       content.includes('const orders = [') ||
                       content.includes('const bases = [');
    
    // 检查具体的API调用
    const apiCalls = [];
    const apiMatches = content.match(/fetch\(['"`]([^'"`]+)['"`]\)/g);
    if (apiMatches) {
      apiMatches.forEach(match => {
        const urlMatch = match.match(/['"`]([^'"`]+)['"`]/);
        if (urlMatch) {
          apiCalls.push(urlMatch[1]);
        }
      });
    }

    // 检查Server Action导入
    const serverActionImports = [];
    const importMatches = content.match(/import.*from.*actions/g);
    if (importMatches) {
      serverActionImports.push(...importMatches);
    }

    const analysis = {
      file: fileName,
      path: filePath,
      hasApiRoutes,
      hasServerActions,
      hasMockData,
      apiCalls,
      serverActionImports,
      dataSource: 'unknown'
    };

    // 确定数据源类型
    if (hasApiRoutes && !hasMockData && !hasServerActions) {
      analysis.dataSource = 'api-routes';
      results.apiRouteComponents.push(analysis);
    } else if (hasServerActions && !hasApiRoutes && !hasMockData) {
      analysis.dataSource = 'server-actions';
      results.serverActionComponents.push(analysis);
    } else if (hasMockData && !hasApiRoutes && !hasServerActions) {
      analysis.dataSource = 'mock-data';
      results.mockDataComponents.push(analysis);
    } else if ((hasApiRoutes || hasServerActions) && !hasMockData) {
      analysis.dataSource = 'real-data';
      results.realDataComponents.push(analysis);
    } else if ((hasApiRoutes || hasServerActions) && hasMockData) {
      analysis.dataSource = 'mixed-data';
      results.mixedDataComponents.push(analysis);
    }

    // 输出分析结果
    const dataSourceIcon = {
      'api-routes': '🌐',
      'server-actions': '⚡',
      'mock-data': '🎭',
      'real-data': '✅',
      'mixed-data': '🔄',
      'unknown': '❓'
    }[analysis.dataSource];

    console.log(`${dataSourceIcon} ${fileName}`);
    console.log(`   数据源: ${analysis.dataSource}`);
    
    if (apiCalls.length > 0) {
      console.log(`   API调用: ${apiCalls.join(', ')}`);
    }
    
    if (serverActionImports.length > 0) {
      console.log(`   Server Actions: ${serverActionImports.length} 个导入`);
    }
    
    if (hasMockData) {
      console.log(`   ⚠️  包含模拟数据`);
    }
    
    console.log('');
  });

  // 2. API端点检查
  console.log('2. 📡 API端点完整性检查\n');
  
  const apiEndpoints = [
    '/api/production/orders',
    '/api/production/bases', 
    '/api/production/reports',
    '/api/production/alerts',
    '/api/production/smart-transition',
    '/api/production/smart-schedule',
    '/api/production/batch-optimization',
    '/api/production/collaboration-report',
    '/api/piece-works'
  ];

  apiEndpoints.forEach(endpoint => {
    const routePath = path.join(process.cwd(), 'app', endpoint, 'route.ts');
    const exists = fs.existsSync(routePath);
    
    console.log(`${exists ? '✅' : '❌'} ${endpoint}`);
    console.log(`   文件: ${exists ? '存在' : '缺失'}`);
    
    if (exists) {
      const content = fs.readFileSync(routePath, 'utf8');
      const hasGet = content.includes('export async function GET');
      const hasPost = content.includes('export async function POST');
      const hasPut = content.includes('export async function PUT');
      const hasDelete = content.includes('export async function DELETE');
      
      const methods = [];
      if (hasGet) methods.push('GET');
      if (hasPost) methods.push('POST');
      if (hasPut) methods.push('PUT');
      if (hasDelete) methods.push('DELETE');
      
      console.log(`   方法: ${methods.join(', ')}`);
    }
    
    console.log('');
  });

  // 3. 数据源迁移状态
  console.log('3. 🔄 数据源迁移状态\n');
  
  console.log(`✅ API Routes组件: ${results.apiRouteComponents.length}`);
  results.apiRouteComponents.forEach(comp => {
    console.log(`   • ${comp.file}`);
  });
  
  console.log(`\n⚡ Server Actions组件: ${results.serverActionComponents.length}`);
  results.serverActionComponents.forEach(comp => {
    console.log(`   • ${comp.file}`);
  });
  
  console.log(`\n🎭 模拟数据组件: ${results.mockDataComponents.length}`);
  results.mockDataComponents.forEach(comp => {
    console.log(`   • ${comp.file}`);
  });
  
  console.log(`\n🔄 混合数据组件: ${results.mixedDataComponents.length}`);
  results.mixedDataComponents.forEach(comp => {
    console.log(`   • ${comp.file}`);
  });

  // 4. 迁移建议
  console.log('\n4. 💡 迁移建议\n');
  
  const totalComponents = componentFiles.length;
  const migratedComponents = results.apiRouteComponents.length + results.realDataComponents.length;
  const migrationProgress = (migratedComponents / totalComponents) * 100;
  
  console.log(`迁移进度: ${migratedComponents}/${totalComponents} (${migrationProgress.toFixed(1)}%)`);
  
  if (results.serverActionComponents.length > 0) {
    console.log('\n🔧 需要迁移到API Routes的组件:');
    results.serverActionComponents.forEach(comp => {
      console.log(`   • ${comp.file} - 当前使用Server Actions`);
    });
  }
  
  if (results.mockDataComponents.length > 0) {
    console.log('\n🔧 需要连接真实数据的组件:');
    results.mockDataComponents.forEach(comp => {
      console.log(`   • ${comp.file} - 当前使用模拟数据`);
    });
  }
  
  if (results.mixedDataComponents.length > 0) {
    console.log('\n🔧 需要清理混合数据源的组件:');
    results.mixedDataComponents.forEach(comp => {
      console.log(`   • ${comp.file} - 混合使用多种数据源`);
    });
  }

  // 5. 质量评估
  console.log('\n5. 📊 数据源质量评估\n');
  
  const apiRouteScore = (results.apiRouteComponents.length / totalComponents) * 100;
  const realDataScore = ((results.apiRouteComponents.length + results.realDataComponents.length) / totalComponents) * 100;
  const mockDataPenalty = (results.mockDataComponents.length / totalComponents) * 100;
  
  const overallScore = Math.max(0, realDataScore - mockDataPenalty);
  
  console.log(`API Routes使用率: ${apiRouteScore.toFixed(1)}%`);
  console.log(`真实数据使用率: ${realDataScore.toFixed(1)}%`);
  console.log(`模拟数据比例: ${mockDataPenalty.toFixed(1)}%`);
  console.log(`综合评分: ${overallScore.toFixed(1)}%`);
  
  const qualityLevel = overallScore >= 90 ? '优秀' : 
                      overallScore >= 80 ? '良好' : 
                      overallScore >= 70 ? '一般' : '需要改进';
  
  console.log(`质量等级: ${qualityLevel}`);

  // 6. 下一步行动
  console.log('\n6. 🎯 下一步行动\n');
  
  if (migrationProgress >= 90) {
    console.log('✅ 数据源迁移基本完成，可以投入使用');
  } else if (migrationProgress >= 70) {
    console.log('🔄 数据源迁移进展良好，建议完成剩余组件');
  } else {
    console.log('⚠️  数据源迁移需要加速，优先处理核心组件');
  }
  
  console.log('\n优先级建议:');
  console.log('1. 🔴 高优先级: 核心业务组件（订单管理、基地管理）');
  console.log('2. 🟡 中优先级: 报表和分析组件');
  console.log('3. 🟢 低优先级: 辅助功能组件');

  return {
    totalComponents,
    migratedComponents,
    migrationProgress,
    overallScore,
    qualityLevel,
    results
  };
}

// 运行检查
const result = checkDataSources();

console.log('\n🎉 数据源检查完成！');
console.log(`总组件数: ${result.totalComponents}`);
console.log(`已迁移组件: ${result.migratedComponents}`);
console.log(`迁移进度: ${result.migrationProgress.toFixed(1)}%`);
console.log(`综合评分: ${result.overallScore.toFixed(1)}%`);
