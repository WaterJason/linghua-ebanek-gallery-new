# 服务器操作函数迁移指南

本指南将帮助开发人员从旧的 `lib/actions.ts` 文件迁移到新的模块化结构。

## 重要通知：迁移时间表

**`lib/actions.ts` 文件将在 2024年6月30日 后移除。**

请在此日期前完成所有代码的迁移工作，直接从特定模块导入函数。

## 为什么要迁移？

旧的 `lib/actions.ts` 文件存在以下问题：

1. **文件过大**：超过7000行代码，难以维护和理解
2. **重复导出**：存在重复导出的函数，导致编译错误
3. **功能混杂**：不同领域的操作混在一起，难以查找和修改
4. **缺乏模块化**：难以扩展和测试
5. **Next.js 限制**：在标记为 "use server" 的文件中不允许重复导出

新的模块化结构解决了这些问题，提供了更好的代码组织、类型安全和开发体验。

## 当前状态

原始的 `lib/actions.ts` 文件已被替换为一个简单的桥接文件，它只导入并重新导出模块化的函数，不包含任何实现代码。这是一个临时解决方案，以保持向后兼容性，同时鼓励迁移到新的模块化结构。

## 迁移步骤

### 1. 更新导入语句

将导入语句从旧的路径更新为新的路径：

**旧的导入方式（将在2024年6月30日后失效）**：
```typescript
import { getUsers, createUser } from "@/lib/actions";
```

**新的导入方式**：
```typescript
// 方式1：直接从特定模块导入函数（强烈推荐）
import { getUsers, createUser } from "@/lib/actions/user-actions";

// 方式2：导入整个模块（推荐）
import * as userActions from "@/lib/actions/user-actions";
const { getUsers, createUser } = userActions;
```

> **重要**：旧的导入方式目前仍然有效，但将在2024年6月30日后失效。请尽快迁移到新的导入方式。

### 2. 使用类型定义

新的模块化结构提供了类型定义，可以提高代码质量和开发体验：

**旧的方式**：
```typescript
async function createUser(data: any) {
  // ...
}
```

**新的方式**：
```typescript
import { UserCreateParams } from "@/lib/actions/types";

async function createUser(data: UserCreateParams) {
  // ...
}
```

### 3. 按功能领域组织导入

根据功能领域组织导入语句，使代码更加清晰：

**旧的方式**：
```typescript
import {
  getUsers,
  createUser,
  getProducts,
  createProduct
} from "@/lib/actions";
```

**新的方式**：
```typescript
// 用户相关
import {
  getUsers,
  createUser
} from "@/lib/actions";

// 产品相关
import {
  getProducts,
  createProduct
} from "@/lib/actions";

// 或者使用命名空间
import {
  userActions,
  productActions
} from "@/lib/actions";
```

### 4. 函数命名说明

在模块化重构过程中，一些函数已经被重命名，以避免命名冲突：

| 旧函数名 | 新函数名 | 模块 |
|---------|---------|------|
| `createUser` (第一个版本) | `createUserBasic` | `userActions` |
| `updateUser` (第一个版本) | `updateUserDetailed` | `userActions` |

> **注意**：新的桥接文件已经解决了重复导出的问题，所以不再需要使用 `xxxNew` 函数名。但我们仍然强烈建议直接从特定模块导入函数，以便在2024年6月30日后的迁移更加顺畅。

### 5. 使用文档注释

新的模块化结构提供了详细的文档注释，可以帮助你理解函数的用法：

```typescript
/**
 * 创建用户
 *
 * @param data - 用户创建参数
 * @returns 创建的用户信息
 * @throws 如果用户创建失败，例如邮箱已被注册
 *
 * @example
 * ```ts
 * const newUser = await createUser({
 *   name: "张三",
 *   email: "zhangsan@example.com",
 *   password: "password123",
 *   role: "user",
 *   roleIds: [1, 2]
 * });
 * ```
 */
export async function createUser(data: UserCreateParams) {
  // ...
}
```

## 模块化结构

新的模块化结构按功能领域组织了服务器操作函数：

| 模块 | 文件 | 功能 |
|------|------|------|
| `userActions` | `user-actions.ts` | 用户相关操作 |
| `authActions` | `auth-actions.ts` | 认证相关操作 |
| `roleActions` | `role-actions.ts` | 角色和权限相关操作 |
| `employeeActions` | `employee-actions.ts` | 员工相关操作 |
| `productActions` | `product-actions.ts` | 产品相关操作 |
| `inventoryActions` | `inventory-actions.ts` | 库存相关操作 |
| `salesActions` | `sales-actions.ts` | 销售相关操作 |
| `purchaseActions` | `purchase-actions.ts` | 采购相关操作 |
| `workshopActions` | `workshop-actions.ts` | 团建相关操作 |
| `systemActions` | `system-actions.ts` | 系统相关操作 |
| `scheduleActions` | `schedule-actions.ts` | 日程相关操作 |
| `channelActions` | `channel-actions.ts` | 渠道相关操作 |

## 类型定义

新的模块化结构提供了类型定义，可以在 `lib/actions/types.ts` 文件中找到：

