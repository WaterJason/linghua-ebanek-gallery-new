"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProductSettings } from "@/components/product-settings"
import { PieceWorkSettings } from "@/components/piece-work-settings"
import { SystemSettings } from "@/components/system-settings"
import { BackupRestore } from "@/components/backup-restore"
import { SystemLogs } from "@/components/system-logs"
import { SystemInfo } from "@/components/system-info"
import { ExportImportButtons } from "@/components/export-import-buttons"
import {
  TagIcon,
  ClipboardListIcon,
  SettingsIcon,
  DatabaseIcon,
  ListIcon,
  InfoIcon,
  ServerIcon,
  ShieldIcon,
  BellIcon,
  GlobeIcon,
  LayoutIcon,
  UsersIcon,
  UserCogIcon,
  DollarSignIcon
} from "lucide-react"

export default function LegacySettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("system")
  const [activeCategory, setActiveCategory] = useState("general")

  // 定义设置类别
  const settingCategories = [
    {
      id: "general",
      label: "通用设置",
      options: [
        { id: "system", label: "系统设置", icon: SettingsIcon, component: SystemSettings },
        { id: "system-info", label: "系统信息", icon: InfoIcon, component: SystemInfo },
      ]
    },
    {
      id: "users",
      label: "用户与权限",
      options: [
        { id: "employees", label: "员工管理", icon: UsersIcon, href: "/employees" },
        { id: "permissions", label: "权限管理", icon: ShieldIcon, href: "/permissions" },
      ]
    },
    {
      id: "salary",
      label: "薪资管理",
      options: [
        { id: "salary-management", label: "薪资管理", icon: DollarSignIcon, href: "/salary" },
        { id: "salary-settings", label: "薪资设置", icon: SettingsIcon, href: "/salary?tab=settings" },
      ]
    },
    {
      id: "data",
      label: "数据管理",
      options: [
        { id: "products", label: "产品管理", icon: TagIcon, component: ProductSettings },
        { id: "piecework", label: "计件工项", icon: ClipboardListIcon, component: PieceWorkSettings },
      ]
    },
    {
      id: "system",
      label: "系统维护",
      options: [
        { id: "backup", label: "备份恢复", icon: DatabaseIcon, component: BackupRestore },
        { id: "logs", label: "系统日志", icon: ListIcon, href: "/settings/logs" },
      ]
    }
  ]

  // 获取所有选项的平面列表
  const allOptions = settingCategories.flatMap(category => category.options)

  // 获取当前活动组件
  const activeOption = allOptions.find(option => option.id === activeTab)
  const ActiveComponent = activeOption?.component || SystemSettings

  // 处理选项点击
  const handleOptionClick = (categoryId, optionId, href) => {
    if (href) {
      // 如果有href属性，则导航到该链接
      router.push(href)
    } else {
      // 否则，切换选项卡
      setActiveCategory(categoryId)
      setActiveTab(optionId)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">旧版系统设置</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/settings")}>
            前往新版设置
          </Button>
          <ExportImportButtons type="products" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左侧导航 */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="py-4">
              <CardTitle className="text-xl">设置</CardTitle>
              <CardDescription>管理系统配置和参数</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="p-4 space-y-6">
                  {settingCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground px-2">
                        {category.label}
                      </h3>
                      <div className="space-y-1">
                        {category.options.map((option) => {
                          const Icon = option.icon
                          const isActive = activeTab === option.id
                          return (
                            <Button
                              key={option.id}
                              variant={isActive ? "secondary" : "ghost"}
                              className={`w-full justify-start ${isActive ? 'font-medium' : ''}`}
                              onClick={() => handleOptionClick(category.id, option.id, option.href)}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {option.label}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{activeOption?.label}</CardTitle>
                <CardDescription>
                  {activeTab === "system" && "管理系统基础设置和参数配置"}
                  {activeTab === "system-info" && "查看系统运行状态和资源使用情况"}
                  {activeTab === "employees" && "管理员工信息和员工账号"}
                  {activeTab === "permissions" && "管理系统角色和用户权限"}
                  {activeTab === "products" && "管理产品类别和产品信息"}
                  {activeTab === "piecework" && "管理计件工项和计件单价"}
                  {activeTab === "backup" && "备份或恢复系统数据"}
                  {activeTab === "logs" && "查看系统操作日志记录"}
                </CardDescription>
              </div>
              {activeOption?.icon && (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <activeOption.icon className="h-5 w-5 text-primary" />
                </div>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {activeOption?.component ? (
                <ActiveComponent />
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    {activeOption?.icon && <activeOption.icon className="h-8 w-8 text-primary" />}
                  </div>
                  <h3 className="text-xl font-medium mb-2">正在跳转到{activeOption?.label}...</h3>
                  <p className="text-muted-foreground">请稍候，正在加载页面</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
