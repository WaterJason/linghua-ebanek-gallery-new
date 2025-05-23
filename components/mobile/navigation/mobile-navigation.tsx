"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface NavItem {
  title: string
  href: string
  icon: keyof typeof Icons
  activePattern: RegExp
}

export function MobileNavigation() {
  const pathname = usePathname()
  
  const navItems: NavItem[] = [
    {
      title: "首页",
      href: "/",
      icon: "home",
      activePattern: /^\/$/, // 精确匹配首页
    },
    {
      title: "财务",
      href: "/finance",
      icon: "wallet",
      activePattern: /^\/finance/,
    },
    {
      title: "库存",
      href: "/inventory",
      icon: "package",
      activePattern: /^\/inventory/,
    },
    {
      title: "销售",
      href: "/sales",
      icon: "store",
      activePattern: /^\/sales/,
    },
    {
      title: "我的",
      href: "/settings",
      icon: "user",
      activePattern: /^\/settings/,
    },
  ]

  return (
    <nav className="sticky bottom-0 z-30 flex h-16 w-full items-center justify-around border-t bg-background">
      {navItems.map((item) => {
        const Icon = Icons[item.icon]
        const isActive = item.activePattern.test(pathname)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className="mt-1 text-xs">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
