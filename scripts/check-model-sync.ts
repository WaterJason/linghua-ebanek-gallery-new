/**
 * 模型同步检查脚本
 *
 * 此脚本用于检查代码中使用的字段名是否与 Prisma 模型一致
 * 使用方法：npx ts-node scripts/check-model-sync.ts
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

// 检查文件中的字段名是否与 Prisma 模型一致
async function checkFile(filePath: string, models: any) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues: string[] = [];

    // 检查每个模型
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
            const dataPattern = new RegExp(`${match}\\s*\\(\\s*\\{[\\s\\S]*?data\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'g');
            const dataMatches = content.matchAll(dataPattern);

            for (const dataMatch of dataMatches) {
              if (dataMatch[1]) {
                // 提取字段名
                const fieldPattern = /(\w+)\s*:/g;
                const fieldMatches = dataMatch[1].matchAll(fieldPattern);

                for (const fieldMatch of fieldMatches) {
                  const fieldName = fieldMatch[1];

                  // 检查字段是否存在于模型中
                  if (!modelFields.includes(fieldName) && !['connect', 'disconnect', 'create', 'update', 'upsert', 'delete', 'deleteMany', 'set'].includes(fieldName)) {
                    issues.push(`文件 ${filePath} 中使用了不存在的字段 ${modelName}.${fieldName}`);
                  }
                }
              }
            }
          } else if (operationType === 'findUnique' || operationType === 'findFirst' || operationType === 'findMany' || operationType === 'delete') {
            // 提取 where 对象
            const wherePattern = new RegExp(`${match}\\s*\\(\\s*\\{[\\s\\S]*?where\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'g');
            const whereMatches = content.matchAll(wherePattern);

            for (const whereMatch of whereMatches) {
              if (whereMatch[1]) {
                // 提取字段名
                const fieldPattern = /(\w+)\s*:/g;
                const fieldMatches = whereMatch[1].matchAll(fieldPattern);

                for (const fieldMatch of fieldMatches) {
                  const fieldName = fieldMatch[1];

                  // 检查字段是否存在于模型中
                  if (!modelFields.includes(fieldName) && !['AND', 'OR', 'NOT', 'some', 'every', 'none', 'is', 'isNot', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'endsWith', 'mode', 'not'].includes(fieldName)) {
                    issues.push(`文件 ${filePath} 中使用了不存在的字段 ${modelName}.${fieldName}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    return issues;
  } catch (error) {
    console.error(`检查文件 ${filePath} 时出错:`, error);
    return [`检查文件 ${filePath} 时出错: ${error instanceof Error ? error.message : String(error)}`];
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
    console.log('开始检查模型同步...');

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

    // 检查每个文件
    let totalIssues = 0;
    for (const file of files) {
      const issues = await checkFile(file, models);

      if (issues.length > 0) {
        console.log(`\n文件 ${file} 存在 ${issues.length} 个问题:`);
        for (const issue of issues) {
          console.log(`  - ${issue}`);
        }
        totalIssues += issues.length;
      }
    }

    console.log(`\n检查完成，共发现 ${totalIssues} 个问题`);

    if (totalIssues > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('检查模型同步时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行主函数
main();
