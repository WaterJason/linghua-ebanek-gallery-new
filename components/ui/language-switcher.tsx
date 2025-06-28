"use client"

import { useState, useEffect } from "react"
import { LOCALE_NAMES, Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  variant?: "icon" | "select" | "button"
  className?: string
}

export function LanguageSwitcher({
  variant = "icon",
  className
}: LanguageSwitcherProps) {
  // 简化版实现，使用本地状态而不是全局i18n
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [isOpen, setIsOpen] = useState(false)

  // 从本地存储加载语言设置
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("linghua-locale") as Locale | null
      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
        setLocaleState(savedLocale)
      }
    } catch (error) {
      console.error("Failed to load locale from localStorage:", error)
    }
  }, [])

  // 设置语言
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem("linghua-locale", newLocale)
    } catch (error) {
      console.error("Failed to save locale to localStorage:", error)
    }
  }

  // 图标模式
  if (variant === "icon") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", className)}
            aria-label="切换语言"
          >
            <Icons.languages className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SUPPORTED_LOCALES.map((localeOption) => (
            <DropdownMenuItem
              key={localeOption}
              onClick={() => {
                setLocale(localeOption)
                setIsOpen(false)
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer",
                locale === localeOption && "bg-accent"
              )}
            >
              <span className={cn(
                "h-4 w-4 rounded-full border flex items-center justify-center",
                locale === localeOption ? "border-primary" : "border-transparent"
              )}>
                {locale === localeOption && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </span>
              {LOCALE_NAMES[localeOption]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 选择器模式
  if (variant === "select") {
    return (
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={cn(
          "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          className
        )}
      >
        {SUPPORTED_LOCALES.map((localeOption) => (
          <option key={localeOption} value={localeOption}>
            {LOCALE_NAMES[localeOption]}
          </option>
        ))}
      </select>
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
          <Icons.languages className="h-4 w-4" />
          {LOCALE_NAMES[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((localeOption) => (
          <DropdownMenuItem
            key={localeOption}
            onClick={() => setLocale(localeOption)}
          >
            {LOCALE_NAMES[localeOption]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
