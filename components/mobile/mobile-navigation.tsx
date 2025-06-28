"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  PlusCircleIcon,
  PackageIcon,
  ShoppingBagIcon,
  UserIcon,
} from "lucide-react"

export function MobileNavigation() {
  const pathname = usePathname()
  
  const navItems = [
    {
      name: "首页",
      href: "/m/dashboard",
      icon: HomeIcon,
    },
    {
      name: "快速操作",
      href: "/m/quick-actions",
      icon: PlusCircleIcon,
    },
    {
      name: "产品与库存",
      href: "/m/products",
      icon: PackageIcon,
    },
    {
      name: "销售",
      href: "/m/sales",
      icon: ShoppingBagIcon,
    },
    {
      name: "我的",
      href: "/m/profile",
      icon: UserIcon,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
