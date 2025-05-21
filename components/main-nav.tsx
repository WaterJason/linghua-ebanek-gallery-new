"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          聆花掐丝珐琅馆
        </span>
      </Link>
      <nav
        className={cn("flex items-center space-x-6 text-sm font-medium", className)}
        {...props}
      >
        <Link
          href="/finance"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/finance" ? "text-foreground" : "text-foreground/60"
          )}
        >
          财务概览
        </Link>
        <Link
          href="/finance/accounts"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/finance/accounts")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          资金账户
        </Link>
        <Link
          href="/finance/categories"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/finance/categories")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          收支分类
        </Link>
        <Link
          href="/finance/transactions"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/finance/transactions")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          交易记录
        </Link>
        <Link
          href="/finance/reports"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/finance/reports")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          财务报表
        </Link>
      </nav>
    </div>
  )
}
