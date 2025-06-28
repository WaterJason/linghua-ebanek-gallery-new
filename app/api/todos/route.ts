import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { getTodoList, createTodo } from "@/lib/actions/system-actions"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取待办事项列表
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const filter = searchParams.get("filter") || "all"

    // 获取待办事项列表
    const todos = await getTodoList(limit, filter)

    return NextResponse.json(todos)
  } catch (error) {
    console.error("获取待办事项列表失败:", error)
    return NextResponse.json(
      { error: "获取待办事项列表失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建待办事项
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
    const { title, description, type, priority, dueDate, link } = data

    // 验证必填字段
    if (!title) {
      return NextResponse.json(
        { error: "标题不能为空" },
        { status: 400 }
      )
    }

    // 创建待办事项
    const todo = await createTodo({
      title,
      description,
      type: type || "other",
      priority: priority || "medium",
      dueDate,
      link,
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "todo",
      entityId: todo.id,
      details: `创建待办事项: ${title}`,
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error("创建待办事项失败:", error)
    return NextResponse.json(
      { error: "创建待办事项失败" },
      { status: 500 }
    )
  }
}
