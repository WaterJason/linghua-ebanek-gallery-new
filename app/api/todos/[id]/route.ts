import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { updateTodoStatus, deleteTodo } from "@/lib/actions/system-actions"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 更新待办事项
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

    // 获取请求数据
    const data = await req.json()
    const { completed } = data

    // 更新待办事项状态
    const todo = await updateTodoStatus(params.id, completed)

    // 记录审计日志
    await createAuditLog({
      action: "update",
      entityType: "todo",
      entityId: params.id,
      details: `${completed ? "完成" : "取消完成"}待办事项: ${todo.title}`,
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error("更新待办事项失败:", error)
    return NextResponse.json(
      { error: "更新待办事项失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除待办事项
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

    // 删除待办事项
    await deleteTodo(params.id)

    // 记录审计日志
    await createAuditLog({
      action: "delete",
      entityType: "todo",
      entityId: params.id,
      details: `删除待办事项: ${params.id}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除待办事项失败:", error)
    return NextResponse.json(
      { error: "删除待办事项失败" },
      { status: 500 }
    )
  }
}
