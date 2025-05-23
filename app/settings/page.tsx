import { Metadata } from "next"

export const metadata: Metadata = {
  title: "系统设置",
  description: "管理系统设置和配置",
}

"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { DesktopSettingsPage } from "@/components/settings/desktop-settings-page"
import { MobileSettingsPage } from "@/components/settings/mobile-settings-page"

export default function SettingsPage() {
  const isMobile = useIsMobile()

  return (
    <>
      {isMobile ? <MobileSettingsPage /> : <DesktopSettingsPage />}
    </>
  )
}
