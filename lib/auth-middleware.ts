import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/db"
import { permissionCache } from "@/lib/permission-cache"

/**
 * 检查用户是否有指定权限（带缓存优化）
 *
 * @param userId 用户ID
 * @param permissionCode 权限代码
 * @returns 是否有权限
 */
export async function checkUserPermission(userId: string, permissionCode: string): Promise<boolean> {
  try {
    // 使用权限缓存进行快速检查
    return await permissionCache.checkUserPermission(userId, permissionCode)
  } catch (error) {
    console.error("检查用户权限失败:", error)
    return false
  }
}

/**
 * 获取用户所有权限（带缓存优化）
 *
 * @param userId 用户ID
 * @returns 权限代码列表
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    // 使用权限缓存获取用户权限
    return await permissionCache.getUserPermissions(userId)
  } catch (error) {
    console.error("获取用户权限失败:", error)
    return []
  }
}

/**
 * 权限中间件
 * 用于保护API路由，确保只有拥有指定权限的用户才能访问
 *
 * @param req 请求对象
 * @param permissionCode 权限代码
 * @returns 响应对象或undefined（继续处理请求）
 */
export async function withPermission(req: NextRequest, permissionCode: string) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "linghua-enamel-gallery-secret-key-2024"
    })

    if (!token || !token.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const userId = token.id as string

    // 临时超级用户检查 - 如果是admin@linghua.com，直接通过
    if (token.email === "admin@linghua.com") {
      return undefined
    }

    const hasPermission = await checkUserPermission(userId, permissionCode)

    if (!hasPermission) {
      // 记录权限检查失败
      try {
        await prisma.systemLog.create({
          data: {
            module: "auth",
            level: "warning",
            message: `权限检查失败: ${permissionCode}`,
            details: JSON.stringify({
              userId,
              permissionCode,
              url: req.url,
              method: req.method,
            }),
            userId,
          },
        })
      } catch (logError) {
        console.error("记录权限检查失败日志失败:", logError)
      }

      return NextResponse.json({ error: "没有权限执行此操作" }, { status: 403 })
    }

    // 继续处理请求
    return undefined
  } catch (error) {
    console.error("权限中间件错误:", error)
    return NextResponse.json({ error: "权限检查失败" }, { status: 500 })
  }
}

/**
 * 角色中间件
 * 用于保护API路由，确保只有拥有指定角色的用户才能访问
 *
 * @param req 请求对象
 * @param roleCodes 角色代码或代码列表
 * @returns 响应对象或undefined（继续处理请求）
 */
export async function withRole(req: NextRequest, roleCodes: string | string[]) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "linghua-enamel-gallery-secret-key-2024"
    })

    if (!token || !token.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const userId = token.id as string
    const codes = Array.isArray(roleCodes) ? roleCodes : [roleCodes]

    // 获取用户角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })

    // 检查是否有指定角色
    const hasRole = userRoles.some(ur => codes.includes(ur.role.code))

    if (!hasRole) {
      // 记录角色检查失败
      try {
        await prisma.systemLog.create({
          data: {
            module: "auth",
            level: "warning",
            message: `角色检查失败: ${codes.join(", ")}`,
            details: JSON.stringify({
              userId,
              requiredRoles: codes,
              userRoles: userRoles.map(ur => ur.role.code),
              url: req.url,
              method: req.method,
            }),
            userId,
          },
        })
      } catch (logError) {
        console.error("记录角色检查失败日志失败:", logError)
      }

      return NextResponse.json({ error: "没有权限执行此操作" }, { status: 403 })
    }

    // 继续处理请求
    return undefined
  } catch (error) {
    console.error("角色中间件错误:", error)
    return NextResponse.json({ error: "权限检查失败" }, { status: 500 })
  }
}
