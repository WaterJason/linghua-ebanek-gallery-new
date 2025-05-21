"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  CalendarIcon,
  LayoutDashboardIcon,
  UsersIcon,
  ClipboardListIcon,
  DollarSignIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  PackageIcon,
  ShoppingCartIcon,
  GlobeIcon,
  CoffeeIcon,
  BarChart2Icon,
  PieChartIcon,
  TagIcon,
  ShieldIcon,
} from "lucide-react"

const navItems = [
  {
    title: "仪表盘",
    href: "/",
    icon: LayoutDashboardIcon,
  },
  {
    title: "排班管理",
    href: "/schedule",
    icon: CalendarIcon,
  },
  {
    title: "数据录入",
    href: "/daily-log",
    icon: ClipboardListIcon,
  },
  {
    title: "产品管理",
    href: "/products",
    icon: TagIcon,
  },
  {
    title: "库存管理",
    href: "/inventory",
    icon: PackageIcon,
  },
  {
    title: "采购管理",
    href: "/purchase",
    icon: ShoppingCartIcon,
  },
  {
    title: "销售管理",
    href: "/sales",
    icon: DollarSignIcon,
  },
  {
    title: "渠道管理",
    href: "/channels",
    icon: GlobeIcon,
  },
  {
    title: "制作管理",
    href: "/production",
    icon: ClipboardListIcon,
  },

  {
    title: "咖啡店报表",
    href: "/coffee-reports",
    icon: CoffeeIcon,
  },
  {
    title: "综合报表",
    href: "/reports",
    icon: PieChartIcon,
  },
  {
    title: "薪资管理",
    href: "/salary",
    icon: DollarSignIcon,
  },
  {
    title: "系统设置",
    href: "/settings",
    icon: SettingsIcon,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
      >
        {isOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">聆花掐丝珐琅馆</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">A</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">管理员</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">admin@linghua.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
