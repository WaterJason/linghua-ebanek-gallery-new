/**
 * 检查 Prisma 模型和代码的一致性
 * 
 * 这个脚本会扫描 lib/actions/ 目录下的所有 .ts 文件，
 * 检查它们是否使用了不存在于 Prisma 模型中的字段。
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

// 检查文件中的 Prisma 操作
function checkFile(filePath, models) {
  console.log(`正在检查文件: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 提取模型名称
  const modelNameMatch = path.basename(filePath, '.ts').match(/^(\w+)-actions/);
  if (!modelNameMatch) {
    console.log(`  无法确定模型名称，跳过检查`);
    return issues;
  }
  
  // 猜测模型名称（首字母大写）
  const guessedModelName = modelNameMatch[1].charAt(0).toUpperCase() + modelNameMatch[1].slice(1);
  
  if (!models[guessedModelName]) {
    console.log(`  找不到模型 ${guessedModelName}，跳过检查`);
    return issues;
  }
  
  console.log(`  使用模型: ${guessedModelName}`);
  
  // 检查 create 操作
  const createRegex = new RegExp(`prisma\\.${guessedModelName.toLowerCase()}\\.create\\(\\s*{\\s*data:\\s*{([^}]*)}`, 'g');
  let createMatch;
  
  while ((createMatch = createRegex.exec(content)) !== null) {
    const dataBlock = createMatch[1];
    const fieldLines = dataBlock.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/^(\w+):/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        if (fieldName !== 'createdAt' && fieldName !== 'updatedAt' && !models[guessedModelName][fieldName]) {
          issues.push({
            type: 'create',
            model: guessedModelName,
            field: fieldName,
            line: content.substring(0, createMatch.index).split('\n').length + dataBlock.substring(0, dataBlock.indexOf(line)).split('\n').length
          });
        }
      }
    });
  }
  
  // 检查 update 操作
  const updateRegex = new RegExp(`prisma\\.${guessedModelName.toLowerCase()}\\.update\\(\\s*{[^}]*data:\\s*{([^}]*)}`, 'g');
  let updateMatch;
  
  while ((updateMatch = updateRegex.exec(content)) !== null) {
    const dataBlock = updateMatch[1];
    const fieldLines = dataBlock.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    
    fieldLines.forEach(line => {
      const fieldMatch = line.match(/^(\w+):/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        if (fieldName !== 'createdAt' && fieldName !== 'updatedAt' && !models[guessedModelName][fieldName]) {
          issues.push({
            type: 'update',
            model: guessedModelName,
            field: fieldName,
            line: content.substring(0, updateMatch.index).split('\n').length + dataBlock.substring(0, dataBlock.indexOf(line)).split('\n').length
          });
        }
      }
    });
  }
  
  return issues;
}

// 主函数
function main() {
  console.log('开始检查 Prisma 模型和代码的一致性...\n');
  
  const models = parsePrismaSchema();
  console.log(`已解析 ${Object.keys(models).length} 个 Prisma 模型\n`);
  
  const files = findTsFiles(actionsDir);
  console.log(`找到 ${files.length} 个 action 文件\n`);
  
  let totalIssues = 0;
  const allIssues = {};
  
  files.forEach(file => {
    const issues = checkFile(file, models);
    
    if (issues.length > 0) {
      allIssues[file] = issues;
      totalIssues += issues.length;
      
      console.log(`  发现 ${issues.length} 个问题:`);
      issues.forEach(issue => {
        console.log(`    - ${issue.type} 操作使用了不存在的字段 ${issue.model}.${issue.field}，在第 ${issue.line} 行`);
      });
      console.log('');
    } else {
      console.log(`  没有发现问题\n`);
    }
  });
  
  console.log(`\n检查完成! 共发现 ${totalIssues} 个问题。`);
  
  if (totalIssues > 0) {
    console.log('\n问题汇总:');
    Object.entries(allIssues).forEach(([file, issues]) => {
      console.log(`\n文件: ${file}`);
      issues.forEach(issue => {
        console.log(`  - ${issue.type} 操作使用了不存在的字段 ${issue.model}.${issue.field}，在第 ${issue.line} 行`);
      });
    });
    
    console.log('\n建议修复这些问题，以避免运行时错误。');
  } else {
    console.log('\n太好了! 所有文件都与 Prisma 模型保持一致。');
  }
}

main();
