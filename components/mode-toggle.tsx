"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

interface ModeToggleProps {
  variant?: "icon" | "button"
  className?: string
}

export function ModeToggle({ variant = "icon", className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  // 图标模式
  if (variant === "icon") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 relative", className)}
            aria-label="切换主题"
          >
            <Icons.sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Icons.moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setTheme("light")
              setIsOpen(false)
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer",
              theme === "light" && "bg-accent"
            )}
          >
            <span className={cn(
              "h-4 w-4 rounded-full border flex items-center justify-center",
              theme === "light" ? "border-primary" : "border-transparent"
            )}>
              {theme === "light" && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </span>
            <Icons.sun className="mr-2 h-4 w-4" />
            <span>浅色</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTheme("dark")
              setIsOpen(false)
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer",
              theme === "dark" && "bg-accent"
            )}
          >
            <span className={cn(
              "h-4 w-4 rounded-full border flex items-center justify-center",
              theme === "dark" ? "border-primary" : "border-transparent"
            )}>
              {theme === "dark" && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </span>
            <Icons.moon className="mr-2 h-4 w-4" />
            <span>深色</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTheme("system")
              setIsOpen(false)
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer",
              theme === "system" && "bg-accent"
            )}
          >
            <span className={cn(
              "h-4 w-4 rounded-full border flex items-center justify-center",
              theme === "system" ? "border-primary" : "border-transparent"
            )}>
              {theme === "system" && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </span>
            <Icons.laptop className="mr-2 h-4 w-4" />
            <span>系统</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 按钮模式
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", className)}
        >
          <Icons.palette className="h-4 w-4" />
          <span>
            {theme === "light" && "浅色"}
            {theme === "dark" && "深色"}
            {theme === "system" && "系统"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Icons.sun className="mr-2 h-4 w-4" />
          <span>浅色</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Icons.moon className="mr-2 h-4 w-4" />
          <span>深色</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Icons.laptop className="mr-2 h-4 w-4" />
          <span>系统</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
