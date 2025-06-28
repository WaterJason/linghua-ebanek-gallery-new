import { NextRequest, NextResponse } from "next/server"
import { getServerSession, isAdmin } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取通知列表
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")
    const read = searchParams.get("read") === "true" ? true : 
                 searchParams.get("read") === "false" ? false : undefined
    const type = searchParams.get("type") || undefined

    // 构建查询条件
    const where: any = {
      userId: session.user.id,
    }

    if (read !== undefined) {
      where.read = read
    }

    if (type) {
      where.type = type
    }

    // 查询通知
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100), // 限制最大返回数量
      skip: offset,
    })

    // 查询总数
    const total = await prisma.notification.count({ where })

    // 记录审计日志
    await createAuditLog({
      action: "view",
      entityType: "other",
      entityId: "notifications",
      details: `查看通知列表，共 ${notifications.length} 条`,
    })

    return NextResponse.json({
      notifications,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("获取通知列表失败:", error)
    return NextResponse.json(
      { error: "获取通知列表失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建通知
 */
export async function POST(req: NextRequest) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取请求数据
    const data = await req.json()
    const { userId, title, message, type, priority, link, expiresAt } = data

    // 验证必填字段
    if (!userId || !title || !message || !type || !priority) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 创建通知
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        link,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "other",
      entityId: notification.id,
      details: `创建通知: ${title}`,
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error("创建通知失败:", error)
    return NextResponse.json(
      { error: "创建通知失败" },
      { status: 500 }
    )
  }
}

/**
 * 批量创建通知
 */
export async function PUT(req: NextRequest) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取请求数据
    const data = await req.json()
    const { userIds, title, message, type, priority, link, expiresAt } = data

    // 验证必填字段
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message || !type || !priority) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 创建通知数据
    const notificationsData = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
      priority,
      link,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }))

    // 批量创建通知
    const result = await prisma.notification.createMany({
      data: notificationsData,
      skipDuplicates: true,
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "other",
      entityId: "bulk-notifications",
      details: `批量创建通知: ${title}，共 ${result.count} 条`,
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error("批量创建通知失败:", error)
    return NextResponse.json(
      { error: "批量创建通知失败" },
      { status: 500 }
    )
  }
}
