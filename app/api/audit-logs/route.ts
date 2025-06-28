import { NextRequest, NextResponse } from "next/server"
import { getServerSession, isAdmin } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

/**
 * 获取审计日志列表
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // 构建查询条件
    const where: any = {}

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.timestamp = {}

      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }

      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    // 查询审计日志
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 1000), // 限制最大返回数量
      skip: offset,
    })

    // 查询总数
    const total = await prisma.auditLog.count({ where })

    return NextResponse.json({
      auditLogs,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("获取审计日志列表失败:", error)
    return NextResponse.json(
      { error: "获取审计日志列表失败" },
      { status: 500 }
    )
  }
}
