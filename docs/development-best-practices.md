# 灵华珐琅馆系统开发最佳实践指南

## 目录

1. [前言](#前言)
2. [系统架构概览](#系统架构概览)
3. [开发流程](#开发流程)
4. [代码规范](#代码规范)
5. [数据库与模型管理](#数据库与模型管理)
6. [服务器操作函数](#服务器操作函数)
7. [错误处理与调试](#错误处理与调试)
8. [自动化工具](#自动化工具)
9. [测试策略](#测试策略)
10. [部署流程](#部署流程)
11. [常见问题与解决方案](#常见问题与解决方案)

## 前言

本文档旨在提供灵华珐琅馆系统开发的最佳实践指南，帮助开发团队避免常见错误，提高代码质量和开发效率。**请在每次开发前阅读本文档，确保遵循这些最佳实践。**

## 系统架构概览

灵华珐琅馆系统基于以下技术栈：

- **前端框架**：Next.js 15.x
- **UI 组件**：Tailwind CSS + Shadcn UI
- **数据库**：PostgreSQL
- **ORM**：Prisma
- **认证**：NextAuth.js
- **部署**：Vercel

系统采用模块化设计，主要包括以下模块：

- 产品管理
- 库存管理
- 采购管理
- 销售管理
- 员工管理
- 日程管理
- 团建管理
- 财务管理
- 系统设置

## 开发流程

### 1. 需求分析

- 明确需求，确保理解业务逻辑
- 与产品经理和用户确认需求细节
- 记录需求变更

### 2. 设计阶段

- 设计数据模型
- 设计 API 接口
- 设计 UI 界面
- 进行技术选型

### 3. 开发阶段

- **遵循代码规范**
- **使用类型安全的方法**
- **定期运行检查脚本**
- **编写单元测试**

### 4. 测试阶段

- 进行单元测试
- 进行集成测试
- 进行 UI 测试
- 进行性能测试

### 5. 部署阶段

- 准备部署环境
- 执行数据库迁移
- 部署应用
- 监控系统运行状态

## 代码规范

### 命名规范

- **文件名**：使用 kebab-case（如 `employee-actions.ts`）
- **组件名**：使用 PascalCase（如 `EmployeeList`）
- **函数名**：使用 camelCase（如 `getEmployees`）
- **变量名**：使用 camelCase（如 `employeeList`）
- **常量名**：使用 UPPER_SNAKE_CASE（如 `MAX_EMPLOYEES`）
- **类型名**：使用 PascalCase（如 `EmployeeType`）

### 代码风格

- 使用 ESLint 和 Prettier 保持代码风格一致
- 使用 TypeScript 类型定义，避免使用 `any` 类型
- 使用异步/await 而不是回调函数
- 使用解构赋值简化代码
- 使用箭头函数提高可读性

### 注释规范

- 为每个函数添加 JSDoc 注释，说明函数的功能、参数和返回值
- 为复杂的逻辑添加行内注释
- 为重要的业务逻辑添加详细注释

## 数据库与模型管理

### Prisma 模型定义

- 在 `prisma/schema.prisma` 文件中定义数据模型
- 使用有意义的字段名和关系名
- 为每个字段添加适当的类型和约束
- 使用 `@relation` 定义模型之间的关系

### 数据库迁移

- 使用 Prisma 的迁移功能管理数据库结构变更
- 每次修改模型后，运行 `npx prisma migrate dev --name <migration-name>` 创建迁移
- 在生产环境中，使用 `npx prisma migrate deploy` 应用迁移

### 模型与代码同步

- **每次修改数据库模型后，运行 `node scripts/check-model-code-consistency.js` 检查代码和模型是否同步**
- **如果发现不同步，运行 `node scripts/fix-common-issues.js` 自动修复常见问题**
- **或者手动修改代码，确保与模型保持一致**

### 模型同步最佳实践

- **在添加新字段前先更新Prisma模型**：确保先修改`schema.prisma`文件并运行迁移，然后再在代码中使用新字段
- **使用Prisma自动生成类型**：优先使用Prisma生成的类型，而不是手动定义接口，以避免类型不匹配
- **确保接口与模型一致**：确保`types/prisma-models.ts`中的接口定义与Prisma模型保持一致
- **定期运行模型同步检查**：不仅在修改模型后，还应定期运行检查脚本，确保代码和模型始终同步
- **使用类型安全的包装函数**：使用`lib/prisma-wrapper.ts`中的函数进行数据库操作，利用TypeScript的类型检查功能

## 服务器操作函数

### 使用类型安全的方法

- **使用 `lib/prisma-wrapper.ts` 提供的类型安全函数，而不是直接使用 Prisma 客户端**
- **避免使用不存在的字段，让 TypeScript 帮助您捕获潜在的错误**

```typescript
// 不推荐的方式
const employee = await prisma.employee.create({
  data: {
    name: data.name,
    department: data.department, // 错误：Employee 模型中没有 department 字段
  },
});

// 推荐的方式
import { createRecord } from "@/lib/prisma-wrapper";

const employee = await createRecord('employee', {
  name: data.name,
  // TypeScript 会报错，因为 Employee 模型中没有 department 字段
});
```

### 服务器操作函数规范

- 在文件顶部添加 `"use server"` 指令
- 使用 `@/lib/db` 导入 Prisma 客户端，而不是 `../prisma`
- 使用 `revalidatePath` 在数据变更后刷新页面
- 使用 try/catch 块处理错误
- 返回有意义的错误信息

```typescript
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createEmployee(data: any) {
  try {
    // 验证数据
    if (!data.name) {
      throw new Error("员工姓名为必填项");
    }

    // 创建记录
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        position: data.position || "",
        // 其他字段...
      },
    });

    // 刷新页面
    revalidatePath("/employees");
    return employee;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create employee");
  }
}
```

### 模块化组织

- 按功能模块组织服务器操作函数
- 使用 `lib/actions/<module>-actions.ts` 的命名方式
- 在 `lib/actions/index.ts` 中重新导出所有模块的函数
- 推荐直接从特定模块导入函数，而不是从 `lib/actions` 导入

```typescript
// 推荐的导入方式
import { getEmployees } from "@/lib/actions/employee-actions";

// 不推荐的导入方式（但为了向后兼容性，仍然支持）
import { getEmployees } from "@/lib/actions";
```

### 文件重构原则

- **完全替换而非修改**：在进行大规模重构时，应完全替换文件，而不是在原始文件中添加新代码
- **保留备份**：替换文件前，先创建备份（如 `file.ts.bak`）
- **清晰的过渡策略**：如需保持向后兼容性，创建专门的桥接文件，而不是混合新旧代码
- **避免函数重复声明**：确保同一个函数不会在多个地方被声明，以防止编译错误

```typescript
// 错误示例：在同一文件中既有原始函数又导入相同函数
export async function getUsers() { /* 原始实现 */ }
export * from "./actions/user-actions"; // 这里也导出了 getUsers，导致重复声明

// 正确示例：创建专门的桥接文件，只导出模块化函数
// lib/actions.ts
export * from "./actions/user-actions";
export * from "./actions/employee-actions";
// ...其他模块
```

## 错误处理与调试

### 错误处理

- 使用 try/catch 块捕获错误
- 记录详细的错误信息，包括错误堆栈
- 返回用户友好的错误信息
- 使用自定义错误类型区分不同类型的错误

### 详细错误日志

- **提供上下文信息**：记录错误发生时的操作、参数和环境信息
- **记录完整错误堆栈**：使用`console.error("错误信息:", error, error.stack)`记录完整的错误堆栈
- **区分错误类型**：根据错误类型提供不同的处理方式和日志信息
- **记录操作步骤**：在关键操作前后添加日志，便于追踪问题
- **使用结构化日志**：使用JSON格式记录日志，便于后期分析
- **避免敏感信息泄露**：确保日志中不包含密码、令牌等敏感信息

### 调试技巧

- 使用 `console.log` 输出调试信息
- 使用 Chrome DevTools 调试前端代码
- 使用 VS Code 调试器调试服务器代码
- 使用 Prisma Studio 查看和修改数据库数据

### 错误处理最佳实践

- **统一错误处理**：使用统一的错误处理机制，避免重复代码
- **优雅降级**：在关键功能出错时提供备选方案，确保系统可用性
- **错误监控**：在生产环境中使用错误监控工具，如Sentry，及时发现和修复问题
- **自动重试**：对于可恢复的错误，实现自动重试机制
- **用户反馈**：提供友好的错误信息，引导用户解决问题或联系支持

## 自动化工具

系统提供了以下自动化工具，位于 `scripts` 目录：

### 1. 模型与代码一致性检查

```bash
node scripts/check-model-code-consistency.js
```

这个脚本会检查 Prisma 模型和代码之间的不匹配，帮助您一次性发现所有类似的问题。

### 2. 常见问题自动修复

```bash
node scripts/fix-common-issues.js
```

这个脚本可以自动修复常见问题，如添加缺少的 "use server" 指令、修复 prisma 导入路径、移除不存在的字段等。

### 3. 导入路径修复

```bash
node scripts/fix-imports.js
```

这个脚本可以自动修复导入路径问题，确保所有文件都使用正确的导入路径。

## 测试策略

### 单元测试

- 使用 Jest 和 React Testing Library 编写单元测试
- 为每个服务器操作函数编写测试
- 为每个 React 组件编写测试
- 使用模拟（Mock）隔离测试单元

### 数据操作测试

- **测试数据验证**：确保数据验证函数能正确识别有效和无效数据
- **测试边界条件**：测试极限值、空值、特殊字符等边界情况
- **测试类型转换**：确保字符串、数字等类型的正确转换
- **模拟数据库操作**：使用模拟对象替代真实数据库连接
- **测试事务回滚**：确保事务在出错时能正确回滚
- **测试模型同步**：验证代码使用的字段与数据库模型一致
- **测试错误处理**：确保数据操作错误能被正确捕获和处理

### 集成测试

- 测试多个组件或函数之间的交互
- 测试数据流和状态管理
- 测试表单提交和数据验证

### E2E 测试

- 使用 Cypress 或 Playwright 编写端到端测试
- 测试关键用户流程
- 测试跨页面交互

### 测试最佳实践

- **使用测试数据库**：使用专门的测试数据库，避免影响生产数据
- **自动化测试**：将测试集成到CI/CD流程中，确保每次提交都运行测试
- **测试覆盖率**：使用覆盖率工具监控测试覆盖情况，确保关键代码路径被测试
- **测试驱动开发**：先编写测试，再实现功能，确保代码可测试性
- **定期重构测试**：随着代码变化，定期重构和更新测试用例

## 部署流程

### 开发环境

- 使用 `npm run dev` 启动开发服务器
- 使用 `npx prisma studio` 查看和修改数据库数据
- 使用 `npx prisma migrate dev` 应用数据库迁移

### 生产环境

- 使用 Vercel 部署应用
- 使用 `npx prisma migrate deploy` 应用数据库迁移
- 使用环境变量配置应用

## 常见问题与解决方案

### 1. "Module not found" 错误

**问题**：导入模块时出现 "Module not found" 错误。

**解决方案**：
- 检查导入路径是否正确
- 检查文件是否存在
- 检查 `tsconfig.json` 中的路径别名配置

### 2. Prisma 查询错误

**问题**：使用 Prisma 查询数据库时出现错误。

**解决方案**：
- 检查 Prisma 模型定义是否正确
- 检查查询参数是否符合模型定义
- 运行 `npx prisma generate` 更新 Prisma 客户端

### 3. "use server" 指令错误

**问题**：使用服务器操作函数时出现 "use server" 指令相关错误。

**解决方案**：
- 确保在文件顶部添加了 `"use server"` 指令
- 确保只导出异步函数
- 确保不在客户端组件中使用服务器组件的功能

### 4. 数据库迁移错误

**问题**：执行数据库迁移时出现错误。

**解决方案**：
- 检查迁移文件是否正确
- 检查数据库连接是否正常
- 尝试使用 `npx prisma migrate reset` 重置数据库（注意：这会删除所有数据）

### 5. 函数重复声明错误

**问题**：出现 "Identifier 'xxx' has already been declared" 错误。

**解决方案**：
- 检查是否在同一文件中既有原始函数定义又导入了相同函数
- 完全替换文件，而不是在原始文件中添加新代码
- 创建专门的桥接文件，只导出模块化函数
- 运行 `npm run build` 检查编译错误

### 6. 模型同步错误

**问题**：出现 "Failed to create xxx" 或 "数据与模型不一致" 等错误。

**解决方案**：
- 运行 `node scripts/check-model-code-consistency.js` 检查模型与代码一致性
- 确保代码中使用的字段在 Prisma 模型中存在
- 确保字段类型正确，特别是数字类型（如 `dailySalary`）
- 添加详细的错误日志，记录操作步骤和数据内容
- 使用 `lib/prisma-wrapper.ts` 中的类型安全函数进行数据库操作
- 确保 `types/prisma-models.ts` 中的接口定义与 Prisma 模型一致

## 结语

遵循本文档中的最佳实践，可以帮助您避免常见错误，提高代码质量和开发效率。如果您有任何问题或建议，请联系技术负责人。

**记住：每次开发前阅读本文档，确保遵循这些最佳实践。**
