"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCookie, setCookie } from "cookies-next"

// 支持的语言
export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const
export type Locale = typeof SUPPORTED_LOCALES[number]

// 默认语言
export const DEFAULT_LOCALE: Locale = "zh-CN"

// 语言名称映射
export const LOCALE_NAMES: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "en-US": "English"
}

// 语言上下文类型
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
  formatNumber: (num: number) => string
}

// 创建语言上下文
const I18nContext = createContext<I18nContextType | null>(null)

// 语言提供者属性
interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
  translations: Record<Locale, Record<string, string>>
}

// 语言提供者组件
export function I18nProvider({
  children,
  initialLocale,
  translations
}: I18nProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // 初始化语言
  const [locale, setLocaleState] = useState<Locale>(() => {
    // 优先使用传入的初始语言
    if (initialLocale && SUPPORTED_LOCALES.includes(initialLocale)) {
      return initialLocale
    }
    
    // 其次使用Cookie中的语言
    const cookieLocale = getCookie("locale") as Locale | undefined
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      return cookieLocale
    }
    
    // 最后使用浏览器语言
    if (typeof navigator !== "undefined") {
      const browserLocale = navigator.language
      const matchedLocale = SUPPORTED_LOCALES.find(locale => 
        browserLocale.startsWith(locale.split("-")[0])
      )
      
      if (matchedLocale) {
        return matchedLocale
      }
    }
    
    // 默认语言
    return DEFAULT_LOCALE
  })
  
  // 设置语言
  const setLocale = (newLocale: Locale) => {
    if (newLocale !== locale && SUPPORTED_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale)
      setCookie("locale", newLocale, { maxAge: 365 * 24 * 60 * 60 }) // 保存一年
      
      // 刷新页面以应用新语言
      if (pathname) {
        router.refresh()
      }
    }
  }
  
  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>) => {
    // 获取当前语言的翻译
    const translation = translations[locale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key
    
    // 替换参数
    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, paramValue]) => 
          acc.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue)),
        translation
      )
    }
    
    return translation
  }
  
  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: locale === "zh-CN" ? "CNY" : "USD"
    }).format(amount)
  }
  
  // 格式化日期
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(dateObj)
  }
  
  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num)
  }
  
  // 上下文值
  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
    formatCurrency,
    formatDate,
    formatNumber
  }
  
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

// 使用语言钩子
export function useI18n() {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  
  return context
}

// 语言切换器组件
interface LocaleSwitcherProps {
  className?: string
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const { locale, setLocale } = useI18n()
  
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={className}
    >
      {SUPPORTED_LOCALES.map((localeOption) => (
        <option key={localeOption} value={localeOption}>
          {LOCALE_NAMES[localeOption]}
        </option>
      ))}
    </select>
  )
}
