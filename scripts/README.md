# 灵华珐琅馆系统自动化工具

本目录包含一系列自动化工具，用于帮助开发人员提高代码质量和开发效率。

## 工具列表

### 1. 模型与代码一致性检查 (`check-model-code-consistency.js`)

这个脚本会检查 Prisma 模型和代码之间的不匹配，帮助您一次性发现所有类似的问题。

**使用方法**：
```bash
node scripts/check-model-code-consistency.js
```

**功能**：
- 解析 `prisma/schema.prisma` 文件，提取所有模型和字段
- 扫描 `lib/actions/` 目录下的所有 `.ts` 文件
- 检查是否使用了不存在于 Prisma 模型中的字段
- 输出详细的问题报告

**建议**：在每次修改数据库模型后运行此脚本。

### 2. 常见问题自动修复 (`fix-common-issues.js`)

这个脚本可以自动修复常见问题，如添加缺少的 "use server" 指令、修复 prisma 导入路径、移除不存在的字段等。

**使用方法**：
```bash
node scripts/fix-common-issues.js
```

**功能**：
- 添加缺少的 `"use server"` 指令
- 修复 prisma 导入路径（从 `../prisma` 改为 `@/lib/db`）
- 移除不存在的字段（如 `Employee.department`、`Schedule.type` 等）

**建议**：在运行 `check-model-code-consistency.js` 发现问题后运行此脚本。

### 3. 导入路径修复 (`fix-imports.js`)

这个脚本可以自动修复导入路径问题，确保所有文件都使用正确的导入路径。

**使用方法**：
```bash
node scripts/fix-imports.js
```

**功能**：
- 扫描项目中的所有 `.ts` 和 `.tsx` 文件
- 检查是否有从 `@/lib/actions` 导入的函数
- 建议更新为从特定模块导入
- 自动修复导入路径

**建议**：在重构代码或发现导入路径问题时运行此脚本。

### 4. Prisma 导入路径修复 (`fix-prisma-imports.js`)

这个脚本可以自动修复 Prisma 导入路径问题，确保所有文件都使用正确的 Prisma 导入路径。

**使用方法**：
```bash
node scripts/fix-prisma-imports.js
```

**功能**：
- 扫描 `lib/actions/` 目录下的所有 `.ts` 文件
- 将 `import { prisma } from "../prisma"` 替换为 `import prisma from "@/lib/db"`

**建议**：在发现 Prisma 导入路径问题时运行此脚本。

### 5. "use server" 指令添加 (`add-use-server.js`)

这个脚本可以自动添加缺少的 "use server" 指令。

**使用方法**：
```bash
node scripts/add-use-server.js
```

**功能**：
- 扫描 `lib/actions/` 目录下的所有 `.ts` 文件
- 检查是否使用了 `revalidatePath` 但没有 `"use server"` 指令
- 自动添加 `"use server"` 指令

**建议**：在发现 "use server" 指令相关错误时运行此脚本。

## 最佳实践

1. **定期运行检查脚本**：在每次修改数据库模型后，运行 `check-model-code-consistency.js` 检查代码和模型是否同步。

2. **自动修复常见问题**：如果发现问题，运行 `fix-common-issues.js` 自动修复常见问题。

3. **手动修复复杂问题**：对于自动修复脚本无法处理的复杂问题，需要手动修改代码。

4. **使用类型安全的方法**：使用 `lib/prisma-wrapper.ts` 提供的类型安全函数，避免使用不存在的字段。

5. **遵循代码规范**：遵循 [开发最佳实践指南](../docs/development-best-practices.md) 中的代码规范。

## 注意事项

- 这些脚本是辅助工具，不能替代人工代码审查。
- 在运行修复脚本前，建议先备份代码或确保代码已提交到版本控制系统。
- 修复后，务必测试系统功能，确保没有引入新的问题。

如有任何问题或建议，请联系技术负责人。
