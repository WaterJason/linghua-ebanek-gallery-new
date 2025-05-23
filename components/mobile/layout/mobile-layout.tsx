"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { MobileNavigation } from "@/components/mobile/navigation/mobile-navigation"
import { MobileHeader } from "@/components/mobile/layout/mobile-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InstallPrompt } from "@/components/mobile/pwa/install-prompt"

interface MobileLayoutProps {
  children: React.ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [showOfflineToast, setShowOfflineToast] = useState<boolean>(false)

  // 检测在线状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineToast(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineToast(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始化检查
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 自动隐藏离线提示
  useEffect(() => {
    if (showOfflineToast) {
      const timer = setTimeout(() => {
        setShowOfflineToast(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [showOfflineToast])

  // 获取当前页面标题
  const getPageTitle = () => {
    if (pathname === '/') return '首页'
    if (pathname.includes('/dashboard')) return '仪表盘'
    if (pathname.includes('/finance')) return '财务管理'
    if (pathname.includes('/inventory')) return '库存管理'
    if (pathname.includes('/sales')) return '销售管理'
    if (pathname.includes('/employees')) return '员工管理'
    if (pathname.includes('/settings')) return '系统设置'
    return '聆华ERP'
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <MobileHeader title={getPageTitle()} />

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="container px-4 py-4">
            {children}
          </div>
        </ScrollArea>
      </main>

      <MobileNavigation />

      {/* PWA安装提示 */}
      <InstallPrompt />

      {/* 离线提示 */}
      {showOfflineToast && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-[90%] max-w-md bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md shadow-md flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>您当前处于离线状态</span>
          </div>
          <button
            onClick={() => setShowOfflineToast(false)}
            className="text-yellow-800 hover:text-yellow-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
