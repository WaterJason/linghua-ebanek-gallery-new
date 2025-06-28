#!/bin/bash

# 0606ERP数据库一键恢复脚本
# 创建时间: $(date)

set -e

echo "🚀 开始恢复0606ERP数据库..."

# 配置变量
CONTAINER_NAME="0606erp"
DB_NAME="linghua_enamel_gallery"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_PORT="5432"
VOLUME_NAME="0606erp_postgres_data"
BACKUP_FILE="complete_backup.sql"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 错误: 备份文件 $BACKUP_FILE 不存在"
    echo "请确保在包含备份文件的目录中运行此脚本"
    exit 1
fi

# 停止本地PostgreSQL服务
echo "🛑 停止本地PostgreSQL服务..."
brew services stop postgresql@14 2>/dev/null || true
brew services stop postgresql@15 2>/dev/null || true

# 检查容器是否已存在
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  容器 $CONTAINER_NAME 已存在"
    read -p "是否删除现有容器并重新创建? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除现有容器..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
    else
        echo "❌ 取消恢复操作"
        exit 1
    fi
fi

# 创建新容器
echo "📦 创建新的PostgreSQL容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -e POSTGRES_USER=$DB_USER \
  -e POSTGRES_PASSWORD=$DB_PASSWORD \
  -e POSTGRES_DB=$DB_NAME \
  -p $DB_PORT:5432 \
  -v $VOLUME_NAME:/var/lib/postgresql/data \
  postgres:15

# 等待容器启动
echo "⏳ 等待数据库启动..."
sleep 10

# 检查容器状态
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ 错误: 容器启动失败"
    docker logs $CONTAINER_NAME
    exit 1
fi

# 等待数据库准备就绪
echo "🔍 等待数据库准备就绪..."
for i in {1..30}; do
    if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
        echo "✅ 数据库已准备就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 错误: 数据库启动超时"
        exit 1
    fi
    sleep 2
done

# 恢复数据库备份
echo "📥 恢复数据库备份..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份恢复成功"
else
    echo "❌ 错误: 数据库备份恢复失败"
    exit 1
fi

# 验证恢复结果
echo "🔍 验证恢复结果..."
TABLE_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ 验证成功: 发现 $TABLE_COUNT 个表"
    
    # 检查管理员用户
    USER_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"User\";" | tr -d ' ')
    echo "📊 用户数量: $USER_COUNT"
    
    # 检查角色
    ROLE_COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"Role\";" | tr -d ' ')
    echo "📊 角色数量: $ROLE_COUNT"
    
else
    echo "❌ 错误: 数据恢复验证失败"
    exit 1
fi

echo ""
echo "🎉 0606ERP数据库恢复完成!"
echo ""
echo "📋 连接信息:"
echo "   数据库地址: localhost:$DB_PORT"
echo "   数据库名: $DB_NAME"
echo "   用户名: $DB_USER"
echo "   密码: $DB_PASSWORD"
echo ""
echo "👤 管理员账户:"
echo "   邮箱: admin@linghua.com"
echo "   密码: Admin123456"
echo ""
echo "🚀 现在可以启动应用服务:"
echo "   npm run dev"
echo ""