"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ShoppingCartIcon,
  CreditCardIcon,
  UserPlusIcon,
  PackageIcon,
  CoffeeIcon,
  CalendarIcon,
  ClipboardListIcon,
  DollarSignIcon,
  TruckIcon,
  BuildingIcon,
  ScanIcon,
  FileTextIcon,
  PlusIcon
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface QuickActionItem {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  badge?: string
  category: 'sales' | 'finance' | 'inventory' | 'business'
}

export function MobileQuickActions() {
  const [activeTab, setActiveTab] = useState("sales")

  const quickActions: QuickActionItem[] = [
    // 销售相关
    {
      title: "POS销售",
      description: "快速录入POS销售记录",
      icon: ShoppingCartIcon,
      href: "/daily-log?tab=sales",
      color: "bg-blue-500",
      badge: "热门",
      category: "sales"
    },
    {
      title: "新建订单",
      description: "创建新的销售订单",
      icon: FileTextIcon,
      href: "/sales/new",
      color: "bg-green-500",
      category: "sales"
    },
    {
      title: "定制作品",
      description: "录入定制作品订单",
      icon: ClipboardListIcon,
      href: "/sales/custom-works/new",
      color: "bg-purple-500",
      category: "sales"
    },
    // 财务相关
    {
      title: "收款记录",
      description: "快速录入收款信息",
      icon: CreditCardIcon,
      href: "/finance/incomes/new",
      color: "bg-green-500",
      badge: "常用",
      category: "finance"
    },
    {
      title: "付款记录",
      description: "快速录入付款信息",
      icon: DollarSignIcon,
      href: "/finance/expenses/new",
      color: "bg-red-500",
      category: "finance"
    },
    // 库存相关
    {
      title: "扫码入库",
      description: "扫描条码快速入库",
      icon: ScanIcon,
      href: "/inventory/inbound/scan",
      color: "bg-blue-500",
      badge: "快捷",
      category: "inventory"
    },
    {
      title: "快速出库",
      description: "快速录入出库信息",
      icon: PackageIcon,
      href: "/inventory/outbound/new",
      color: "bg-orange-500",
      category: "inventory"
    },
    {
      title: "库存调拨",
      description: "仓库间库存调拨",
      icon: TruckIcon,
      href: "/inventory/transfer/new",
      color: "bg-purple-500",
      category: "inventory"
    },
    // 业务相关
    {
      title: "咖啡店销售",
      description: "录入咖啡店销售数据",
      icon: CoffeeIcon,
      href: "/daily-log?tab=coffee",
      color: "bg-amber-500",
      badge: "每日",
      category: "business"
    },
    {
      title: "手作团建",
      description: "录入团建活动信息",
      icon: BuildingIcon,
      href: "/daily-log?tab=workshop",
      color: "bg-indigo-500",
      category: "business"
    },
    {
      title: "新增客户",
      description: "快速添加新客户",
      icon: UserPlusIcon,
      href: "/customers/new",
      color: "bg-teal-500",
      category: "business"
    }
  ]

  // 按分类过滤操作
  const getActionsByCategory = (category: string) => {
    return quickActions.filter(action => action.category === category)
  }

  // 渲染操作卡片
  const renderActionCard = (action: QuickActionItem) => {
    const Icon = action.icon
    return (
      <Link key={action.href} href={action.href}>
        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`${action.color} text-white p-2 rounded-lg flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-sm">{action.title}</h3>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="sales" className="text-xs">销售</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs">财务</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs">库存</TabsTrigger>
          <TabsTrigger value="business" className="text-xs">业务</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {getActionsByCategory("sales").map(renderActionCard)}
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {getActionsByCategory("finance").map(renderActionCard)}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {getActionsByCategory("inventory").map(renderActionCard)}
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {getActionsByCategory("business").map(renderActionCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* 底部快捷按钮 */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">今日数据录入</h3>
              <p className="text-xs opacity-90">完成日常业务记录</p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/daily-log">
                <PlusIcon className="h-4 w-4 mr-1" />
                录入
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
