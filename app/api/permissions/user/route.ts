import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getUserPermissions } from "@/lib/auth-middleware"

/**
 * 获取用户权限API
 * 返回当前用户拥有的所有权限
 */
export async function GET(req: NextRequest) {
  try {
    // 获取用户Token
    const token = await getToken({ req })
    
    if (!token || !token.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取用户权限
    const permissions = await getUserPermissions(token.id as string)
    
    return NextResponse.json({ permissions }, { status: 200 })
  } catch (error) {
    console.error("获取用户权限API错误:", error)
    return NextResponse.json({ error: "获取用户权限失败" }, { status: 500 })
  }
}
