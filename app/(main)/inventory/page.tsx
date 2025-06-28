"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ModernPageContainer } from "@/components/modern-page-container"
import { WarehouseManagement } from "@/components/warehouse-management"
import { InventoryManagement } from "@/components/inventory-management"
import { InventoryTransactions } from "@/components/inventory-transactions"
import { InventoryDashboard } from "@/components/inventory-dashboard"
import { InventoryAnalytics } from "@/components/inventory-analytics"
import { InventoryAlerts } from "@/components/inventory-alerts"
import { InventoryTransfer } from "@/components/inventory-transfer"
import { InventoryIntegration } from "@/components/inventory-integration"
import { SupplyChainInventory } from "@/components/supply-chain-inventory"
import { SupplyChainStatusTracker } from "@/components/supply-chain-status-tracker"
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
  LinkIcon,
  TruckIcon,
  ClockIcon
} from "lucide-react"

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && navItems.some(item => item.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 定义导航选项
  const navItems = [
    { id: "dashboard", label: "库存概览", icon: LayoutDashboardIcon, component: InventoryDashboard },
    { id: "supply-chain", label: "供应链库存", icon: TruckIcon, component: SupplyChainInventory },
    { id: "status-tracker", label: "状态跟踪", icon: ClockIcon, component: SupplyChainStatusTracker },
    { id: "products", label: "产品库存", icon: PackageIcon, component: InventoryManagement },
    { id: "inventory", label: "产品库存", icon: PackageIcon, component: InventoryManagement }, // 兼容旧链接
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
    <ModernPageContainer
      title="库存管理"
      description="管理仓库、库存和库存交易记录"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "库存管理" }
      ]}
    >
      <div className="space-y-6">
        <ActiveComponent />
      </div>
    </ModernPageContainer>
  )
}
