import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路径，不需要认证
  const publicPaths = ["/login", "/register", "/api/auth"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // 检查是否是API路由
  const isApiPath = pathname.startsWith("/api")

  // 获取token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // 如果是公开路径且用户已登录，重定向到首页
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 如果不是公开路径且用户未登录，重定向到登录页
  if (!isPublicPath && !token && !isApiPath) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // 权限控制
  if (token && pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  // 员工相关页面权限控制
  if (token && pathname.startsWith("/employees") && !pathname.includes("/profile")) {
    // 只有管理员或有员工ID的用户可以访问员工管理页面
    if (token.role !== "admin" && !token.employeeId) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    // 非管理员只能访问自己的员工页面
    if (token.role !== "admin" && token.employeeId) {
      const employeeIdInPath = pathname.split("/")[2]
      if (employeeIdInPath && Number(employeeIdInPath) !== token.employeeId) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
