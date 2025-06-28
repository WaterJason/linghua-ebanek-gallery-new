import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "登录 - 聆花掐丝珐琅馆管理系统",
  description: "登录到聆花掐丝珐琅馆管理系统",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
