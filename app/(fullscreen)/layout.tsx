"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, HomeIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { VersionSwitcher } from "@/components/mobile/version-switcher"

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <HomeIcon className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-medium">
            {pathname.split('/').pop()?.charAt(0).toUpperCase() + pathname.split('/').pop()?.slice(1) || '详情页'}
          </h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 bg-background">
        {children}
        <VersionSwitcher />
      </main>
    </div>
  )
}
