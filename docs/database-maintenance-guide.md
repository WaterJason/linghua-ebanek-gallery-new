# 聆花珐琅馆数据库维护指南

## 概述

本文档提供数据库维护、监控和预防措施的标准化流程，确保数据库的稳定性和完整性。

## 🔍 定期检查清单

### 每日检查
- [ ] 数据库连接状态
- [ ] 备份任务执行状态
- [ ] 错误日志检查
- [ ] 性能监控

### 每周检查
- [ ] 数据完整性验证
- [ ] 外键约束检查
- [ ] 重复数据检查
- [ ] 存储空间使用情况

### 每月检查
- [ ] 全面数据库健康检查
- [ ] 备份文件验证
- [ ] 性能优化分析
- [ ] 安全审计

## 🛠️ 维护脚本

### 1. 数据库连接测试
```bash
node scripts/test-db-connection.js
```

### 2. 深度完整性检查
```bash
node scripts/deep-integrity-check.js
```

### 3. 创建完整备份
```bash
node scripts/create-database-backup.js
```

### 4. 历史问题分析
```bash
node scripts/database-history-analysis.js
```

### 5. 实时系统验证
```bash
node scripts/real-time-system-verification.js
```

### 6. 改进的系统诊断
```bash
node scripts/improved-system-diagnostics.js
```

### 7. 服务监控
```bash
# 一次性检查
node scripts/service-monitor.js

# 持续监控模式
node scripts/service-monitor.js --monitor
```

## 📋 标准操作程序

### 数据库配置变更
1. **变更前准备**
   - 创建完整备份
   - 记录当前配置
   - 准备回滚计划

2. **执行变更**
   - 停止应用服务
   - 执行配置变更
   - 验证连接

3. **变更后验证**
   - 运行完整性检查
   - 测试核心功能
   - 监控性能指标

### Prisma Schema 变更
1. **开发环境测试**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **生产环境部署**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **验证部署**
   ```bash
   node scripts/final-verification.js
   ```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 连接被拒绝 (P1010)
**症状**: `User was denied access on the database`

**排查步骤**:
1. 检查Docker容器状态
2. 验证环境变量配置
3. 检查端口冲突
4. 重启数据库服务

**解决方案**:
```bash
# 检查容器状态
docker ps | grep postgres

# 重启容器
docker restart linghua-postgres

# 验证连接
node scripts/test-db-connection.js
```

#### 2. 数据不一致
**症状**: 外键约束错误、重复数据

**排查步骤**:
1. 运行深度完整性检查
2. 分析错误日志
3. 检查数据关联

**解决方案**:
```bash
# 运行完整性检查
node scripts/deep-integrity-check.js

# 修复数据不一致
# (根据具体问题制定修复方案)
```

#### 3. 性能问题
**症状**: 查询缓慢、连接超时

**排查步骤**:
1. 检查数据库负载
2. 分析慢查询日志
3. 检查索引使用情况

**解决方案**:
```bash
# 查看数据库统计
docker exec linghua-postgres psql -U postgres -d linghua_enamel_gallery -c "SELECT * FROM pg_stat_activity;"

# 分析表大小
docker exec linghua-postgres psql -U postgres -d linghua_enamel_gallery -c "SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats;"
```

## 📊 监控指标

### 关键指标
- 连接数
- 查询响应时间
- 错误率
- 存储使用率
- 备份成功率

### 监控脚本
```bash
# 创建监控脚本
cat > scripts/monitor-database.js << 'EOF'
// 数据库监控脚本
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function monitorDatabase() {
  try {
    const start = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - start;

    console.log(`连接时间: ${connectionTime}ms`);

    // 检查各表记录数
    const counts = {
      users: await prisma.user.count(),
      employees: await prisma.employee.count(),
      customers: await prisma.customer.count(),
      orders: await prisma.order.count(),
    };

    console.log('表记录统计:', counts);

  } catch (error) {
    console.error('监控失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

monitorDatabase();
EOF
```

## 🔐 安全措施

### 访问控制
- 使用强密码
- 限制网络访问
- 定期更新凭据
- 审计访问日志

### 数据保护
- 定期备份
- 加密敏感数据
- 实施访问控制
- 监控异常活动

## 📈 性能优化

### 索引优化
```sql
-- 检查缺失的索引
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public';

-- 创建必要的索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_phone ON "Customer"(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_date ON "Order"(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_date ON "Schedule"(date);
```

### 查询优化
- 使用适当的索引
- 避免N+1查询
- 使用连接查询替代多次查询
- 实施查询缓存

## 🔄 备份策略

### 备份类型
1. **完整备份** (每日)
   - 包含所有数据和架构
   - 用于灾难恢复

2. **增量备份** (每小时)
   - 仅备份变更数据
   - 节省存储空间

3. **配置备份** (变更时)
   - Prisma schema
   - 环境变量
   - Docker配置

### 备份验证
```bash
# 验证备份文件完整性
node scripts/verify-backup.js

# 测试恢复流程
node scripts/test-restore.js
```

## 📝 变更日志

### 记录要求
- 变更时间
- 变更内容
- 执行人员
- 影响范围
- 回滚方案

### 变更模板
```markdown
## 变更记录 - YYYY-MM-DD

**变更类型**: [配置/架构/数据/性能]
**执行人员**: [姓名]
**变更时间**: [具体时间]

**变更内容**:
- 详细描述变更内容

**影响范围**:
- 受影响的表/功能

**验证结果**:
- 测试结果
- 性能影响

**回滚方案**:
- 如何回滚此变更
```

## 🎯 最佳实践

1. **始终备份**: 任何变更前都要创建备份
2. **测试优先**: 在开发环境充分测试
3. **监控告警**: 设置关键指标告警
4. **文档更新**: 及时更新维护文档
5. **定期审查**: 定期审查和优化流程

---

**最后更新**: 2025-05-28
**维护者**: 聆花珐琅馆开发团队
