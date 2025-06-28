"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Laptop, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export function VersionSwitcher() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const switchToDesktop = () => {
    Cookies.set("prefer-desktop", "true", { expires: 30 })
    Cookies.remove("prefer-mobile")
    router.push("/")
  }

  const switchToMobile = () => {
    Cookies.set("prefer-mobile", "true", { expires: 30 })
    Cookies.remove("prefer-desktop")
    router.push("/m/dashboard")
  }

  // 检测当前是否在移动版
  const isMobileVersion = typeof window !== "undefined" && window.location.pathname.startsWith("/m/")

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full shadow-lg"
        onClick={isMobileVersion ? switchToDesktop : switchToMobile}
      >
        {isMobileVersion ? (
          <>
            <Laptop className="h-4 w-4 mr-2" />
            <span className="text-xs">切换到桌面版</span>
          </>
        ) : (
          <>
            <Smartphone className="h-4 w-4 mr-2" />
            <span className="text-xs">切换到移动版</span>
          </>
        )}
      </Button>
    </div>
  )
}
