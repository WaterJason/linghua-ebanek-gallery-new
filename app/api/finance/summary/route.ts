import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { 
  getFinancialSummary,
  getAccountBalances
} from "@/lib/actions/finance-actions"

/**
 * 获取财务统计数据
 */
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "summary"
    
    // 获取账户余额
    if (type === "balances") {
      const includeInactive = searchParams.get("includeInactive") === "true"
      const balances = await getAccountBalances(includeInactive)
      return NextResponse.json(balances)
    }
    
    // 获取财务统计数据
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "开始日期和结束日期为必填项" },
        { status: 400 }
      )
    }
    
    const summary = await getFinancialSummary(startDate, endDate)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching financial summary:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取财务统计数据失败" },
      { status: 500 }
    )
  }
}
