/**
 * 检查项目中的导入问题
 * 
 * 这个脚本会扫描项目中的所有 .ts 和 .tsx 文件，
 * 检查是否有从 "@/lib/actions" 导入的函数，
 * 并建议更新为从特定模块导入。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 要扫描的目录
const dirsToScan = ['app', 'components', 'lib'];

// 要排除的目录
const excludeDirs = ['node_modules', '.next', 'backups'];

// 导入映射表
const importMap = {
  // 用户相关
  'getUsers': 'user-actions',
  'createUser': 'user-actions',
  'updateUser': 'user-actions',
  'deleteUser': 'user-actions',
  
  // 认证相关
  'getCurrentUser': 'auth-actions',
  'login': 'auth-actions',
  'logout': 'auth-actions',
  
  // 员工相关
  'getEmployees': 'employee-actions',
  'createEmployee': 'employee-actions',
  'updateEmployee': 'employee-actions',
  'deleteEmployee': 'employee-actions',
  
  // 产品相关
  'getProducts': 'product-actions',
  'createProduct': 'product-actions',
  'updateProduct': 'product-actions',
  'deleteProduct': 'product-actions',
  
  // 库存相关
  'getInventory': 'inventory-actions',
  'updateInventory': 'inventory-actions',
  
  // 销售相关
  'getSalesOrders': 'sales-actions',
  'createSalesOrder': 'sales-actions',
  
  // 采购相关
  'getPurchaseOrders': 'purchase-actions',
  'createPurchaseOrder': 'purchase-actions',
  
  // 团建相关
  'getWorkshopActivities': 'workshop-actions',
  'createWorkshopActivity': 'workshop-actions',
  
  // 系统相关
  'getSystemSettings': 'system-actions',
  'updateSystemSetting': 'system-actions',
  
  // 日程相关
  'getSchedules': 'schedule-actions',
  'createSchedule': 'schedule-actions',
  
  // 角色相关
  'getRoles': 'role-actions',
  'createRole': 'role-actions',
  
  // 渠道相关
  'getChannels': 'channel-actions',
  'createChannel': 'channel-actions',
};

// 查找所有 .ts 和 .tsx 文件
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 检查文件中的导入
function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+{([^}]+)}\s+from\s+["']@\/lib\/actions["']/g;
  let match;
  let hasIssue = false;
  
  while ((match = importRegex.exec(content)) !== null) {
    hasIssue = true;
    const imports = match[1].split(',').map(i => i.trim());
    
    console.log(`\n文件: ${filePath}`);
    console.log(`发现从 "@/lib/actions" 导入: ${imports.join(', ')}`);
    
    // 按模块分组导入
    const moduleImports = {};
    
    imports.forEach(importName => {
      const moduleName = importMap[importName];
      
      if (moduleName) {
        if (!moduleImports[moduleName]) {
          moduleImports[moduleName] = [];
        }
        moduleImports[moduleName].push(importName);
      }
    });
    
    console.log('\n建议更新为:');
    
    Object.entries(moduleImports).forEach(([moduleName, moduleImports]) => {
      console.log(`import { ${moduleImports.join(', ')} } from "@/lib/actions/${moduleName}";`);
    });
  }
  
  return hasIssue;
}

// 主函数
function main() {
  console.log('开始检查项目中的导入问题...\n');
  
  let totalFiles = 0;
  let filesWithIssues = 0;
  
  dirsToScan.forEach(dir => {
    const files = findFiles(dir);
    totalFiles += files.length;
    
    files.forEach(file => {
      if (checkImports(file)) {
        filesWithIssues++;
      }
    });
  });
  
  console.log(`\n检查完成! 共检查了 ${totalFiles} 个文件，发现 ${filesWithIssues} 个文件有导入问题。`);
  
  if (filesWithIssues > 0) {
    console.log('\n建议在 2024年6月30日 前更新这些导入，以避免系统出现问题。');
  } else {
    console.log('\n太好了! 所有文件都已经使用了推荐的导入方式。');
  }
}

main();
