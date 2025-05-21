import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createBackup } from "@/lib/backup"

export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取请求数据
    const data = await request.json()
    const reason = data.reason || "manual"

    // 创建备份
    const backupPath = await createBackup(reason)
    
    return NextResponse.json({ success: true, path: backupPath })
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    )
  }
}
