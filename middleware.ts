/**
 * 全局中间件 - 简化版本专注于认证
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径，不需要认证
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/unauthorized",
    "/login-debug",
    "/login-test"
  ]

  // 静态资源路径，不需要认证
  const staticPaths = [
    "/_next",
    "/favicon.ico",
    "/placeholder.svg",
    "/placeholder-logo.png",
    "/images",
    "/fonts"
  ]

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  const isStaticPath = staticPaths.some((path) => pathname.startsWith(path))
  const isNextAuthPath = pathname.startsWith("/api/auth")
  const isApiPath = pathname.startsWith("/api")

  // 静态资源和NextAuth API路径直接放行
  if (isStaticPath || isNextAuthPath) {
    return NextResponse.next()
  }

  // 检查会话Cookie
  const authCookie = request.cookies.get("next-auth.session-token") ||
                    request.cookies.get("__Secure-next-auth.session-token")
  const hasSession = !!authCookie?.value

  // 如果是公开路径且用户已登录，重定向到仪表盘
  if (isPublicPath && hasSession && pathname !== "/logout") {
    console.log("用户已登录，从", pathname, "重定向到 /dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // 如果不是公开路径且用户未登录，重定向到登录页
  if (!isPublicPath && !hasSession && !isApiPath) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// 匹配所有路径，除了静态资源
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - 静态资源 (_next/static, _next/image, favicon.ico等)
     * - 公共资源 (images, fonts等)
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|images/|fonts/|placeholder.svg|placeholder-logo.png).*)"
  ],
}
