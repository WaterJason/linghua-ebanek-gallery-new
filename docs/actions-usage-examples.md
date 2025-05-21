# 服务器操作函数使用示例

本文档提供了如何使用模块化的服务器操作函数的示例。

## 重要通知：迁移时间表

**`lib/actions.ts` 文件将在 2024年6月30日 后移除。**

请在此日期前完成所有代码的迁移工作，直接从特定模块导入函数。

## 导入方式

有两种推荐的方式可以导入服务器操作函数：

### 1. 直接从特定模块导入函数（强烈推荐）

```typescript
import { getUsers, createUser, updateUser } from "@/lib/actions/user-actions";
import { getProducts, createProduct } from "@/lib/actions/product-actions";

// 使用函数
const users = await getUsers();
const products = await getProducts();
```

### 2. 导入整个模块（推荐）

```typescript
import * as userActions from "@/lib/actions/user-actions";
import * as productActions from "@/lib/actions/product-actions";

// 使用模块访问函数
const users = await userActions.getUsers();
const products = await productActions.getProducts();
```

> **重要**：旧的导入方式（从 `@/lib/actions` 导入）目前仍然有效，但将在2024年6月30日后失效。请尽快迁移到新的导入方式。

## 用户管理示例

### 获取所有用户

```typescript
import { getUsers } from "@/lib/actions/user-actions";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <h1>用户列表</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

### 创建用户

```typescript
import { createUser } from "@/lib/actions/user-actions";
import { UserCreateParams } from "@/lib/actions/types";

