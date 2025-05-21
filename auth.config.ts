import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"

// 这是一个简化版的 auth 配置，专门用于中间件
// 中间件在 Edge Runtime 中运行，不能使用完整的 Auth.js 功能
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "用户名或邮箱", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("用户名/邮箱和密码不能为空")
        }

        try {
          // 尝试通过邮箱查找用户
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.identifier },
                { name: credentials.identifier }
              ]
            },
          })

          if (!user || !user.password) {
            throw new Error("用户不存在或密码错误")
          }

          const isPasswordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordMatch) {
            throw new Error("用户不存在或密码错误")
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw new Error("登录失败，请稍后再试")
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const pathname = request.nextUrl?.pathname || request.url

      // 公开路径，不需要认证
      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/api/auth"]
      const isOnPublicPage = publicPaths.some(path =>
        typeof pathname === 'string' ? pathname.startsWith(path) : pathname.pathname.startsWith(path)
      )

      // 如果是公开页面，允许访问
      if (isOnPublicPage) {
        return true
      }

      // 如果用户已登录，允许访问
      return isLoggedIn
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "linghua-enamel-gallery-secret-key-2024",
}
