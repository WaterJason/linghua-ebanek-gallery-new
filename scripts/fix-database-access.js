#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 聆花珐琅馆数据库访问权限修复工具');
console.log('=====================================\n');

// 检查环境变量
function checkEnvironment() {
  console.log('📋 检查环境配置...');

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 文件不存在');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env 文件存在');
  console.log('当前数据库配置:');

  const dbUrl = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (dbUrl) {
    console.log(`   DATABASE_URL: ${dbUrl[1]}`);
  } else {
    console.error('❌ DATABASE_URL 未配置');
    return false;
  }

  return true;
}

// 检查 PostgreSQL 服务状态
function checkPostgreSQL() {
  console.log('\n🔍 检查 PostgreSQL 服务状态...');

  try {
    const result = execSync('brew services list | grep postgres', { encoding: 'utf8' });
    console.log('PostgreSQL 服务状态:');
    console.log(result);

    if (result.includes('started')) {
      console.log('✅ PostgreSQL 服务正在运行');
      return true;
    } else {
      console.log('⚠️  PostgreSQL 服务未启动');
      return false;
    }
  } catch (error) {
    console.error('❌ 无法检查 PostgreSQL 服务状态:', error.message);
    return false;
  }
}

// 启动 PostgreSQL 服务
function startPostgreSQL() {
  console.log('\n🚀 启动 PostgreSQL 服务...');

  try {
    execSync('brew services start postgresql@15', { stdio: 'inherit' });
    console.log('✅ PostgreSQL 服务启动成功');

    // 等待服务完全启动
    console.log('⏳ 等待服务完全启动...');
    setTimeout(() => {}, 3000);

    return true;
  } catch (error) {
    console.error('❌ 启动 PostgreSQL 服务失败:', error.message);
    return false;
  }
}

// 重置数据库
function resetDatabase() {
  console.log('\n🔄 重置数据库...');

  try {
    // 使用 psql 连接并重置数据库
    console.log('使用 psql 重置数据库...');

    // 首先尝试连接到 postgres 默认数据库
    const psqlPath = '/opt/homebrew/Cellar/postgresql@15/15.13/bin/psql';

    try {
      // 删除现有数据库（如果存在）
      console.log('删除现有数据库...');
      execSync(`${psqlPath} -d postgres -c "DROP DATABASE IF EXISTS linghua_enamel_gallery;"`, { stdio: 'inherit' });
      console.log('✅ 现有数据库已删除');
    } catch (error) {
      console.log('ℹ️  数据库删除操作完成');
    }

    // 创建新数据库
    console.log('创建新数据库...');
    execSync(`${psqlPath} -d postgres -c "CREATE DATABASE linghua_enamel_gallery;"`, { stdio: 'inherit' });
    console.log('✅ 新数据库创建成功');

    return true;
  } catch (error) {
    console.error('❌ 重置数据库失败:', error.message);
    console.log('尝试使用 Prisma 重置...');

    // 备用方案：使用 Prisma 重置
    try {
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
      console.log('✅ 使用 Prisma 重置成功');
      return true;
    } catch (prismaError) {
      console.error('❌ Prisma 重置也失败:', prismaError.message);
      return false;
    }
  }
}

// 运行 Prisma 迁移
function runPrismaMigrations() {
  console.log('\n📦 运行 Prisma 迁移...');

  try {
    // 重新生成 Prisma 客户端
    console.log('重新生成 Prisma 客户端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma 客户端生成成功');

    // 推送数据库架构
    console.log('推送数据库架构...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ 数据库架构推送成功');

    return true;
  } catch (error) {
    console.error('❌ Prisma 迁移失败:', error.message);
    return false;
  }
}

// 测试数据库连接
function testDatabaseConnection() {
  console.log('\n🧪 测试数据库连接...');

  try {
    execSync('node scripts/test-db-connection.js', { stdio: 'inherit' });
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

// 主修复流程
async function main() {
  try {
    // 1. 检查环境配置
    if (!checkEnvironment()) {
      process.exit(1);
    }

    // 2. 检查 PostgreSQL 服务
    if (!checkPostgreSQL()) {
      if (!startPostgreSQL()) {
        process.exit(1);
      }
    }

    // 3. 重置数据库
    if (!resetDatabase()) {
      process.exit(1);
    }

    // 4. 运行 Prisma 迁移
    if (!runPrismaMigrations()) {
      process.exit(1);
    }

    // 5. 测试数据库连接
    if (!testDatabaseConnection()) {
      process.exit(1);
    }

    console.log('\n🎉 数据库访问权限修复完成！');
    console.log('现在可以正常使用数据库功能了。');

  } catch (error) {
    console.error('\n❌ 修复过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行修复程序
main();
