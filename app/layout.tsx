import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import CollapsibleSidebar from "@/components/collapsible-sidebar"
import { SessionProvider } from "@/components/session-provider"
import PermissionChecker from "@/components/auth/permission-checker"

// 导入服务器端初始化脚本 (这是服务器组件，可以安全地导入服务器操作)
import "@/lib/server-init"
// 导入客户端安全的初始化脚本
import "@/lib/init-app"

export const metadata: Metadata = {
  title: "聆花掐丝珐琅馆管理系统",
  description: "销售提成与排班系统",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <PermissionChecker />
            <div className="flex h-screen">
              <CollapsibleSidebar />
              <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 lg:ml-64">{children}</main>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
