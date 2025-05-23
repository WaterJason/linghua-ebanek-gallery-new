"use client"

import type React from "react"
import CollapsibleSidebar from "@/components/collapsible-sidebar"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 检查当前路径是否是财务模块
  const pathname = usePathname()
  const isFinancePage = pathname.startsWith('/finance')

  // 如果是财务模块，不显示侧边栏
  if (isFinancePage) {
    return (
      <div className="flex h-screen">
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
    )
  }

  // 其他模块显示侧边栏
  return (
    <div className="flex h-screen">
      <CollapsibleSidebar />
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 lg:ml-64">{children}</main>
    </div>
  )
}
