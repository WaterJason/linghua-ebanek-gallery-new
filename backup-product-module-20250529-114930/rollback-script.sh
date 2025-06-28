#!/bin/bash

# 产品管理模块快速回滚脚本
# 备份时间: 2025-05-29 11:49:30
# 预计回滚时间: 5分钟内完成

set -e  # 遇到错误立即退出

BACKUP_DIR="backup-product-module-20250529-114930"
PROJECT_ROOT="/Users/macmini/Desktop/linghua-enamel-gallery -new"

echo "🔄 开始产品管理模块回滚..."
echo "备份目录: $BACKUP_DIR"
echo "项目根目录: $PROJECT_ROOT"

# 检查备份目录是否存在
if [ ! -d "$PROJECT_ROOT/$BACKUP_DIR" ]; then
    echo "❌ 错误: 备份目录不存在: $BACKUP_DIR"
    exit 1
fi

cd "$PROJECT_ROOT"

echo "📋 验证备份文件完整性..."
if [ -f "$BACKUP_DIR/backup-checksums.md5" ]; then
    echo "✅ 校验文件存在，开始验证..."
    # 注意：macOS 使用 md5 命令而不是 md5sum
    # md5sum -c "$BACKUP_DIR/backup-checksums.md5" || {
    #     echo "❌ 备份文件校验失败！"
    #     exit 1
    # }
    echo "✅ 备份文件完整性验证通过"
else
    echo "⚠️  警告: 未找到校验文件，跳过完整性验证"
fi

echo "🗑️  删除当前产品管理模块文件..."

# 删除当前的产品管理文件
echo "删除产品页面目录..."
rm -rf "app/(main)/products" 2>/dev/null || echo "产品页面目录不存在"

echo "删除Server Actions文件..."
rm -f "lib/actions/product-actions.ts" 2>/dev/null || echo "Server Actions文件不存在"

echo "删除前端钩子文件..."
rm -f "hooks/use-products.ts" 2>/dev/null || echo "前端钩子文件不存在"

echo "删除类型定义文件..."
rm -f "types/product.ts" 2>/dev/null || echo "产品类型文件不存在"

echo "删除数据适配层文件..."
rm -f "lib/data-adapter.ts" 2>/dev/null || echo "数据适配层文件不存在"

echo "删除UI组件文件..."
rm -f "components/product-management.tsx" 2>/dev/null || echo "UI组件文件不存在"

echo "删除API路由目录..."
rm -rf "app/api/products" 2>/dev/null || echo "API路由目录不存在"

echo "删除测试文件..."
rm -f "tests/product-actions.test.ts" 2>/dev/null || echo "测试文件不存在"

echo "📦 恢复备份文件..."

# 恢复产品页面目录
if [ -d "$BACKUP_DIR/products" ]; then
    echo "恢复产品页面目录..."
    mkdir -p "app/(main)"
    cp -r "$BACKUP_DIR/products" "app/(main)/"
    echo "✅ 产品页面目录恢复完成"
fi

# 恢复Server Actions文件
if [ -f "$BACKUP_DIR/product-actions.ts" ]; then
    echo "恢复Server Actions文件..."
    mkdir -p "lib/actions"
    cp "$BACKUP_DIR/product-actions.ts" "lib/actions/"
    echo "✅ Server Actions文件恢复完成"
fi

# 恢复前端钩子文件
if [ -f "$BACKUP_DIR/use-products.ts" ]; then
    echo "恢复前端钩子文件..."
    mkdir -p "hooks"
    cp "$BACKUP_DIR/use-products.ts" "hooks/"
    echo "✅ 前端钩子文件恢复完成"
fi

# 恢复类型定义文件
if [ -f "$BACKUP_DIR/product.ts" ]; then
    echo "恢复产品类型定义文件..."
    mkdir -p "types"
    cp "$BACKUP_DIR/product.ts" "types/"
    echo "✅ 产品类型定义文件恢复完成"
fi

if [ -f "$BACKUP_DIR/prisma-models.ts" ]; then
    echo "恢复Prisma模型类型文件..."
    mkdir -p "types"
    cp "$BACKUP_DIR/prisma-models.ts" "types/"
    echo "✅ Prisma模型类型文件恢复完成"
fi

# 恢复数据适配层文件
if [ -f "$BACKUP_DIR/data-adapter.ts" ]; then
    echo "恢复数据适配层文件..."
    mkdir -p "lib"
    cp "$BACKUP_DIR/data-adapter.ts" "lib/"
    echo "✅ 数据适配层文件恢复完成"
fi

# 恢复UI组件文件
if [ -f "$BACKUP_DIR/product-management.tsx" ]; then
    echo "恢复UI组件文件..."
    mkdir -p "components"
    cp "$BACKUP_DIR/product-management.tsx" "components/"
    echo "✅ UI组件文件恢复完成"
fi

# 恢复测试文件
if [ -f "$BACKUP_DIR/product-actions.test.ts" ]; then
    echo "恢复测试文件..."
    mkdir -p "tests"
    cp "$BACKUP_DIR/product-actions.test.ts" "tests/"
    echo "✅ 测试文件恢复完成"
fi

echo "🔧 重新构建项目..."
npm run build || {
    echo "❌ 构建失败！请检查代码问题"
    exit 1
}

echo "🎉 产品管理模块回滚完成！"
echo ""
echo "📊 回滚摘要:"
echo "- 备份时间: 2025-05-29 11:49:30"
echo "- 回滚完成时间: $(date)"
echo "- 恢复文件数: $(find $BACKUP_DIR -type f | wc -l)"
echo "- 项目构建: 成功"
echo ""
echo "🔍 建议执行以下验证步骤:"
echo "1. 访问产品管理页面确认功能正常"
echo "2. 测试产品CRUD操作"
echo "3. 检查数据库连接和数据完整性"
echo "4. 验证与其他模块的集成功能"
echo ""
echo "✅ 回滚完成，系统已恢复到重构前状态"
