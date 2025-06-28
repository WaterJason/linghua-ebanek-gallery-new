# 聆花掐丝珐琅馆管理系统

一个基于 Next.js 14 和 Prisma 构建的现代化ERP管理系统，专为聆花掐丝珐琅馆的业务需求设计。

## 🚀 项目特性

### 核心功能模块
- **用户管理** - 完整的用户认证、权限管理和角色分配
- **产品管理** - 产品信息、分类、库存管理
- **销售管理** - 订单处理、POS系统、渠道管理
- **生产管理** - 生产订单、工艺流程、质量控制
- **财务管理** - 收支记录、成本核算、财务报表
- **库存管理** - 双仓库管理、库存转移、自动化规则
- **采购管理** - 采购订单、供应商管理、Excel导入
- **员工管理** - 员工信息、排班管理、薪资计算
- **报表分析** - 多维度数据分析和可视化报表

### 技术特性
- **现代化架构** - Next.js 14 App Router + TypeScript
- **数据库** - Prisma ORM + PostgreSQL/MySQL
- **认证系统** - NextAuth.js 完整认证方案
- **UI组件** - Radix UI + Tailwind CSS + shadcn/ui
- **状态管理** - React Server Components + SWR
- **实时功能** - WebSocket 支持
- **移动端适配** - 响应式设计，支持PWA
- **性能优化** - 代码分割、懒加载、缓存策略

## 📦 技术栈

### 前端技术
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + CSS Modules
- **组件库**: Radix UI + shadcn/ui
- **状态管理**: SWR + React Context
- **表单处理**: React Hook Form + Zod
- **图表**: Recharts + ECharts
- **动画**: Framer Motion

### 后端技术
- **API**: Next.js API Routes
- **数据库**: Prisma ORM
- **认证**: NextAuth.js
- **文件上传**: 本地存储 + 云存储支持
- **任务队列**: 内置任务调度
- **缓存**: Redis (可选)

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **测试**: Vitest + Playwright
- **构建**: Next.js 内置构建系统
- **部署**: Vercel / Docker

## 🛠️ 安装和运行

### 环境要求
- Node.js 18.0+
- pnpm 8.0+
- PostgreSQL 或 MySQL

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd 0606linghua-enamel-gallery
```

2. **安装依赖**
```bash
pnpm install
```

3. **环境配置**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和其他环境变量
```

4. **数据库设置**
```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma db push

# (可选) 填充示例数据
pnpm prisma db seed
```

5. **启动开发服务器**
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建和部署

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 运行测试
pnpm test

# 运行E2E测试
pnpm test:e2e
```

## 📁 项目结构

```
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (main)/            # 主要业务页面
│   ├── api/               # API 路由
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # 基础UI组件
│   ├── auth/             # 认证组件
│   ├── dashboard/        # 仪表盘组件
│   └── ...               # 业务组件
├── lib/                  # 工具库和配置
│   ├── actions/          # Server Actions
│   ├── services/         # 业务服务
│   ├── utils.ts          # 工具函数
│   └── validation.ts     # 数据验证
├── prisma/               # 数据库配置
│   ├── schema.prisma     # 数据库模式
│   └── migrations/       # 数据库迁移
├── types/                # TypeScript 类型定义
├── public/               # 静态资源
└── archived-files/       # 归档文件
```

## 🔧 配置说明

### 环境变量

主要环境变量配置：

```env
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 文件上传
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Redis (可选)
REDIS_URL="redis://localhost:6379"
```

### 数据库配置

支持 PostgreSQL 和 MySQL，推荐使用 PostgreSQL：

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🎯 核心功能

### 用户认证和权限
- 基于角色的访问控制 (RBAC)
- 细粒度权限管理
- 会话管理和安全控制
- 多因素认证支持

### 产品管理
- 产品信息管理
- 分类和标签系统
- 库存跟踪
- 成本核算

### 销售系统
- 订单管理
- POS 销售
- 渠道管理
- 客户关系管理

### 生产管理
- 生产订单
- 工艺流程
- 质量控制
- 进度跟踪

### 财务管理
- 收支管理
- 成本分析
- 财务报表
- 预算控制

## 📊 性能优化

### 前端优化
- 代码分割和懒加载
- 图片优化和CDN
- 缓存策略
- 虚拟滚动

### 后端优化
- 数据库查询优化
- API响应缓存
- 批量操作
- 连接池管理

### 监控和诊断
- 性能监控
- 错误追踪
- 系统诊断
- 日志管理

## 🧪 测试

### 单元测试
```bash
pnpm test
```

### E2E测试
```bash
pnpm test:e2e
```

### 测试覆盖率
```bash
pnpm test:coverage
```

## 📝 开发指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 规则
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

### 提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 分支管理
- `main`: 主分支，用于生产环境
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支

## 🚀 部署

### Docker 部署
```bash
# 构建镜像
docker build -t linghua-erp .

# 运行容器
docker run -p 3000:3000 linghua-erp
```

### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 📞 支持和贡献

### 问题反馈
如果您遇到问题或有建议，请通过以下方式联系：
- 创建 GitHub Issue
- 发送邮件至项目维护者

### 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 🔄 更新日志

### v1.0.0 (2024-06-07)
- 初始版本发布
- 完整的ERP功能模块
- 现代化技术栈
- 移动端适配

---

**聆花掐丝珐琅馆管理系统** - 让传统工艺与现代技术完美结合
