import type { NextAuthConfig } from "next-auth"

// 简化的认证配置，专门用于中间件
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnLogin = nextUrl.pathname.startsWith('/login')
      
      // 如果在受保护的页面但未登录，重定向到登录页
      if (isOnDashboard && !isLoggedIn) {
        return false
      }
      
      // 如果已登录但在登录页，重定向到仪表板
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      return true
    },
  },
  providers: [], // 中间件不需要providers
}
