import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { 
  getFinancialTransactions, 
  createFinancialTransaction 
} from "@/lib/actions/finance-actions"

/**
 * 获取财务交易记录
 */
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId") ? parseInt(searchParams.get("accountId")) : undefined
    const categoryId = searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")) : undefined
    const type = searchParams.get("type") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")) : 50
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")) : 0

    const transactions = await getFinancialTransactions(
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      limit,
      offset
    )
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching financial transactions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取财务交易记录失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建财务交易记录
 */
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()
    
    // 添加创建人ID
    if (session.user?.id) {
      data.createdById = session.user.id
    }
    
    const transaction = await createFinancialTransaction(data)
    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error creating financial transaction:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建财务交易记录失败" },
      { status: 500 }
    )
  }
}
