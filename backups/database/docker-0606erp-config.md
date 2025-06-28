# 0606ERP Docker数据库配置备份

## 容器信息
- **容器名称**: 0606erp
- **镜像**: postgres:15
- **创建时间**: 2025-06-28
- **状态**: 运行中

## 数据库配置
- **数据库名**: linghua_enamel_gallery
- **用户名**: postgres
- **密码**: postgres
- **端口映射**: 5432:5432
- **数据卷**: 0606erp_postgres_data

## 容器创建命令
```bash
docker run -d \
  --name 0606erp \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=linghua_enamel_gallery \
  -p 5432:5432 \
  -v 0606erp_postgres_data:/var/lib/postgresql/data \
  postgres:15
```

## 数据卷信息
```bash
# 查看数据卷
docker volume inspect 0606erp_postgres_data

# 数据卷位置
/var/lib/docker/volumes/0606erp_postgres_data/_data
```

## 管理员账户
- **邮箱**: admin@linghua.com
- **密码**: Admin123456
- **角色**: 超级管理员
- **权限**: 所有系统权限

## 数据库表结构
- 总计93个表
- 包含完整的ERP系统功能模块
- 用户管理、产品管理、库存管理、财务管理等

## 恢复步骤
1. 创建Docker容器（使用上述命令）
2. 等待容器启动完成
3. 恢复数据库备份：
   ```bash
   docker exec -i 0606erp psql -U postgres linghua_enamel_gallery < complete_backup.sql
   ```
4. 验证数据恢复
5. 启动应用服务

## 环境变量配置
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linghua_enamel_gallery?schema=public"
NEXTAUTH_SECRET="linghua-enamel-gallery-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
AUTH_TRUST_HOST="true"
AUTH_SECRET="linghua-enamel-gallery-secret-key-2024"
```

## 备份创建时间
- 创建时间: $(date)
- 备份类型: 完整备份（结构+数据）
- 备份大小: 待确认

## 注意事项
1. 确保端口5432未被占用
2. 停止本地PostgreSQL服务
3. 数据卷名称必须匹配
4. 环境变量配置正确