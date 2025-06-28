import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 标记所有通知为已读
 */
export async function POST(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取请求数据
    const data = await req.json()
    const { type } = data

    // 构建查询条件
    const where: any = {
      userId: session.user.id,
      read: false,
    }

    if (type) {
      where.type = type
    }

    // 更新通知
    const result = await prisma.notification.updateMany({
      where,
      data: { read: true },
    })

    // 记录审计日志
    await createAuditLog({
      action: "update",
      entityType: "other",
      entityId: "mark-all-read",
      details: `标记所有${type ? `${type}类型的` : ""}通知为已读，共 ${result.count} 条`,
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error("标记所有通知为已读失败:", error)
    return NextResponse.json(
      { error: "标记所有通知为已读失败" },
      { status: 500 }
    )
  }
}
