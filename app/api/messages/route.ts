import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { getMessages, createMessage, getUsers } from "@/lib/actions/message-actions"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取消息列表
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
    const filter = searchParams.get("filter") || "all"
    const limit = parseInt(searchParams.get("limit") || "20")

    // 获取消息列表
    const messages = await getMessages(filter, limit)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("获取消息列表失败:", error)
    return NextResponse.json(
      { error: "获取消息列表失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建消息
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
    const { recipientIds, subject, content, type, priority } = data

    // 验证必填字段
    if (!subject || !content) {
      return NextResponse.json(
        { error: "主题和内容不能为空" },
        { status: 400 }
      )
    }

    if (!recipientIds || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "请选择接收者" },
        { status: 400 }
      )
    }

    // 创建消息
    const message = await createMessage({
      recipientIds,
      subject,
      content,
      type: type || "chat",
      priority: priority || "normal",
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "message",
      entityId: message.id,
      details: `发送消息: ${subject}`,
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("创建消息失败:", error)
    return NextResponse.json(
      { error: "创建消息失败" },
      { status: 500 }
    )
  }
}
