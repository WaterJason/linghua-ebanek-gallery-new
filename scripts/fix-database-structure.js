// 修复数据库表结构的脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDatabaseStructure() {
  console.log('开始修复数据库表结构...');

  try {
    // 1. 检查并修复产品表结构
    await fixProductTable();
    
    // 2. 检查并修复员工表结构
    await fixEmployeeTable();
    
    // 3. 检查并修复供应商表结构
    await fixSupplierTable();
    
    // 4. 检查并修复财务账户表结构
    await fixFinancialAccountTable();
    
    // 5. 检查并修复财务分类表结构
    await fixFinancialCategoryTable();
    
    // 6. 检查并修复财务交易表结构
    await fixFinancialTransactionTable();

    console.log('数据库表结构修复完成！');
  } catch (error) {
    console.error('修复数据库表结构时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 检查并修复产品表结构
async function fixProductTable() {
  console.log('检查并修复产品表结构...');
  
  try {
    // 检查是否有产品缺少必要的字段
    const products = await prisma.product.findMany();
    
    for (const product of products) {
      const updates = {};
      
      // 检查并设置默认值
      if (product.commissionRate === null || product.commissionRate === undefined) {
        updates.commissionRate = 0;
      }
      
      if (product.type === null || product.type === undefined) {
        updates.type = 'product';
      }
      
      if (product.price === null || product.price === undefined) {
        updates.price = 0;
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: updates,
        });
        console.log(`已修复产品 ID=${product.id} 的字段: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (error) {
    console.error('修复产品表结构时出错:', error);
  }
}

// 检查并修复员工表结构
async function fixEmployeeTable() {
  console.log('检查并修复员工表结构...');
  
  try {
    // 检查是否有员工缺少必要的字段
    const employees = await prisma.employee.findMany();
    
    for (const employee of employees) {
      const updates = {};
      
      // 检查并设置默认值
      if (employee.dailySalary === null || employee.dailySalary === undefined) {
        updates.dailySalary = 0;
      }
      
      if (employee.status === null || employee.status === undefined) {
        updates.status = 'active';
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: updates,
        });
        console.log(`已修复员工 ID=${employee.id} 的字段: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (error) {
    console.error('修复员工表结构时出错:', error);
  }
}

// 检查并修复供应商表结构
async function fixSupplierTable() {
  console.log('检查并修复供应商表结构...');
  
  try {
    // 检查是否有供应商缺少必要的字段
    const suppliers = await prisma.supplier.findMany();
    
    for (const supplier of suppliers) {
      const updates = {};
      
      // 检查并设置默认值
      if (supplier.isActive === null || supplier.isActive === undefined) {
        updates.isActive = true;
      }
      
      if (supplier.description === null || supplier.description === undefined) {
        updates.description = '';
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.supplier.update({
          where: { id: supplier.id },
          data: updates,
        });
        console.log(`已修复供应商 ID=${supplier.id} 的字段: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (error) {
    console.error('修复供应商表结构时出错:', error);
  }
}

// 检查并修复财务账户表结构
async function fixFinancialAccountTable() {
  console.log('检查并修复财务账户表结构...');
  
  try {
    // 检查是否有财务账户缺少必要的字段
    const accounts = await prisma.financialAccount.findMany();
    
    for (const account of accounts) {
      const updates = {};
      
      // 检查并设置默认值
      if (account.initialBalance === null || account.initialBalance === undefined) {
        updates.initialBalance = 0;
      }
      
      if (account.currentBalance === null || account.currentBalance === undefined) {
        updates.currentBalance = 0;
      }
      
      if (account.isActive === null || account.isActive === undefined) {
        updates.isActive = true;
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.financialAccount.update({
          where: { id: account.id },
          data: updates,
        });
        console.log(`已修复财务账户 ID=${account.id} 的字段: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (error) {
    console.error('修复财务账户表结构时出错:', error);
  }
}

// 检查并修复财务分类表结构
async function fixFinancialCategoryTable() {
  console.log('检查并修复财务分类表结构...');
  
  try {
    // 检查是否有财务分类缺少必要的字段
    const categories = await prisma.financialCategory.findMany();
    
    for (const category of categories) {
      const updates = {};
      
      // 检查并设置默认值
      if (category.isSystem === null || category.isSystem === undefined) {
        updates.isSystem = false;
      }
      
      if (category.isActive === null || category.isActive === undefined) {
        updates.isActive = true;
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.financialCategory.update({
          where: { id: category.id },
          data: updates,
        });
        console.log(`已修复财务分类 ID=${category.id} 的字段: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (error) {
    console.error('修复财务分类表结构时出错:', error);
  }
}

// 检查并修复财务交易表结构
async function fixFinancialTransactionTable() {
  console.log('检查并修复财务交易表结构...');
  
  try {
    // 检查是否有财务交易缺少必要的字段
    const transactions = await prisma.financialTransaction.findMany();
    
    for (const transaction of transactions) {
      const updates = {};
      
      // 检查并设置默认值
      if (transaction.status === null || transaction.status === undefined) {
        updates.status = 'completed';
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: updates,
        });
        console.log(`已修复财务交易 ID=${transaction.id} 的字段: ${Object.keys(updates).join(', ')}`);
      }
    }
  } catch (error) {
    console.error('修复财务交易表结构时出错:', error);
  }
}

// 执行修复操作
fixDatabaseStructure();
