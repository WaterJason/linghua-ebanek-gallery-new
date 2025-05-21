import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkUserPermission } from "@/lib/auth-middleware"

/**
 * 权限检查API
 * 检查当前用户是否拥有指定权限
 */
export async function GET(req: NextRequest) {
  try {
    // 获取权限代码
    const searchParams = req.nextUrl.searchParams
    const permissionCode = searchParams.get("code")

    if (!permissionCode) {
      return NextResponse.json({ error: "缺少权限代码" }, { status: 400 })
    }

    // 获取用户Token
    const token = await getToken({ req })
    
    if (!token || !token.id) {
      return NextResponse.json({ hasPermission: false }, { status: 200 })
    }

    // 检查权限
    const hasPermission = await checkUserPermission(token.id as string, permissionCode)
    
    return NextResponse.json({ hasPermission }, { status: 200 })
  } catch (error) {
    console.error("权限检查API错误:", error)
    return NextResponse.json({ error: "权限检查失败" }, { status: 500 })
  }
}
