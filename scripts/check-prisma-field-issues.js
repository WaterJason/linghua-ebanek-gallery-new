/**
 * 检查Prisma字段问题
 * 系统性排查所有Prisma操作中可能存在的缺少必需字段问题
 */

const fs = require('fs');
const path = require('path');

// Prisma模型字段定义（从schema.prisma提取的必需字段）
const requiredFields = {
  PurchaseOrder: ['orderNumber'],
  Order: ['orderNumber'],
  ProductionOrder: ['orderNumber'],
  Product: ['name', 'price'],
  Employee: ['name', 'position', 'dailySalary'],
  Customer: ['name'],
  Supplier: ['name'],
  Warehouse: ['name'],
  InventoryItem: ['productId', 'quantity'],
  SalaryRecord: ['employeeId', 'year', 'month'],
  GallerySale: ['date', 'totalAmount'],
  CoffeeShopSale: ['date', 'totalSales'],
  Workshop: ['name', 'date', 'startTime', 'endTime'],
  Channel: ['name', 'type'],
  ProductCategory: ['name'],
  ArtworkCategory: ['name'],
  Artwork: ['name', 'price'],
  PurchaseOrderItem: ['purchaseOrderId', 'productId', 'quantity', 'price'],
  OrderItem: ['orderId', 'productId', 'quantity', 'price'],
  SalesItem: ['gallerySaleId', 'productId', 'quantity', 'price'],
  WorkshopServiceItem: ['workshopId', 'productId', 'quantity', 'price'],
  InventoryTransaction: ['productId', 'quantity', 'type'],
  ChannelInventory: ['channelId', 'productId'],
  ChannelSaleItem: ['channelSaleId', 'productId', 'quantity', 'price'],
  CoffeeShopShift: ['coffeeShopSaleId', 'employeeId']
};

// 字段名映射（处理常见的字段名不一致问题）
const fieldMappings = {
  'orderId': 'purchaseOrderId', // PurchaseOrderItem中应该使用purchaseOrderId
  'saleId': 'gallerySaleId',    // SalesItem中应该使用gallerySaleId
  'id': null // 排除id字段检查，因为它通常是自动生成的
};

// 需要检查的目录
const checkDirs = [
  'lib/actions',
  'app/api'
];

// 查找所有相关文件
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 分析Prisma操作
function analyzePrismaOperations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // 查找所有prisma.*.create()调用
  const createMatches = content.match(/prisma\.(\w+)\.create\s*\(\s*\{[\s\S]*?data:\s*\{([\s\S]*?)\}/g);
  
  if (createMatches) {
    createMatches.forEach((match, index) => {
      // 提取模型名
      const modelMatch = match.match(/prisma\.(\w+)\.create/);
      if (!modelMatch) return;
      
      const modelName = modelMatch[1];
      
      // 转换为Pascal Case（首字母大写）
      const pascalModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      
      // 检查是否有对应的必需字段定义
      if (!requiredFields[pascalModelName]) {
        return; // 跳过未定义的模型
      }
      
      // 提取data对象内容
      const dataMatch = match.match(/data:\s*\{([\s\S]*?)\}/);
      if (!dataMatch) return;
      
      const dataContent = dataMatch[1];
      
      // 提取字段名
      const fieldMatches = dataContent.match(/(\w+):/g);
      const providedFields = fieldMatches ? fieldMatches.map(f => f.replace(':', '')) : [];
      
      // 检查缺少的必需字段
      const missingFields = requiredFields[pascalModelName].filter(field => {
        // 检查字段是否直接存在
        if (providedFields.includes(field)) return false;
        
        // 检查字段映射
        const mappedField = fieldMappings[field];
        if (mappedField && providedFields.includes(mappedField)) return false;
        
        return true;
      });
      
      if (missingFields.length > 0) {
        issues.push({
          type: 'missing_required_fields',
          model: pascalModelName,
          operation: 'create',
          missingFields,
          providedFields,
          location: `Line ${getLineNumber(content, match)}`,
          code: match.substring(0, 200) + '...'
        });
      }
      
      // 检查字段名映射问题
      providedFields.forEach(field => {
        if (fieldMappings[field] && fieldMappings[field] !== null) {
          issues.push({
            type: 'incorrect_field_name',
            model: pascalModelName,
            operation: 'create',
            incorrectField: field,
            correctField: fieldMappings[field],
            location: `Line ${getLineNumber(content, match)}`,
            code: match.substring(0, 200) + '...'
          });
        }
      });
    });
  }

  // 查找所有prisma.*.update()调用（检查字段名问题）
  const updateMatches = content.match(/prisma\.(\w+)\.update\s*\(\s*\{[\s\S]*?data:\s*\{([\s\S]*?)\}/g);
  
  if (updateMatches) {
    updateMatches.forEach((match, index) => {
      const modelMatch = match.match(/prisma\.(\w+)\.update/);
      if (!modelMatch) return;
      
      const modelName = modelMatch[1];
      const pascalModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      
      const dataMatch = match.match(/data:\s*\{([\s\S]*?)\}/);
      if (!dataMatch) return;
      
      const dataContent = dataMatch[1];
      const fieldMatches = dataContent.match(/(\w+):/g);
      const providedFields = fieldMatches ? fieldMatches.map(f => f.replace(':', '')) : [];
      
      // 检查字段名映射问题
      providedFields.forEach(field => {
        if (fieldMappings[field] && fieldMappings[field] !== null) {
          issues.push({
            type: 'incorrect_field_name',
            model: pascalModelName,
            operation: 'update',
            incorrectField: field,
            correctField: fieldMappings[field],
            location: `Line ${getLineNumber(content, match)}`,
            code: match.substring(0, 200) + '...'
          });
        }
      });
    });
  }

  return {
    filePath,
    issues,
    linesOfCode: content.split('\n').length
  };
}

// 获取代码在文件中的行号
function getLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText.split('\n')[0])) {
      return i + 1;
    }
  }
  return 'Unknown';
}

