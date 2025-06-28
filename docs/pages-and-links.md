# 聆花掐丝珐琅馆ERP系统 - 页面与链接结构

本文档整理了聆花掐丝珐琅馆ERP系统的所有页面和链接结构，用于系统重新规划和优化。

## 导航栏结构

当前系统的导航栏结构按照业务逻辑分组，包含以下模块：

### 1. 概览
- **仪表盘** - `/` - 系统首页，显示关键业务指标
- **数据录入** - `/daily-log` - 日常数据录入页面

### 2. 人员管理
- **排班管理** - `/schedule` - 员工排班管理
- **员工管理** - `/employees` - 员工信息管理
- **薪资管理** - `/salary` - 员工薪资管理

### 3. 商品与库存
- **产品管理** - `/products` - 产品信息管理
- **库存管理** - `/inventory` - 库存状态管理
- **采购管理** - `/purchase` - 采购订单管理
- **制作管理** - `/production` - 产品制作管理
- **手作团建管理** - `/workshop` - 团建活动管理

### 4. 销售与渠道
- **销售管理** - `/sales` - 销售订单管理
- **POS销售记录** - `/sales/pos` - POS销售记录
- **渠道管理** - `/channels` - 渠道合作伙伴管理
- **财务管理** - `/finance` - 财务数据管理

### 5. 报表
- **咖啡店报表** - `/coffee-reports` - 咖啡店销售报表
- **咖啡店数据录入** - `/daily-log?tab=coffee` - 咖啡店数据录入
- **综合报表** - `/reports` - 系统综合报表

### 6. 系统
- **系统设置** - `/settings` - 系统参数设置
- **账号管理** - `/accounts` - 用户账号管理
- **权限管理** - `/permissions` - 用户权限管理
- **数据备份** - `/settings/backup` - 系统数据备份

## 详细页面结构

### 认证相关页面
- `/login` - 登录页面
- `/register` - 注册页面
- `/forgot-password` - 忘记密码页面
- `/reset-password` - 重置密码页面
- `/unauthorized` - 未授权页面

### 仪表盘与首页
- `/` - 系统首页/仪表盘
- `/legacy-dashboard` - 旧版仪表盘

### 数据录入
- `/daily-log` - 日常数据录入
  - 支持通过查询参数 `?tab=coffee` 切换到咖啡店数据录入

### 人员管理
- `/employees` - 员工列表页面
- `/employees/[id]` - 员工详情页面
- `/employees/[id]/performance` - 员工绩效页面
- `/employees/[id]/salary` - 员工薪资详情页面
- `/schedule` - 排班管理页面
- `/salary` - 薪资管理页面
- `/salary/[id]` - 薪资记录详情页面
- `/payroll` - 工资单页面

### 商品与库存
- `/products` - 产品列表页面
- `/products/[id]` - 产品详情页面
- `/products/analytics` - 产品分析页面
- `/inventory` - 库存管理页面
- `/purchase` - 采购管理页面
- `/production` - 制作管理页面
- `/workshop` - 手作团建管理页面

### 销售与渠道
- `/sales` - 销售订单管理页面
- `/sales/pos` - POS销售记录页面
- `/channels` - 渠道管理页面
- `/finance` - 财务管理页面
  - `/finance/accounts` - 资金账户管理
  - `/finance/categories` - 收支分类管理
  - `/finance/transactions` - 交易记录管理
  - `/finance/reports` - 财务报表

### 报表
- `/coffee-reports` - 咖啡店报表页面
- `/reports` - 综合报表页面

### 系统管理
- `/settings` - 系统设置页面
- `/settings/backup` - 数据备份页面
- `/settings/logs` - 系统日志页面
- `/settings/parameters` - 系统参数页面
- `/settings/performance` - 性能监控页面
- `/settings/roles` - 角色管理页面
- `/settings/users` - 用户管理页面
- `/accounts` - 账号管理页面
- `/accounts/profile` - 个人资料页面
- `/accounts/security` - 安全设置页面
- `/accounts/settings` - 账号设置页面
- `/permissions` - 权限管理页面

### 工作流管理
- `/workflows` - 工作流列表页面
- `/workflows/[id]` - 工作流详情页面
- `/workflows/approvals` - 审批管理页面
- `/workflows/instances/[id]` - 工作流实例详情页面
- `/workflows/my` - 我的工作流页面

### 通知与消息
- `/notifications` - 通知中心页面
- `/legacy-notifications` - 旧版通知页面

### 管理员功能
- `/admin/analytics` - 管理员分析页面
- `/admin/monitoring` - 系统监控页面
- `/admin/users` - 用户管理页面

### 测试页面
- `/test/advanced-search` - 高级搜索测试页面
- `/test/image-upload` - 图片上传测试页面
- `/test/product-export` - 产品导出测试页面
- `/test/product-management` - 产品管理测试页面
- `/test/product-tags` - 产品标签测试页面
- `/test/products` - 产品测试页面

### 其他页面
- `/todos` - 待办事项列表页面
- `/todos/new` - 新建待办事项页面
- `/users` - 用户列表页面
- `/account` - 账户页面

## 路由组结构

系统使用Next.js的路由组功能组织页面结构：

- `(auth)` - 认证相关页面
- `(dashboard)` - 仪表盘相关页面
- `(mobile)` - 移动版页面（计划中）

## 建议优化方向

1. **路由结构优化**：
   - 统一使用路由组组织相关页面
   - 移除重复的页面路径（如 `/settings/roles` 和 `/settings/users` 与 `/roles` 和 `/users`）
   - 规范化API路由

2. **导航结构优化**：
   - 保持当前的业务逻辑分组
   - 优化子菜单结构，减少导航层级
   - 为移动版设计专用导航结构

3. **页面整合**：
   - 整合测试页面到正式功能
   - 移除旧版页面（legacy）
   - 统一相似功能的页面（如各种设置页面）

4. **权限控制**：
   - 为所有页面设置明确的权限要求
   - 实现基于角色的访问控制
