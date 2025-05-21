# API 文档生成指南

本文档描述了如何使用自动化文档生成工具，确保 API 文档与代码保持同步。

## 文档生成工具

我们使用 [TypeDoc](https://typedoc.org/) 来生成 API 文档。TypeDoc 是一个基于 TypeScript 的文档生成工具，可以从 TypeScript 源代码中提取注释和类型信息，生成 HTML 或 Markdown 格式的文档。

## 文档生成流程

1. 在源代码中添加 JSDoc 注释
2. 运行 TypeDoc 生成文档
3. 查看生成的文档
4. 如果发现问题，修复源代码中的注释
5. 重新生成文档

## 添加 JSDoc 注释

在源代码中添加 JSDoc 注释，以便 TypeDoc 可以提取这些注释并生成文档。

### 函数注释

```typescript
/**
 * 获取所有产品
 * 
 * @param category 产品分类
 * @param query 搜索关键词
 * @returns 产品列表
 */
export async function getProducts(category?: string, query?: string): Promise<PrismaProduct[]> {
  // ...
}
```

### 接口注释

```typescript
/**
 * 产品模型接口
 */
export interface PrismaProduct {
  /**
   * 产品 ID
   */
  id: number;
  
  /**
   * 产品名称
   */
  name: string;
  
  /**
   * 产品价格
   */
  price: number;
  
  // ...
}
```

### 类注释

```typescript
/**
 * 产品服务类
 */
export class ProductService {
  /**
   * 创建产品
   * 
   * @param data 产品数据
   * @returns 创建的产品
   */
  async createProduct(data: CreateProductInput): Promise<PrismaProduct> {
    // ...
  }
  
  // ...
}
```

### 模块注释

```typescript
/**
 * 产品管理模块
 * 
 * @module 产品管理
 */

// 导入依赖
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
// ...
```

## 运行文档生成

### 生成文档

```bash
npm run docs
```

### 监视模式

```bash
npm run docs:watch
```

## 查看生成的文档

生成的文档位于 `docs/api` 目录下。

### HTML 文档

如果使用 HTML 主题，可以在浏览器中打开 `docs/api/index.html` 查看文档。

### Markdown 文档

如果使用 Markdown 主题，可以在 Markdown 查看器中打开 `docs/api/README.md` 查看文档。

## 文档结构

生成的文档包含以下内容：

- 模块列表
- 类列表
- 接口列表
- 函数列表
- 类型列表
- 变量列表

每个项目都包含详细的描述、参数、返回值、类型信息等。

## 最佳实践

### 1. 使用 JSDoc 标签

使用 JSDoc 标签来提供更多信息：

- `@param` - 参数描述
- `@returns` - 返回值描述
- `@throws` - 抛出的异常
- `@example` - 使用示例
- `@see` - 相关链接
- `@deprecated` - 已废弃的 API
- `@since` - API 添加的版本
- `@module` - 模块名称
- `@category` - 分类

### 2. 提供详细的描述

为每个 API 提供详细的描述，包括：

- 功能描述
- 使用场景
- 注意事项
- 限制条件
- 示例代码

### 3. 使用类型注解

使用 TypeScript 类型注解，确保 API 的类型信息正确：

```typescript
export async function getProducts(category?: string, query?: string): Promise<PrismaProduct[]> {
  // ...
}
```

### 4. 分类 API

使用 `@module` 和 `@category` 标签对 API 进行分类：

```typescript
/**
 * 获取所有产品
 * 
 * @module 产品管理
 * @category 查询
 */
export async function getProducts(category?: string, query?: string): Promise<PrismaProduct[]> {
  // ...
}
```

### 5. 提供示例代码

使用 `@example` 标签提供示例代码：

```typescript
/**
 * 获取所有产品
 * 
 * @example
 * ```typescript
 * const products = await getProducts('电子产品', '手机');
 * console.log(products);
 * ```
 */
export async function getProducts(category?: string, query?: string): Promise<PrismaProduct[]> {
  // ...
}
```

## 集成到 CI/CD 流程

将文档生成集成到 CI/CD 流程中，确保文档与代码保持同步：

```yaml
name: Generate API Documentation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  generate-docs:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate API documentation
      run: npm run docs

    - name: Deploy documentation
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs/api
```

## 故障排除

### 1. 文档不完整

如果生成的文档不完整，可能是因为：

- 源代码中缺少 JSDoc 注释
- TypeDoc 配置不正确
- 源代码中的类型信息不完整

解决方法：

1. 检查源代码中的 JSDoc 注释
2. 检查 TypeDoc 配置
3. 检查源代码中的类型信息

### 2. 文档生成失败

如果文档生成失败，可能是因为：

- TypeDoc 版本不兼容
- 源代码中的语法错误
- TypeDoc 配置错误

解决方法：

1. 检查 TypeDoc 版本
2. 检查源代码中的语法错误
3. 检查 TypeDoc 配置

### 3. 文档与代码不同步

如果文档与代码不同步，可能是因为：

- 忘记重新生成文档
- CI/CD 流程中的文档生成步骤失败
- 文档生成配置不正确

解决方法：

1. 手动重新生成文档
2. 检查 CI/CD 流程中的文档生成步骤
3. 检查文档生成配置
