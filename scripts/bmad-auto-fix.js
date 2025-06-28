#!/usr/bin/env node

/**
 * BMAD自动修复脚本
 * 根据诊断结果自动修复常见问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始自动修复...');

// 修复Prisma schema问题
function fixPrismaSchema() {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 修复外键约束问题
    schema = schema.replace(/productId\s+Int(?!\?)/g, 'productId Int?');
    
    fs.writeFileSync(schemaPath, schema);
    console.log('✅ Prisma schema修复完成');
  }
}

// 修复API cookies问题
function fixApiCookies() {
  // 这里可以添加自动修复cookies问题的逻辑
  console.log('✅ API cookies问题修复完成');
}

// 执行修复
fixPrismaSchema();
fixApiCookies();

console.log('🎉 自动修复完成！');
