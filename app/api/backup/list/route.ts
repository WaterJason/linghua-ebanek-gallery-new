import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getBackupsList } from "@/lib/backup"

export async function GET() {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取备份列表
    const backups = getBackupsList()
    
    return NextResponse.json(backups)
  } catch (error) {
    console.error("Error fetching backup list:", error)
    return NextResponse.json(
      { error: "Failed to fetch backup list" },
      { status: 500 }
    )
  }
}
