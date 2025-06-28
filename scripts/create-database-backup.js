#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function createDatabaseBackup() {
  console.log('💾 创建数据库完整备份');
  console.log('========================\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = 'backups/database';
  
  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    // 1. 创建SQL转储备份
    console.log('📦 1. 创建SQL转储备份...');
    
    const sqlBackupFile = path.join(backupDir, `full-backup-${timestamp}.sql`);
    
    execSync(`docker exec linghua-postgres pg_dump -U postgres linghua_enamel_gallery > ${sqlBackupFile}`, {
      stdio: 'inherit'
    });
    
    console.log(`   ✅ SQL备份已保存到: ${sqlBackupFile}`);
    
    // 2. 创建架构备份
    console.log('\n🏗️  2. 创建架构备份...');
    
    const schemaBackupFile = path.join(backupDir, `schema-backup-${timestamp}.sql`);
    
    execSync(`docker exec linghua-postgres pg_dump -U postgres --schema-only linghua_enamel_gallery > ${schemaBackupFile}`, {
      stdio: 'inherit'
    });
    
    console.log(`   ✅ 架构备份已保存到: ${schemaBackupFile}`);
    
    // 3. 创建数据备份
    console.log('\n📊 3. 创建数据备份...');
    
    const dataBackupFile = path.join(backupDir, `data-backup-${timestamp}.sql`);
    
    execSync(`docker exec linghua-postgres pg_dump -U postgres --data-only linghua_enamel_gallery > ${dataBackupFile}`, {
      stdio: 'inherit'
    });
    
    console.log(`   ✅ 数据备份已保存到: ${dataBackupFile}`);
    
    // 4. 备份Prisma配置
    console.log('\n⚙️  4. 备份Prisma配置...');
    
    const prismaBackupDir = path.join(backupDir, `prisma-config-${timestamp}`);
    fs.mkdirSync(prismaBackupDir, { recursive: true });
    
    // 复制schema文件
    if (fs.existsSync('prisma/schema.prisma')) {
      fs.copyFileSync('prisma/schema.prisma', path.join(prismaBackupDir, 'schema.prisma'));
      console.log('   ✅ schema.prisma 已备份');
    }
    
    // 复制迁移文件
    if (fs.existsSync('prisma/migrations')) {
      execSync(`cp -r prisma/migrations ${prismaBackupDir}/`, { stdio: 'inherit' });
      console.log('   ✅ 迁移文件已备份');
    }
    
    // 5. 备份环境配置
    console.log('\n🔧 5. 备份环境配置...');
    
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', path.join(backupDir, `.env-backup-${timestamp}`));
      console.log('   ✅ .env 文件已备份');
    }
    
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', path.join(backupDir, `.env.example-backup-${timestamp}`));
      console.log('   ✅ .env.example 文件已备份');
    }
    
    // 6. 创建备份清单
    console.log('\n📋 6. 创建备份清单...');
    
    const manifest = {
      timestamp: new Date().toISOString(),
      backupType: 'full-database-backup',
      files: {
        sqlDump: sqlBackupFile,
        schemaDump: schemaBackupFile,
        dataDump: dataBackupFile,
        prismaConfig: prismaBackupDir,
        envConfig: path.join(backupDir, `.env-backup-${timestamp}`)
      },
      databaseInfo: {
        containerName: 'linghua-postgres',
        databaseName: 'linghua_enamel_gallery',
        user: 'postgres'
      },
      notes: '完整数据库备份，包含数据、架构、Prisma配置和环境变量'
    };
    
    const manifestFile = path.join(backupDir, `backup-manifest-${timestamp}.json`);
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    console.log(`   ✅ 备份清单已保存到: ${manifestFile}`);
    
    // 7. 验证备份文件
    console.log('\n🔍 7. 验证备份文件...');
    
    const files = [sqlBackupFile, schemaBackupFile, dataBackupFile, manifestFile];
    let allValid = true;
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`   ✅ ${path.basename(file)}: ${(stats.size / 1024).toFixed(2)} KB`);
      } else {
        console.log(`   ❌ ${path.basename(file)}: 文件不存在`);
        allValid = false;
      }
    });
    
    if (allValid) {
      console.log('\n🎉 数据库备份创建成功！');
      console.log(`备份位置: ${backupDir}`);
      console.log(`备份时间: ${timestamp}`);
      
      return {
        success: true,
        backupDir,
        timestamp,
        manifest
      };
    } else {
      throw new Error('部分备份文件创建失败');
    }
    
  } catch (error) {
    console.error('\n❌ 备份创建失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行备份
const result = createDatabaseBackup();

if (result.success) {
  console.log('\n✅ 备份任务完成');
  process.exit(0);
} else {
  console.log('\n❌ 备份任务失败');
  process.exit(1);
}
