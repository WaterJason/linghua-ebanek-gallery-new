/**
 * 修复 prisma 导入路径问题
 *
 * 这个脚本会扫描 lib/actions/ 目录下的所有 .ts 文件，
 * 将 `import { prisma } from "../prisma";` 或 `import { prisma } from "@/lib/prisma";`
 * 替换为 `import prisma from "@/lib/db";`
 */

const fs = require('fs');
const path = require('path');

// 要扫描的目录
const actionsDir = path.join(__dirname, '..', 'lib', 'actions');

// 查找所有 .ts 文件
function findTsFiles(dir) {
  const files = fs.readdirSync(dir);
  return files
    .filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'types.ts')
    .map(file => path.join(dir, file));
}

// 修复文件中的导入
function fixImports(filePath) {
  console.log(`正在处理文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // 替换相对路径导入语句
  content = content.replace(
    /import\s*{\s*prisma\s*}\s*from\s*["']\.\.\/prisma["'];?/,
    'import prisma from "@/lib/db";'
  );

  // 替换绝对路径导入语句
  content = content.replace(
    /import\s*{\s*prisma\s*}\s*from\s*["']@\/lib\/prisma["'];?/,
    'import prisma from "@/lib/db";'
  );

  // 检查是否有变化
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`已修复文件: ${filePath}`);
    return true;
  }

  console.log(`文件无需修复: ${filePath}`);
  return false;
}

// 主函数
function main() {
  console.log('开始修复 prisma 导入路径问题...\n');

  const files = findTsFiles(actionsDir);
  let fixedCount = 0;

  files.forEach(file => {
    if (fixImports(file)) {
      fixedCount++;
    }
  });

  console.log(`\n修复完成! 共修复了 ${fixedCount} 个文件的导入问题。`);
}

main();