// 主函数
function main() {
  console.log('🔍 检查Prisma字段问题');
  console.log('===================\n');
  
  let allFiles = [];
  
  // 收集所有需要检查的文件
  checkDirs.forEach(dir => {
    const files = findFiles(dir);
    allFiles = allFiles.concat(files);
  });
  
  console.log(`找到 ${allFiles.length} 个文件需要检查\n`);
  
  const analysisResults = [];
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  // 问题分类统计
  const issueStats = {
    missing_required_fields: 0,
    incorrect_field_name: 0
  };
  
  allFiles.forEach(filePath => {
    const analysis = analyzePrismaOperations(filePath);
    
    if (analysis.issues.length > 0) {
      analysisResults.push(analysis);
      totalIssues += analysis.issues.length;
      filesWithIssues++;
      
      // 统计问题类型
      analysis.issues.forEach(issue => {
        issueStats[issue.type]++;
      });
    }
  });
  
  // 输出分析结果
  console.log('📊 分析结果');
  console.log('===========');
  console.log(`总文件数: ${allFiles.length}`);
  console.log(`有问题的文件: ${filesWithIssues}`);
  console.log(`总问题数: ${totalIssues}`);
  console.log(`缺少必需字段: ${issueStats.missing_required_fields}`);
  console.log(`字段名错误: ${issueStats.incorrect_field_name}\n`);
  
  if (analysisResults.length > 0) {
    console.log('🔥 发现的问题:');
    console.log('=============\n');
    
    // 按优先级分类问题
    const p0Issues = []; // 核心业务模块的缺少必需字段
    const p1Issues = []; // 其他模块的缺少必需字段
    const p2Issues = []; // 字段名错误
    
    analysisResults.forEach(result => {
      const isCoreModule = result.filePath.includes('product-actions') || 
                          result.filePath.includes('sales-actions') || 
                          result.filePath.includes('purchase-actions') || 
                          result.filePath.includes('inventory-actions') || 
                          result.filePath.includes('employee-actions');
      
      result.issues.forEach(issue => {
        const issueWithFile = { ...issue, filePath: result.filePath };
        
        if (issue.type === 'missing_required_fields') {
          if (isCoreModule) {
            p0Issues.push(issueWithFile);
          } else {
            p1Issues.push(issueWithFile);
          }
        } else {
          p2Issues.push(issueWithFile);
        }
      });
    });
    
    // 输出P0问题（最高优先级）
    if (p0Issues.length > 0) {
      console.log('🚨 P0 - 核心业务模块缺少必需字段 (需要立即修复):');
      p0Issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.filePath}`);
        console.log(`   模型: ${issue.model}`);
        console.log(`   操作: ${issue.operation}`);
        console.log(`   缺少字段: ${issue.missingFields.join(', ')}`);
        console.log(`   位置: ${issue.location}`);
        console.log('');
      });
    }
    
    // 输出P1问题
    if (p1Issues.length > 0) {
      console.log('⚠️ P1 - 其他模块缺少必需字段:');
      p1Issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.filePath}`);
        console.log(`   模型: ${issue.model}`);
        console.log(`   缺少字段: ${issue.missingFields.join(', ')}`);
        console.log('');
      });
    }
    
    // 输出P2问题
    if (p2Issues.length > 0) {
      console.log('💡 P2 - 字段名错误:');
      p2Issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.filePath}`);
        console.log(`   模型: ${issue.model}`);
        console.log(`   错误字段: ${issue.incorrectField} → 应为: ${issue.correctField}`);
        console.log('');
      });
    }
  }
  
  // 保存分析报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allFiles.length,
      filesWithIssues,
      totalIssues,
      issueStats
    },
    results: analysisResults,
    prioritizedIssues: {
      p0: analysisResults.filter(r => r.filePath.includes('product-actions') || 
                                     r.filePath.includes('sales-actions') || 
                                     r.filePath.includes('purchase-actions') || 
                                     r.filePath.includes('inventory-actions') || 
                                     r.filePath.includes('employee-actions'))
                        .flatMap(r => r.issues.filter(i => i.type === 'missing_required_fields')),
      p1: analysisResults.filter(r => !(r.filePath.includes('product-actions') || 
                                       r.filePath.includes('sales-actions') || 
                                       r.filePath.includes('purchase-actions') || 
                                       r.filePath.includes('inventory-actions') || 
                                       r.filePath.includes('employee-actions')))
                        .flatMap(r => r.issues.filter(i => i.type === 'missing_required_fields')),
      p2: analysisResults.flatMap(r => r.issues.filter(i => i.type === 'incorrect_field_name'))
    }
  };
  
  const reportPath = `reports/prisma-field-analysis-${Date.now()}.json`;
  
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 分析报告已保存: ${reportPath}`);
  
  // 根据结果设置退出码
  if (totalIssues === 0) {
    console.log('\n🎉 所有Prisma操作都正确！');
    process.exit(0);
  } else {
    console.log(`\n⚠️ 发现 ${totalIssues} 个问题需要修复`);
    process.exit(1);
  }
}

main();
