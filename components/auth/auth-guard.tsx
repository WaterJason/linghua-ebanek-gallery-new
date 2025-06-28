"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  // 公开路径，不需要认证
  const publicPaths = [
    "/login",
    "/register", 
    "/forgot-password",
    "/reset-password",
    "/unauthorized",
    "/login-debug"
  ]

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  useEffect(() => {
    console.log("AuthGuard - 状态:", { status, session: !!session, pathname, isPublicPath })

    if (status === "loading") {
      setIsLoading(true)
      return
    }

    setIsLoading(false)

    // 如果是公开路径，不需要认证
    if (isPublicPath) {
      // 如果用户已登录且在登录页面，重定向到仪表板
      if (session && pathname === "/login") {
        console.log("用户已登录，从登录页重定向到仪表板")
        router.push("/dashboard")
      }
      return
    }

    // 如果不是公开路径且用户未登录，重定向到登录页
    if (!session) {
      console.log("用户未登录，重定向到登录页")
      const callbackUrl = encodeURIComponent(pathname)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    console.log("认证检查通过，用户:", session.user?.email)
  }, [status, session, pathname, isPublicPath, router])

  // 显示加载状态
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    )
  }

  // 如果是公开路径，直接渲染
  if (isPublicPath) {
    return <>{children}</>
  }

  // 如果用户未登录，显示空白（重定向正在进行）
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在跳转到登录页...</p>
        </div>
      </div>
    )
  }

  // 用户已认证，渲染子组件
  return <>{children}</>
}
