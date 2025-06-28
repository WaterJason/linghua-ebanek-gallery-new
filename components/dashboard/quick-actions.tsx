"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PlusIcon, ShoppingCartIcon, PackageIcon, CalendarIcon,
  ClipboardListIcon, DollarSignIcon, UsersIcon, SettingsIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
  title: string
  href: string
  icon: React.ReactNode
  color: string
  description?: string
}

const defaultQuickActions: QuickAction[] = [
  {
    title: "POS销售",
    href: "/sales/pos/new",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    description: "录入新的POS销售记录"
  },
  {
    title: "数据录入",
    href: "/daily-log",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    description: "录入销售、团建、计件等数据"
  },
  {
    title: "库存查询",
    href: "/inventory",
    icon: <PackageIcon className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    description: "查看当前库存状态"
  },
  {
    title: "排班管理",
    href: "/schedule",
    icon: <CalendarIcon className="h-5 w-5" />,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    description: "管理员工排班"
  },
  {
    title: "团建预约",
    href: "/workshops/new",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    description: "创建新的手作团建活动"
  },
  {
    title: "员工管理",
    href: "/employees",
    icon: <UsersIcon className="h-5 w-5" />,
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    description: "管理员工信息"
  },
  {
    title: "财务管理",
    href: "/finance",
    icon: <DollarSignIcon className="h-5 w-5" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    description: "管理财务收支和账户"
  },
  {
    title: "采购管理",
    href: "/purchase/new",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    description: "创建新的采购订单"
  }
]

interface QuickActionsProps {
  className?: string
  limit?: number
  showDescription?: boolean
  showMore?: boolean
}

export function QuickActions({
  className,
  limit = 6,
  showDescription = false,
  showMore = true
}: QuickActionsProps) {
  const [expanded, setExpanded] = useState(false)
  const displayActions = expanded ? defaultQuickActions : defaultQuickActions.slice(0, limit)

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">快捷操作</CardTitle>
        <CardDescription>常用功能快速入口</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {displayActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="no-underline"
            >
              <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className={cn("p-2 rounded-full mb-2", action.color)}>
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-center">{action.title}</span>
                {showDescription && action.description && (
                  <span className="text-xs text-muted-foreground text-center mt-1">{action.description}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {showMore && defaultQuickActions.length > limit && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "显示更少" : "显示更多"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
