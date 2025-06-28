import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "用户名或邮箱", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 [NextAuth] =================================")
        console.log("🔐 [NextAuth] 开始认证流程")
        console.log("🔐 [NextAuth] 时间:", new Date().toISOString())
        console.log("🔐 [NextAuth] 凭证:", {
          identifier: credentials?.identifier,
          hasPassword: !!credentials?.password,
          passwordLength: credentials?.password?.length || 0
        })

        // 验证凭证完整性
        if (!credentials?.identifier || !credentials?.password) {
          console.log("❌ [NextAuth] 凭证不完整，拒绝认证")
          console.log("❌ [NextAuth] identifier:", !!credentials?.identifier)
          console.log("❌ [NextAuth] password:", !!credentials?.password)
          return null
        }

        try {
          console.log("🔍 [NextAuth] 开始查找用户:", credentials.identifier)

          // 查找用户 - 支持邮箱和用户名登录
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.identifier as string },
                { name: credentials.identifier as string }
              ]
            },
            include: {
              employee: true,
            },
          })

          if (!user) {
            console.log("❌ [NextAuth] 用户不存在:", credentials.identifier)
            console.log("❌ [NextAuth] 查找条件: email或name =", credentials.identifier)
            return null
          }

          console.log("✅ [NextAuth] 用户找到:", {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasPassword: !!user.password,
            employeeId: user.employeeId
          })

          // 验证密码是否设置
          if (!user.password) {
            console.log("❌ [NextAuth] 用户密码未设置:", user.email)
            return null
          }

          // 验证密码
          console.log("🔑 [NextAuth] 开始密码验证")
          console.log("🔑 [NextAuth] 输入密码长度:", credentials.password.length)
          console.log("🔑 [NextAuth] 存储密码哈希长度:", user.password.length)

          const isPasswordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordMatch) {
            console.log("❌ [NextAuth] 密码验证失败:", user.email)
            console.log("❌ [NextAuth] 输入密码:", credentials.password)
            console.log("❌ [NextAuth] 密码哈希前缀:", user.password.substring(0, 20))
            return null
          }

          console.log("✅ [NextAuth] 密码验证成功:", user.email)

          // 记录登录历史
          try {
            await prisma.userLoginHistory.create({
              data: {
                userId: user.id,
                ipAddress: "127.0.0.1",
                userAgent: "NextAuth-Credentials",
                loginTime: new Date(),
                status: "success"
              }
            })

            // 更新最后登录时间
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() }
            })

            console.log("✅ [NextAuth] 登录历史已记录")
          } catch (historyError) {
            console.log("⚠️ [NextAuth] 记录登录历史失败:", historyError.message)
            // 不因为历史记录失败而阻止登录
          }

          // 构建返回的用户对象
          const authUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            employeeName: user.employee?.name || null,
            employeePosition: user.employee?.position || null,
          }

          console.log("✅ [NextAuth] 认证成功，返回用户对象:", authUser)
          console.log("🔐 [NextAuth] 认证流程完成 =================================")
          return authUser

        } catch (error) {
          console.error("❌ [NextAuth] 认证过程发生异常:", error)
          console.error("❌ [NextAuth] 错误堆栈:", error.stack)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("🚪 [NextAuth] signIn回调:", { user: user ? { id: user.id, email: user.email } : null })
      const result = !!user
      console.log("🚪 [NextAuth] signIn结果:", result)
      return result
    },
    async jwt({ token, user }) {
      console.log("🎫 [NextAuth] JWT回调:", { hasUser: !!user, tokenId: token.id })
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employeeId = user.employeeId
        token.employeeName = user.employeeName
        token.employeePosition = user.employeePosition
        console.log("🎫 [NextAuth] JWT更新:", { id: token.id, role: token.role })
      }
      return token
    },
    async session({ session, token }) {
      console.log("📋 [NextAuth] Session回调:", { hasSession: !!session.user, tokenId: token.id })
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.employeeId = token.employeeId as number
        session.user.employeeName = token.employeeName as string
        session.user.employeePosition = token.employeePosition as string
        console.log("📋 [NextAuth] Session更新:", { id: session.user.id, email: session.user.email })
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24小时
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // 信任主机，解决开发环境问题
  useSecureCookies: process.env.NODE_ENV === "production",
  skipCSRFCheck: process.env.NODE_ENV === "development", // 开发环境跳过CSRF检查
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  }
}

const nextAuth = NextAuth(authConfig)

export const { handlers, auth, signIn, signOut } = nextAuth
export default nextAuth
