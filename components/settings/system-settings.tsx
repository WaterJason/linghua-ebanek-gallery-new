"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  DatabaseIcon,
  FileTextIcon,
  UsersIcon,
  SettingsIcon,
  BellIcon,
  ClipboardListIcon,
  ShieldIcon,
  KeyIcon,
  LayoutDashboardIcon,
  WorkflowIcon,
  HistoryIcon,
  ServerIcon,
  GlobeIcon,
  MailIcon,
  CloudIcon,
  ArrowRightIcon
} from "lucide-react"

interface SettingCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

function SettingCard({ title, description, icon, href }: SettingCardProps) {
  const router = useRouter()

  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(href)}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" className="p-0 h-auto" onClick={() => router.push(href)}>
          <span className="text-sm">查看设置</span>
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

export function SystemSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">系统管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 用户管理 */}
          <SettingCard
            title="用户管理"
            description="管理系统用户和权限"
            icon={<UsersIcon className="h-5 w-5 text-primary" />}
            href="/settings/users"
          />

          {/* 角色与权限 */}
          <SettingCard
            title="角色与权限"
            description="管理系统角色和权限设置"
            icon={<ShieldIcon className="h-5 w-5 text-primary" />}
            href="/settings/roles"
          />

          {/* 系统参数 */}
          <SettingCard
            title="系统参数"
            description="配置系统全局参数和设置"
            icon={<SettingsIcon className="h-5 w-5 text-primary" />}
            href="/settings/parameters"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">数据管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 数据字典 */}
          <SettingCard
            title="数据字典"
            description="管理系统中使用的数据字典和字典项"
            icon={<DatabaseIcon className="h-5 w-5 text-primary" />}
            href="/settings/dictionaries"
          />

          {/* 工作流管理 */}
          <SettingCard
            title="工作流管理"
            description="管理系统中的工作流和审批流程"
            icon={<WorkflowIcon className="h-5 w-5 text-primary" />}
            href="/workflows"
          />

          {/* 备份与恢复 */}
          <SettingCard
            title="备份与恢复"
            description="管理系统数据备份和恢复"
            icon={<CloudIcon className="h-5 w-5 text-primary" />}
            href="/settings/backup"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">监控与日志</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 审计日志 */}
          <SettingCard
            title="审计日志"
            description="查看系统操作日志和审计记录"
            icon={<HistoryIcon className="h-5 w-5 text-primary" />}
            href="/settings/audit-logs"
          />

          {/* 系统日志 */}
          <SettingCard
            title="系统日志"
            description="查看系统运行日志和错误记录"
            icon={<ServerIcon className="h-5 w-5 text-primary" />}
            href="/settings/logs"
          />

          {/* 性能监控 */}
          <SettingCard
            title="性能监控"
            description="监控系统性能和资源使用情况"
            icon={<LayoutDashboardIcon className="h-5 w-5 text-primary" />}
            href="/settings/performance"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">通知与集成</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 通知设置 */}
          <SettingCard
            title="通知设置"
            description="配置系统通知和提醒"
            icon={<BellIcon className="h-5 w-5 text-primary" />}
            href="/settings/notifications"
          />

          {/* 邮件模板 */}
          <SettingCard
            title="邮件模板"
            description="管理系统邮件模板和内容"
            icon={<MailIcon className="h-5 w-5 text-primary" />}
            href="/settings/email-templates"
          />

          {/* 第三方集成 */}
          <SettingCard
            title="第三方集成"
            description="配置与第三方系统的集成"
            icon={<GlobeIcon className="h-5 w-5 text-primary" />}
            href="/settings/integrations"
          />
        </div>
      </div>
    </div>
  )
}
