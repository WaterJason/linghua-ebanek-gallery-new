#!/bin/bash

# 更新所有模块化文件中的导入路径
# 从 @/lib/prisma 改为 ../prisma

# 获取所有模块化文件
FILES=$(find lib/actions -name "*.ts")

# 遍历所有文件
for file in $FILES; do
  echo "Processing $file..."
  
  # 使用 sed 替换导入路径
  sed -i '' 's/import { prisma } from "@\/lib\/prisma";/import { prisma } from "..\/prisma";/g' "$file"
  
  # 检查是否有其他 @/lib 导入
  if grep -q "@/lib/" "$file"; then
    echo "Warning: $file still contains @/lib/ imports"
  fi
done

echo "Done!"
