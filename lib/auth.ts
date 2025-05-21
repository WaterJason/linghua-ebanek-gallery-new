import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"
import { initAccountSystem } from "@/lib/init-account-system"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { createLogger } from "@/lib/logger"

// 创建认证模块的日志记录器
const authLogger = createLogger("认证系统")

// 初始化账号管理系统
// 这将在应用启动时运行一次
initAccountSystem().catch(error => {
  console.error("初始化账号管理系统失败:", error)
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
            include: {
              employee: true,
            },
          })

          if (!user || !user.password) {
            // 记录登录失败日志
            await authLogger.warning(
              "登录失败: 用户不存在",
              `尝试使用标识符 "${credentials.identifier}" 登录，但用户不存在`
            )
            throw new Error("用户不存在或密码错误")
          }

          const isPasswordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordMatch) {
            // 记录密码错误日志
            await authLogger.warning(
              "登录失败: 密码错误",
              `用户 "${user.email || user.name}" 尝试登录，但密码不正确`,
              user.id
            )
            throw new Error("用户不存在或密码错误")
          }

          // 记录登录历史
          await prisma.userLoginHistory.create({
            data: {
              userId: user.id,
              ipAddress: "127.0.0.1", // 在实际环境中，应该从请求中获取
              userAgent: "Unknown", // 在实际环境中，应该从请求中获取
              loginTime: new Date(),
              status: "success"
            }
          })

          // 更新最后登录时间
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            employeeName: user.employee?.name,
            employeePosition: user.employee?.position,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw new Error("登录失败，请稍后再试")
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 只有凭证登录，不需要额外处理
      return true
    },
    async jwt({ token, user, trigger }) {
      // 初始登录
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employeeId = user.employeeId
        token.employeeName = user.employeeName
        token.employeePosition = user.employeePosition

        // 获取用户角色
        if (user.id) {
          try {
            const userRoles = await prisma.userRole.findMany({
              where: { userId: user.id },
              include: { role: true },
            })

            token.roles = userRoles.map(ur => ({
              id: ur.role.id,
              name: ur.role.name,
              code: ur.role.code,
            }))
          } catch (error) {
            console.error("获取用户角色失败:", error)
            token.roles = []
          }
        }
      }

      // 会话更新
      if (trigger === "update") {
        // 重新获取用户角色
        try {
          const userRoles = await prisma.userRole.findMany({
            where: { userId: token.id as string },
            include: { role: true },
          })

          token.roles = userRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            code: ur.role.code,
          }))
        } catch (error) {
          console.error("更新会话时获取用户角色失败:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.employeeId = token.employeeId as number
        session.user.employeeName = token.employeeName as string
        session.user.employeePosition = token.employeePosition as string
        session.user.roles = token.roles as any[] || []

        // 添加权限检查辅助函数
        session.user.hasPermission = function(permissionCode: string) {
          const roles = this.roles || []

          // 超级管理员拥有所有权限 - 检查角色代码
          if (roles.some(r => r.code === "super_admin")) {
            return true
          }

          // 超级管理员拥有所有权限 - 检查邮箱
          if (this.email === "admin@linghua.com") {
            return true
          }

          // 兼容旧版本：admin 角色也拥有所有权限
          if (this.role === "admin") {
            return true
          }

          // 基本权限检查 - 所有用户都有的基本权限
          if (permissionCode === "products.view" ||
              permissionCode === "inventory.view" ||
              permissionCode === "employees.view") {
            return true
          }

          // 编辑权限检查
          if (permissionCode === "products.edit" ||
              permissionCode === "inventory.edit" ||
              permissionCode === "employees.edit") {
            return roles.some(r => r.code === "editor" || r.code === "manager")
          }

          // 管理权限检查
          if (permissionCode === "permissions.edit" ||
              permissionCode === "users.edit") {
            return roles.some(r => r.code === "manager")
          }

          return false
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  secret: process.env.NEXTAUTH_SECRET || "linghua-enamel-gallery-secret-key-2024",
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user }) {
      // 记录登录事件
      try {
        await authLogger.info(
          `用户登录: ${user.email || user.name}`,
          JSON.stringify({
            provider: "credentials",
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            timestamp: new Date().toISOString()
          }),
          user.id
        )
      } catch (error) {
        console.error("记录登录事件失败:", error)
      }
    },
    async signOut({ token }) {
      // 记录登出事件
      try {
        if (token?.id) {
          await authLogger.info(
            `用户登出`,
            JSON.stringify({
              userId: token.id,
              email: token.email,
              name: token.name,
              timestamp: new Date().toISOString()
            }),
            token.id as string
          )
        }
      } catch (error) {
        console.error("记录登出事件失败:", error)
      }
    },
  },
}
