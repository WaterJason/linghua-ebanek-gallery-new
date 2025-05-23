"use client"

import { useEffect } from "react"
import { MobileLayout } from "@/components/mobile/layout/mobile-layout"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
import { initPerformanceMonitoring } from "@/lib/pwa/performance"

export default function MobileRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const router = useRouter()

  // 如果不是移动设备，重定向到桌面版
  useEffect(() => {
    if (!isMobile) {
      router.push("/dashboard")
    }
  }, [isMobile, router])

  // 初始化性能监控
  useEffect(() => {
    if (isMobile) {
      initPerformanceMonitoring()
    }
  }, [isMobile])

  // 注册 Service Worker
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox

      // 添加安装提示
      let deferredPrompt: any
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault()
        deferredPrompt = e

        // 可以在这里显示自定义的安装提示
        // 例如，显示一个按钮，点击后调用 deferredPrompt.prompt()
      })

      // 监听 Service Worker 更新
      wb.addEventListener("controlling", () => {
        window.location.reload()
      })

      // 如果有新版本，提示用户刷新
      wb.addEventListener("waiting", () => {
        if (
          confirm(
            "有新版本可用，是否立即更新？"
          )
        ) {
          wb.messageSkipWaiting()
        }
      })

      wb.register()
    }
  }, [])

  if (!isMobile) {
    return null
  }

  return <MobileLayout>{children}</MobileLayout>
}
