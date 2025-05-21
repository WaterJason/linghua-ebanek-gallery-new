/**
 * 添加 "use server" 指令到所有 action 文件
 * 
 * 这个脚本会扫描 lib/actions/ 目录下的所有 .ts 文件，
 * 如果文件中使用了 revalidatePath 但没有 "use server" 指令，
 * 则在文件顶部添加 "use server" 指令。
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

// 添加 "use server" 指令
function addUseServer(filePath) {
  console.log(`正在处理文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 检查文件是否使用了 revalidatePath
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
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`已添加 "use server" 指令到文件: ${filePath}`);
    return true;
  }
  
  console.log(`文件无需修改: ${filePath}`);
  return false;
}

// 主函数
function main() {
  console.log('开始添加 "use server" 指令...\n');
  
  const files = findTsFiles(actionsDir);
  let modifiedCount = 0;
  
  files.forEach(file => {
    if (addUseServer(file)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n修改完成! 共修改了 ${modifiedCount} 个文件。`);
}

main();
