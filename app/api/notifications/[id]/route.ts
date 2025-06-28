import { NextRequest, NextResponse } from "next/server"
import { getServerSession, isAdmin } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取单个通知
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = params.id

    // 查询通知
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    // 检查通知是否存在
    if (!notification) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 })
    }

    // 检查通知是否属于当前用户
    if (notification.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "无权访问此通知" }, { status: 403 })
    }

    // 记录审计日志
    await createAuditLog({
      action: "view",
      entityType: "other",
      entityId: id,
      details: `查看通知: ${notification.title}`,
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error("获取通知失败:", error)
    return NextResponse.json(
      { error: "获取通知失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新通知（标记为已读/未读）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = params.id

    // 获取请求数据
    const data = await req.json()
    const { read } = data

    // 查询通知
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    // 检查通知是否存在
    if (!notification) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 })
    }

    // 检查通知是否属于当前用户
    if (notification.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "无权修改此通知" }, { status: 403 })
    }

    // 更新通知
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read },
    })

    // 记录审计日志
    await createAuditLog({
      action: "update",
      entityType: "other",
      entityId: id,
      details: `${read ? "标记通知为已读" : "标记通知为未读"}: ${notification.title}`,
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error("更新通知失败:", error)
    return NextResponse.json(
      { error: "更新通知失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除通知
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = params.id

    // 查询通知
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    // 检查通知是否存在
    if (!notification) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 })
    }

    // 检查通知是否属于当前用户
    if (notification.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "无权删除此通知" }, { status: 403 })
    }

    // 删除通知
    await prisma.notification.delete({
      where: { id },
    })

    // 记录审计日志
    await createAuditLog({
      action: "delete",
      entityType: "other",
      entityId: id,
      details: `删除通知: ${notification.title}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除通知失败:", error)
    return NextResponse.json(
      { error: "删除通知失败" },
      { status: 500 }
    )
  }
}
