# 模型同步工具使用示例

本文档提供了模型同步工具的使用示例，帮助开发人员理解如何使用这些工具确保代码与 Prisma 模型保持同步。

## 1. 使用类型安全的包装函数

### 创建记录

```typescript
import { createRecord } from '@/lib/prisma-wrapper';

// 创建员工
const employee = await createRecord('employee', {
  name: "张三",
  position: "经理",
  dailySalary: 200,
  // 如果尝试使用不存在的字段，TypeScript 会报错
  // department: "销售部", // 错误：'department' 不存在于 'Employee' 类型中
}, { checkSync: true });
```

### 更新记录

```typescript
import { updateRecord } from '@/lib/prisma-wrapper';

// 更新员工
const updatedEmployee = await updateRecord('employee', 1, {
  name: "李四",
  // department: "市场部", // 错误：'department' 不存在于 'Employee' 类型中
}, { checkSync: true });
```

### 查找记录

```typescript
import { findRecords } from '@/lib/prisma-wrapper';

// 查找员工
const employees = await findRecords('employee', {
  where: {
    position: "经理",
  },
  include: {
    user: true,
  },
});
```

### 删除记录

```typescript
import { deleteRecord } from '@/lib/prisma-wrapper';

// 删除员工
const result = await deleteRecord('employee', 1);
```

## 2. 使用模型同步检查工具

### 检查数据是否与模型一致

```typescript
import { checkModelSync } from '@/lib/model-sync';

// 检查数据是否与模型一致
const checkResult = await checkModelSync('employee', {
  name: "张三",
  position: "经理",
  dailySalary: 200,
  department: "销售部", // 这个字段在 Employee 模型中不存在
});

console.log(checkResult);
// 输出:
// {
//   isValid: false,
//   errors: ['字段 "department" 在模型 "Employee" 中不存在']
// }
```

### 转换数据为正确的格式

```typescript
import { convertToModelFormat } from '@/lib/model-sync';

// 转换数据为正确的格式
const convertedData = await convertToModelFormat('employee', {
  name: "张三",
  position: "经理",
  dailySalary: "200", // 字符串类型
});

console.log(convertedData);
// 输出:
// {
//   name: "张三",
//   position: "经理",
//   dailySalary: 200, // 转换为数字类型
// }
```

### 安全创建数据

```typescript
import { safeCreate } from '@/lib/model-sync';

// 安全创建数据
try {
  const employee = await safeCreate('Employee', {
    name: "张三",
    position: "经理",
    dailySalary: "200", // 字符串类型会被自动转换为数字类型
    department: "销售部", // 这个字段在 Employee 模型中不存在
  });
} catch (error) {
  console.error(error.message);
  // 输出: 数据与模型不一致: 字段 "department" 在模型 "Employee" 中不存在
}
```

### 安全更新数据

```typescript
import { safeUpdate } from '@/lib/model-sync';

// 安全更新数据
try {
  const employee = await safeUpdate('Employee', 1, {
    name: "李四",
    dailySalary: "300", // 字符串类型会被自动转换为数字类型
  });
} catch (error) {
  console.error(error.message);
}
```

## 3. 使用验证函数

### 验证创建数据

```typescript
import { validateCreateEmployee } from '@/lib/validation';

// 验证创建数据
const validation = validateCreateEmployee({
  name: "张三",
  position: "经理",
  dailySalary: 200,
  phone: "13800138000",
});

console.log(validation);
// 输出:
// {
//   isValid: true,
//   errors: []
// }
```

### 验证更新数据

```typescript
import { validateUpdateEmployee } from '@/lib/validation';

// 验证更新数据
const validation = validateUpdateEmployee({
  name: "李四",
  phone: "13800138000x", // 无效的手机号
});

console.log(validation);
// 输出:
// {
//   isValid: false,
//   errors: ['手机号格式不正确']
// }
```

## 4. 使用自动化脚本

### 检查模型同步

```bash
# 检查模型同步
npm run check:model-sync
```

### 修复模型同步

```bash
# 修复模型同步
npm run fix:model-sync
```

## 5. 最佳实践

1. 在开发新功能时，使用类型安全的包装函数创建和更新数据
2. 在提交代码前，运行模型同步检查脚本，确保代码与模型一致
3. 如果发现不一致，使用模型同步修复脚本自动修复
4. 在服务器端操作函数中使用验证函数，确保数据符合模型的要求
5. 定期更新 TypeScript 接口，确保它们与 Prisma 模型保持同步

## 6. 常见问题

### Q: 为什么我的代码在运行时报错，但在编译时没有错误？

A: TypeScript 只能在编译时检查类型，但无法检查运行时的动态数据。使用模型同步检查工具可以在运行时检查数据是否与模型一致。

### Q: 如何处理模型变更？

A: 当 Prisma 模型发生变更时，需要执行以下步骤：

1. 更新 Prisma 模型
2. 运行 `npx prisma generate` 生成新的客户端
3. 更新 TypeScript 接口
4. 运行模型同步检查脚本，确保代码与模型一致
5. 如果发现不一致，使用模型同步修复脚本自动修复

### Q: 如何处理复杂的关联关系？

A: 对于复杂的关联关系，可以使用 Prisma 的 `include` 和 `connect` 选项：

```typescript
const employee = await createRecord('employee', {
  name: "张三",
  position: "经理",
  dailySalary: 200,
  user: {
    connect: {
      id: 1,
    },
  },
}, {
  include: {
    user: true,
  },
});
```
