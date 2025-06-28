# 增强操作系统使用指南

## 概述

增强操作系统是灵华文化ERP系统的核心用户体验增强组件，提供撤销/重做、操作反馈、进度指示器等功能，让用户操作更加安全、友好和高效。

## 核心功能

### 1. 撤销/重做功能 (Undo/Redo)

#### 功能特点
- 支持5-10步操作历史
- 本地存储持久化
- 跨会话保持历史记录
- 智能操作分组

#### 使用方法
```typescript
// 基本使用
const enhancedOps = useEnhancedOperations('moduleName')

// 创建操作（支持撤销）
await enhancedOps.create('资源名称').form(
  async () => await createAPI(data),
  null,                    // beforeData (创建操作为null)
  afterData,              // afterData
  { canUndo: true }       // 选项
)

// 更新操作（支持撤销）
await enhancedOps.update('资源名称').form(
  async () => await updateAPI(id, data),
  beforeData,             // 更新前的数据
  afterData,              // 更新后的数据
  { canUndo: true }
)

// 删除操作（支持撤销）
await enhancedOps.delete('资源名称').delete(
  async () => await deleteAPI(id),
  deletedData,            // 被删除的数据
  { requiresConfirmation: true }
)
```

#### 快捷键
- `Ctrl+Z` (Windows) / `Cmd+Z` (Mac): 撤销
- `Ctrl+Y` (Windows) / `Cmd+Shift+Z` (Mac): 重做

### 2. 操作反馈系统 (Operation Feedback)

#### 功能特点
- 即时Toast通知
- 统一错误处理
- 加载状态显示
- 操作结果确认

#### 自动反馈
系统会自动为以下操作提供反馈：
- ✅ 成功操作：绿色Toast通知
- ❌ 错误操作：红色Toast通知，包含错误详情
- ⏳ 进行中：加载指示器和状态文本
- ℹ️ 信息提示：蓝色Toast通知

#### 自定义反馈
```typescript
// 自定义成功消息
await enhancedOps.create('产品').form(
  async () => await createProduct(data),
  null,
  data,
  { 
    canUndo: true,
    successMessage: '产品创建成功！',
    errorMessage: '创建产品失败，请检查输入信息'
  }
)
```

### 3. 进度指示器 (Progress Indicators)

#### 功能特点
- 实时进度显示
- 可取消的长时间操作
- 后台任务监控
- 批量操作进度

#### 使用场景
```typescript
// 导出操作
await enhancedOps.export(
  '库存数据',
  async (updateProgress) => {
    updateProgress(20, '正在收集数据...')
    const data = await fetchData()
    
    updateProgress(60, '正在格式化...')
    const formatted = await formatData(data)
    
    updateProgress(80, '正在生成文件...')
    const file = await generateFile(formatted)
    
    updateProgress(100, '导出完成')
    return file
  }
)

// 批量操作
await enhancedOps.update('产品').batch(
  selectedItems,
  async (itemId, index, total) => {
    // 系统自动显示进度: "正在处理 3/10 个项目..."
    await updateProduct(itemId, newData)
  }
)
```

## 模块集成示例

### 库存管理模块

```typescript
import { useEnhancedOperations } from "@/lib/enhanced-operations"

export function InventoryForm() {
  const enhancedOps = useEnhancedOperations('inventory')
  
  const handleSave = async (data) => {
    await enhancedOps.create('库存记录').form(
      async () => await createInventory(data),
      null,
      data,
      { canUndo: true }
    )
  }
  
  const handleBatchUpdate = async (items) => {
    await enhancedOps.update('库存').batch(
      items,
      async (item, index) => {
        await updateInventoryItem(item.id, item.data)
      }
    )
  }
}
```

### 财务管理模块

```typescript
export function TransactionForm() {
  const enhancedOps = useEnhancedOperations('finance')
  
  const handleSubmit = async (values) => {
    const beforeData = isEditing ? originalData : null
    
    if (isEditing) {
      await enhancedOps.update('财务交易').form(
        async () => await updateTransaction(id, values),
        beforeData,
        values,
        { canUndo: true }
      )
    } else {
      await enhancedOps.create('财务交易').form(
        async () => await createTransaction(values),
        null,
        values,
        { canUndo: true }
      )
    }
  }
}
```

## 最佳实践

### 1. 模块命名规范
- 使用小写字母和连字符
- 反映模块的主要功能
- 保持简洁明了

```typescript
// ✅ 推荐
useEnhancedOperations('inventory')
useEnhancedOperations('finance')
useEnhancedOperations('production')

// ❌ 不推荐
useEnhancedOperations('InventoryManagement')
useEnhancedOperations('finance_module')
```

### 2. 操作命名规范
- 使用中文描述具体操作
- 包含操作对象
- 保持一致性

```typescript
// ✅ 推荐
enhancedOps.create('库存记录')
enhancedOps.update('产品信息')
enhancedOps.delete('员工档案')

// ❌ 不推荐
enhancedOps.create('record')
enhancedOps.update('data')
```

### 3. 数据结构规范
- beforeData: 操作前的完整数据状态
- afterData: 操作后的完整数据状态
- 确保数据结构一致性

```typescript
// ✅ 推荐
const beforeData = {
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category
}

const afterData = {
  id: product.id,
  name: newData.name,
  price: newData.price,
  category: newData.category
}
```

### 4. 错误处理
- 让增强操作系统处理错误
- 不要重复显示错误消息
- 记录详细错误信息用于调试

```typescript
// ✅ 推荐
try {
  await enhancedOps.create('产品').form(
    async () => await createProduct(data),
    null,
    data,
    { canUndo: true }
  )
} catch (error) {
  console.error("产品创建失败:", error)
  // 错误已由增强操作系统处理，无需额外处理
}

// ❌ 不推荐
try {
  await enhancedOps.create('产品').form(...)
} catch (error) {
  toast({
    title: "错误",
    description: "操作失败",
    variant: "destructive"
  })
}
```

## 故障排除

### 常见问题

#### 1. 撤销功能不工作
- 检查是否设置了 `canUndo: true`
- 确认 beforeData 和 afterData 格式正确
- 检查浏览器本地存储是否可用

#### 2. 进度指示器不显示
- 确认操作时间足够长（>500ms）
- 检查 updateProgress 函数调用
- 验证进度值在0-100范围内

#### 3. 操作反馈不一致
- 检查模块名称是否正确
- 确认使用了正确的操作类型
- 验证错误处理逻辑

### 调试技巧

#### 1. 启用调试模式
```typescript
// 在开发环境中启用详细日志
const enhancedOps = useEnhancedOperations('module', { debug: true })
```

#### 2. 检查操作历史
```typescript
// 查看当前模块的操作历史
console.log(enhancedOps.getHistory())
```

#### 3. 监控操作状态
```typescript
// 监听操作状态变化
enhancedOps.onStateChange((state) => {
  console.log('操作状态:', state)
})
```

## 维护指南

### 定期维护任务

1. **清理操作历史**: 定期清理过期的操作历史记录
2. **性能监控**: 监控操作响应时间和成功率
3. **用户反馈**: 收集用户对操作体验的反馈
4. **功能更新**: 根据业务需求更新和扩展功能

### 版本升级

在升级增强操作系统时，请注意：
- 检查API兼容性
- 测试现有集成功能
- 更新相关文档
- 通知用户新功能

通过遵循本指南，您可以充分利用增强操作系统的强大功能，为用户提供卓越的操作体验。
