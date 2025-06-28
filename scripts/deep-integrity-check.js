#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function deepIntegrityCheck() {
  console.log('🔬 深度数据完整性验证');
  console.log('========================\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    checks: [],
    issues: [],
    warnings: [],
    summary: {}
  };
  
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');
    
    // 1. 检查Prisma Schema与数据库结构一致性
    console.log('🏗️  1. 检查Prisma Schema与数据库结构一致性...');
    
    try {
      // 获取数据库中的表信息
      const dbTables = await prisma.$queryRaw`
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position;
      `;
      
      console.log(`   数据库中发现 ${dbTables.length} 个字段`);
      
      // 检查关键表是否存在
      const keyTables = ['User', 'Employee', 'Customer', 'Product', 'Order', 'Schedule'];
      const existingTables = [...new Set(dbTables.map(t => t.table_name))];
      
      keyTables.forEach(table => {
        if (existingTables.includes(table)) {
          console.log(`   ✅ 关键表 ${table} 存在`);
        } else {
          report.issues.push(`关键表 ${table} 不存在`);
          console.log(`   ❌ 关键表 ${table} 不存在`);
        }
      });
      
      report.checks.push({
        name: 'schema_consistency',
        status: 'completed',
        tablesFound: existingTables.length,
        keyTablesPresent: keyTables.filter(t => existingTables.includes(t)).length
      });
      
    } catch (error) {
      report.issues.push(`Schema一致性检查失败: ${error.message}`);
      console.log(`   ❌ Schema一致性检查失败: ${error.message}`);
    }
    
    // 2. 检查数据关联完整性
    console.log('\n🔗 2. 检查数据关联完整性...');
    
    try {
      // 检查用户数据完整性
      const users = await prisma.user.findMany({
        include: {
          employee: true,
          userRoles: true,
          userSettings: true
        }
      });
      
      console.log(`   发现 ${users.length} 个用户`);
      
      users.forEach((user, index) => {
        if (user.employeeId && !user.employee) {
          report.issues.push(`用户 ${user.id} 关联到不存在的员工 ${user.employeeId}`);
        }
        if (!user.userSettings) {
          report.warnings.push(`用户 ${user.id} 缺少用户设置`);
        }
      });
      
      // 检查员工数据完整性
      const employees = await prisma.employee.findMany({
        include: {
          user: true,
          schedules: true
        }
      });
      
      console.log(`   发现 ${employees.length} 个员工`);
      
      employees.forEach(employee => {
        if (!employee.name || employee.name.trim() === '') {
          report.issues.push(`员工 ${employee.id} 缺少姓名`);
        }
        if (!employee.position || employee.position.trim() === '') {
          report.warnings.push(`员工 ${employee.id} 缺少职位信息`);
        }
      });
      
      // 检查客户数据完整性
      const customers = await prisma.customer.findMany({
        include: {
          orders: true,
          workshops: true
        }
      });
      
      console.log(`   发现 ${customers.length} 个客户`);
      
      customers.forEach(customer => {
        if (!customer.name || customer.name.trim() === '') {
          report.issues.push(`客户 ${customer.id} 缺少姓名`);
        }
        if (customer.phone && !/^1[3-9]\d{9}$/.test(customer.phone)) {
          report.warnings.push(`客户 ${customer.id} 电话号码格式可能不正确: ${customer.phone}`);
        }
      });
      
      // 检查产品数据完整性
      const products = await prisma.product.findMany({
        include: {
          productCategory: true,
          orderItems: true
        }
      });
      
      console.log(`   发现 ${products.length} 个产品`);
      
      products.forEach(product => {
        if (!product.name || product.name.trim() === '') {
          report.issues.push(`产品 ${product.id} 缺少名称`);
        }
        if (product.price <= 0) {
          report.warnings.push(`产品 ${product.id} 价格异常: ${product.price}`);
        }
        if (product.commissionRate < 0 || product.commissionRate > 1) {
          report.warnings.push(`产品 ${product.id} 佣金率异常: ${product.commissionRate}`);
        }
      });
      
      report.checks.push({
        name: 'data_associations',
        status: 'completed',
        usersChecked: users.length,
        employeesChecked: employees.length,
        customersChecked: customers.length,
        productsChecked: products.length
      });
      
    } catch (error) {
      report.issues.push(`数据关联检查失败: ${error.message}`);
      console.log(`   ❌ 数据关联检查失败: ${error.message}`);
    }
    
    // 3. 检查业务逻辑完整性
    console.log('\n💼 3. 检查业务逻辑完整性...');
    
    try {
      // 检查订单数据
      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          employee: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      console.log(`   发现 ${orders.length} 个订单`);
      
      orders.forEach(order => {
        if (!order.customer) {
          report.issues.push(`订单 ${order.id} 关联到不存在的客户`);
        }
        if (!order.employee) {
          report.issues.push(`订单 ${order.id} 关联到不存在的员工`);
        }
        if (order.totalAmount <= 0) {
          report.warnings.push(`订单 ${order.id} 总金额异常: ${order.totalAmount}`);
        }
        if (order.paidAmount > order.totalAmount) {
          report.issues.push(`订单 ${order.id} 已付金额超过总金额`);
        }
        
        // 检查订单项
        let calculatedTotal = 0;
        order.items.forEach(item => {
          if (!item.product) {
            report.issues.push(`订单项 ${item.id} 关联到不存在的产品`);
          }
          calculatedTotal += item.price * item.quantity;
        });
        
        if (Math.abs(calculatedTotal - order.totalAmount) > 0.01) {
          report.warnings.push(`订单 ${order.id} 计算总额与记录总额不符: 计算=${calculatedTotal}, 记录=${order.totalAmount}`);
        }
      });
      
      // 检查排班数据
      const schedules = await prisma.schedule.findMany({
        include: {
          employee: true
        }
      });
      
      console.log(`   发现 ${schedules.length} 个排班记录`);
      
      schedules.forEach(schedule => {
        if (!schedule.employee) {
          report.issues.push(`排班 ${schedule.id} 关联到不存在的员工`);
        }
        
        // 检查时间逻辑
        const startTime = schedule.startTime;
        const endTime = schedule.endTime;
        
        if (startTime >= endTime) {
          report.issues.push(`排班 ${schedule.id} 开始时间晚于或等于结束时间`);
        }
        
        // 检查日期合理性
        const scheduleDate = new Date(schedule.date);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        
        if (scheduleDate < oneYearAgo || scheduleDate > oneYearLater) {
          report.warnings.push(`排班 ${schedule.id} 日期超出合理范围: ${schedule.date}`);
        }
      });
      
      report.checks.push({
        name: 'business_logic',
        status: 'completed',
        ordersChecked: orders.length,
        schedulesChecked: schedules.length
      });
      
    } catch (error) {
      report.issues.push(`业务逻辑检查失败: ${error.message}`);
      console.log(`   ❌ 业务逻辑检查失败: ${error.message}`);
    }
    
    // 4. 检查数据一致性
    console.log('\n🔄 4. 检查数据一致性...');
    
    try {
      // 检查重复数据
      const duplicatePhones = await prisma.$queryRaw`
        SELECT phone, COUNT(*) as count
        FROM "Customer"
        WHERE phone IS NOT NULL AND phone != ''
        GROUP BY phone
        HAVING COUNT(*) > 1;
      `;
      
      if (duplicatePhones.length > 0) {
        report.warnings.push(`发现 ${duplicatePhones.length} 个重复的客户电话号码`);
        console.log(`   ⚠️  发现 ${duplicatePhones.length} 个重复的客户电话号码`);
      } else {
        console.log('   ✅ 客户电话号码无重复');
      }
      
      // 检查员工重复邮箱
      const duplicateEmails = await prisma.$queryRaw`
        SELECT email, COUNT(*) as count
        FROM "Employee"
        WHERE email IS NOT NULL AND email != ''
        GROUP BY email
        HAVING COUNT(*) > 1;
      `;
      
      if (duplicateEmails.length > 0) {
        report.warnings.push(`发现 ${duplicateEmails.length} 个重复的员工邮箱`);
        console.log(`   ⚠️  发现 ${duplicateEmails.length} 个重复的员工邮箱`);
      } else {
        console.log('   ✅ 员工邮箱无重复');
      }
      
      report.checks.push({
        name: 'data_consistency',
        status: 'completed',
        duplicatePhones: duplicatePhones.length,
        duplicateEmails: duplicateEmails.length
      });
      
    } catch (error) {
      report.issues.push(`数据一致性检查失败: ${error.message}`);
      console.log(`   ❌ 数据一致性检查失败: ${error.message}`);
    }
    
  } catch (error) {
    report.issues.push(`深度完整性检查失败: ${error.message}`);
    console.error('\n❌ 深度完整性检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // 生成总结
  report.summary = {
    totalChecks: report.checks.length,
    completedChecks: report.checks.filter(c => c.status === 'completed').length,
    totalIssues: report.issues.length,
    totalWarnings: report.warnings.length,
    overallStatus: report.issues.length === 0 ? 'healthy' : 'needs_attention'
  };
  
  // 保存报告
  const reportPath = `reports/deep-integrity-check-${Date.now()}.json`;
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // 输出总结
  console.log('\n📊 检查总结:');
  console.log(`   完成检查: ${report.summary.completedChecks}/${report.summary.totalChecks}`);
  console.log(`   发现问题: ${report.summary.totalIssues} 个`);
  console.log(`   警告信息: ${report.summary.totalWarnings} 个`);
  console.log(`   整体状态: ${report.summary.overallStatus === 'healthy' ? '健康' : '需要关注'}`);
  
  if (report.issues.length > 0) {
    console.log('\n❌ 发现的问题:');
    report.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  if (report.warnings.length > 0) {
    console.log('\n⚠️  警告信息:');
    report.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  
  return report;
}

// 运行深度检查
deepIntegrityCheck()
  .then((report) => {
    console.log('\n✅ 深度完整性验证完成');
    if (report.summary.overallStatus === 'healthy') {
      console.log('🎉 数据库完整性良好');
      process.exit(0);
    } else {
      console.log('⚠️  发现需要关注的问题');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 深度完整性验证失败:', error);
    process.exit(1);
  });
