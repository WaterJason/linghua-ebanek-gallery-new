const fs = require('fs');
const path = require('path');

// 递归查找所有 TypeScript 文件
function findTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTSFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 修复文件中的 next-auth 导入
function fixAuthImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 替换 getServerSession 导入
  if (content.includes('import { getServerSession } from "next-auth/next"')) {
    content = content.replace(
      /import { getServerSession } from "next-auth\/next"/g,
      'import { getServerSession } from "@/lib/auth-helpers"'
    );
    modified = true;
  }
  
  if (content.includes('import { getServerSession } from "next-auth"')) {
    content = content.replace(
      /import { getServerSession } from "next-auth"/g,
      'import { getServerSession } from "@/lib/auth-helpers"'
    );
    modified = true;
  }
  
  // 移除 authOptions 导入（如果存在）
  if (content.includes('import { authOptions } from "@/lib/auth"')) {
    content = content.replace(
      /,?\s*authOptions/g,
      ''
    );
    // 如果导入行变空了，移除整行
    content = content.replace(
      /import\s*{\s*}\s*from\s*"@\/lib\/auth"\s*\n?/g,
      ''
    );
    modified = true;
  }
  
  // 替换 getServerSession(authOptions) 调用
  if (content.includes('getServerSession(authOptions)')) {
    content = content.replace(
      /getServerSession\(authOptions\)/g,
      'getServerSession()'
    );
    modified = true;
  }
  
  // 替换常见的权限检查模式
  if (content.includes('session.user.role !== "admin"')) {
    content = content.replace(
      /const session = await getServerSession\(\)\s*\n\s*if \(!session \|\| session\.user\.role !== "admin"\) {/g,
      'if (!(await isAdmin())) {'
    );
    // 添加 isAdmin 导入
    if (!content.includes('isAdmin')) {
      content = content.replace(
        'import { getServerSession } from "@/lib/auth-helpers"',
        'import { getServerSession, isAdmin } from "@/lib/auth-helpers"'
      );
    }
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

// 主函数
function main() {
  const apiDir = path.join(__dirname, '..', 'app', 'api');
  const libDir = path.join(__dirname, '..', 'lib');
  
  console.log('Finding TypeScript files...');
  const apiFiles = findTSFiles(apiDir);
  const libFiles = findTSFiles(libDir);
  
  const allFiles = [...apiFiles, ...libFiles];
  console.log(`Found ${allFiles.length} TypeScript files`);
  
  console.log('Fixing auth imports...');
  allFiles.forEach(fixAuthImports);
  
  console.log('Done!');
}

main();
