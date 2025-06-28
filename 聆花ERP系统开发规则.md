# 聆花掐丝珐琅馆ERP系统开发规则

## 目录
1. [技术架构规则](#技术架构规则)
2. [业务逻辑规则](#业务逻辑规则)
3. [代码质量规则](#代码质量规则)
4. [团队协作规则](#团队协作规则)
5. [安全和性能规则](#安全和性能规则)
6. [测试和质量保证规则](#测试和质量保证规则)

---

## 技术架构规则

### 1. Next.js 15 + React 19 开发规范

#### 1.1 项目结构规范
```
/app
  /(auth)          # 认证相关页面
  /(main)          # 主要业务模块
  /(mobile)        # 移动端优化页面
  /api             # API路由
/components
  /ui              # 基础UI组件
  /forms           # 表单组件
  /layouts         # 布局组件
  /[module]        # 模块特定组件
/lib
  /actions         # Server Actions
  /hooks           # 自定义Hooks
  /utils           # 工具函数
  /services        # 服务层
  /types           # 类型定义
/prisma            # 数据库模型和迁移
```

#### 1.2 组件设计原则
- **单一职责原则**：每个组件只负责一个功能
- **组合优于继承**：使用组合模式构建复杂组件
- **Props接口明确**：使用TypeScript定义清晰的Props接口
- **状态最小化**：只在必要时使用状态，优先使用派生状态

```typescript
// ✅ 正确示例
interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function ProductCard({ product, onEdit, onDelete, showActions = true }: ProductCardProps) {
  // 组件实现
}

// ❌ 错误示例
export function ProductCard(props: any) {
  // 缺乏类型定义
}
```

#### 1.3 Server Actions 使用规范
- **文件组织**：所有Server Actions放在`lib/actions`目录
- **错误处理**：统一使用`AppError`类处理错误
- **数据验证**：使用Zod进行输入验证
- **事务处理**：涉及多表操作时使用Prisma事务

```typescript
// lib/actions/product-actions.ts
'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'

const createProductSchema = z.object({
  name: z.string().min(1, '产品名称不能为空'),
  price: z.number().positive('价格必须大于0'),
  categoryId: z.number().optional(),
})

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  try {
    const validatedData = createProductSchema.parse(data)
    
    return await prisma.product.create({
      data: validatedData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.badRequest('数据验证失败', error.errors)
    }
    throw AppError.internal('创建产品失败')
  }
}
```

### 2. Prisma ORM 数据库操作规范

#### 2.1 模型设计原则
- **命名规范**：使用PascalCase命名模型，camelCase命名字段
- **关系定义**：明确定义模型间关系，使用适当的级联删除
- **索引优化**：为常用查询字段添加索引
- **数据完整性**：使用约束确保数据完整性

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  categoryId  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  category    ProductCategory? @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  
  @@index([categoryId])
  @@index([name])
}
```

#### 2.2 查询优化规范
- **选择性查询**：只查询需要的字段
- **关联查询**：使用`include`或`select`避免N+1问题
- **分页处理**：大数据集使用`skip`和`take`分页
- **事务使用**：多表操作使用事务保证一致性

```typescript
// ✅ 正确示例
export async function getProductsWithCategory(page: number, limit: number) {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      category: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  })
}

// ❌ 错误示例
export async function getProducts() {
  return await prisma.product.findMany() // 查询所有字段和数据
}
```

#### 2.3 迁移管理规范
- **迁移命名**：使用描述性名称，格式：`YYYYMMDD_description`
- **向后兼容**：新字段设为可选，避免破坏现有数据
- **数据迁移**：复杂数据变更使用单独的迁移脚本
- **回滚计划**：每个迁移都要有回滚方案

### 3. API 设计规范

#### 3.1 RESTful API 设计原则
- **资源导向**：URL表示资源，HTTP方法表示操作
- **状态码规范**：正确使用HTTP状态码
- **响应格式**：统一的JSON响应格式
- **版本控制**：API版本控制策略

```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const products = await getProducts(page, limit)
    
    return Response.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: await getProductsCount()
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 3.2 错误处理规范
- **统一错误格式**：所有API使用统一的错误响应格式
- **错误分类**：区分客户端错误和服务器错误
- **错误日志**：记录详细的错误信息用于调试
- **用户友好**：向用户返回可理解的错误信息

```typescript
// lib/api/error-handler.ts
export function handleApiError(error: unknown): Response {
  logger.error('API错误', error as Error)
  
  if (error instanceof AppError) {
    return Response.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: error.statusCode })
  }
  
  return Response.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  }, { status: 500 })
}
```

---

## 业务逻辑规则

### 1. ERP 模块集成规范

#### 1.1 数据一致性保证
- **事务边界**：跨模块操作使用数据库事务
- **状态同步**：相关模块状态变更要同步更新
- **数据验证**：业务规则验证在服务层实现
- **审计追踪**：重要操作记录审计日志

```typescript
// 销售完成时的库存更新示例
export async function completeSale(saleId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. 更新销售状态
    const sale = await tx.order.update({
      where: { id: saleId },
      data: { status: 'completed' },
      include: { items: true }
    })
    
    // 2. 减少库存
    for (const item of sale.items) {
      await tx.inventoryItem.update({
        where: {
          warehouseId_productId: {
            warehouseId: 1, // 默认仓库
            productId: item.productId
          }
        },
        data: {
          quantity: { decrement: item.quantity }
        }
      })
      
      // 3. 记录库存交易
      await tx.inventoryTransaction.create({
        data: {
          type: 'sale_out',
          productId: item.productId,
          quantity: -item.quantity,
          referenceId: saleId,
          referenceType: 'sale'
        }
      })
    }
    
    return sale
  })
}
```

#### 1.2 业务流程规范
- **状态机模式**：复杂业务流程使用状态机管理
- **工作流引擎**：审批流程使用工作流引擎
- **事件驱动**：模块间通信使用事件驱动模式
- **补偿机制**：失败操作要有补偿机制

### 2. 权限控制规范

#### 2.1 基于角色的访问控制(RBAC)
- **角色定义**：明确定义系统角色和权限
- **权限粒度**：细化到功能级别的权限控制
- **动态权限**：支持运行时权限检查
- **权限继承**：支持角色权限继承

```typescript
// lib/auth/permissions.ts
export const PERMISSIONS = {
  PRODUCT: {
    VIEW: 'product:view',
    CREATE: 'product:create',
    UPDATE: 'product:update',
    DELETE: 'product:delete',
  },
  INVENTORY: {
    VIEW: 'inventory:view',
    TRANSFER: 'inventory:transfer',
    ADJUST: 'inventory:adjust',
  },
  // ... 其他权限
} as const

export async function checkPermission(userId: string, permission: string): Promise<boolean> {
  const userRoles = await getUserRoles(userId)
  const userPermissions = await getRolePermissions(userRoles)
  return userPermissions.includes(permission)
}
```

#### 2.2 数据级权限控制
- **行级安全**：基于用户角色的数据访问控制
- **字段级权限**：敏感字段的访问控制
- **部门隔离**：不同部门数据隔离
- **审计日志**：权限检查和数据访问记录

### 3. 库存管理规则

#### 3.1 库存操作规范
- **原子性操作**：库存变更使用事务保证原子性
- **并发控制**：使用乐观锁防止库存超卖
- **预警机制**：低库存自动预警
- **盘点流程**：定期库存盘点和调整

```typescript
// 库存转移操作
export async function transferInventory(
  sourceWarehouseId: number,
  targetWarehouseId: number,
  productId: number,
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // 检查源仓库库存
    const sourceInventory = await tx.inventoryItem.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: sourceWarehouseId,
          productId
        }
      }
    })
    
    if (!sourceInventory || sourceInventory.quantity < quantity) {
      throw AppError.badRequest('库存不足')
    }
    
    // 减少源仓库库存
    await tx.inventoryItem.update({
      where: {
        warehouseId_productId: {
          warehouseId: sourceWarehouseId,
          productId
        }
      },
      data: { quantity: { decrement: quantity } }
    })
    
    // 增加目标仓库库存
    await tx.inventoryItem.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: targetWarehouseId,
          productId
        }
      },
      update: { quantity: { increment: quantity } },
      create: {
        warehouseId: targetWarehouseId,
        productId,
        quantity
      }
    })
    
    // 记录转移交易
    await tx.inventoryTransaction.create({
      data: {
        type: 'transfer',
        sourceWarehouseId,
        targetWarehouseId,
        productId,
        quantity,
        notes: `从仓库${sourceWarehouseId}转移到仓库${targetWarehouseId}`
      }
    })
  })
}
```

---

## 代码质量规则

### 1. TypeScript 编码规范

#### 1.1 类型定义规范
- **严格模式**：启用TypeScript严格模式
- **类型导出**：公共类型统一导出
- **泛型使用**：合理使用泛型提高代码复用性
- **类型守卫**：使用类型守卫确保类型安全

```typescript
// types/product.ts
export interface Product {
  id: number
  name: string
  price: number
  categoryId?: number
  category?: ProductCategory
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductRequest {
  name: string
  price: number
  categoryId?: number
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number
}

// 类型守卫示例
export function isProduct(obj: unknown): obj is Product {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'price' in obj
  )
}
```

#### 1.2 接口设计规范
- **接口命名**：使用描述性名称，以I开头或以Interface结尾
- **接口组合**：使用接口组合而非继承
- **可选属性**：合理使用可选属性
- **只读属性**：不可变数据使用readonly

```typescript
// ✅ 正确示例
interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: {
    readonly code: string
    readonly message: string
    readonly details?: unknown
  }
  readonly pagination?: {
    readonly page: number
    readonly limit: number
    readonly total: number
  }
}

// 使用泛型和组合
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
  }
}
```

### 2. 代码组织规范

#### 2.1 文件和目录命名
- **文件命名**：使用kebab-case命名文件
- **组件文件**：React组件使用PascalCase
- **工具函数**：工具函数文件使用camelCase
- **常量文件**：常量文件使用UPPER_SNAKE_CASE

```
components/
  ui/
    button.tsx
    input.tsx
    data-table.tsx
  forms/
    ProductForm.tsx
    CustomerForm.tsx
lib/
  utils/
    formatters.ts
    validators.ts
  constants/
    API_ENDPOINTS.ts
    ERROR_CODES.ts
```

#### 2.2 导入导出规范
- **命名导出**：优先使用命名导出
- **默认导出**：只在组件和页面使用默认导出
- **导入顺序**：按照第三方库、内部模块、相对路径的顺序
- **路径别名**：使用路径别名简化导入

```typescript
// ✅ 正确的导入顺序
import React from 'react'
import { NextPage } from 'next'
import { Button } from '@radix-ui/react-button'

import { ProductService } from '@/lib/services/product-service'
import { formatCurrency } from '@/lib/utils/formatters'
import { Product } from '@/types/product'

import { ProductCard } from './product-card'
import './styles.css'
```

### 3. 代码注释规范

#### 3.1 注释原则
- **代码自解释**：优先编写自解释的代码
- **必要注释**：复杂业务逻辑必须添加注释
- **JSDoc规范**：公共函数使用JSDoc注释
- **TODO标记**：临时代码使用TODO标记

```typescript
/**
 * 计算产品的最终价格，包含折扣和税费
 * @param product 产品信息
 * @param discount 折扣率 (0-1)
 * @param taxRate 税率 (0-1)
 * @returns 最终价格
 */
export function calculateFinalPrice(
  product: Product,
  discount: number = 0,
  taxRate: number = 0
): number {
  // 应用折扣
  const discountedPrice = product.price * (1 - discount)
  
  // 计算税费
  const finalPrice = discountedPrice * (1 + taxRate)
  
  return Math.round(finalPrice * 100) / 100 // 保留两位小数
}
```

---

## 团队协作规则

### 1. 敏捷开发流程

#### 1.1 Sprint 规划
- **Sprint 周期**：2周一个Sprint
- **Story Points**：使用斐波那契数列估算
- **Definition of Done**：明确完成标准
- **Sprint 目标**：每个Sprint有明确目标

#### 1.2 每日站会
- **时间控制**：15分钟内完成
- **三个问题**：昨天做了什么、今天计划做什么、遇到什么阻碍
- **问题跟进**：会后解决具体问题
- **状态更新**：及时更新任务状态

#### 1.3 Sprint 回顾
- **Demo演示**：向利益相关者演示完成功能
- **回顾总结**：总结Sprint中的经验教训
- **改进计划**：制定下个Sprint的改进计划
- **指标跟踪**：跟踪团队效率指标

### 2. 代码审查规范

#### 2.1 Pull Request 规范
- **PR大小**：单个PR不超过500行代码
- **描述清晰**：详细描述变更内容和原因
- **测试覆盖**：包含相应的测试用例
- **文档更新**：必要时更新相关文档

```markdown
## PR 模板

### 变更类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 重构
- [ ] 文档更新
- [ ] 性能优化

### 变更描述
简要描述本次变更的内容和目的

### 测试说明
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成

### 检查清单
- [ ] 代码符合编码规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 无安全漏洞
```

#### 2.2 代码审查标准
- **功能正确性**：代码是否实现了预期功能
- **代码质量**：是否符合编码规范和最佳实践
- **性能考虑**：是否存在性能问题
- **安全性**：是否存在安全漏洞
- **可维护性**：代码是否易于理解和维护

### 3. 版本控制规范

#### 3.1 Git 工作流
- **主分支保护**：main分支受保护，只能通过PR合并
- **功能分支**：每个功能使用独立分支开发
- **分支命名**：feature/功能名、bugfix/问题描述、hotfix/紧急修复
- **提交信息**：使用约定式提交格式

```bash
# 分支命名示例
feature/product-management
bugfix/inventory-calculation-error
hotfix/security-vulnerability

# 提交信息格式
feat(product): 添加产品批量导入功能
fix(inventory): 修复库存计算错误
docs(api): 更新API文档
refactor(auth): 重构认证模块
test(product): 添加产品服务单元测试
```

#### 3.2 发布流程
- **版本号规范**：使用语义化版本号(SemVer)
- **发布分支**：从main分支创建release分支
- **变更日志**：自动生成变更日志
- **回滚计划**：每次发布都有回滚计划

### 4. 文档管理规范

#### 4.1 文档类型
- **API文档**：使用OpenAPI规范
- **组件文档**：使用Storybook
- **业务文档**：业务流程和需求文档
- **技术文档**：架构设计和技术决策文档

#### 4.2 文档维护
- **同步更新**：代码变更时同步更新文档
- **版本控制**：文档纳入版本控制
- **定期审查**：定期审查文档的准确性和完整性
- **知识分享**：定期进行技术分享和知识传递

---

## 安全和性能规则

### 1. 安全规范

#### 1.1 认证和授权
- **JWT令牌**：使用JWT进行身份认证
- **令牌刷新**：实现令牌自动刷新机制
- **会话管理**：安全的会话管理
- **密码策略**：强密码策略和密码加密

```typescript
// lib/auth/security.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h',
    issuer: 'linghua-erp',
    audience: 'linghua-users'
  })
}
```

#### 1.2 数据保护
- **输入验证**：所有用户输入都要验证
- **SQL注入防护**：使用参数化查询
- **XSS防护**：输出编码和CSP策略
- **CSRF防护**：使用CSRF令牌

#### 1.3 敏感数据处理
- **数据加密**：敏感数据加密存储
- **日志脱敏**：日志中不记录敏感信息
- **访问控制**：严格控制敏感数据访问
- **数据备份**：定期备份重要数据

### 2. 性能优化规范

#### 2.1 前端性能优化
- **代码分割**：按路由和组件分割代码
- **懒加载**：图片和组件懒加载
- **缓存策略**：合理使用浏览器缓存
- **资源压缩**：压缩CSS、JS和图片资源

```typescript
// 组件懒加载示例
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const ProductManagement = lazy(() => import('@/components/product/product-management'))

export function ProductPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductManagement />
    </Suspense>
  )
}
```

#### 2.2 后端性能优化
- **数据库优化**：查询优化和索引优化
- **缓存策略**：Redis缓存热点数据
- **连接池**：数据库连接池管理
- **异步处理**：耗时操作异步处理

#### 2.3 监控和分析
- **性能监控**：实时监控应用性能
- **错误追踪**：使用Sentry追踪错误
- **日志分析**：结构化日志和分析
- **用户体验监控**：监控用户体验指标

---

## 测试和质量保证规则

### 1. 测试策略

#### 1.1 测试金字塔
- **单元测试**：70% - 测试单个函数和组件
- **集成测试**：20% - 测试模块间集成
- **端到端测试**：10% - 测试完整用户流程

#### 1.2 测试覆盖率要求
- **代码覆盖率**：最低80%
- **分支覆盖率**：最低70%
- **关键路径**：100%覆盖
- **边界条件**：充分测试边界条件

```typescript
// __tests__/services/product-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProductService } from '@/lib/services/product-service'
import { AppError } from '@/lib/errors'

describe('ProductService', () => {
  let productService: ProductService
  
  beforeEach(() => {
    productService = new ProductService()
  })
  
  describe('createProduct', () => {
    it('应该成功创建产品', async () => {
      const productData = {
        name: '测试产品',
        price: 100,
        categoryId: 1
      }
      
      const result = await productService.createProduct(productData)
      
      expect(result).toMatchObject({
        name: '测试产品',
        price: 100,
        categoryId: 1
      })
      expect(result.id).toBeDefined()
    })
    
    it('当产品名称为空时应该抛出错误', async () => {
      const productData = {
        name: '',
        price: 100
      }
      
      await expect(productService.createProduct(productData))
        .rejects
        .toThrow(AppError)
    })
  })
})
```

### 2. 质量保证流程

#### 2.1 持续集成
- **自动化测试**：每次提交自动运行测试
- **代码质量检查**：ESLint、Prettier、TypeScript检查
- **安全扫描**：自动化安全漏洞扫描
- **构建验证**：确保代码能够成功构建

#### 2.2 部署前检查
- **功能测试**：完整的功能测试
- **性能测试**：关键功能性能测试
- **安全测试**：安全漏洞扫描
- **兼容性测试**：浏览器兼容性测试

### 3. 错误处理和监控

#### 3.1 错误处理策略
- **统一错误处理**：全局错误处理机制
- **错误分类**：按严重程度分类错误
- **用户友好**：向用户显示友好的错误信息
- **错误恢复**：提供错误恢复机制

#### 3.2 监控和告警
- **实时监控**：实时监控系统状态
- **性能指标**：监控关键性能指标
- **错误告警**：错误发生时及时告警
- **日志分析**：定期分析日志发现问题

---

## 规则执行和维护

### 1. 规则执行
- **代码审查**：通过代码审查确保规则执行
- **自动化检查**：使用工具自动检查规则遵循情况
- **培训教育**：定期进行规则培训
- **持续改进**：根据实践经验持续改进规则

### 2. 规则更新
- **版本控制**：规则文档纳入版本控制
- **变更流程**：规则变更要经过团队讨论和批准
- **通知机制**：规则更新要及时通知团队成员
- **文档维护**：保持规则文档的准确性和完整性

### 3. 违规处理
- **问题识别**：及时识别规则违规问题
- **原因分析**：分析违规原因
- **改进措施**：制定改进措施
- **跟踪验证**：跟踪改进效果

---

## 附录

### A. 工具配置

#### A.1 ESLint 配置
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### A.2 Prettier 配置
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### A.3 TypeScript 配置
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### B. 检查清单

#### B.1 代码提交检查清单
- [ ] 代码符合编码规范
- [ ] 通过所有测试
- [ ] 添加必要的注释
- [ ] 更新相关文档
- [ ] 通过代码审查

#### B.2 发布前检查清单
- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 安全测试通过
- [ ] 文档已更新
- [ ] 回滚计划已准备

---

*本文档是聆花掐丝珐琅馆ERP系统开发的指导性文档，所有团队成员都应该遵循这些规则。如有疑问或建议，请及时与团队讨论。* 