/**
 * 全局中间件
 *
 * 处理请求的中间件，包括认证、监控、错误处理等功能。
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from 'next/headers'

export function middleware(request: NextRequest) {
  // 添加请求ID和性能监控
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;

  // 公开路径，不需要认证
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/unauthorized",
    "/api/auth"
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

  // 特殊处理 NextAuth 会话路径
  const isNextAuthPath = pathname === "/api/auth/session" ||
                        pathname.startsWith("/api/auth/callback") ||
                        pathname.startsWith("/api/auth/signin") ||
                        pathname.startsWith("/api/auth/signout")

  // 检查是否是API路由
  const isApiPath = pathname.startsWith("/api")

  // 检查是否有会话 Cookie
  const authCookie = request.cookies.get("next-auth.session-token") ||
                    request.cookies.get("__Secure-next-auth.session-token")
  const hasSession = !!authCookie?.value

  // 检查是否是超级管理员
  const isSuperAdmin = request.cookies.has("is_super_admin")

  // 如果是超级管理员，设置标记以确保拥有所有权限
  if (isSuperAdmin) {
    const response = NextResponse.next()
    response.cookies.set("check_super_admin_permissions", "true")
    return response
  }

  // 静态资源和NextAuth路径直接放行
  if (isStaticPath || isNextAuthPath) {
    return NextResponse.next()
  }

  // 如果是公开路径且用户已登录，重定向到首页
  if (isPublicPath && hasSession && pathname !== "/api/auth") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 如果不是公开路径且用户未登录，重定向到登录页
  if (!isPublicPath && !hasSession && !isApiPath) {
    // 对于直接访问的页面，重定向到未授权页面
    if (request.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    // 对于AJAX请求，重定向到登录页
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // API路由的认证检查（除了公开API路由外）
  if (isApiPath && !isPublicPath && !isNextAuthPath && !hasSession) {
    return NextResponse.json({
      error: "未授权，请先登录",
      code: "UNAUTHORIZED"
    }, { status: 401 })
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
