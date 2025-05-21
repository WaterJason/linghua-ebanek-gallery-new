"use client"

import { useState } from "react"
import { WarehouseManagement } from "@/components/warehouse-management"
import { InventoryManagement } from "@/components/inventory-management"
import { InventoryTransactions } from "@/components/inventory-transactions"
import { InventoryDashboard } from "@/components/inventory-dashboard"
import { InventoryAnalytics } from "@/components/inventory-analytics"
import { InventoryAlerts } from "@/components/inventory-alerts"
import { InventoryTransfer } from "@/components/inventory-transfer"
import { InventoryIntegration } from "@/components/inventory-integration"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboardIcon,
  PackageIcon,
  WarehouseIcon,
  ClipboardListIcon,
  BarChart2Icon,
  AlertTriangleIcon,
  ArrowRightIcon,
  LinkIcon
} from "lucide-react"

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("dashboard")

  // 定义导航选项
  const navItems = [
    { id: "dashboard", label: "库存概览", icon: LayoutDashboardIcon, component: InventoryDashboard },
    { id: "inventory", label: "库存管理", icon: PackageIcon, component: InventoryManagement },
    { id: "warehouses", label: "仓库管理", icon: WarehouseIcon, component: WarehouseManagement },
    { id: "transfer", label: "库存转移", icon: ArrowRightIcon, component: InventoryTransfer },
    { id: "integration", label: "业务集成", icon: LinkIcon, component: InventoryIntegration },
    { id: "transactions", label: "交易记录", icon: ClipboardListIcon, component: InventoryTransactions },
    { id: "analytics", label: "库存分析", icon: BarChart2Icon, component: InventoryAnalytics },
    { id: "alerts", label: "库存预警", icon: AlertTriangleIcon, component: InventoryAlerts },
  ]

  // 获取当前活动组件
  const ActiveComponent = navItems.find(item => item.id === activeTab)?.component || InventoryDashboard

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">库存管理</h1>
        <p className="text-muted-foreground">管理仓库、库存和库存交易记录</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 左侧导航 */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-lg">库存管理</CardTitle>
              <CardDescription>管理库存和仓库</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-2">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab(item.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容 */}
        <div className="md:col-span-3">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
