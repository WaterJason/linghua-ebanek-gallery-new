#!/bin/bash

# 更新所有 API 路由文件中的认证方式
find ./app/api/finance -type f -name "*.ts" -exec sed -i '' 's/import { getServerSession } from "next-auth"/import { auth } from "@\/auth"/' {} \;
find ./app/api/finance -type f -name "*.ts" -exec sed -i '' 's/import { authOptions } from "@\/lib\/auth"//' {} \;
find ./app/api/finance -type f -name "*.ts" -exec sed -i '' 's/const session = await getServerSession(authOptions)/const session = await auth()/' {} \;

echo "所有 API 路由文件已更新完成！"
