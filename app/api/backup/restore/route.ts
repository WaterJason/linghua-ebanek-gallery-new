import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { restoreBackup } from "@/lib/backup"

export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取请求数据
    const data = await request.json()
    const { filePath, reason } = data

    if (!filePath) {
      return NextResponse.json({ error: "缺少文件路径参数" }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: "缺少恢复原因参数" }, { status: 400 })
    }

    // 恢复备份
    const result = await restoreBackup(filePath)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error restoring backup:", error)
    return NextResponse.json(
      { error: "Failed to restore backup", message: error.message },
      { status: 500 }
    )
  }
}