// 在客户端组件中
async function handleCreateUser(formData: FormData) {
  "use server";

  const userData: UserCreateParams = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: "user",
  };

  try {
    const newUser = await createUser(userData);
    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 更新用户

```typescript
import { updateUser } from "@/lib/actions/user-actions";
import { UserUpdateParams } from "@/lib/actions/types";

// 在服务器操作中
export async function updateUserAction(userId: string, formData: FormData) {
  const userData: UserUpdateParams = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
  };

  try {
    const updatedUser = await updateUser(userId, userData);
    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 产品管理示例

### 获取所有产品

```typescript
import { getProducts } from "@/lib/actions/product-actions";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <h1>产品列表</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - ¥{product.retailPrice}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 创建产品

```typescript
import { createProduct } from "@/lib/actions/product-actions";
import { ProductCreateParams } from "@/lib/actions/types";

// 在服务器操作中
export async function createProductAction(formData: FormData) {
  const productData: ProductCreateParams = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    retailPrice: parseFloat(formData.get("retailPrice") as string),
    categoryId: parseInt(formData.get("categoryId") as string),
    images: formData.getAll("images").map(img => img as string),
  };

  try {
    const newProduct = await createProduct(productData);
    return { success: true, product: newProduct };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 库存管理示例

### 获取库存

```typescript
import { getInventory } from "@/lib/actions/inventory-actions";

export default async function InventoryPage() {
  const inventory = await getInventory();

  return (
    <div>
      <h1>库存列表</h1>
      <table>
        <thead>
          <tr>
            <th>产品</th>
            <th>数量</th>
            <th>位置</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.id}>
              <td>{item.product.name}</td>
              <td>{item.quantity}</td>
              <td>{item.location?.name || "未指定"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 库存转移

```typescript
import { transferInventory } from "@/lib/actions/inventory-actions";
import { InventoryTransferParams } from "@/lib/actions/types";

// 在服务器操作中
export async function transferInventoryAction(formData: FormData) {
  const transferData: InventoryTransferParams = {
    productId: parseInt(formData.get("productId") as string),
    quantity: parseInt(formData.get("quantity") as string),
    fromLocationId: parseInt(formData.get("fromLocationId") as string),
    toLocationId: parseInt(formData.get("toLocationId") as string),
  };

  try {
    const result = await transferInventory(transferData);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 销售管理示例

### 创建销售订单

```typescript
import { createSalesOrder } from "@/lib/actions/sales-actions";
import { SalesOrderCreateParams } from "@/lib/actions/types";

// 在服务器操作中
export async function createSalesOrderAction(formData: FormData) {
  const items = JSON.parse(formData.get("items") as string);

  const orderData: SalesOrderCreateParams = {
    customerId: parseInt(formData.get("customerId") as string),
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
    status: "pending",
    payment: {
      amount: parseFloat(formData.get("paymentAmount") as string),
      method: formData.get("paymentMethod") as "cash" | "card" | "transfer" | "other",
    },
    createdById: formData.get("userId") as string,
  };

  try {
    const newOrder = await createSalesOrder(orderData);
    return { success: true, order: newOrder };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 团建管理示例

### 创建团建活动

```typescript
import { createWorkshopActivity } from "@/lib/actions/workshop-actions";
import { WorkshopActivityCreateParams } from "@/lib/actions/types";

// 在服务器操作中
export async function createWorkshopActivityAction(formData: FormData) {
  const activityData: WorkshopActivityCreateParams = {
    title: formData.get("title") as string,
    date: formData.get("date") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    location: formData.get("location") as string,
    channelId: parseInt(formData.get("channelId") as string),
    instructorId: parseInt(formData.get("instructorId") as string),
    participantCount: parseInt(formData.get("participantCount") as string),
    fee: parseFloat(formData.get("fee") as string),
    status: "pending",
    participantIds: JSON.parse(formData.get("participantIds") as string),
    createdById: formData.get("userId") as string,
  };

  try {
    const newActivity = await createWorkshopActivity(activityData);
    return { success: true, activity: newActivity };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 系统设置示例

### 获取系统设置

```typescript
import { getSystemSettings } from "@/lib/actions/system-actions";

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div>
      <h1>系统设置</h1>
      <div>
        <h2>公司信息</h2>
        <p>公司名称: {settings.companyName}</p>
        <p>联系电话: {settings.contactPhone}</p>
      </div>
      <div>
        <h2>系统配置</h2>
        <p>主题: {settings.theme}</p>
        <p>语言: {settings.language}</p>
      </div>
    </div>
  );
}

> **注意**：如果你从 `@/lib/actions` 导入 `getSystemSettings`，需要使用 `getSystemSettingsNew` 函数名，以避免重复导出的问题。但我们强烈建议直接从 `@/lib/actions/system-actions` 导入，如上例所示。

### 更新系统设置

```typescript
import { updateSystemSetting } from "@/lib/actions/system-actions";

// 在服务器操作中
export async function updateSystemSettingAction(key: string, value: any) {
  try {
    await updateSystemSetting(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

> **注意**：如果你从 `@/lib/actions` 导入 `updateSystemSetting`，需要使用 `updateSystemSettingNew` 函数名，以避免重复导出的问题。但我们强烈建议直接从 `@/lib/actions/system-actions` 导入，如上例所示。

## 最佳实践

1. **直接从模块导入**：直接从特定模块导入函数，而不是从 `@/lib/actions` 导入。
   ```typescript
   // 推荐
   import { getUsers } from "@/lib/actions/user-actions";

   // 不推荐（将在2024年6月30日后失效）
   import { getUsers } from "@/lib/actions";
   ```

2. **使用类型定义**：始终使用类型定义，以获得更好的类型检查和代码提示。
   ```typescript
   import { UserCreateParams } from "@/lib/actions/types";

   const userData: UserCreateParams = {
     name: "张三",
     email: "zhangsan@example.com",
     password: "password123",
   };
   ```

3. **错误处理**：使用 try/catch 块来处理可能的错误，并向用户提供有意义的错误消息。
   ```typescript
   try {
     const result = await createUser(userData);
     return { success: true, result };
   } catch (error) {
     return { success: false, error: error.message };
   }
   ```

4. **数据验证**：在调用服务器操作函数之前，验证用户输入的数据。
   ```typescript
   if (!data.name || !data.email) {
     return { success: false, error: "姓名和邮箱为必填项" };
   }
   ```

5. **路径重新验证**：在修改数据后，使用 `revalidatePath` 函数来重新验证相关页面。
   ```typescript
   import { revalidatePath } from "next/cache";

   // 在更新数据后
   revalidatePath("/users");
   ```

6. **按需导入**：只导入你需要的函数，以减少代码体积。
   ```typescript
   // 推荐
   import { getUsers, createUser } from "@/lib/actions/user-actions";

   // 不推荐（除非需要使用多个函数）
   import * as userActions from "@/lib/actions/user-actions";
   ```

7. **避免在 "use server" 文件中导出非异步内容**：在标记为 "use server" 的文件中，只导出异步函数。
   ```typescript
   // 正确
   export async function getUsers() { /* ... */ }

   // 错误
   export const userTypes = { /* ... */ };
   ```

8. **尽早迁移**：不要等到最后一刻才开始迁移。尽早迁移可以避免在截止日期前出现紧急问题。
   ```typescript
   // 现在就开始迁移
   import { getUsers } from "@/lib/actions/user-actions";

   // 不要等到2024年6月30日才开始迁移
   import { getUsers } from "@/lib/actions";
   ```
