# 开发提醒

## ⚠️ 重要提示

在开始任何开发工作之前，请务必阅读 [开发最佳实践指南](./docs/development-best-practices.md)。

## 🔍 每次修改前的检查清单

1. **数据库模型变更**
   - 修改 `prisma/schema.prisma` 后，运行 `npx prisma migrate dev --name <migration-name>`
   - 运行 `node scripts/check-model-code-consistency.js` 检查代码和模型是否同步
   - 如有问题，运行 `node scripts/fix-common-issues.js` 自动修复

2. **服务器操作函数**
   - 使用 `lib/prisma-wrapper.ts` 提供的类型安全函数
   - 确保文件顶部有 `"use server"` 指令
   - 使用 `@/lib/db` 导入 Prisma 客户端
   - 使用 try/catch 块处理错误
   - 使用 `revalidatePath` 刷新页面

3. **导入路径**
   - 直接从特定模块导入函数：`import { getEmployees } from "@/lib/actions/employee-actions"`
   - 避免从 `@/lib/actions` 导入（虽然为了向后兼容性仍然支持）

## 🛠️ 常用命令

```bash
# 开发服务器
npm run dev

# Prisma Studio
npx prisma studio

# 数据库迁移
npx prisma migrate dev --name <migration-name>

# 检查模型与代码一致性
node scripts/check-model-code-consistency.js

# 修复常见问题
node scripts/fix-common-issues.js

# 修复导入路径
node scripts/fix-imports.js
```

## 🚫 常见错误与避免方法

1. **不要使用不存在的字段**
   - 使用类型安全的方法避免此类错误
   - 定期运行检查脚本

2. **不要忘记添加 "use server" 指令**
   - 在所有服务器操作函数文件顶部添加此指令
   - 运行修复脚本可以自动添加

3. **不要使用错误的导入路径**
   - 使用 `@/lib/db` 而不是 `../prisma`
   - 使用 `@/lib/actions/<module>-actions` 而不是 `@/lib/actions`

4. **不要忽略类型错误**
   - 解决所有 TypeScript 类型错误
   - 避免使用 `any` 类型或类型断言

5. **不要在原始文件中添加新代码**
   - 完全替换文件，而不是混合新旧代码
   - 创建专门的桥接文件，避免函数重复声明
   - 保留原始文件的备份（如 `file.ts.bak`）

## 📝 提交代码前的检查

1. 运行 `npm run lint` 检查代码风格
2. 运行 `npm run test` 执行单元测试
3. 运行 `node scripts/check-model-code-consistency.js` 检查模型与代码一致性
4. 手动测试关键功能

## 🆘 遇到问题？

1. 查阅 [开发最佳实践指南](./docs/development-best-practices.md)
2. 检查 [常见问题与解决方案](./docs/development-best-practices.md#常见问题与解决方案)
3. 运行自动修复脚本
4. 联系技术负责人

**记住：预防问题总比修复问题更容易！**
