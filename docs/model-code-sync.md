# Prisma 模型与代码同步最佳实践

## 问题背景

在开发过程中，我们发现了一个常见问题：Prisma 模型定义与代码中使用的字段名不匹配，导致运行时错误。例如，在创建产品时，代码使用 `categoryId` 字段，但 Prisma 模型中定义的是 `category` 字段，导致以下错误：

```
Error: Invalid `prisma.product.create()` invocation:
{
  data: {
    categoryId: null,
    ~~~~~~~~~~
  }
}
Unknown argument `categoryId`. Did you mean `category`?
```

这类问题通常发生在以下情况：

1. 数据库模型发生变化，但代码没有同步更新
2. 使用了错误的字段名
3. 字段类型不匹配（如将对象存储为字符串）

## 解决方案

为了解决这个问题，我们实施了以下解决方案：

### 1. 创建 TypeScript 接口

为每个 Prisma 模型创建 TypeScript 接口，确保代码中使用的类型与数据库模型一致：

```typescript
// types/prisma-models.ts
export interface PrismaProduct {
  id: number;
  name: string;
  price: number;
  // ... 其他字段
}

export interface CreateProductInput {
  name: string;
  price: number;
  // ... 其他字段
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  // ... 其他字段
}
```

### 2. 使用类型化函数

在服务器端操作函数中使用这些接口，确保类型安全：

```typescript
export async function createProduct(data: CreateProductInput): Promise<PrismaProduct> {
  // ...
}

export async function updateProduct(id: number, data: UpdateProductInput): Promise<PrismaProduct> {
  // ...
}
```

### 3. 添加数据验证

创建通用验证函数，确保传入的数据符合模型的要求：

```typescript
export function validate(data: any, validations: Array<(data: any) => string | null>): ValidationResult {
  const errors: string[] = [];
  
  for (const validation of validations) {
    const error = validation(data);
    if (error) {
      errors.push(error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCreateProduct(data: any): ValidationResult {
  return validate(data, [
    required('name', '产品名称'),
    number('price', '产品价格', { min: 0, required: true }),
    // ... 其他验证
  ]);
}
```

### 4. 创建模型同步检查工具

创建模型同步检查工具，用于检查代码中使用的字段名是否与 Prisma 模型一致：

```typescript
export async function checkModelSync(
  modelName: string, 
  data: Record<string, any>
): Promise<{ isValid: boolean; errors: string[] }> {
  // 检查数据对象中的每个字段是否存在于模型中
  // 检查字段类型是否匹配
  // ...
}

export async function safeCreate(
  modelName: string, 
  data: Record<string, any>
): Promise<any> {
  // 检查数据是否与模型一致
  // 转换数据为正确的格式
  // 创建数据
  // ...
}
```

### 5. 类型转换和安全处理

在操作函数中添加类型转换和安全处理，确保数据类型正确：

```typescript
// 字符串转数字
if (data.price !== undefined) {
  updateData.price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
}

// 对象转字符串
if (data.dimensions !== undefined) {
  updateData.dimensions = typeof data.dimensions === 'object' ? JSON.stringify(data.dimensions) : data.dimensions;
}

// 安全处理 null 值
if (data.categoryId !== undefined) {
  updateData.categoryId = data.categoryId !== null ? (typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId) : null;
}
```

## 最佳实践

为了避免类似问题再次发生，我们建议遵循以下最佳实践：

### 1. 模型定义与代码同步

- 每次修改 Prisma 模型后，同步更新相关的 TypeScript 接口
- 使用 `prisma generate` 命令生成最新的 Prisma 客户端
- 考虑使用自动化工具从 Prisma 模型生成 TypeScript 接口

### 2. 使用类型安全的函数

- 为所有数据库操作函数添加明确的参数和返回类型
- 使用接口而不是 `any` 类型
- 在函数内部进行类型检查和转换

### 3. 数据验证

- 在服务器端操作前验证数据
- 使用通用验证函数，集中处理验证逻辑
- 返回详细的错误信息，帮助调试

### 4. 错误处理

- 使用 try-catch 块捕获错误
- 记录详细的错误信息
- 返回用户友好的错误消息

### 5. 代码审查

- 在代码审查中特别关注数据库操作
- 检查字段名是否与模型一致
- 检查类型转换是否正确

### 6. 使用安全操作函数

- 使用 `safeCreate` 和 `safeUpdate` 函数，自动检查和转换数据
- 在开发环境中启用模型同步检查，及早发现问题
- 在生产环境中禁用模型同步检查，避免性能影响

## 工具和资源

- [Prisma 文档](https://www.prisma.io/docs/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Zod](https://github.com/colinhacks/zod) - TypeScript 优先的模式验证库
- [Prisma-zod-generator](https://github.com/CarterGrimmeisen/prisma-zod-generator) - 从 Prisma 模型生成 Zod 模式

## 结论

通过实施这些最佳实践，我们可以显著减少由于模型与代码不同步导致的错误，提高代码的可维护性和稳定性。这些实践不仅适用于产品管理模块，也适用于整个应用程序的所有模块。

## 实施步骤

1. 为所有 Prisma 模型创建 TypeScript 接口
2. 更新所有服务器端操作函数，使用类型化参数和返回值
3. 创建通用数据验证函数，用于验证传入的数据
4. 创建模型同步检查工具，用于检查代码中使用的字段名是否与 Prisma 模型一致
5. 在所有模块中使用安全操作函数，自动检查和转换数据

## 示例代码

### 模型接口

```typescript
// types/prisma-models.ts
export interface PrismaProduct {
  id: number;
  name: string;
  price: number;
  commissionRate: number;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  barcode: string | null;
  category: string | null;
  categoryId: number | null;
  cost: number | null;
  sku: string | null;
  details: string | null;
  dimensions: string | null;
  material: string | null;
  unit: string | null;
  inventory: number | null;
}
```

### 验证函数

```typescript
// lib/validation.ts
export function validateCreateProduct(data: any): ValidationResult {
  return validate(data, [
    required('name', '产品名称'),
    number('price', '产品价格', { min: 0, required: true }),
    number('commissionRate', '佣金率', { min: 0, max: 100 }),
    number('cost', '成本', { min: 0 }),
    integer('categoryId', '分类ID', { min: 1 }),
    integer('inventory', '库存', { min: 0 }),
    string('name', '产品名称', { maxLength: 100, required: true }),
    string('description', '产品描述', { maxLength: 1000 }),
    string('sku', 'SKU', { maxLength: 50 }),
    string('barcode', '条形码', { maxLength: 50 }),
    string('unit', '单位', { maxLength: 20 }),
    string('material', '材料', { maxLength: 50 }),
  ]);
}
```

### 安全操作函数

```typescript
// lib/model-sync.ts
export async function safeCreate(
  modelName: string, 
  data: Record<string, any>
): Promise<any> {
  // 检查数据是否与模型一致
  const checkResult = await checkModelSync(modelName, data);
  
  if (!checkResult.isValid) {
    throw new Error(`数据与模型不一致: ${checkResult.errors.join(', ')}`);
  }
  
  // 转换数据为正确的格式
  const convertedData = await convertToModelFormat(modelName, data);
  
  // 创建数据
  const prisma = new PrismaClient();
  
  try {
    const result = await (prisma as any)[modelName].create({
      data: convertedData,
    });
    
    return result;
  } catch (error) {
    console.error(`创建 ${modelName} 时出错:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
```
