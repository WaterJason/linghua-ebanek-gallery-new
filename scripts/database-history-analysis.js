#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('🔍 聆花珐琅馆数据库历史问题排查');
  console.log('=====================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    configFiles: [],
    migrations: [],
    dataIntegrity: {},
    issues: [],
    recommendations: []
  };

  try {
    // 1. 检查配置文件
    console.log('📋 1. 检查数据库配置文件...');

    const envFiles = ['.env', '.env.example', '.env.local', '.env.development'];
    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const dbUrl = content.match(/DATABASE_URL="([^"]+)"/);
        report.configFiles.push({
          file,
          exists: true,
          databaseUrl: dbUrl ? dbUrl[1] : null
        });
        console.log(`   ✅ ${file}: ${dbUrl ? dbUrl[1] : '无DATABASE_URL'}`);
      } else {
        report.configFiles.push({ file, exists: false });
        console.log(`   ❌ ${file}: 不存在`);
      }
    }

    // 2. 分析迁移历史
    console.log('\n📦 2. 分析数据库迁移历史...');

    const migrationsDir = 'prisma/migrations';
    if (fs.existsSync(migrationsDir)) {
      const migrations = fs.readdirSync(migrationsDir)
        .filter(item => fs.statSync(path.join(migrationsDir, item)).isDirectory())
        .sort();

      console.log(`   发现 ${migrations.length} 个迁移文件:`);
      migrations.forEach(migration => {
        report.migrations.push(migration);
        console.log(`   - ${migration}`);
      });

      // 检查是否有重复或冲突的迁移
      const duplicates = migrations.filter((item, index) =>
        migrations.indexOf(item) !== index
      );
      if (duplicates.length > 0) {
        report.issues.push(`发现重复迁移: ${duplicates.join(', ')}`);
      }
    }

    // 3. 连接数据库进行完整性检查
    console.log('\n🔗 3. 连接数据库进行完整性检查...');

    await prisma.$connect();
    console.log('   ✅ 数据库连接成功');

    // 4. 检查表结构
    console.log('\n📊 4. 检查数据库表结构...');

    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log(`   数据库中共有 ${tables.length} 个表:`);
    const tableNames = tables.map(t => t.table_name);
    tableNames.forEach(name => console.log(`   - ${name}`));

    report.dataIntegrity.tableCount = tables.length;
    report.dataIntegrity.tables = tableNames;

    // 5. 检查核心业务数据
    console.log('\n👥 5. 检查核心业务数据完整性...');

    const coreData = {
      users: await prisma.user.count(),
      employees: await prisma.employee.count(),
      customers: await prisma.customer.count(),
      products: await prisma.product.count(),
      orders: await prisma.order.count(),
      schedules: await prisma.schedule.count(),
      workshops: await prisma.workshop.count(),
    };

    report.dataIntegrity.coreData = coreData;

    console.log('   核心数据统计:');
    Object.entries(coreData).forEach(([key, count]) => {
      console.log(`   - ${key}: ${count} 条记录`);
    });

    // 6. 检查外键约束
    console.log('\n🔗 6. 检查外键约束完整性...');

    try {
      // 检查用户-员工关联
      const userEmployeeCheck = await prisma.$queryRaw`
        SELECT u.id as user_id, u."employeeId", e.id as employee_id
        FROM "User" u
        LEFT JOIN "Employee" e ON u."employeeId" = e.id
        WHERE u."employeeId" IS NOT NULL AND e.id IS NULL;
      `;

      if (userEmployeeCheck.length > 0) {
        report.issues.push(`发现 ${userEmployeeCheck.length} 个用户关联到不存在的员工`);
        console.log(`   ⚠️  发现 ${userEmployeeCheck.length} 个用户关联到不存在的员工`);
      } else {
        console.log('   ✅ 用户-员工关联完整');
      }

      // 检查订单-客户关联
      const orderCustomerCheck = await prisma.$queryRaw`
        SELECT o.id as order_id, o."customerId", c.id as customer_id
        FROM "Order" o
        LEFT JOIN "Customer" c ON o."customerId" = c.id
        WHERE c.id IS NULL;
      `;

      if (orderCustomerCheck.length > 0) {
        report.issues.push(`发现 ${orderCustomerCheck.length} 个订单关联到不存在的客户`);
        console.log(`   ⚠️  发现 ${orderCustomerCheck.length} 个订单关联到不存在的客户`);
      } else {
        console.log('   ✅ 订单-客户关联完整');
      }

      // 检查排班-员工关联
      const scheduleEmployeeCheck = await prisma.$queryRaw`
        SELECT s.id as schedule_id, s."employeeId", e.id as employee_id
        FROM "Schedule" s
        LEFT JOIN "Employee" e ON s."employeeId" = e.id
        WHERE e.id IS NULL;
      `;

      if (scheduleEmployeeCheck.length > 0) {
        report.issues.push(`发现 ${scheduleEmployeeCheck.length} 个排班关联到不存在的员工`);
        console.log(`   ⚠️  发现 ${scheduleEmployeeCheck.length} 个排班关联到不存在的员工`);
      } else {
        console.log('   ✅ 排班-员工关联完整');
      }

    } catch (error) {
      report.issues.push(`外键约束检查失败: ${error.message}`);
      console.log(`   ❌ 外键约束检查失败: ${error.message}`);
    }

    // 7. 检查数据一致性
    console.log('\n🔍 7. 检查数据一致性...');

    try {
      // 检查重复数据
      const duplicateCustomers = await prisma.$queryRaw`
        SELECT phone, COUNT(*) as count
        FROM "Customer"
        WHERE phone IS NOT NULL
        GROUP BY phone
        HAVING COUNT(*) > 1;
      `;

      if (duplicateCustomers.length > 0) {
        report.issues.push(`发现 ${duplicateCustomers.length} 个重复的客户电话号码`);
        console.log(`   ⚠️  发现 ${duplicateCustomers.length} 个重复的客户电话号码`);
      } else {
        console.log('   ✅ 客户电话号码无重复');
      }

      // 检查数据范围合理性
      const futureSchedules = await prisma.schedule.count({
        where: {
          date: {
            gt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 一年后
          }
        }
      });

      if (futureSchedules > 0) {
        report.issues.push(`发现 ${futureSchedules} 个超过一年的未来排班`);
        console.log(`   ⚠️  发现 ${futureSchedules} 个超过一年的未来排班`);
      } else {
        console.log('   ✅ 排班日期范围合理');
      }

    } catch (error) {
      report.issues.push(`数据一致性检查失败: ${error.message}`);
      console.log(`   ❌ 数据一致性检查失败: ${error.message}`);
    }

  } catch (error) {
    report.issues.push(`数据库连接或查询失败: ${error.message}`);
    console.error('\n❌ 数据库分析失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  // 8. 生成建议
  console.log('\n💡 8. 生成修复建议...');

  if (report.issues.length === 0) {
    report.recommendations.push('数据库状态良好，无需修复');
    console.log('   ✅ 数据库状态良好，无需修复');
  } else {
    report.recommendations.push('建议立即备份数据库');
    report.recommendations.push('修复发现的数据完整性问题');
    report.recommendations.push('建立定期数据完整性检查机制');

    console.log('   建议执行以下修复措施:');
    report.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }

  // 保存报告
  const reportPath = `reports/database-analysis-${Date.now()}.json`;
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📄 详细报告已保存到: ${reportPath}`);

  return report;
}

// 运行分析
analyzeDatabase()
  .then((report) => {
    console.log('\n✅ 数据库历史问题排查完成');
    if (report.issues.length > 0) {
      console.log(`⚠️  发现 ${report.issues.length} 个问题需要处理`);
      process.exit(1);
    } else {
      console.log('🎉 数据库状态良好');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('\n❌ 分析过程失败:', error);
    process.exit(1);
  });
