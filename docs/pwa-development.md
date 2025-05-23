# 聆华ERP移动端PWA开发文档

## 项目概述

聆华ERP移动端是一个基于渐进式Web应用(PWA)技术开发的移动端应用，旨在为用户提供随时随地访问ERP系统的能力。该应用采用现代化的前端技术栈，具有离线工作能力、响应式设计和接近原生应用的用户体验。

## 技术栈

- **前端框架**: Next.js 15.x
- **UI组件库**: 基于Tailwind CSS的自定义组件
- **PWA支持**: next-pwa
- **离线存储**: IndexedDB (通过idb库)
- **状态管理**: React Hooks + Context API
- **数据获取**: SWR + Server Actions
- **数据库**: PostgreSQL (通过Prisma ORM)

## 项目结构

```
/
├── app/
│   ├── (mobile)/                  # 移动端路由组
│   │   ├── layout.tsx             # 移动端布局
│   │   ├── page.tsx               # 移动端首页
│   │   ├── finance/               # 移动端财务管理
│   │   ├── inventory/             # 移动端库存管理
│   │   └── ...                    # 其他模块
│   └── manifest.ts                # PWA manifest配置
├── components/
│   ├── mobile/                    # 移动端专用组件
│   │   ├── layout/                # 移动端布局组件
│   │   ├── navigation/            # 移动端导航组件
│   │   └── ui/                    # 移动端UI组件
│   └── ...                        # 其他组件
├── hooks/
│   ├── use-offline.ts             # 离线状态检测钩子
│   └── ...                        # 其他钩子
├── lib/
│   ├── pwa/                       # PWA相关工具函数
│   │   ├── cache.ts               # 缓存策略
│   │   ├── sync.ts                # 数据同步逻辑
│   │   └── offline-db.ts          # 离线数据库管理
│   └── ...                        # 其他工具函数
├── public/
│   ├── icons/                     # PWA图标
│   └── ...                        # 其他静态资源
├── types/
│   └── pwa.d.ts                   # PWA相关类型声明
└── next.config.mjs                # Next.js配置(含PWA配置)
```

## 核心功能

### 1. PWA基础设施

- **Web App Manifest**: 定义应用图标、名称、启动URL等
- **Service Worker**: 实现资源缓存、离线访问和后台同步
- **安装提示**: 引导用户将应用添加到主屏幕

### 2. 离线功能

- **离线数据存储**: 使用IndexedDB存储关键数据
- **离线操作**: 支持在无网络环境下继续工作
- **数据同步**: 网络恢复后自动同步离线操作

### 3. 移动端UI

- **响应式设计**: 针对移动设备优化的界面
- **触控友好**: 大尺寸触控目标和手势操作
- **原生体验**: 模拟原生应用的交互和视觉效果

## 开发指南

### 安装依赖

```bash
npm install next-pwa workbox-window idb --legacy-peer-deps
```

### 配置PWA

在`next.config.mjs`中添加PWA配置：

```javascript
import withPWA from 'next-pwa';

const nextConfig = {
  // 其他配置...
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);

export default pwaConfig;
```

### 创建Web App Manifest

在`app/manifest.ts`中定义应用清单：

```typescript
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '聆华ERP',
    short_name: '聆华ERP',
    description: '聆华掐丝珐琅馆管理系统',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007aff',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      // 其他图标...
    ],
  }
}
```

### 使用离线存储

```typescript
import { addData, getData, getUnsyncedData } from '@/lib/pwa/offline-db';

// 存储数据
await addData('finance', {
  id: 'transaction-1',
  amount: 1000,
  type: 'income',
  description: '产品销售'
});

// 获取数据
const transaction = await getData('finance', 'transaction-1');

// 获取未同步的数据
const unsyncedData = await getUnsyncedData('finance');
```

### 数据同步

```typescript
import { syncData } from '@/lib/pwa/sync';
import useOffline from '@/hooks/use-offline';

// 在组件中使用
function MyComponent() {
  const { isOnline, needsSync, resetSyncState } = useOffline();
  
  useEffect(() => {
    if (needsSync()) {
      syncData().then(result => {
        if (result.success) {
          resetSyncState();
        }
      });
    }
  }, [isOnline, needsSync, resetSyncState]);
  
  // 组件内容...
}
```

## 最佳实践

### 1. 离线优先设计

- 默认假设用户处于离线状态
- 优先使用本地数据
- 在后台同步数据，不阻塞用户操作

### 2. 性能优化

- 使用适当的缓存策略
- 实现懒加载和代码分割
- 优化资源加载顺序

### 3. 用户体验

- 提供明确的离线状态指示
- 实现平滑的过渡和动画
- 支持触控手势和快捷操作

### 4. 安全性

- 敏感数据加密存储
- 实现安全的认证机制
- 提供远程数据擦除功能

## 测试

### 离线功能测试

1. 打开应用并浏览几个页面
2. 启用浏览器的网络离线模式
3. 尝试导航到已访问和未访问的页面
4. 尝试执行各种操作
5. 重新启用网络连接，验证数据同步

### 安装测试

1. 访问应用
2. 触发安装提示
3. 完成安装过程
4. 从主屏幕启动应用
5. 验证应用是否正常工作

## 部署

1. 构建应用：`npm run build`
2. 测试生产版本：`npm run start`
3. 部署到生产服务器

## 注意事项

- Service Worker只在HTTPS环境下工作
- 某些浏览器对PWA功能的支持可能有限
- 定期测试离线功能，确保其正常工作
- 监控Service Worker更新和缓存使用情况

## 未来计划

1. 添加推送通知功能
2. 实现更复杂的离线操作
3. 优化数据同步策略
4. 增强安全性措施
5. 改进用户界面和交互
