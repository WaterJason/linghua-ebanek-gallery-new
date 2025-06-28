import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getToken } from "next-auth/jwt"

/**
 * 调试API - 获取权限和角色数据（无权限检查）
 */
export async function GET(req: NextRequest) {
  try {
    console.log("调试API被调用")
    
    // 获取Token信息（用于调试）
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "linghua-enamel-gallery-secret-key-2024"
    })
    
    console.log("调试API Token信息:", token ? `用户=${token.email}` : '无Token')
    
    // 直接从数据库获取数据，不进行权限检查
    const [permissions, roles] = await Promise.all([
      prisma.permission.findMany({
        orderBy: [
          { module: "asc" },
          { name: "asc" },
        ],
      }),
      prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      })
    ])
    
    // 格式化角色数据
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map(rp => rp.permission),
    }))
    
    const result = {
      permissions,
      roles: formattedRoles,
      token: token ? {
        email: token.email,
        name: token.name,
        id: token.id,
        role: token.role
      } : null,
      timestamp: new Date().toISOString(),
      counts: {
        permissions: permissions.length,
        roles: roles.length
      }
    }
    
    console.log("调试API返回数据:", {
      permissions: permissions.length,
      roles: roles.length,
      hasToken: !!token
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("调试API失败:", error)
    return NextResponse.json({ 
      error: "调试API失败",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
