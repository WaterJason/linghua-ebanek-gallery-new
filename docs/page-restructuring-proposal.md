# 聆花掐丝珐琅馆ERP系统 - 页面重构方案

基于对当前系统页面结构的分析，本文档提出了一套完整的页面重构方案，旨在提高系统的可用性、一致性和可维护性。

## 总体架构

我们建议将系统页面按照以下路由组结构进行组织：

1. **`(auth)`** - 认证相关页面
2. **`(dashboard)`** - 主要业务功能页面（带侧边栏导航）
3. **`(mobile)`** - 移动端优化页面
4. **`(no-sidebar)`** - 无侧边栏的全屏页面（如报表、详情页）
5. **`(admin)`** - 管理员专用页面

## 详细路由规划

### 1. 认证相关 `(auth)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/login` | 用户登录 | 已实现 |
| `/register` | 新用户注册 | 已实现 |
| `/forgot-password` | 忘记密码 | 已实现 |
| `/reset-password` | 重置密码 | 已实现 |
| `/unauthorized` | 未授权提示 | 已实现 |

### 2. 仪表盘与概览 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/` | 系统首页/仪表盘 | 已实现 |
| `/daily-log` | 日常数据录入 | 已实现 |
| `/notifications` | 通知中心 | 已实现 |

### 3. 人员管理 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/employees` | 员工列表 | 已实现 |
| `/employees/new` | 新增员工 | 待实现 |
| `/employees/[id]` | 员工详情 | 已实现 |
| `/employees/[id]/performance` | 员工绩效 | 已实现 |
| `/employees/[id]/salary` | 员工薪资详情 | 已实现 |
| `/schedule` | 排班管理 | 已实现 |
| `/salary` | 薪资管理 | 已实现 |
| `/salary/new` | 新增薪资记录 | 待实现 |
| `/salary/[id]` | 薪资记录详情 | 已实现 |

### 4. 商品与库存 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/products` | 产品列表 | 已实现 |
| `/products/new` | 新增产品 | 待实现 |
| `/products/[id]` | 产品详情 | 已实现 |
| `/products/categories` | 产品分类管理 | 待实现 |
| `/products/analytics` | 产品分析 | 已实现 |
| `/inventory` | 库存概览 | 已实现 |
| `/inventory/transactions` | 库存变动记录 | 待实现 |
| `/inventory/alerts` | 库存预警 | 待实现 |
| `/inventory/transfer` | 库存调拨 | 待实现 |
| `/purchase` | 采购订单列表 | 已实现 |
| `/purchase/new` | 新增采购订单 | 待实现 |
| `/purchase/[id]` | 采购订单详情 | 待实现 |
| `/purchase/suppliers` | 供应商管理 | 待实现 |
| `/production` | 制作管理 | 已实现 |
| `/production/new` | 新增制作任务 | 待实现 |
| `/production/[id]` | 制作任务详情 | 待实现 |
| `/workshop` | 手作团建列表 | 已实现 |
| `/workshop/new` | 新增团建活动 | 待实现 |
| `/workshop/[id]` | 团建活动详情 | 待实现 |

### 5. 销售与渠道 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/sales` | 销售订单列表 | 已实现 |
| `/sales/new` | 新增销售订单 | 待实现 |
| `/sales/[id]` | 销售订单详情 | 待实现 |
| `/sales/pos` | POS销售记录 | 已实现 |
| `/sales/pos/new` | 新增POS销售 | 待实现 |
| `/channels` | 渠道合作伙伴列表 | 已实现 |
| `/channels/new` | 新增渠道合作伙伴 | 待实现 |
| `/channels/[id]` | 渠道合作伙伴详情 | 待实现 |
| `/channels/inventory` | 渠道库存管理 | 待实现 |
| `/channels/pricing` | 渠道定价管理 | 待实现 |
| `/channels/settlements` | 渠道结算管理 | 待实现 |

### 6. 财务管理 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/finance` | 财务概览 | 已实现 |
| `/finance/accounts` | 资金账户管理 | 已实现 |
| `/finance/categories` | 收支分类管理 | 已实现 |
| `/finance/transactions` | 交易记录管理 | 已实现 |
| `/finance/transactions/new` | 新增交易记录 | 待实现 |
| `/finance/reports` | 财务报表 | 已实现 |

