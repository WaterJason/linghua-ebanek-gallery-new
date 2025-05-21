import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { 
  getFinancialCategories, 
  createFinancialCategory,
  initializeFinancialCategories
} from "@/lib/actions/finance-actions"

/**
 * 获取所有收支分类
 */
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    const includeInactive = searchParams.get("includeInactive") === "true"
    const initialize = searchParams.get("initialize") === "true"

    // 如果请求初始化，则创建系统预设分类
    if (initialize) {
      const categories = await initializeFinancialCategories()
      return NextResponse.json(categories)
    }

    const categories = await getFinancialCategories(type, includeInactive)
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching financial categories:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取收支分类失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建收支分类
 */
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()
    const category = await createFinancialCategory(data)
    return NextResponse.json(category)
  } catch (error) {
    console.error("Error creating financial category:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建收支分类失败" },
      { status: 500 }
    )
  }
}
