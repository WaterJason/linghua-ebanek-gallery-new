"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  RefreshCwIcon, ServerIcon, DatabaseIcon, CpuIcon, HardDriveIcon,
  LayoutDashboardIcon, ActivityIcon, PackageIcon, UsersIcon, ShoppingCartIcon
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { getSystemInfo } from "@/lib/actions/system-actions";

interface TechStackItem {
  name: string
  version: string
  description: string
}

interface SystemModule {
  name: string
  code: string
  description: string
  tables: string[]
  features: string[]
}

interface SystemInfoData {
  version: string
  name: string
  description: string
  uptime: number
  nodeVersion: string
  platform: string
  memory: {
    total: number
    free: number
    used: number
  }
  database: {
    type: string
    version: string
    size: number
    tables: number
    records: number
  }
  storage: {
    total: number
    free: number
    used: number
  }
  stats: {
    users: number
    products: number
    orders: number
    customers: number
    workshops: number
    employees: number
    suppliers: number
    inventory: number
  }
  techStack: {
    frontend: TechStackItem[]
    backend: TechStackItem[]
    devTools: TechStackItem[]
  }
  modules: SystemModule[]
  buildInfo: {
    buildDate: string
    environment: string
    databaseName: string
  }
}

export function SystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取系统信息
  const fetchSystemInfo = async () => {
    setLoading(true)
    try {
      // 使用服务器端操作获取系统信息
      const data = await getSystemInfo()
      setSystemInfo(data)
    } catch (error) {
      console.error("获取系统信息失败:", error)
      toast({
        title: "获取系统信息失败",
        description: "无法获取系统信息，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchSystemInfo()
  }, [])

  // 格式化字节大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化运行时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24))
    const hours = Math.floor((seconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    return `${days}天 ${hours}小时 ${minutes}分钟`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>系统信息</CardTitle>
          <CardDescription>查看系统运行状态和资源使用情况</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSystemInfo} disabled={loading}>
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        ) : !systemInfo ? (
          <div className="text-center py-8 text-muted-foreground">
            无法获取系统信息
          </div>
        ) : (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <ServerIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">系统版本</span>
                </div>
                <div className="text-sm pl-7">
                  <p>{systemInfo.name} v{systemInfo.version}</p>
                  <p className="text-muted-foreground">{systemInfo.description}</p>
                  <p className="text-muted-foreground">Node.js {systemInfo.nodeVersion}</p>
                  <p className="text-muted-foreground">平台: {systemInfo.platform}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <CpuIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">系统运行时间</span>
                </div>
                <div className="text-sm pl-7">
                  <p>{formatUptime(systemInfo.uptime)}</p>
                </div>
              </div>
            </div>

            {/* 内存使用 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDriveIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">内存使用</span>
                </div>
                <span className="text-sm">
                  {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
                </span>
              </div>
              <Progress
                value={(systemInfo.memory.used / systemInfo.memory.total) * 100}
                className="h-2"
              />
            </div>

            {/* 存储使用 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDriveIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">存储使用</span>
                </div>
                <span className="text-sm">
                  {formatBytes(systemInfo.storage.used)} / {formatBytes(systemInfo.storage.total)}
                </span>
              </div>
              <Progress
                value={(systemInfo.storage.used / systemInfo.storage.total) * 100}
                className="h-2"
              />
            </div>

            {/* 数据库信息 */}
            <div className="space-y-2">
              <div className="flex items-center">
                <DatabaseIcon className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">数据库信息</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                <div className="space-y-1">
                  <p className="text-sm font-medium">类型</p>
                  <p className="text-sm">{systemInfo.database.type} {systemInfo.database.version}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">大小</p>
                  <p className="text-sm">{formatBytes(systemInfo.database.size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">记录数</p>
                  <p className="text-sm">{systemInfo.database.records} 条 (共 {systemInfo.database.tables} 张表)</p>
                </div>
              </div>

              {/* 系统统计信息 */}
              <div className="space-y-2 mt-6">
                <div className="flex items-center">
                  <CpuIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">系统统计</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-7">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">用户</p>
                    <p className="text-sm">{systemInfo.stats.users} 个</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">产品</p>
                    <p className="text-sm">{systemInfo.stats.products} 个</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">客户</p>
                    <p className="text-sm">{systemInfo.stats.customers} 个</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">订单</p>
                    <p className="text-sm">{systemInfo.stats.orders} 个</p>
                  </div>
                </div>
              </div>

              {/* 技术栈信息 */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center">
                  <ServerIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">技术栈</span>
                </div>

                {/* 前端技术 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium pl-7">前端技术</h4>
                  <div className="pl-7 space-y-2">
                    {systemInfo.techStack.frontend.map((tech, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tech.name} <span className="font-normal text-muted-foreground">v{tech.version}</span></p>
                          <p className="text-xs text-muted-foreground">{tech.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 后端技术 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium pl-7">后端技术</h4>
                  <div className="pl-7 space-y-2">
                    {systemInfo.techStack.backend.map((tech, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tech.name} <span className="font-normal text-muted-foreground">v{tech.version}</span></p>
                          <p className="text-xs text-muted-foreground">{tech.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 开发工具 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium pl-7">开发工具</h4>
                  <div className="pl-7 space-y-2">
                    {systemInfo.techStack.devTools.map((tech, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tech.name} <span className="font-normal text-muted-foreground">v{tech.version}</span></p>
                          <p className="text-xs text-muted-foreground">{tech.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 系统模块信息 */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center">
                  <LayoutDashboardIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">系统模块</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  {systemInfo.modules.map((module, index) => (
                    <Card key={index} className="border border-muted">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div>
                          <p className="text-xs font-medium">数据表</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {module.tables.map((table, i) => (
                              <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">{table}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium">功能</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {module.features.map((feature, i) => (
                              <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">{feature}</span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 构建信息 */}
              <div className="space-y-2 mt-6">
                <div className="flex items-center">
                  <ActivityIcon className="h-5 w-5 mr-2 text-primary" />
                  <span className="font-medium">构建信息</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">构建日期</p>
                    <p className="text-sm">{systemInfo.buildInfo.buildDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">环境</p>
                    <p className="text-sm">{systemInfo.buildInfo.environment}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">数据库名称</p>
                    <p className="text-sm">{systemInfo.buildInfo.databaseName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
