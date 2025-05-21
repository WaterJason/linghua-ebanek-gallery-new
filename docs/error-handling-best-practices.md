# 错误处理最佳实践指南

本文档提供了错误处理的最佳实践，帮助开发人员在系统中正确处理错误。

## 目录

1. [服务器端错误处理](#服务器端错误处理)
2. [客户端错误处理](#客户端错误处理)
3. [错误监控与告警](#错误监控与告警)
4. [错误日志记录](#错误日志记录)
5. [错误恢复策略](#错误恢复策略)
6. [用户体验优化](#用户体验优化)

## 服务器端错误处理

### 使用统一的错误处理机制

所有模块都应使用 `lib/error-handler.ts` 中定义的错误处理机制，确保错误处理的一致性。

```typescript
import { ErrorUtils } from '@/lib/error-utils';

export async function someFunction() {
  try {
    // 业务逻辑
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "module-name");
    throw appError;
  }
}
```

### 使用特定的错误类型

根据错误的性质，使用适当的错误类型，而不是通用的 `Error`。

```typescript
// 不推荐
throw new Error("产品不存在");

// 推荐
throw new ErrorUtils.NotFoundError("产品不存在", { productId }, "product-management");
```

### 提供详细的错误上下文

在抛出错误时，提供足够的上下文信息，帮助定位和解决问题。

```typescript
throw new ErrorUtils.ValidationError(
  "订单项缺少必要信息",
  { 
    providedFields: Object.keys(item),
    missingFields: ['productId', 'quantity', 'price'].filter(f => !item[f])
  },
  "order-management"
);
```

### 处理异步操作中的错误

在异步操作中，确保正确捕获和处理错误。

```typescript
// 使用 async/await
try {
  const result = await asyncOperation();
  return result;
} catch (error) {
  const appError = await ErrorUtils.handleError(error, "module-name");
  throw appError;
}

// 使用 Promise
asyncOperation()
  .then(result => {
    // 处理结果
  })
  .catch(async error => {
    const appError = await ErrorUtils.handleError(error, "module-name");
    // 处理错误
  });
```

### 在事务中处理错误

在数据库事务中，确保错误会导致事务回滚。

```typescript
try {
  await prisma.$transaction(async (tx) => {
    // 事务操作
    if (someCondition) {
      throw new ErrorUtils.BusinessLogicError("业务逻辑错误", { details }, "module-name");
    }
    // 更多事务操作
  });
} catch (error) {
  // 事务已自动回滚
  const appError = await ErrorUtils.handleError(error, "module-name");
  throw appError;
}
```

## 客户端错误处理

### 使用错误处理 Hook

在 React 组件中，使用 `useErrorHandler` Hook 处理错误。

```tsx
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const {
    error,
    isLoading,
    clearError,
    withRetryAndErrorHandling,
  } = useErrorHandler();
  
  // 使用错误处理包装器包装 API 调用
  const fetchData = withRetryAndErrorHandling(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  });
  
  // 组件渲染
  return (
    <div>
      {error && (
        <div className="error">
          {error.error.message}
          <button onClick={clearError}>清除错误</button>
        </div>
      )}
      <button onClick={fetchData} disabled={isLoading}>
        {isLoading ? '加载中...' : '获取数据'}
      </button>
    </div>
  );
}
```

### 处理表单验证错误

在表单提交时，正确处理验证错误。

```tsx
import { useForm } from 'react-hook-form';
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyForm() {
  const { register, handleSubmit, setError, formState: { errors } } = useForm();
  const { withErrorHandling } = useErrorHandler();
  
  const onSubmit = withErrorHandling(async (data) => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // 处理验证错误
      if (errorData.error.type === 'VALIDATION') {
        // 将后端验证错误映射到表单字段
        const validationErrors = errorData.error.details || {};
        Object.entries(validationErrors).forEach(([field, message]) => {
          setError(field, { type: 'server', message });
        });
        throw errorData;
      }
      
      throw errorData;
    }
    
    return response.json();
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 表单字段 */}
    </form>
  );
}
```

### 使用重试机制

对于可重试的错误，使用重试机制自动重试。

```tsx
import { useErrorHandler } from '@/hooks/use-error-handler';

function MyComponent() {
  const { withRetry } = useErrorHandler();
  
  // 使用重试机制包装 API 调用
  const fetchData = withRetry(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
  });
  
  // 组件渲染
}
```

## 错误监控与告警

### 使用 Sentry 捕获错误

在关键操作中，使用 Sentry 捕获错误。

```typescript
import { captureError, captureMessage } from '@/lib/monitoring/sentry';

try {
  // 关键操作
} catch (error) {
  // 捕获错误
  captureError(error, { context: 'critical-operation' });
  // 处理错误
}

// 记录重要事件
captureMessage('重要操作完成', 'info', { details: '操作详情' });
```

### 设置错误告警

对于关键错误，设置告警通知相关人员。

1. 在 Sentry 中配置告警规则
2. 设置告警通知渠道（邮件、Slack 等）
3. 定义告警触发条件（错误频率、错误类型等）

### 监控错误趋势

定期检查错误监控数据，识别常见错误和趋势。

1. 查看 Sentry 仪表板，了解错误分布
2. 分析错误趋势，识别问题模块
3. 优先修复高频错误和影响用户体验的错误

## 错误日志记录

### 记录详细的错误信息

在日志中记录详细的错误信息，帮助排查问题。

```typescript
try {
  // 业务逻辑
} catch (error) {
  // 记录错误日志
  console.error('操作失败:', {
    error,
    context: { userId, operationId, params },
    timestamp: new Date().toISOString(),
  });
  throw error;
}
```

### 使用结构化日志

使用结构化日志格式，便于日志分析和搜索。

```typescript
// 不推荐
console.error(`用户 ${userId} 执行操作 ${operationId} 失败: ${error.message}`);

// 推荐
console.error('操作失败', {
  userId,
  operationId,
  errorMessage: error.message,
  errorType: error.type,
  errorCode: error.code,
  timestamp: new Date().toISOString(),
});
```

### 避免记录敏感信息

在日志中避免记录敏感信息，如密码、令牌等。

```typescript
// 不推荐
console.error('登录失败', {
  username,
  password, // 不要记录密码
  error,
});

// 推荐
console.error('登录失败', {
  username,
  error,
});
```

## 错误恢复策略

### 实现幂等操作

设计幂等操作，确保重试不会导致数据不一致。

```typescript
// 使用唯一标识符确保幂等性
async function createOrder(orderData, idempotencyKey) {
  // 检查是否已处理过该请求
  const existingOrder = await prisma.order.findFirst({
    where: { idempotencyKey },
  });
  
  if (existingOrder) {
    return existingOrder; // 返回已存在的订单
  }
  
  // 创建新订单
  const order = await prisma.order.create({
    data: {
      ...orderData,
      idempotencyKey,
    },
  });
  
  return order;
}
```

### 实现补偿事务

对于无法回滚的操作，实现补偿事务。

```typescript
async function processPayment(orderId, amount) {
  try {
    // 1. 扣减账户余额
    await deductBalance(userId, amount);
    
    // 2. 更新订单状态
    await updateOrderStatus(orderId, 'paid');
  } catch (error) {
    // 如果更新订单状态失败，补偿事务：退还账户余额
    if (error.message.includes('updateOrderStatus')) {
      await refundBalance(userId, amount);
    }
    
    throw error;
  }
}
```

### 使用断路器模式

对于依赖外部服务的操作，使用断路器模式防止级联失败。

```typescript
import { CircuitBreaker } from 'opossum';

// 创建断路器
const breaker = new CircuitBreaker(callExternalService, {
  timeout: 3000, // 3秒超时
  resetTimeout: 30000, // 30秒后重置
  errorThresholdPercentage: 50, // 50%错误率触发断路器
});

// 使用断路器调用外部服务
breaker.fire(params)
  .then(result => {
    // 处理结果
  })
  .catch(error => {
    // 处理错误或使用备用方案
    if (breaker.status.isOpen) {
      // 断路器已打开，使用备用方案
      return fallbackService(params);
    }
    throw error;
  });
```

## 用户体验优化

### 提供用户友好的错误消息

向用户展示友好的错误消息，避免技术术语。

```tsx
import { getUserFriendlyErrorMessage } from '@/lib/client/error-handler';

function ErrorDisplay({ error }) {
  const message = getUserFriendlyErrorMessage(error);
  
  return (
    <div className="error-message">
      {message}
    </div>
  );
}
```

### 提供错误恢复建议

在错误消息中提供恢复建议，帮助用户解决问题。

```tsx
function ErrorWithSuggestion({ error }) {
  const message = getUserFriendlyErrorMessage(error);
  let suggestion = '';
  
  // 根据错误类型提供建议
  if (error.error.type === 'VALIDATION') {
    suggestion = '请检查输入数据是否正确，然后重试。';
  } else if (error.error.type === 'AUTHENTICATION') {
    suggestion = '请重新登录后再试。';
  } else if (error.error.type === 'NETWORK') {
    suggestion = '请检查网络连接后重试。';
  }
  
  return (
    <div className="error-message">
      <p>{message}</p>
      {suggestion && <p className="suggestion">{suggestion}</p>}
    </div>
  );
}
```

### 实现自动重试 UI

对于可重试的错误，提供自动重试或手动重试选项。

```tsx
function RetryableError({ error, onRetry, isRetrying }) {
  const { isRetryable } = useErrorHandler();
  const canRetry = isRetryable(error);
  
  return (
    <div className="error-message">
      <p>{getUserFriendlyErrorMessage(error)}</p>
      {canRetry && (
        <button onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? '重试中...' : '重试'}
        </button>
      )}
    </div>
  );
}
```

## 总结

遵循这些最佳实践，可以提高系统的可靠性和用户体验。关键点包括：

1. 使用统一的错误处理机制
2. 提供详细的错误上下文
3. 使用适当的错误类型
4. 实现错误监控和告警
5. 优化用户体验
6. 实现错误恢复策略

如有任何问题，请参考 [错误代码文档](./error-codes.md) 或联系系统管理员。