### 7. 报表 `(no-sidebar)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/reports` | 综合报表中心 | 已实现 |
| `/reports/sales` | 销售报表 | 待实现 |
| `/reports/inventory` | 库存报表 | 待实现 |
| `/reports/production` | 生产报表 | 待实现 |
| `/reports/finance` | 财务报表 | 待实现 |
| `/reports/employee` | 员工报表 | 待实现 |
| `/coffee-reports` | 咖啡店报表 | 已实现 |

### 8. 系统管理 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/settings` | 系统设置首页 | 已实现 |
| `/settings/backup` | 数据备份与恢复 | 已实现 |
| `/settings/logs` | 系统日志 | 已实现 |
| `/settings/parameters` | 系统参数配置 | 已实现 |
| `/settings/performance` | 性能监控 | 已实现 |
| `/settings/dictionaries` | 数据字典管理 | 已实现 |
| `/settings/dictionaries/[id]` | 数据字典详情 | 已实现 |

### 9. 账号与权限 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/accounts` | 账号管理 | 已实现 |
| `/accounts/new` | 新增账号 | 待实现 |
| `/accounts/[id]` | 账号详情 | 待实现 |
| `/accounts/profile` | 个人资料 | 已实现 |
| `/accounts/security` | 安全设置 | 已实现 |
| `/accounts/settings` | 账号设置 | 已实现 |
| `/permissions` | 权限管理 | 已实现 |
| `/permissions/roles` | 角色管理 | 待实现 |
| `/permissions/roles/[id]` | 角色详情 | 待实现 |

### 10. 工作流管理 `(dashboard)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/workflows` | 工作流列表 | 已实现 |
| `/workflows/new` | 新增工作流 | 待实现 |
| `/workflows/[id]` | 工作流详情 | 已实现 |
| `/workflows/approvals` | 审批管理 | 已实现 |
| `/workflows/instances/[id]` | 工作流实例详情 | 已实现 |
| `/workflows/my` | 我的工作流 | 已实现 |

### 11. 移动端页面 `(mobile)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/m` | 移动端首页 | 待实现 |
| `/m/products` | 移动端产品列表 | 待实现 |
| `/m/inventory` | 移动端库存管理 | 待实现 |
| `/m/sales` | 移动端销售管理 | 待实现 |
| `/m/pos` | 移动端POS销售 | 待实现 |
| `/m/profile` | 移动端个人资料 | 待实现 |

### 12. 管理员功能 `(admin)`

| 路径 | 功能描述 | 状态 |
|------|----------|------|
| `/admin/analytics` | 系统分析 | 已实现 |
| `/admin/monitoring` | 系统监控 | 已实现 |
| `/admin/users` | 用户管理 | 已实现 |
| `/admin/system` | 系统管理 | 待实现 |
| `/admin/database` | 数据库管理 | 待实现 |

## 导航栏结构优化

基于上述路由规划，我们建议对导航栏结构进行以下优化：

### 1. 保持当前的业务逻辑分组

- **概览**：仪表盘、数据录入
- **人员管理**：排班管理、员工管理、薪资管理
- **商品与库存**：产品管理、库存管理、采购管理、制作管理、手作团建管理
- **销售与渠道**：销售管理、POS销售记录、渠道管理
- **财务管理**：财务概览、资金账户、收支分类、交易记录、财务报表
- **报表**：综合报表、咖啡店报表
- **系统**：系统设置、账号管理、权限管理、工作流管理、数据备份

### 2. 优化子菜单结构

- 将相关功能合并到同一个主菜单项下，通过子菜单展示
- 减少导航层级，最多不超过两级
- 常用功能放在顶层，不常用功能放在子菜单

### 3. 移动端导航优化

- 使用底部导航栏，包含：首页、产品、销售、库存、我的
- 简化菜单结构，只保留核心功能
- 使用手势操作增强用户体验

## 实施建议

1. **分阶段实施**：
   - 第一阶段：路由组结构调整
   - 第二阶段：页面功能完善
   - 第三阶段：移动端适配

2. **兼容性考虑**：
   - 保留旧路径的重定向，确保现有链接不会失效
   - 使用路由中间件处理权限和重定向

3. **技术实现**：
   - 使用Next.js的路由组功能组织页面
   - 实现响应式设计，适应不同设备
   - 使用状态管理保持导航状态
