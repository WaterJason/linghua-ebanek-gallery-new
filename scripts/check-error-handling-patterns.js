/**
 * 检查错误处理模式
 * 查找系统中可能存在的共性错误处理问题
 */

const fs = require('fs');
const path = require('path');

// 需要检查的目录
const checkDirs = [
  'hooks',
  'lib',
  'components',
  'app/api'
];

// 排除的目录和文件
const excludePatterns = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'backups',
  'reports',
  'scripts'
];

// 错误处理模式
const errorPatterns = {
  // 简单的错误处理模式
  simpleThrow: /throw new Error\([^)]*\)/g,
  
  // fetch调用但没有错误处理
  fetchWithoutErrorHandling: /await fetch\([^)]*\)(?!\s*\.catch)/g,
  
  // 缺少try-catch的async函数
  asyncWithoutTryCatch: /async\s+function[^{]*{[^}]*await[^}]*}(?![^{]*catch)/g,
  
  // 简单的console.error
  simpleConsoleError: /console\.error\([^)]*\)/g,
  
  // 缺少详细错误信息的API调用
  genericErrorMessage: /(API request failed|Failed to|Error:|数据库操作失败)/g,
  
  // 没有用户友好错误消息的toast
  genericToastError: /toast\(\s*{[^}]*variant:\s*["']destructive["'][^}]*}\s*\)/g
};

// 查找所有相关文件
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludePatterns.some(pattern => file.includes(pattern))) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 分析文件中的错误处理模式
function analyzeErrorHandling(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // 检查各种错误处理模式
  Object.entries(errorPatterns).forEach(([patternName, regex]) => {
    const matches = content.match(regex);
    if (matches) {
      issues.push({
        type: patternName,
        count: matches.length,
        examples: matches.slice(0, 3) // 只显示前3个例子
      });
    }
  });

  // 特殊检查：fetch调用是否有适当的错误处理
  const fetchCalls = content.match(/fetch\([^)]*\)/g);
  if (fetchCalls) {
    const fetchWithProperErrorHandling = content.match(/fetch\([^)]*\)[\s\S]*?catch/g);
    const unhandledFetches = fetchCalls.length - (fetchWithProperErrorHandling?.length || 0);
    
    if (unhandledFetches > 0) {
      issues.push({
        type: 'unhandledFetch',
        count: unhandledFetches,
        examples: [`${unhandledFetches} fetch调用可能缺少错误处理`]
      });
    }
  }

  // 检查是否使用了改进的错误处理
  const hasImprovedErrorHandling = content.includes('apiCall') || 
                                   content.includes('swrFetcher') ||
                                   content.includes('api-utils');
  
  return {
    filePath,
    issues,
    hasImprovedErrorHandling,
    linesOfCode: content.split('\n').length
  };
}

// 主函数
function main() {
  console.log('🔍 检查错误处理模式');
  console.log('==================\n');
  
  let allFiles = [];
  
  // 收集所有需要检查的文件
  checkDirs.forEach(dir => {
    const files = findFiles(dir);
    allFiles = allFiles.concat(files);
  });
  
  console.log(`找到 ${allFiles.length} 个文件需要检查\n`);
  
  const analysisResults = [];
  let totalIssues = 0;
  let filesWithIssues = 0;
  let filesWithImprovedHandling = 0;
  
  allFiles.forEach(filePath => {
    const analysis = analyzeErrorHandling(filePath);
    
    if (analysis.issues.length > 0) {
      analysisResults.push(analysis);
      totalIssues += analysis.issues.reduce((sum, issue) => sum + issue.count, 0);
      filesWithIssues++;
    }
    
    if (analysis.hasImprovedErrorHandling) {
      filesWithImprovedHandling++;
    }
  });
  
  // 输出分析结果
  console.log('📊 分析结果');
  console.log('===========');
  console.log(`总文件数: ${allFiles.length}`);
  console.log(`有问题的文件: ${filesWithIssues}`);
  console.log(`使用改进错误处理的文件: ${filesWithImprovedHandling}`);
  console.log(`总问题数: ${totalIssues}\n`);
  
  if (analysisResults.length > 0) {
    console.log('🔥 发现的问题:');
    console.log('=============\n');
    
    analysisResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.filePath}`);
      console.log(`   代码行数: ${result.linesOfCode}`);
      console.log(`   使用改进错误处理: ${result.hasImprovedErrorHandling ? '是' : '否'}`);
      
      result.issues.forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.count} 个问题`);
        if (issue.examples.length > 0) {
          issue.examples.forEach(example => {
            console.log(`     例子: ${example.substring(0, 80)}...`);
          });
        }
      });
      console.log('');
    });
  }
  
  // 生成建议
  console.log('💡 改进建议');
  console.log('===========');
  
  if (filesWithIssues > 0) {
    console.log('1. 统一错误处理:');
    console.log('   - 使用 lib/api-utils.ts 中的 apiCall 和 swrFetcher 函数');
    console.log('   - 为所有 fetch 调用添加适当的错误处理');
    console.log('   - 使用用户友好的错误消息');
    
    console.log('\n2. 错误日志记录:');
    console.log('   - 添加详细的错误日志记录');
    console.log('   - 包含上下文信息（URL、参数等）');
    console.log('   - 区分开发和生产环境的日志级别');
    
    console.log('\n3. 用户体验:');
    console.log('   - 提供具体的错误消息而不是通用消息');
    console.log('   - 添加重试机制');
    console.log('   - 实现优雅的降级处理');
  } else {
    console.log('✅ 所有文件的错误处理都很好！');
  }
  
  // 保存分析报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allFiles.length,
      filesWithIssues,
      filesWithImprovedHandling,
      totalIssues
    },
    results: analysisResults
  };
  
  const reportPath = `reports/error-handling-analysis-${Date.now()}.json`;
  
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 分析报告已保存: ${reportPath}`);
  
  // 根据结果设置退出码
  if (filesWithIssues === 0) {
    console.log('\n🎉 所有文件的错误处理都很好！');
    process.exit(0);
  } else {
    console.log(`\n⚠️ 发现 ${filesWithIssues} 个文件需要改进错误处理`);
    process.exit(1);
  }
}

main();