```typescript
// 用户创建参数
export interface UserCreateParams {
  name: string;
  email: string;
  password: string;
  role?: string;
  roleIds?: number[];
}

// 产品创建参数
export interface ProductCreateParams {
  name: string;
  description?: string;
  retailPrice?: number;
  // ...
}

// 更多类型定义...
```

## 示例

### 用户管理

```typescript
import { getUsers, createUser, updateUser } from "@/lib/actions";
import { UserCreateParams, UserUpdateParams } from "@/lib/actions/types";

// 获取所有用户
const users = await getUsers();

// 创建用户
const userData: UserCreateParams = {
  name: "张三",
  email: "zhangsan@example.com",
  password: "password123",
  role: "user",
};
const newUser = await createUser(userData);

// 更新用户
const updateData: UserUpdateParams = {
  name: "李四",
  email: "lisi@example.com",
};
const updatedUser = await updateUser("user_id", updateData);
```

### 产品管理

```typescript
import { getProducts, createProduct, updateProduct } from "@/lib/actions";
import { ProductCreateParams, ProductUpdateParams } from "@/lib/actions/types";

// 获取所有产品
const products = await getProducts();

// 创建产品
const productData: ProductCreateParams = {
  name: "产品名称",
  description: "产品描述",
  retailPrice: 100,
  categoryId: 1,
};
const newProduct = await createProduct(productData);

// 更新产品
const updateData: ProductUpdateParams = {
  name: "新产品名称",
  retailPrice: 120,
};
const updatedProduct = await updateProduct(1, updateData);
```

## 最佳实践

1. **使用类型定义**：始终使用类型定义，以获得更好的类型检查和代码提示。

2. **按功能领域组织导入**：根据功能领域组织导入语句，使代码更加清晰。

3. **使用命名空间**：对于需要使用多个相关函数的组件，考虑使用命名空间导入。

4. **按需导入**：只导入你需要的函数，以减少代码体积。

5. **使用文档注释**：利用文档注释来理解函数的用法。

## 常见问题

### 我应该使用哪种导入方式？

两种导入方式中，我们强烈建议：

- 方式1：直接从特定模块导入函数（最推荐）
  ```typescript
  import { getUsers } from "@/lib/actions/user-actions";
  ```
- 方式2：导入整个模块（推荐）
  ```typescript
  import * as userActions from "@/lib/actions/user-actions";
  ```

### 旧的导入方式还能用吗？

是的，为了向后兼容，旧的导入方式（从 `@/lib/actions` 导入）目前仍然有效。但这只是一个临时解决方案，`lib/actions.ts` 文件将在 2024年6月30日 后移除。请尽快迁移到新的导入方式。

### 为什么要设定迁移期限？

设定迁移期限有以下几个原因：

1. 明确的期限可以促使开发团队优先考虑迁移工作
2. 长期维护两套并行的代码会增加维护负担和潜在的错误
3. 完全迁移后，代码库将更加清晰和一致
4. Next.js 服务器组件对 "use server" 文件有特定限制，完全迁移可以避免这些限制

### 如何找到我需要的函数？

你可以查看相应的模块文件，例如：

- 用户相关：`lib/actions/user-actions.ts`
- 认证相关：`lib/actions/auth-actions.ts`
- 角色相关：`lib/actions/role-actions.ts`
- 员工相关：`lib/actions/employee-actions.ts`
- 产品相关：`lib/actions/product-actions.ts`
- 库存相关：`lib/actions/inventory-actions.ts`
- 销售相关：`lib/actions/sales-actions.ts`
- 采购相关：`lib/actions/purchase-actions.ts`
- 团建相关：`lib/actions/workshop-actions.ts`
- 系统相关：`lib/actions/system-actions.ts`
- 日程相关：`lib/actions/schedule-actions.ts`
- 渠道相关：`lib/actions/channel-actions.ts`

### 如何添加新的函数？

如果你需要添加新的函数，请将其添加到相应的模块文件中，而不是 `lib/actions.ts` 文件。例如，如果你需要添加一个新的用户相关函数，请将其添加到 `lib/actions/user-actions.ts` 文件中。

### 我在使用新的模块化结构时遇到了问题，该怎么办？

如果你在使用新的模块化结构时遇到了问题，请尝试以下步骤：

1. 确保你使用的是最新版本的代码
2. 检查导入路径是否正确
3. 确保函数名称拼写正确
4. 如果仍然有问题，请联系开发团队寻求帮助

### 迁移计划是什么？

我们的迁移计划如下：

1. **现在 - 2024年5月31日**：自愿迁移阶段
   - 鼓励开发人员在新代码中使用新的导入方式
   - 在修改现有代码时，顺便更新导入方式

2. **2024年6月1日 - 2024年6月30日**：强制迁移阶段
   - 所有新代码必须使用新的导入方式
   - 积极更新现有代码的导入方式
   - 开发团队将协助解决迁移过程中的问题

3. **2024年7月1日**：移除 `lib/actions.ts` 文件
   - 完全移除桥接文件
   - 所有代码必须直接从模块文件导入函数
