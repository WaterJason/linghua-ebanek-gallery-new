# 模型同步工作流程

本文档描述了如何使用模型同步检查工具，确保代码与 Prisma 模型保持同步。

## 工作流程概述

1. 开发人员在本地开发环境中编写代码
2. 提交代码前，运行模型同步检查工具
3. 如果检查通过，提交代码
4. 如果检查失败，修复问题后再提交
5. CI/CD 流程中会再次运行模型同步检查工具
6. 如果 CI/CD 检查通过，代码可以合并到主分支
7. 如果 CI/CD 检查失败，需要修复问题后重新提交

## 本地开发

### 安装依赖

```bash
npm install
```

### 生成 Prisma 客户端

```bash
npx prisma generate
```

### 运行模型同步检查

```bash
npm run check:model-sync
```

### 自动修复模型同步问题

```bash
npm run fix:model-sync
```

### 运行测试

```bash
npm test
```

## 提交代码

提交代码前，会自动运行以下检查：

1. ESLint 检查
2. TypeScript 类型检查
3. 模型同步检查
4. 单元测试

如果任何一项检查失败，提交将被阻止。

## CI/CD 流程

CI/CD 流程中会运行以下检查：

1. 模型同步检查
2. 单元测试
3. ESLint 检查
4. TypeScript 类型检查

如果任何一项检查失败，PR 将无法合并到主分支。

## 最佳实践

### 1. 使用类型安全的包装函数

使用 `lib/prisma-wrapper.ts` 中的类型安全包装函数，而不是直接使用 Prisma 客户端：

```typescript
import { createRecord, updateRecord, findRecord, findRecords } from '@/lib/prisma-wrapper';

// 创建记录
const employee = await createRecord('employee', {
  name: "张三",
  position: "经理",
  dailySalary: 200,
}, { checkSync: true });

// 更新记录
const updatedEmployee = await updateRecord('employee', 1, {
  name: "李四",
}, { checkSync: true });

// 查找记录
const employee = await findRecord('employee', 1);

// 查找多条记录
const employees = await findRecords('employee', {
  where: {
    position: "经理",
  },
});
```

### 2. 使用验证函数

使用 `lib/validation.ts` 中的验证函数，确保数据符合模型的要求：

```typescript
import { validateCreateEmployee } from '@/lib/validation';

// 验证数据
const validation = validateCreateEmployee(data);
if (!validation.isValid) {
  throw new Error(validation.errors.join("; "));
}
```

### 3. 使用 TypeScript 接口

使用 `types/prisma-models.ts` 中的 TypeScript 接口，确保代码中使用的类型与 Prisma 模型一致：

```typescript
import { PrismaEmployee, CreateEmployeeInput } from '@/types/prisma-models';

// 创建员工
export async function createEmployee(data: CreateEmployeeInput): Promise<PrismaEmployee> {
  // ...
}
```

### 4. 更新 Prisma 模型后的步骤

1. 更新 `prisma/schema.prisma` 文件
2. 运行 `npx prisma generate` 生成新的客户端
3. 更新 `types/prisma-models.ts` 中的 TypeScript 接口
4. 运行 `npm run check:model-sync` 检查代码与模型是否一致
5. 如果检查失败，运行 `npm run fix:model-sync` 自动修复问题
6. 更新相关的验证函数
7. 更新相关的测试用例
8. 运行 `npm test` 确保测试通过

## 故障排除

### 1. 模型同步检查失败

如果模型同步检查失败，可能是以下原因：

1. 代码中使用了不存在的字段
2. 代码中使用了错误的字段名
3. 代码中使用了错误的字段类型

解决方法：

1. 查看错误信息，了解具体问题
2. 运行 `npm run fix:model-sync` 自动修复问题
3. 如果自动修复不能解决问题，手动修复代码

### 2. 测试失败

如果测试失败，可能是以下原因：

1. 代码中的逻辑错误
2. 测试用例与代码不匹配
3. 模拟对象配置错误

解决方法：

1. 查看错误信息，了解具体问题
2. 修复代码或测试用例
3. 重新运行测试

### 3. TypeScript 类型检查失败

如果 TypeScript 类型检查失败，可能是以下原因：

1. 代码中使用了错误的类型
2. 接口定义与实际使用不匹配
3. 缺少类型定义

解决方法：

1. 查看错误信息，了解具体问题
2. 修复类型错误
3. 重新运行类型检查

## 参考资料

- [Prisma 文档](https://www.prisma.io/docs/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [模型同步最佳实践](./model-code-sync.md)
- [模型同步示例](./model-sync-examples.md)
