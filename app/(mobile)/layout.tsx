"use client"

import type React from "react"
import { MobileNavigation } from "@/components/mobile/mobile-navigation"
import { VersionSwitcher } from "@/components/mobile/version-switcher"
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts"

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-1 p-4">{children}</main>
      <MobileNavigation />
      <VersionSwitcher />
      <KeyboardShortcuts />
    </div>
  )
}
