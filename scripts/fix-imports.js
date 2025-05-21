/**
 * 自动修复项目中的导入问题
 * 
 * 这个脚本会扫描项目中的所有 .ts 和 .tsx 文件，
 * 检查是否有从 "@/lib/actions" 导入的函数，
 * 并自动更新为从特定模块导入。
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
  'getUsersBasic': 'user-actions',
  'updateUserProfile': 'user-actions',
  'updateUserPassword': 'user-actions',
  'updateUserSettings': 'user-actions',
  'getUserLoginHistory': 'user-actions',
  'getUserRoles': 'user-actions',
  'updateUserRoles': 'user-actions',
  
  // 认证相关
  'getCurrentUser': 'auth-actions',
  'login': 'auth-actions',
  'logout': 'auth-actions',
  'enableTwoFactorAuth': 'auth-actions',
  'disableTwoFactorAuth': 'auth-actions',
  
  // 员工相关
  'getEmployees': 'employee-actions',
  'createEmployee': 'employee-actions',
  'updateEmployee': 'employee-actions',
  'deleteEmployee': 'employee-actions',
  
  // 产品相关
  'getProducts': 'product-actions',
  'getProduct': 'product-actions',
  'createProduct': 'product-actions',
  'updateProduct': 'product-actions',
  'deleteProduct': 'product-actions',
  'getProductCategories': 'product-actions',
  'getProductUnits': 'product-actions',
  'getProductMaterials': 'product-actions',
  'getProductTags': 'product-actions',
  'createProductTag': 'product-actions',
  'updateProductTag': 'product-actions',
  'deleteProductTag': 'product-actions',
  'addTagToProduct': 'product-actions',
  'removeTagFromProduct': 'product-actions',
  'getProductsByTag': 'product-actions',
  'addProductUnit': 'product-actions',
  'removeProductUnit': 'product-actions',
  'addProductMaterial': 'product-actions',
  'removeProductMaterial': 'product-actions',
  'batchUpdateProducts': 'product-actions',
  
  // 库存相关
  'getInventory': 'inventory-actions',
  'updateInventory': 'inventory-actions',
  'getWarehouses': 'inventory-actions',
  'createWarehouse': 'inventory-actions',
  'updateWarehouse': 'inventory-actions',
  'deleteWarehouse': 'inventory-actions',
  'transferInventory': 'inventory-actions',
  'exportInventory': 'inventory-actions',
  'importInventory': 'inventory-actions',
  'batchDeleteInventory': 'inventory-actions',
  'getInventoryTransactions': 'inventory-actions',
  
  // 销售相关
  'getSalesOrders': 'sales-actions',
  'createSalesOrder': 'sales-actions',
  'getOrders': 'sales-actions',
  'createOrder': 'sales-actions',
  'updateOrder': 'sales-actions',
  'createPosSale': 'sales-actions',
  'createGallerySale': 'sales-actions',
  'getGallerySales': 'sales-actions',
  'getCoffeeShopSales': 'sales-actions',
  'createCoffeeShopSale': 'sales-actions',
  'updateCoffeeShopSale': 'sales-actions',
  'deleteCoffeeShopSale': 'sales-actions',
  'importCoffeeShopSales': 'sales-actions',
  'getCoffeeShopItems': 'sales-actions',
  
  // 采购相关
  'getPurchaseOrders': 'purchase-actions',
  'createPurchaseOrder': 'purchase-actions',
  'updatePurchaseOrder': 'purchase-actions',
  'deletePurchaseOrder': 'purchase-actions',
  'receivePurchaseOrder': 'purchase-actions',
  'getSuppliers': 'purchase-actions',
  'createSupplier': 'purchase-actions',
  'updateSupplier': 'purchase-actions',
  'deleteSupplier': 'purchase-actions',
  
  // 团建相关
  'getWorkshopActivities': 'workshop-actions',
  'createWorkshopActivity': 'workshop-actions',
  'getWorkshopReport': 'workshop-actions',
  'createWorkshop': 'workshop-actions',
  'getWorkshopPrices': 'workshop-actions',
  'createWorkshopPrice': 'workshop-actions',
  'updateWorkshopPrice': 'workshop-actions',
  'deleteWorkshopPrice': 'workshop-actions',
  'getWorkshopTeamMembers': 'workshop-actions',
  'createWorkshopTeamMember': 'workshop-actions',
  'updateWorkshopTeamMember': 'workshop-actions',
  'deleteWorkshopTeamMember': 'workshop-actions',
  'getPieceWorkItems': 'workshop-actions',
  'createPieceWorkItem': 'workshop-actions',
  'updatePieceWorkItem': 'workshop-actions',
  'deletePieceWorkItem': 'workshop-actions',
  'createPieceWork': 'workshop-actions',
  'updatePieceWork': 'workshop-actions',
  'deletePieceWork': 'workshop-actions',
  
  // 系统相关
  'getSystemSettings': 'system-actions',
  'updateSystemSettings': 'system-actions',
  'updateSystemSetting': 'system-actions',
  'getSystemInfo': 'system-actions',
  'getLogs': 'system-actions',
  'createLog': 'system-actions',
  'getDashboardData': 'system-actions',
  'createBackup': 'system-actions',
  'getBackupsList': 'system-actions',
  'restoreBackup': 'system-actions',
  
  // 日程相关
  'getSchedules': 'schedule-actions',
  'createSchedule': 'schedule-actions',
  'deleteSchedule': 'schedule-actions',
  'clearAllSchedules': 'schedule-actions',
  'getSchedulesByDate': 'schedule-actions',
  'createScheduleTemplate': 'schedule-actions',
  'getScheduleTemplates': 'schedule-actions',
  'deleteScheduleTemplate': 'schedule-actions',
  'createBatchSchedules': 'schedule-actions',
  
  // 角色相关
  'getRoles': 'role-actions',
  'createRole': 'role-actions',
  'updateRole': 'role-actions',
  'deleteRole': 'role-actions',
  'getPermissions': 'role-actions',
  'getRolePermissions': 'role-actions',
  'updateRolePermissions': 'role-actions',
  
  // 渠道相关
  'getChannels': 'channel-actions',
  'createChannel': 'channel-actions',
  'updateChannel': 'channel-actions',
  'deleteChannel': 'channel-actions',
  'getChannelInventory': 'channel-actions',
  'createChannelInventory': 'channel-actions',
  'updateChannelInventory': 'channel-actions',
  'deleteChannelInventory': 'channel-actions',
  'getChannelPrices': 'channel-actions',
  'createChannelPrice': 'channel-actions',
  'updateChannelPrice': 'channel-actions',
  'deleteChannelPrice': 'channel-actions',
  'getChannelSalesStats': 'channel-actions',
  
  // 客户相关
  'getCustomers': 'customer-actions',
  'createCustomer': 'customer-actions',
  'updateCustomer': 'customer-actions',
  'deleteCustomer': 'customer-actions',
  
  // 薪资相关
  'getSalaryRecords': 'employee-actions',
  'createSalaryRecord': 'employee-actions',
  'updateSalaryRecord': 'employee-actions',
  'deleteSalaryRecord': 'employee-actions',
  'getSalaryRecord': 'employee-actions',
  'getSalaryAdjustments': 'employee-actions',
  'createSalaryAdjustment': 'employee-actions',
  'calculatePayroll': 'employee-actions',
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

// 修复文件中的导入
function fixImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+{([^}]+)}\s+from\s+["']@\/lib\/actions["']/g;
  let match;
  let hasIssue = false;
  let newContent = content;
  
  while ((match = importRegex.exec(content)) !== null) {
    hasIssue = true;
    const imports = match[1].split(',').map(i => i.trim());
    
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
    
    // 生成新的导入语句
    let newImports = '';
    Object.entries(moduleImports).forEach(([moduleName, moduleImports]) => {
      newImports += `import { ${moduleImports.join(', ')} } from "@/lib/actions/${moduleName}";\n`;
    });
    
    // 替换旧的导入语句
    newContent = newContent.replace(match[0], newImports.trim());
  }
  
  if (hasIssue) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`已修复文件: ${filePath}`);
  }
  
  return hasIssue;
}

// 主函数
function main() {
  console.log('开始修复项目中的导入问题...\n');
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  dirsToScan.forEach(dir => {
    const files = findFiles(dir);
    totalFiles += files.length;
    
    files.forEach(file => {
      if (fixImports(file)) {
        fixedFiles++;
      }
    });
  });
  
  console.log(`\n修复完成! 共检查了 ${totalFiles} 个文件，修复了 ${fixedFiles} 个文件的导入问题。`);
}

main();
