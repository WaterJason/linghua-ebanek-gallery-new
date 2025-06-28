import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import PermissionChecker from "@/components/auth/permission-checker"
import { FeedbackProvider } from "@/components/providers/feedback-provider"
import ChunkErrorBoundary from "@/components/ui/chunk-error-boundary"

// 导入优化的初始化管理器
import { ensureSystemInitialized } from "@/lib/init-manager"

// 确保系统初始化（仅在服务器端执行一次，构建时跳过）
if (typeof window === "undefined" && process.env.NEXT_PHASE !== "phase-production-build") {
  ensureSystemInitialized().catch(error => {
    console.error("系统初始化失败:", error)
  })
}

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
        <ChunkErrorBoundary>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
              <FeedbackProvider>
                <PermissionChecker />
                {children}
              </FeedbackProvider>
            </ThemeProvider>
          </SessionProvider>
        </ChunkErrorBoundary>
      </body>
    </html>
  )
}
