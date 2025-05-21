"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboardIcon,
  WalletIcon,
  TagIcon,
  BarChart2Icon,
  ArrowUpDownIcon,
} from "lucide-react"

interface DashboardNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

export function DashboardNav({
  className,
  items,
  ...props
}: DashboardNavProps) {
  const pathname = usePathname()

  // 如果没有提供导航项，使用默认的财务管理导航项
  const defaultItems = [
    {
      href: "/finance",
      title: "财务概览",
      icon: LayoutDashboardIcon,
    },
    {
      href: "/finance/accounts",
      title: "资金账户",
      icon: WalletIcon,
    },
    {
      href: "/finance/categories",
      title: "收支分类",
      icon: TagIcon,
    },
    {
      href: "/finance/transactions",
      title: "交易记录",
      icon: ArrowUpDownIcon,
    },
    {
      href: "/finance/reports",
      title: "财务报表",
      icon: BarChart2Icon,
    },
  ]

  const navItems = items || defaultItems

  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "transparent"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
