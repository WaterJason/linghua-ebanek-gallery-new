"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Icons } from "@/components/icons"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Icons.menu className="h-6 w-6" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <MobileLink
          href="/"
          className="flex items-center"
          onOpenChange={setOpen}
        >
          <Icons.logo className="mr-2 h-4 w-4" />
          <span className="font-bold">聆花掐丝珐琅馆</span>
        </MobileLink>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            <MobileLink
              href="/finance"
              className={cn(
                pathname === "/finance" ? "text-foreground" : "text-foreground/60"
              )}
              onOpenChange={setOpen}
            >
              财务概览
            </MobileLink>
            <MobileLink
              href="/finance/accounts"
              className={cn(
                pathname?.startsWith("/finance/accounts")
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
              onOpenChange={setOpen}
            >
              资金账户
            </MobileLink>
            <MobileLink
              href="/finance/categories"
              className={cn(
                pathname?.startsWith("/finance/categories")
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
              onOpenChange={setOpen}
            >
              收支分类
            </MobileLink>
            <MobileLink
              href="/finance/transactions"
              className={cn(
                pathname?.startsWith("/finance/transactions")
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
              onOpenChange={setOpen}
            >
              交易记录
            </MobileLink>
            <MobileLink
              href="/finance/reports"
              className={cn(
                pathname?.startsWith("/finance/reports")
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
              onOpenChange={setOpen}
            >
              财务报表
            </MobileLink>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MobileLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const handleClick = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  )
}
