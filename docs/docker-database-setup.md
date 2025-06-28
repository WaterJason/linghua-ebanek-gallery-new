# 聆花珐琅馆 Docker PostgreSQL 数据库配置指南

## 概述

本项目使用 Docker 容器运行 PostgreSQL 数据库。本文档提供完整的配置、部署和维护指南。

## 当前配置

### 容器信息
- **容器名称**: `linghua-postgres`
- **镜像**: `postgres:latest`
- **数据库名**: `linghua_enamel_gallery`
- **用户名**: `postgres`
- **密码**: `postgres`
- **端口映射**: `5432:5432`

### 环境变量配置
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linghua_enamel_gallery?schema=public"
NEXTAUTH_SECRET="linghua-enamel-gallery-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## Docker 命令参考

### 1. 创建并启动新容器
```bash
docker run -d \
  --name linghua-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=linghua_enamel_gallery \
  -p 5432:5432 \
  -v linghua_postgres_data:/var/lib/postgresql/data \
  postgres:latest
```

### 2. 启动现有容器
```bash
docker start linghua-postgres
```

### 3. 停止容器
```bash
docker stop linghua-postgres
```

### 4. 重启容器
```bash
docker restart linghua-postgres
```

### 5. 查看容器状态
```bash
docker ps -a | grep postgres
```

### 6. 查看容器日志
```bash
docker logs linghua-postgres
```

### 7. 进入容器执行 SQL
```bash
docker exec -it linghua-postgres psql -U postgres -d linghua_enamel_gallery
```

## 数据库维护

### 备份数据库
```bash
# 备份到文件
docker exec linghua-postgres pg_dump -U postgres linghua_enamel_gallery > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份到容器内
docker exec linghua-postgres pg_dump -U postgres linghua_enamel_gallery -f /tmp/backup.sql
```

### 恢复数据库
```bash
# 从文件恢复
docker exec -i linghua-postgres psql -U postgres linghua_enamel_gallery < backup.sql

# 从容器内文件恢复
docker exec linghua-postgres psql -U postgres linghua_enamel_gallery -f /tmp/backup.sql
```

### 重置数据库
```bash
# 删除并重新创建数据库
docker exec -it linghua-postgres psql -U postgres -c "DROP DATABASE IF EXISTS linghua_enamel_gallery;"
docker exec -it linghua-postgres psql -U postgres -c "CREATE DATABASE linghua_enamel_gallery;"
```

## Prisma 操作

### 生成客户端
```bash
npx prisma generate
```

### 推送架构到数据库
```bash
npx prisma db push
```

### 运行迁移
```bash
npx prisma migrate deploy
```

### 重置数据库（开发环境）
```bash
npx prisma migrate reset
```

### 查看数据库状态
```bash
npx prisma db pull
```

## 故障排除

### 1. 连接被拒绝
**问题**: `Error: P1010: User was denied access on the database`

**解决方案**:
1. 检查容器是否运行: `docker ps | grep linghua-postgres`
2. 检查本地 PostgreSQL 服务是否冲突: `brew services stop postgresql@15`
3. 验证环境变量配置
4. 重启容器: `docker restart linghua-postgres`

### 2. 端口冲突
**问题**: 端口 5432 已被占用

**解决方案**:
1. 停止本地 PostgreSQL: `brew services stop postgresql@15`
2. 或使用不同端口: `-p 5433:5432`
3. 相应更新 DATABASE_URL

### 3. 数据持久化问题
**问题**: 容器重启后数据丢失

**解决方案**:
1. 确保使用数据卷: `-v linghua_postgres_data:/var/lib/postgresql/data`
2. 检查数据卷: `docker volume ls`
3. 备份重要数据

### 4. 权限问题
**问题**: 无法访问特定表或执行操作

**解决方案**:
1. 检查用户权限: `docker exec -it linghua-postgres psql -U postgres -c "\du"`
2. 重新生成 Prisma 客户端: `npx prisma generate`
3. 推送架构: `npx prisma db push`

## 开发环境设置

### 快速启动脚本
创建 `scripts/start-database.sh`:
```bash
#!/bin/bash
echo "启动 PostgreSQL 数据库..."

# 停止本地 PostgreSQL 服务
brew services stop postgresql@15

# 启动 Docker 容器
docker start linghua-postgres

# 等待数据库启动
sleep 3

# 测试连接
npx prisma db push

echo "数据库启动完成！"
```

### 环境检查脚本
使用项目中的 `scripts/test-db-connection.js` 验证连接。

## 生产环境部署

### Docker Compose 配置
创建 `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: linghua-postgres-prod
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: linghua_enamel_gallery
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 安全建议
1. 使用强密码
2. 限制网络访问
3. 定期备份数据
4. 监控容器状态
5. 更新镜像版本

## 监控和日志

### 查看实时日志
```bash
docker logs -f linghua-postgres
```

### 监控容器资源
```bash
docker stats linghua-postgres
```

### 数据库连接监控
```bash
docker exec linghua-postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

---

**最后更新**: 2025-05-28
**维护者**: 聆花珐琅馆开发团队
