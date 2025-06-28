"use client"

import { ModernPageContainer } from "@/components/modern-page-container"
import { AccountMigrationManager } from "@/components/account-migration-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LinkIcon,
  UsersIcon,
  UserIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  RefreshCwIcon
} from "lucide-react"
import { useState } from "react"

export default function AccountMigrationPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <ModernPageContainer
      title="账号迁移管理"
      description="管理员工和用户账号的关联关系，处理未关联的账号"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 功能说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              功能说明
            </CardTitle>
            <CardDescription>
              账号迁移管理帮助您处理员工和用户账号之间的关联关系
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <UsersIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">未关联员工</div>
                  <div className="text-xs text-muted-foreground">
                    显示尚未关联用户账号的员工
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <UserIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">未关联用户</div>
                  <div className="text-xs text-muted-foreground">
                    显示尚未关联员工信息的用户
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <LinkIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">智能匹配</div>
                  <div className="text-xs text-muted-foreground">
                    基于姓名、邮箱等信息智能匹配
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>重要提示：</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• 关联操作会建立员工和用户账号的一对一关系</li>
                  <li>• 高置信度匹配建议通常准确性较高，可以批量操作</li>
                  <li>• 中低置信度匹配建议需要人工确认后再操作</li>
                  <li>• 关联后员工可以使用用户账号登录系统查看个人信息</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 操作指南 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              操作指南
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">1</Badge>
                  查看未关联账号
                </h4>
                <p className="text-sm text-muted-foreground">
                  系统会自动扫描并显示所有未关联的员工和用户账号，以及它们的基本信息。
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50">2</Badge>
                  查看智能匹配建议
                </h4>
                <p className="text-sm text-muted-foreground">
                  系统会根据姓名、邮箱、电话等信息提供智能匹配建议，并显示置信度评分。
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50">3</Badge>
                  选择要关联的账号
                </h4>
                <p className="text-sm text-muted-foreground">
                  可以单独选择特定的匹配建议，或者批量选择所有高置信度的匹配。
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50">4</Badge>
                  执行批量关联
                </h4>
                <p className="text-sm text-muted-foreground">
                  点击批量关联按钮，系统会自动处理所有选中的关联操作并显示结果。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账号迁移管理器 */}
        <AccountMigrationManager key={refreshKey} />
      </div>
    </ModernPageContainer>
  )
}
