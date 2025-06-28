"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { initializePermissions, checkPermissionSystemStatus } from "@/lib/actions/permission-init"

export default function InitPermissionsPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initResult, setInitResult] = useState<any>(null)

  const checkStatus = async () => {
    try {
      setLoading(true)
      const result = await checkPermissionSystemStatus()
      setStatus(result)
    } catch (error) {
      console.error("检查状态失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const runInitialization = async () => {
    try {
      setLoading(true)
      const result = await initializePermissions()
      setInitResult(result)
      // 重新检查状态
      await checkStatus()
    } catch (error) {
      console.error("初始化失败:", error)
      setInitResult({
        success: false,
        message: error instanceof Error ? error.message : "初始化失败"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">权限系统初始化</h1>
        <p className="text-muted-foreground mt-2">
          检查和初始化系统权限配置
        </p>
      </div>

      {/* 状态检查 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCwIcon className="h-5 w-5" />
            系统状态检查
          </CardTitle>
          <CardDescription>
            检查当前权限系统的配置状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkStatus} disabled={loading}>
            {loading ? "检查中..." : "检查状态"}
          </Button>

          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">权限数量</div>
                <div className="text-2xl font-bold">{status.permissions}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">角色数量</div>
                <div className="text-2xl font-bold">{status.roles}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">用户角色关联</div>
                <div className="text-2xl font-bold">{status.userRoles}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">初始化状态</div>
                <div className="flex items-center gap-2 mt-1">
                  {status.isInitialized ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <Badge variant="default">已初始化</Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="h-5 w-5 text-orange-500" />
                      <Badge variant="secondary">未初始化</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 初始化操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            权限系统初始化
          </CardTitle>
          <CardDescription>
            创建基本的角色和权限配置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800">初始化内容</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• 创建基本权限（员工、产品、销售、库存、财务、系统管理）</li>
              <li>• 创建基本角色（超级管理员、经理、员工）</li>
              <li>• 为角色分配相应权限</li>
              <li>• 为现有用户分配默认角色</li>
              <li>• 确保 admin@linghua.com 拥有管理员权限</li>
            </ul>
          </div>

          <Button 
            onClick={runInitialization} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "初始化中..." : "开始初始化"}
          </Button>

          {initResult && (
            <div className={`p-4 border rounded-lg ${
              initResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {initResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircleIcon className="h-5 w-5 text-red-600" />
                )}
                <h4 className={`font-medium ${
                  initResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {initResult.success ? '初始化成功' : '初始化失败'}
                </h4>
              </div>
              <p className={`text-sm ${
                initResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {initResult.message}
              </p>
              {initResult.stats && (
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">权限: </span>
                    <span className="font-medium">{initResult.stats.permissions}</span>
                  </div>
                  <div>
                    <span className="text-green-600">角色: </span>
                    <span className="font-medium">{initResult.stats.roles}</span>
                  </div>
                  <div>
                    <span className="text-green-600">用户更新: </span>
                    <span className="font-medium">{initResult.stats.usersUpdated}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. 首先点击"检查状态"查看当前权限系统配置</p>
          <p>2. 如果显示"未初始化"，点击"开始初始化"创建基本配置</p>
          <p>3. 初始化完成后，所有用户将拥有相应的权限</p>
          <p>4. admin@linghua.com 将自动获得超级管理员权限</p>
          <p>5. 其他用户将获得员工权限，可以查看基本信息</p>
          <p className="text-orange-600 font-medium">
            注意：此操作是安全的，不会删除现有数据，只会添加缺失的权限配置
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
