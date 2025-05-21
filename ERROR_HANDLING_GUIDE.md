# 错误处理指南

本文档提供了聆花掐丝珐琅馆管理系统的错误处理最佳实践和常见问题解决方案。

## 目录

1. [常见错误类型](#常见错误类型)
2. [服务器端错误处理](#服务器端错误处理)
3. [客户端错误处理](#客户端错误处理)
4. [PrismaClient 相关错误](#prismaClient-相关错误)
5. [Next.js 服务器操作错误](#nextjs-服务器操作错误)
6. [认证相关错误](#认证相关错误)
7. [数据获取错误](#数据获取错误)
8. [错误监控与日志](#错误监控与日志)

## 常见错误类型

系统中常见的错误类型包括：

1. **PrismaClient 浏览器环境错误**：PrismaClient 不能在浏览器环境中运行
2. **Headers 上下文错误**：`headers()` 函数在非请求上下文中调用
3. **服务器操作函数未找到**：导入的服务器操作函数不存在
4. **数据获取失败**：从数据库或 API 获取数据失败

## 服务器端错误处理

### 服务器操作（Server Actions）

所有服务器操作文件必须在文件顶部添加 `"use server";` 指令，例如：

```typescript
"use server";

import prisma from "@/lib/db";
// 其他导入...

export async function getUsers() {
  try {
    // 操作代码...
  } catch (error) {
    // 错误处理...
  }
}
```

### 错误处理最佳实践

1. **使用统一的错误处理机制**：

```typescript
import { ErrorUtils } from "@/lib/error-utils";

try {
  // 操作代码...
} catch (error) {
  // 使用统一的错误处理机制
  const appError = await ErrorUtils.handleError(error, "module-name");
  throw appError;
}
```

2. **对于非关键操作，返回空结果而不是抛出错误**：

```typescript
try {
  // 操作代码...
} catch (error) {
  console.error("Error fetching data:", error);
  return []; // 返回空数组而不是抛出错误
}
```

## 客户端错误处理

### 组件中的错误处理

在 React 组件中获取数据时，应该使用 try-catch 块并提供用户友好的错误消息：

```typescript
async function loadData() {
  setIsLoading(true);
  try {
    const data = await fetchData();
    setData(data);
  } catch (error) {
    console.error("加载数据失败:", error);
    toast({
      title: "加载失败",
      description: "无法加载数据，请稍后再试",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
}
```

### 使用错误边界

在关键组件周围添加错误边界，防止整个应用崩溃：

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

## PrismaClient 相关错误

### 问题：PrismaClient 在浏览器环境中运行

错误消息：`PrismaClient is unable to run in this browser environment`

解决方案：

1. 确保 PrismaClient 只在服务器端使用：
   - 只在标记了 `"use server";` 的文件中使用
   - 不要在客户端组件中直接导入和使用 PrismaClient

2. 使用服务器操作函数封装所有数据库操作：

```typescript
// 在客户端组件中
import { getUsers } from "@/lib/actions/user-actions";

// 使用服务器操作函数
const users = await getUsers();
```

## Next.js 服务器操作错误

### 问题：headers() 在非请求上下文中调用

错误消息：`headers was called outside a request scope`

解决方案：

1. 确保 `headers()` 函数只在服务器组件或服务器操作中调用
2. 在可能的客户端环境中添加保护措施：

```typescript
if (typeof window === 'undefined') {
  // 只在服务器端执行的代码
  const headers = headers();
} else {
  // 客户端环境中的替代方案
}
```

## 认证相关错误

### 问题：认证模块加载失败

解决方案：

1. 确保 auth.ts 文件正确配置
2. 在获取当前用户时添加错误处理：

```typescript
export async function getCurrentUser() {
  try {
    // 获取用户代码...
  } catch (error) {
    console.error("获取当前用户失败:", error);
    return null; // 返回 null 而不是抛出错误
  }
}
```

## 数据获取错误

### 问题：获取数据失败

解决方案：

1. 对非关键数据，返回空结果而不是抛出错误：

```typescript
export async function getGallerySales() {
  try {
    // 获取数据代码...
  } catch (error) {
    console.error("Error fetching gallery sales:", error);
    return []; // 返回空数组
  }
}
```

2. 在客户端组件中添加错误处理和回退机制：

```typescript
const [data, setData] = useState([]);

useEffect(() => {
  async function loadData() {
    try {
      const result = await getData();
      setData(result || []); // 确保始终有有效值
    } catch (error) {
      console.error("加载数据失败:", error);
      setData([]); // 使用空数组作为回退
    }
  }
  
  loadData();
}, []);
```

## 错误监控与日志

系统使用以下机制进行错误监控和日志记录：

1. **服务器端日志**：使用 `ErrorUtils.handleError()` 记录错误
2. **客户端日志**：使用 `console.error()` 记录错误
3. **Sentry 集成**：使用 Sentry 监控生产环境错误

### 添加自定义错误日志

```typescript
import { createLog } from "@/lib/actions/system-actions";

try {
  // 操作代码...
} catch (error) {
  // 记录错误日志
  await createLog({
    module: "模块名称",
    level: "error",
    message: "操作失败",
    details: error instanceof Error ? error.message : String(error)
  });
  
  // 重新抛出或返回错误
}
```
