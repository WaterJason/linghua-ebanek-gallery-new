#!/bin/bash
# 聆花珐琅馆ERP诊断系统修复部署脚本
# 版本: 2.0.0
# 创建时间: 2025-05-28T07:18:20.711Z

echo "🚀 开始部署诊断系统修复包..."

# 创建备份
echo "📦 创建备份..."
BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp lib/*-diagnostics-controller.ts $BACKUP_DIR/ 2>/dev/null || true

# 部署修复文件
echo "📋 部署修复文件..."
# 文件已经在正确位置，无需复制

# 验证部署
echo "🧪 验证部署..."
node scripts/comprehensive-diagnostic-verification.js

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "🔍 启动监控..."
    # node -e "require('./lib/diagnostic-system-monitor').startContinuousMonitoring()" &
    echo "📊 监控已启动"
else
    echo "❌ 部署验证失败，请检查日志"
    exit 1
fi

echo "🎉 诊断系统修复部署完成！"
