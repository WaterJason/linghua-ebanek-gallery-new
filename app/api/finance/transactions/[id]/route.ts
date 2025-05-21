import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { 
  getFinancialTransaction, 
  updateFinancialTransaction, 
  deleteFinancialTransaction 
} from "@/lib/actions/finance-actions"

/**
 * 获取单个财务交易记录
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

    const transaction = await getFinancialTransaction(id)
    if (!transaction) {
      return NextResponse.json({ error: "财务交易记录不存在" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error(`Error fetching financial transaction (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取财务交易记录失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新财务交易记录
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
    const transaction = await updateFinancialTransaction(id, data)
    return NextResponse.json(transaction)
  } catch (error) {
    console.error(`Error updating financial transaction (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新财务交易记录失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除财务交易记录
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

    const result = await deleteFinancialTransaction(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error deleting financial transaction (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除财务交易记录失败" },
      { status: 500 }
    )
  }
}
