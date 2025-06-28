"use client"

import type React from "react"
import EnhancedSidebar from "@/components/enhanced-sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlertIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { VersionSwitcher } from "@/components/mobile/version-switcher"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  // 检查用户是否有管理员权限
  const isAdmin = session?.user?.role === "admin" || session?.user?.email === "admin@linghua.com"

  // 如果用户不是管理员，重定向到未授权页面
  if (status === "authenticated" && !isAdmin) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex h-screen">
      <EnhancedSidebar />
      <main className="flex-1 overflow-auto p-6 bg-background lg:ml-64">
        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <ShieldAlertIcon className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-300">管理员模式</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            您正在使用管理员权限，请谨慎操作。所有操作将被记录。
          </AlertDescription>
        </Alert>
        {children}
        <VersionSwitcher />
      </main>
    </div>
  )
}
