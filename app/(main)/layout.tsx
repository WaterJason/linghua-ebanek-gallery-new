"use client"

import type React from "react"
import { useState } from "react"
import EnhancedSidebar from "@/components/enhanced-sidebar"
import { ModernHeader } from "@/components/modern-header"
import { ModernQuickActions } from "@/components/modern-quick-actions"
import { PersonalizationProvider } from "@/components/personalization/personalization-provider"
import { usePathname } from "next/navigation"
import { VersionSwitcher } from "@/components/mobile/version-switcher"
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts"
import AuthGuard from "@/components/auth/auth-guard"
import { cn } from "@/lib/utils"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const handleQuickActionOpen = () => {
    setIsQuickActionsOpen(true)
  }

  return (
    <AuthGuard>
      <PersonalizationProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        {/* 现代化顶部导航栏 */}
        <ModernHeader
          onMenuToggle={handleMenuToggle}
          onQuickActionOpen={handleQuickActionOpen}
          onSidebarToggle={handleSidebarToggle}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* 侧边栏 */}
        <EnhancedSidebar
          isCollapsed={isSidebarCollapsed}
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />

        {/* 主内容区域 */}
        <main className={cn(
          "flex-1 overflow-auto pt-20 px-6 pb-6 transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
        )}>
          <div className="max-w-7xl mx-auto mt-4">
            {children}
          </div>
          <VersionSwitcher />
          <KeyboardShortcuts />
        </main>

        {/* 快速操作模态框 */}
        <ModernQuickActions
          open={isQuickActionsOpen}
          onOpenChange={setIsQuickActionsOpen}
        />
        </div>
      </PersonalizationProvider>
    </AuthGuard>
  )
}
