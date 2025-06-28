"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModernPageContainer } from "@/components/modern-page-container"
import {
  UsersIcon,
  ShieldIcon,
  DatabaseIcon,
  FolderArchiveIcon,
  FileTextIcon,
  BarChart2Icon,
  SettingsIcon,
  ArrowRightIcon,
  LinkIcon,
  BuildingIcon
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const settingsModules = [
    {
      title: "系统诊断中心",
      description: "统一管理和监控ERP系统健康状态",
      href: "/settings/diagnostics",
      icon: BarChart2Icon,
      color: "text-red-600",
      isNew: true,
    },
    {
      title: "用户管理",
      description: "管理系统用户账户和基本信息",
      href: "/settings/users",
      icon: UsersIcon,
      color: "text-blue-600",
    },
    {
      title: "角色管理",
      description: "配置用户角色和权限组",
      href: "/settings/roles",
      icon: ShieldIcon,
      color: "text-green-600",
    },
    {
      title: "权限分配",
      description: "分配和管理用户权限",
      href: "/settings/permissions",
      icon: ShieldIcon,
      color: "text-purple-600",
    },
    {
      title: "公司信息",
      description: "管理公司基本信息和Logo设置",
      href: "/settings/company-profile",
      icon: BuildingIcon,
      color: "text-cyan-600",
    },
    {
      title: "系统参数",
      description: "配置系统运行参数和选项",
      href: "/settings/parameters",
      icon: SettingsIcon,
      color: "text-slate-600",
    },
    {
      title: "数据字典",
      description: "管理系统数据字典和配置项",
      href: "/settings/dictionaries",
      icon: DatabaseIcon,
      color: "text-orange-600",
    },
    {
      title: "账号迁移",
      description: "管理员工和用户账号的关联关系",
      href: "/settings/account-migration",
      icon: LinkIcon,
      color: "text-emerald-600",
    },
    {
      title: "数据备份恢复",
      description: "系统数据备份与恢复管理",
      href: "/settings/backup-restore",
      icon: FolderArchiveIcon,
      color: "text-indigo-600",
    },
    {
      title: "数据导入导出",
      description: "数据模板管理和批量导入导出",
      href: "/settings/data-io-templates",
      icon: FolderArchiveIcon,
      color: "text-purple-600",
    },
    {
      title: "系统日志",
      description: "查看系统操作日志和审计记录",
      href: "/settings/logs",
      icon: FileTextIcon,
      color: "text-gray-600",
    },
    {
      title: "系统监控",
      description: "监控系统性能和运行状态",
      href: "/settings/monitoring",
      icon: BarChart2Icon,
      color: "text-red-600",
    },
  ]

  return (
    <ModernPageContainer
      title="系统设置"
      description="管理系统配置和参数"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "系统设置" }
      ]}
    >
      <div className="space-y-6">
        {/* 快速访问面板 */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2Icon className="w-5 h-5" />
              快速访问
            </CardTitle>
            <CardDescription>
              常用的系统管理功能快速入口
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/settings/diagnostics">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full relative">
                  <BarChart2Icon className="w-6 h-6" />
                  <span className="text-sm">系统诊断</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">新</span>
                </Button>
              </Link>
              <Link href="/system-diagnostics">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full">
                  <DatabaseIcon className="w-6 h-6" />
                  <span className="text-sm">数据诊断</span>
                </Button>
              </Link>
              <Link href="/performance-diagnostics">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full">
                  <BarChart2Icon className="w-6 h-6" />
                  <span className="text-sm">性能监控</span>
                </Button>
              </Link>
              <Link href="/security-diagnostics">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 w-full">
                  <ShieldIcon className="w-6 h-6" />
                  <span className="text-sm">安全检查</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsModules.map((module) => (
            <Card key={module.href} className="card-modern card-hover relative">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${module.color}`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {module.title}
                      {module.isNew && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">新</span>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {module.description}
                </CardDescription>
                <Button asChild variant="outline" className="w-full">
                  <Link href={module.href}>
                    进入设置
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 系统信息卡片 */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>当前系统的基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">系统名称</p>
                <p className="text-sm text-muted-foreground">聆花掐丝珐琅馆ERP系统</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">版本号</p>
                <p className="text-sm text-muted-foreground">v1.0.0</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">技术栈</p>
                <p className="text-sm text-muted-foreground">Next.js 15 + React 19</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernPageContainer>
  )
}
