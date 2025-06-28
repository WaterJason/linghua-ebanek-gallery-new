import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { globalSearch, SearchResultType } from "@/lib/actions/search-actions"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 全局搜索API
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
    const query = searchParams.get("query")
    const typesParam = searchParams.get("types")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // 验证查询参数
    if (!query) {
      return NextResponse.json(
        { error: "缺少查询参数" },
        { status: 400 }
      )
    }

    // 解析类型参数
    let types: SearchResultType[] | undefined
    if (typesParam) {
      try {
        types = JSON.parse(typesParam) as SearchResultType[]
      } catch (error) {
        console.error("解析类型参数失败:", error)
      }
    }

    // 执行搜索
    const result = await globalSearch({
      query,
      types,
      limit,
      offset,
    })

    // 记录审计日志
    await createAuditLog({
      action: "search",
      entityType: "other",
      entityId: "global-search",
      details: `全局搜索: ${query}，找到 ${result.total} 条结果`,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("全局搜索失败:", error)
    return NextResponse.json(
      { error: "全局搜索失败" },
      { status: 500 }
    )
  }
}
