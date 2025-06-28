"use client"

import React from "react"

// 支持的语言
export type Locale = "zh-CN" | "en-US"

// 语言名称映射
export const LOCALE_NAMES: Record<Locale, string> = {
  "zh-CN": "中文",
  "en-US": "English",
}

// 支持的语言列表
export const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en-US"]

// 默认语言
export const DEFAULT_LOCALE: Locale = "zh-CN"

// 简化版的 I18n Provider 组件
export function I18nProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

// 简化版的 useI18n 钩子
export function useI18n() {
  return {
    locale: "zh-CN" as Locale,
    setLocale: (locale: Locale) => {},
    t: (key: string) => key,
  }
}
