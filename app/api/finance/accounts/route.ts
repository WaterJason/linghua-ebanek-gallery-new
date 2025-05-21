import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getFinancialAccounts,
  createFinancialAccount
} from "@/lib/actions/finance-actions"

/**
 * 获取所有资金账户
 */
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    const accounts = await getFinancialAccounts(includeInactive)
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching financial accounts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取资金账户失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建资金账户
 */
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()
    const account = await createFinancialAccount(data)
    return NextResponse.json(account)
  } catch (error) {
    console.error("Error creating financial account:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建资金账户失败" },
      { status: 500 }
    )
  }
}
