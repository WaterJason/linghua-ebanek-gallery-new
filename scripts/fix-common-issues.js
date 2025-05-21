/**
 * 自动修复常见问题
 * 
 * 这个脚本会自动修复一些常见问题，比如：
 * 1. 添加缺少的 "use server" 指令
 * 2. 修复 prisma 导入路径
 * 3. 移除不存在的字段
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 要扫描的目录
const actionsDir = path.join(__dirname, '..', 'lib', 'actions');
const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// 解析 Prisma 模型
function parsePrismaSchema() {
  const schema = fs.readFileSync(prismaSchemaPath, 'utf8');
  const models = {};
  
  // 使用正则表达式提取模型定义
  const modelRegex = /model\s+(\w+)\s+{([^}]*)}/g;
  let match;
  
  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // 提取字段
    const fields = {};
    const fieldLines = modelBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//') && !line.startsWith('@@'));
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/^(\w+)\s+/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        fields[fieldName] = true;
      }
    });
    
    models[modelName] = fields;
  }
  
  return models;
}

// 查找所有 .ts 文件
function findTsFiles(dir) {
  const files = fs.readdirSync(dir);
  return files
    .filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'types.ts')
    .map(file => path.join(dir, file));
}

// 修复 "use server" 指令
function fixUseServer(filePath) {
  console.log(`正在检查 "use server" 指令: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 检查文件是否使用了 revalidatePath 但没有 "use server" 指令
  if (content.includes('revalidatePath') && !content.includes('"use server"') && !content.includes("'use server'")) {
    // 在导入语句之前添加 "use server" 指令
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // 跳过文件开头的注释
    while (insertIndex < lines.length && (lines[insertIndex].trim().startsWith('/*') || lines[insertIndex].trim().startsWith('*') || lines[insertIndex].trim().startsWith('*/') || lines[insertIndex].trim() === '')) {
      insertIndex++;
    }
    
    lines.splice(insertIndex, 0, '"use server";', '');
    content = lines.join('\n');
    modified = true;
    
    console.log(`  已添加 "use server" 指令`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// 修复 prisma 导入路径
function fixPrismaImport(filePath) {
  console.log(`正在检查 prisma 导入路径: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 替换导入语句
  const oldImport = /import\s*{\s*prisma\s*}\s*from\s*["']\.\.\/prisma["'];?/;
  if (oldImport.test(content)) {
    content = content.replace(oldImport, 'import prisma from "@/lib/db";');
    modified = true;
    
    console.log(`  已修复 prisma 导入路径`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// 移除不存在的字段
function removeNonExistentFields(filePath, models) {
  console.log(`正在检查不存在的字段: ${filePath}`);
  
  // 提取模型名称
  const modelNameMatch = path.basename(filePath, '.ts').match(/^(\w+)-actions/);
  if (!modelNameMatch) {
    console.log(`  无法确定模型名称，跳过检查`);
    return false;
  }
  
  // 猜测模型名称（首字母大写）
  const guessedModelName = modelNameMatch[1].charAt(0).toUpperCase() + modelNameMatch[1].slice(1);
  
  if (!models[guessedModelName]) {
    console.log(`  找不到模型 ${guessedModelName}，跳过检查`);
    return false;
  }
  
  console.log(`  使用模型: ${guessedModelName}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 已知的不存在字段列表
  const knownNonExistentFields = {
    'Employee': ['department', 'notes'],
    'Schedule': ['type', 'location', 'notes', 'createdById'],
    // 可以添加更多模型和字段
  };
  
  // 如果有已知的不存在字段，尝试移除它们
  if (knownNonExistentFields[guessedModelName]) {
    knownNonExistentFields[guessedModelName].forEach(field => {
      // 在 create 操作中移除字段
      const createRegex = new RegExp(`(\\s+)${field}:\\s*[^,\\n]*,?\\n`, 'g');
      const oldContent = content;
      content = content.replace(createRegex, (match, indent) => {
        console.log(`  已移除 create 操作中的 ${field} 字段`);
        return `${indent}// 移除 ${field} 字段，因为 ${guessedModelName} 模型中没有这个字段\n`;
      });
      
      if (oldContent !== content) {
        modified = true;
      }
      
      // 在 update 操作中移除字段
      const updateRegex = new RegExp(`(\\s+)${field}:\\s*[^,\\n]*,?\\n`, 'g');
      const oldContent2 = content;
      content = content.replace(updateRegex, (match, indent) => {
        console.log(`  已移除 update 操作中的 ${field} 字段`);
        return `${indent}// 移除 ${field} 字段，因为 ${guessedModelName} 模型中没有这个字段\n`;
      });
      
      if (oldContent2 !== content) {
        modified = true;
      }
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// 主函数
function main() {
  console.log('开始修复常见问题...\n');
  
  const models = parsePrismaSchema();
  console.log(`已解析 ${Object.keys(models).length} 个 Prisma 模型\n`);
  
  const files = findTsFiles(actionsDir);
  console.log(`找到 ${files.length} 个 action 文件\n`);
  
  let totalFixed = 0;
  
  files.forEach(file => {
    let fixed = false;
    
    // 修复 "use server" 指令
    if (fixUseServer(file)) {
      fixed = true;
    }
    
    // 修复 prisma 导入路径
    if (fixPrismaImport(file)) {
      fixed = true;
    }
    
    // 移除不存在的字段
    if (removeNonExistentFields(file, models)) {
      fixed = true;
    }
    
    if (fixed) {
      totalFixed++;
    }
  });
  
  console.log(`\n修复完成! 共修复了 ${totalFixed} 个文件。`);
}

main();
