/**
 * 修复JSX语法错误脚本
 * 检查和修复常见的JSX语法问题，如缺少闭合标签、Fragment语法错误等
 */

const fs = require('fs');
const path = require('path');

// 需要检查的目录
const checkDirs = [
  'components',
  'app',
  'src'
];

// 排除的目录
const excludeDirs = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'backups'
];

// 查找所有 .tsx 和 .jsx 文件
function findJsxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        findJsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 检查和修复JSX语法错误
function fixJsxSyntaxErrors(filePath) {
  console.log(`正在检查文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let issues = [];

  // 检查1: React Fragment 语法错误
  // 查找 <> 开始但没有正确闭合的情况
  const fragmentRegex = /return\s*\(\s*<>\s*\n/g;
  if (fragmentRegex.test(content)) {
    // 检查是否有对应的 </> 
    const fragmentCloseRegex = /<\/>\s*\)/g;
    if (!fragmentCloseRegex.test(content)) {
      issues.push('缺少React Fragment闭合标签 </>');
    }
  }

  // 检查2: 函数组件缺少return语句的闭合
  // 查找 return ( 但没有对应的 ) 的情况
  const returnRegex = /return\s*\(/g;
  const returnMatches = content.match(returnRegex);
  if (returnMatches) {
    // 简单检查：确保每个 return ( 都有对应的 )
    const lines = content.split('\n');
    let inReturn = false;
    let parenCount = 0;
    let returnLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('return (')) {
        inReturn = true;
        returnLineIndex = i;
        parenCount = 1;
        continue;
      }
      
      if (inReturn) {
        // 计算括号
        for (let char of line) {
          if (char === '(') parenCount++;
          if (char === ')') parenCount--;
        }
        
        if (parenCount === 0) {
          inReturn = false;
          break;
        }
      }
    }
    
    if (inReturn && parenCount > 0) {
      issues.push(`第${returnLineIndex + 1}行的return语句可能缺少闭合括号`);
    }
  }

  // 检查3: JSX元素没有正确闭合
  // 这是一个简化的检查，查找常见的未闭合标签
  const unclosedTagRegex = /<(\w+)[^>]*>[^<]*$/gm;
  const unclosedMatches = content.match(unclosedTagRegex);
  if (unclosedMatches) {
    unclosedMatches.forEach(match => {
      const tagName = match.match(/<(\w+)/)[1];
      if (!match.includes(`</${tagName}>`)) {
        issues.push(`可能存在未闭合的标签: ${tagName}`);
      }
    });
  }

  // 修复1: 自动修复常见的Fragment问题
  // 如果文件以 return ( <> 开始但没有正确结束，尝试修复
  if (content.includes('return (\n    <>') && !content.includes('    </>\n  )')) {
    // 查找最后一个 </Dialog> 或类似的闭合标签
    const lastClosingTagRegex = /(\s*<\/\w+>\s*)$/;
    const match = content.match(lastClosingTagRegex);
    if (match) {
      content = content.replace(lastClosingTagRegex, match[1] + '\n    </>\n  )\n}');
      modified = true;
      issues.push('已修复: 添加了缺少的Fragment闭合标签');
    }
  }

  // 修复2: 修复常见的函数组件结构问题
  // 如果函数以 export default function 开始但没有正确的结构
  if (content.includes('export default function') && !content.endsWith('}\n')) {
    if (!content.trim().endsWith('}')) {
      content = content.trim() + '\n}\n';
      modified = true;
      issues.push('已修复: 添加了缺少的函数闭合括号');
    }
  }

  // 保存修改后的文件
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ 已修复文件: ${filePath}`);
  }

  if (issues.length > 0) {
    console.log(`  发现问题:`);
    issues.forEach(issue => {
      console.log(`    - ${issue}`);
    });
  } else {
    console.log(`  ✅ 无问题`);
  }

  return { modified, issues };
}

// 主函数
function main() {
  console.log('=== JSX语法错误检查和修复 ===\n');
  
  let allFiles = [];
  
  // 收集所有需要检查的文件
  checkDirs.forEach(dir => {
    const files = findJsxFiles(dir);
    allFiles = allFiles.concat(files);
  });
  
  console.log(`找到 ${allFiles.length} 个JSX/TSX文件\n`);
  
  let totalFixed = 0;
  let totalIssues = 0;
  
  allFiles.forEach(filePath => {
    const { modified, issues } = fixJsxSyntaxErrors(filePath);
    
    if (modified) {
      totalFixed++;
    }
    
    totalIssues += issues.length;
  });
  
  console.log(`\n=== 修复完成 ===`);
  console.log(`共检查了 ${allFiles.length} 个文件`);
  console.log(`修复了 ${totalFixed} 个文件`);
  console.log(`发现 ${totalIssues} 个问题`);
  
  if (totalFixed > 0) {
    console.log('\n建议运行以下命令验证修复结果:');
    console.log('npm run build');
  }
}

main();
