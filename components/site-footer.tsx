import * as React from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn(className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-4 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.logo className="h-4 w-4" />
          <p className="text-center text-sm leading-loose md:text-left">
            &copy; {new Date().getFullYear()} 聆花掐丝珐琅馆. 版权所有.
          </p>
        </div>
        <ModeToggle />
      </div>
    </footer>
  )
}
