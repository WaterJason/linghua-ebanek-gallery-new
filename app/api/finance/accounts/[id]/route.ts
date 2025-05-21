import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount
} from "@/lib/actions/finance-actions"

/**
 * 获取单个资金账户
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const account = await getFinancialAccount(id)
    if (!account) {
      return NextResponse.json({ error: "资金账户不存在" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error(`Error fetching financial account (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取资金账户失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新资金账户
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const data = await request.json()
    const account = await updateFinancialAccount(id, data)
    return NextResponse.json(account)
  } catch (error) {
    console.error(`Error updating financial account (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新资金账户失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除资金账户
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const result = await deleteFinancialAccount(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error deleting financial account (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除资金账户失败" },
      { status: 500 }
    )
  }
}
