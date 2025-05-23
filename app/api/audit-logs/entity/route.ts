import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

/**
 * 获取实体的审计日志
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const limit = parseInt(searchParams.get("limit") || "10")

    // 验证必填参数
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "实体类型和实体ID为必填项" },
        { status: 400 }
      )
    }

    // 查询审计日志
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 100), // 限制最大返回数量
    })

    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error("获取实体审计日志失败:", error)
    return NextResponse.json(
      { error: "获取实体审计日志失败" },
      { status: 500 }
    )
  }
}
