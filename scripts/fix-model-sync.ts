/**
 * 模型同步修复脚本
 *
 * 此脚本用于修复代码中使用的字段名与 Prisma 模型不一致的问题
 * 使用方法：npx ts-node scripts/fix-model-sync.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// 初始化 Prisma 客户端
const prisma = new PrismaClient();

// 需要检查的目录
const DIRS_TO_CHECK = [
  'lib/actions',
  'app',
  'components',
];

// 需要检查的文件扩展名
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 忽略的文件和目录
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'public',
  'scripts',
  'test',
  'tests',
];

// 字段名映射表
const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  Product: {
    category: 'categoryId',
  },
  Employee: {
    department: null, // 移除字段
    hireDate: null, // 移除字段
    notes: null, // 移除字段
  },
};

// 获取所有 Prisma 模型
async function getPrismaModels() {
  try {
    // 直接从 schema.prisma 文件解析模型
    console.log('从 schema.prisma 文件解析模型信息...');
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`找不到 schema.prisma 文件: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const models: Record<string, any> = {};

    // 解析 schema.prisma 文件中的模型
    const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/gs;
    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];

      // 提取字段
      const fieldRegex = /\s+(\w+)\s+(\w+)/g;
      const fields: any[] = [];
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];

        // 忽略特殊字段和关系字段
        if (!fieldName.startsWith('@@') && !fieldName.startsWith('@')) {
          fields.push({ name: fieldName, type: fieldType });
        }
      }

      models[modelName] = { name: modelName, fields };
    }

    console.log(`成功解析 ${Object.keys(models).length} 个模型`);
    return models;
  } catch (error) {
    console.error('获取 Prisma 模型时出错:', error);
    throw error;
  }
}

// 修复文件中的字段名
async function fixFile(filePath: string, models: any) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // 修复每个模型
    for (const modelName in models) {
      const model = models[modelName];

      // 检查文件中是否使用了该模型
      const modelPattern = new RegExp(`prisma\\.${modelName}\\.(create|update|upsert|findUnique|findMany|findFirst|delete|deleteMany|count|aggregate|groupBy)`, 'g');
      const modelMatches = content.match(modelPattern);

      if (modelMatches) {
        // 提取模型的所有字段
        const modelFields = model.fields.map((field: any) => field.name);

        // 检查文件中是否使用了不存在的字段
        for (const match of modelMatches) {
          // 提取操作类型
          const operationType = match.match(/\.(create|update|upsert|findUnique|findMany|findFirst|delete|deleteMany|count|aggregate|groupBy)/)?.[1];

          if (operationType === 'create' || operationType === 'update' || operationType === 'upsert') {
            // 提取 data 对象
            const dataPattern = new RegExp(`(${match}\\s*\\(\\s*\\{[\\s\\S]*?data\\s*:\\s*\\{)([\\s\\S]*?)(\\})`, 'g');
            const dataMatches = Array.from(content.matchAll(dataPattern));

            for (const dataMatch of dataMatches) {
              if (dataMatch[2]) {
                let dataContent = dataMatch[2];

                // 修复字段名
                for (const fieldName in FIELD_MAPPINGS[modelName] || {}) {
                  const mappedFieldName = FIELD_MAPPINGS[modelName][fieldName];

                  if (mappedFieldName === null) {
                    // 移除字段
                    const fieldPattern = new RegExp(`\\s*${fieldName}\\s*:\\s*[^,}]*,?`, 'g');
                    dataContent = dataContent.replace(fieldPattern, '');
                    modified = true;
                  } else {
                    // 替换字段名
                    const fieldPattern = new RegExp(`(\\s*)(${fieldName})(\\s*:)`, 'g');
                    dataContent = dataContent.replace(fieldPattern, `$1${mappedFieldName}$3`);
                    modified = true;
                  }
                }

                // 更新文件内容
                content = content.replace(dataMatch[0], `${dataMatch[1]}${dataContent}${dataMatch[3]}`);
              }
            }
          } else if (operationType === 'findUnique' || operationType === 'findFirst' || operationType === 'findMany' || operationType === 'delete') {
            // 提取 where 对象
            const wherePattern = new RegExp(`(${match}\\s*\\(\\s*\\{[\\s\\S]*?where\\s*:\\s*\\{)([\\s\\S]*?)(\\})`, 'g');
            const whereMatches = Array.from(content.matchAll(wherePattern));

            for (const whereMatch of whereMatches) {
              if (whereMatch[2]) {
                let whereContent = whereMatch[2];

                // 修复字段名
                for (const fieldName in FIELD_MAPPINGS[modelName] || {}) {
                  const mappedFieldName = FIELD_MAPPINGS[modelName][fieldName];

                  if (mappedFieldName !== null) {
                    // 替换字段名
                    const fieldPattern = new RegExp(`(\\s*)(${fieldName})(\\s*:)`, 'g');
                    whereContent = whereContent.replace(fieldPattern, `$1${mappedFieldName}$3`);
                    modified = true;
                  }
                }

                // 更新文件内容
                content = content.replace(whereMatch[0], `${whereMatch[1]}${whereContent}${whereMatch[3]}`);
              }
            }
          }
        }
      }
    }

    // 保存修改后的文件
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`已修复文件 ${filePath}`);
    }

    return modified;
  } catch (error) {
    console.error(`修复文件 ${filePath} 时出错:`, error);
    return false;
  }
}

// 递归获取目录中的所有文件
function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    // 检查是否应该忽略
    if (IGNORE_PATTERNS.some(pattern => item.includes(pattern))) {
      continue;
    }

    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(itemPath));
    } else if (FILE_EXTENSIONS.includes(path.extname(itemPath))) {
      files.push(itemPath);
    }
  }

  return files;
}

// 主函数
async function main() {
  try {
    console.log('开始修复模型同步...');

    // 获取所有 Prisma 模型
    const models = await getPrismaModels();

    // 获取所有需要检查的文件
    let files: string[] = [];
    for (const dir of DIRS_TO_CHECK) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        files.push(...getAllFiles(dirPath));
      }
    }

    console.log(`找到 ${files.length} 个文件需要检查`);

    // 修复每个文件
    let fixedFiles = 0;
    for (const file of files) {
      const fixed = await fixFile(file, models);

      if (fixed) {
        fixedFiles++;
      }
    }

    console.log(`\n修复完成，共修复 ${fixedFiles} 个文件`);
  } catch (error) {
    console.error('修复模型同步时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行主函数
main();
