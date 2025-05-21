// 清理重复数据的脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicateData() {
  console.log('开始清理重复数据...');

  try {
    // 1. 清理重复的产品数据
    await cleanDuplicateProducts();
    
    // 2. 清理重复的员工数据
    await cleanDuplicateEmployees();
    
    // 3. 清理重复的客户数据
    await cleanDuplicateCustomers();
    
    // 4. 清理重复的供应商数据
    await cleanDuplicateSuppliers();
    
    // 5. 清理重复的渠道数据
    await cleanDuplicateChannels();
    
    // 6. 清理重复的财务账户数据
    await cleanDuplicateFinancialAccounts();
    
    // 7. 清理重复的财务分类数据
    await cleanDuplicateFinancialCategories();

    console.log('重复数据清理完成！');
  } catch (error) {
    console.error('清理重复数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 清理重复的产品数据
async function cleanDuplicateProducts() {
  console.log('清理重复的产品数据...');
  
  // 获取所有产品
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按名称分组
  const productsByName = {};
  products.forEach(product => {
    if (!productsByName[product.name]) {
      productsByName[product.name] = [];
    }
    productsByName[product.name].push(product);
  });
  
  // 处理重复的产品
  for (const name in productsByName) {
    const productsWithSameName = productsByName[name];
    if (productsWithSameName.length > 1) {
      console.log(`发现重复产品: ${name}, 数量: ${productsWithSameName.length}`);
      
      // 保留ID最小的产品，删除其他重复的产品
      const [keepProduct, ...duplicateProducts] = productsWithSameName;
      
      for (const duplicateProduct of duplicateProducts) {
        try {
          // 删除重复的产品
          await prisma.product.delete({
            where: { id: duplicateProduct.id },
          });
          console.log(`已删除重复产品: ID=${duplicateProduct.id}, 名称=${duplicateProduct.name}`);
        } catch (error) {
          console.error(`删除重复产品时出错 (ID=${duplicateProduct.id}):`, error.message);
        }
      }
    }
  }
}

// 清理重复的员工数据
async function cleanDuplicateEmployees() {
  console.log('清理重复的员工数据...');
  
  // 获取所有员工
  const employees = await prisma.employee.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按名称分组
  const employeesByName = {};
  employees.forEach(employee => {
    if (!employeesByName[employee.name]) {
      employeesByName[employee.name] = [];
    }
    employeesByName[employee.name].push(employee);
  });
  
  // 处理重复的员工
  for (const name in employeesByName) {
    const employeesWithSameName = employeesByName[name];
    if (employeesWithSameName.length > 1) {
      console.log(`发现重复员工: ${name}, 数量: ${employeesWithSameName.length}`);
      
      // 保留ID最小的员工，删除其他重复的员工
      const [keepEmployee, ...duplicateEmployees] = employeesWithSameName;
      
      for (const duplicateEmployee of duplicateEmployees) {
        try {
          // 删除重复的员工
          await prisma.employee.delete({
            where: { id: duplicateEmployee.id },
          });
          console.log(`已删除重复员工: ID=${duplicateEmployee.id}, 名称=${duplicateEmployee.name}`);
        } catch (error) {
          console.error(`删除重复员工时出错 (ID=${duplicateEmployee.id}):`, error.message);
        }
      }
    }
  }
}

// 清理重复的客户数据
async function cleanDuplicateCustomers() {
  console.log('清理重复的客户数据...');
  
  // 获取所有客户
  const customers = await prisma.customer.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按名称分组
  const customersByName = {};
  customers.forEach(customer => {
    if (!customersByName[customer.name]) {
      customersByName[customer.name] = [];
    }
    customersByName[customer.name].push(customer);
  });
  
  // 处理重复的客户
  for (const name in customersByName) {
    const customersWithSameName = customersByName[name];
    if (customersWithSameName.length > 1) {
      console.log(`发现重复客户: ${name}, 数量: ${customersWithSameName.length}`);
      
      // 保留ID最小的客户，删除其他重复的客户
      const [keepCustomer, ...duplicateCustomers] = customersWithSameName;
      
      for (const duplicateCustomer of duplicateCustomers) {
        try {
          // 删除重复的客户
          await prisma.customer.delete({
            where: { id: duplicateCustomer.id },
          });
          console.log(`已删除重复客户: ID=${duplicateCustomer.id}, 名称=${duplicateCustomer.name}`);
        } catch (error) {
          console.error(`删除重复客户时出错 (ID=${duplicateCustomer.id}):`, error.message);
        }
      }
    }
  }
}

// 清理重复的供应商数据
async function cleanDuplicateSuppliers() {
  console.log('清理重复的供应商数据...');
  
  // 获取所有供应商
  const suppliers = await prisma.supplier.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按名称分组
  const suppliersByName = {};
  suppliers.forEach(supplier => {
    if (!suppliersByName[supplier.name]) {
      suppliersByName[supplier.name] = [];
    }
    suppliersByName[supplier.name].push(supplier);
  });
  
  // 处理重复的供应商
  for (const name in suppliersByName) {
    const suppliersWithSameName = suppliersByName[name];
    if (suppliersWithSameName.length > 1) {
      console.log(`发现重复供应商: ${name}, 数量: ${suppliersWithSameName.length}`);
      
      // 保留ID最小的供应商，删除其他重复的供应商
      const [keepSupplier, ...duplicateSuppliers] = suppliersWithSameName;
      
      for (const duplicateSupplier of duplicateSuppliers) {
        try {
          // 删除重复的供应商
          await prisma.supplier.delete({
            where: { id: duplicateSupplier.id },
          });
          console.log(`已删除重复供应商: ID=${duplicateSupplier.id}, 名称=${duplicateSupplier.name}`);
        } catch (error) {
          console.error(`删除重复供应商时出错 (ID=${duplicateSupplier.id}):`, error.message);
        }
      }
    }
  }
}

// 清理重复的渠道数据
async function cleanDuplicateChannels() {
  console.log('清理重复的渠道数据...');
  
  // 获取所有渠道
  const channels = await prisma.channel.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按名称分组
  const channelsByName = {};
  channels.forEach(channel => {
    if (!channelsByName[channel.name]) {
      channelsByName[channel.name] = [];
    }
    channelsByName[channel.name].push(channel);
  });
  
  // 处理重复的渠道
  for (const name in channelsByName) {
    const channelsWithSameName = channelsByName[name];
    if (channelsWithSameName.length > 1) {
      console.log(`发现重复渠道: ${name}, 数量: ${channelsWithSameName.length}`);
      
      // 保留ID最小的渠道，删除其他重复的渠道
      const [keepChannel, ...duplicateChannels] = channelsWithSameName;
      
      for (const duplicateChannel of duplicateChannels) {
        try {
          // 删除重复的渠道
          await prisma.channel.delete({
            where: { id: duplicateChannel.id },
          });
          console.log(`已删除重复渠道: ID=${duplicateChannel.id}, 名称=${duplicateChannel.name}`);
        } catch (error) {
          console.error(`删除重复渠道时出错 (ID=${duplicateChannel.id}):`, error.message);
        }
      }
    }
  }
}

// 清理重复的财务账户数据
async function cleanDuplicateFinancialAccounts() {
  console.log('清理重复的财务账户数据...');
  
  // 获取所有财务账户
  const accounts = await prisma.financialAccount.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按名称分组
  const accountsByName = {};
  accounts.forEach(account => {
    if (!accountsByName[account.name]) {
      accountsByName[account.name] = [];
    }
    accountsByName[account.name].push(account);
  });
  
  // 处理重复的财务账户
  for (const name in accountsByName) {
    const accountsWithSameName = accountsByName[name];
    if (accountsWithSameName.length > 1) {
      console.log(`发现重复财务账户: ${name}, 数量: ${accountsWithSameName.length}`);
      
      // 保留ID最小的财务账户，删除其他重复的财务账户
      const [keepAccount, ...duplicateAccounts] = accountsWithSameName;
      
      for (const duplicateAccount of duplicateAccounts) {
        try {
          // 删除重复的财务账户
          await prisma.financialAccount.delete({
            where: { id: duplicateAccount.id },
          });
          console.log(`已删除重复财务账户: ID=${duplicateAccount.id}, 名称=${duplicateAccount.name}`);
        } catch (error) {
          console.error(`删除重复财务账户时出错 (ID=${duplicateAccount.id}):`, error.message);
        }
      }
    }
  }
}

// 清理重复的财务分类数据
async function cleanDuplicateFinancialCategories() {
  console.log('清理重复的财务分类数据...');
  
  // 获取所有财务分类
  const categories = await prisma.financialCategory.findMany({
    orderBy: { id: 'asc' },
  });
  
  // 按代码分组
  const categoriesByCode = {};
  categories.forEach(category => {
    if (!categoriesByCode[category.code]) {
      categoriesByCode[category.code] = [];
    }
    categoriesByCode[category.code].push(category);
  });
  
  // 处理重复的财务分类
  for (const code in categoriesByCode) {
    const categoriesWithSameCode = categoriesByCode[code];
    if (categoriesWithSameCode.length > 1) {
      console.log(`发现重复财务分类: ${code}, 数量: ${categoriesWithSameCode.length}`);
      
      // 保留ID最小的财务分类，删除其他重复的财务分类
      const [keepCategory, ...duplicateCategories] = categoriesWithSameCode;
      
      for (const duplicateCategory of duplicateCategories) {
        try {
          // 删除重复的财务分类
          await prisma.financialCategory.delete({
            where: { id: duplicateCategory.id },
          });
          console.log(`已删除重复财务分类: ID=${duplicateCategory.id}, 代码=${duplicateCategory.code}`);
        } catch (error) {
          console.error(`删除重复财务分类时出错 (ID=${duplicateCategory.id}):`, error.message);
        }
      }
    }
  }
}

// 执行清理操作
cleanDuplicateData();
