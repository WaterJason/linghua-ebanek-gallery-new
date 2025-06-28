/**
 * 测试导入修复
 * 验证所有artwork-actions的引用是否已正确修复为product-actions
 */

const fs = require('fs');
const path = require('path');

// 需要检查的目录
const checkDirs = [
  'components',
  'app',
  'lib'
];

// 排除的目录
const excludeDirs = ['node_modules', '.next', 'backup', 'dist', 'build'];

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
      if (!excludeDirs.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 检查文件中的导入问题
function checkImportIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // 检查artwork-actions引用
  const artworkActionsMatches = content.match(/["']@\/lib\/actions\/artwork-actions["']/g);
  if (artworkActionsMatches) {
    artworkActionsMatches.forEach(match => {
      const lineNumber = getLineNumber(content, match);
      issues.push({
        type: 'artwork-actions-import',
        line: lineNumber,
        match: match,
        suggestion: 'Replace with @/lib/actions/product-actions'
      });
    });
  }

  // 检查是否有注释的artwork-actions引用
  const commentedMatches = content.match(/\/\/.*artwork-actions/g);
  if (commentedMatches) {
    commentedMatches.forEach(match => {
      const lineNumber = getLineNumber(content, match);
      issues.push({
        type: 'commented-artwork-actions',
        line: lineNumber,
        match: match,
        suggestion: 'This is commented out, which is good'
      });
    });
  }

  return {
    filePath,
    issues,
    hasIssues: issues.filter(i => i.type === 'artwork-actions-import').length > 0
  };
}

// 获取代码在文件中的行号
function getLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return 'Unknown';
}

// 主函数
function main() {
  console.log('🔍 测试导入修复');
  console.log('===============\n');
  
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
  let commentedReferences = 0;
  
  allFiles.forEach(filePath => {
    const analysis = checkImportIssues(filePath);
    
    if (analysis.issues.length > 0) {
      analysisResults.push(analysis);
      
      const activeIssues = analysis.issues.filter(i => i.type === 'artwork-actions-import');
      const commentedIssues = analysis.issues.filter(i => i.type === 'commented-artwork-actions');
      
      totalIssues += activeIssues.length;
      commentedReferences += commentedIssues.length;
      
      if (activeIssues.length > 0) {
        filesWithIssues++;
      }
    }
  });
  
  // 输出分析结果
  console.log('📊 分析结果');
  console.log('===========');
  console.log(`总文件数: ${allFiles.length}`);
  console.log(`有问题的文件: ${filesWithIssues}`);
  console.log(`活跃的artwork-actions引用: ${totalIssues}`);
  console.log(`已注释的artwork-actions引用: ${commentedReferences}\n`);
  
  if (analysisResults.length > 0) {
    console.log('🔍 发现的引用:');
    console.log('=============\n');
    
    analysisResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.filePath}`);
      
      result.issues.forEach(issue => {
        const status = issue.type === 'artwork-actions-import' ? '❌ 需要修复' : '✅ 已注释';
        console.log(`   ${status} 第${issue.line}行: ${issue.match}`);
        console.log(`   建议: ${issue.suggestion}`);
      });
      console.log('');
    });
  }
  
  // 测试特定文件的修复
  console.log('🧪 测试特定文件修复');
  console.log('==================\n');
  
  const testFiles = [
    'components/channel/channel-sales-import-form.tsx',
    'components/mobile/mobile-products.tsx'
  ];
  
  testFiles.forEach(testFile => {
    if (fs.existsSync(testFile)) {
      const content = fs.readFileSync(testFile, 'utf8');
      
      // 检查是否包含正确的导入
      const hasProductActions = content.includes('@/lib/actions/product-actions');
      const hasArtworkActions = content.includes('@/lib/actions/artwork-actions');
      
      console.log(`📁 ${testFile}:`);
      console.log(`   ✅ 使用product-actions: ${hasProductActions ? '是' : '否'}`);
      console.log(`   ❌ 使用artwork-actions: ${hasArtworkActions ? '是' : '否'}`);
      console.log(`   🎯 修复状态: ${hasProductActions && !hasArtworkActions ? '✅ 已修复' : '❌ 需要修复'}\n`);
    } else {
      console.log(`📁 ${testFile}: 文件不存在\n`);
    }
  });
  
  // 生成修复建议
  console.log('💡 修复建议');
  console.log('===========');
  
  if (totalIssues === 0) {
    console.log('🎉 所有artwork-actions引用都已正确修复！');
    console.log('✅ 所有导入都使用了正确的product-actions模块');
    
    if (commentedReferences > 0) {
      console.log(`📝 发现 ${commentedReferences} 个已注释的引用，这是正确的处理方式`);
    }
  } else {
    console.log(`⚠️ 发现 ${totalIssues} 个需要修复的artwork-actions引用`);
    console.log('建议修复步骤:');
    console.log('1. 将所有 @/lib/actions/artwork-actions 替换为 @/lib/actions/product-actions');
    console.log('2. 确保使用的函数名正确（getArtworks 在 product-actions 中作为别名存在）');
    console.log('3. 验证数据结构兼容性');
  }
  
  // 保存测试报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allFiles.length,
      filesWithIssues,
      totalIssues,
      commentedReferences
    },
    results: analysisResults,
    testFiles: testFiles.map(file => ({
      file,
      exists: fs.existsSync(file),
      hasProductActions: fs.existsSync(file) ? fs.readFileSync(file, 'utf8').includes('@/lib/actions/product-actions') : false,
      hasArtworkActions: fs.existsSync(file) ? fs.readFileSync(file, 'utf8').includes('@/lib/actions/artwork-actions') : false
    }))
  };
  
  const reportPath = `reports/import-fixes-test-${Date.now()}.json`;
  
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportPath}`);
  
  // 根据结果设置退出码
  if (totalIssues === 0) {
    console.log('\n🎉 所有导入修复测试通过！');
    process.exit(0);
  } else {
    console.log(`\n⚠️ 发现 ${totalIssues} 个需要修复的导入问题`);
    process.exit(1);
  }
}

main();
