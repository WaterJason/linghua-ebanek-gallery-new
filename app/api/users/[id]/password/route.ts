import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { getToken } from "next-auth/jwt"

/**
 * 更新用户密码
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取用户Token
    const token = await getToken({ req })
    
    if (!token || !token.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }
    
    const userId = params.id
    
    // 只允许用户更改自己的密码
    if (token.id !== userId) {
      return NextResponse.json({ error: "无权更改其他用户的密码" }, { status: 403 })
    }
    
    const data = await req.json()
    const { currentPassword, newPassword } = data
    
    // 验证必填字段
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "当前密码和新密码为必填项" }, { status: 400 })
    }
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    
    if (!user || !user.password) {
      return NextResponse.json({ error: "用户不存在或无法更改密码" }, { status: 404 })
    }
    
    // 验证当前密码
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 })
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    })
    
    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "users",
        level: "info",
        message: `密码更新: ${user.email}`,
        details: JSON.stringify({
          userId,
          email: user.email,
        }),
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("更新密码失败:", error)
    return NextResponse.json({ error: "更新密码失败" }, { status: 500 })
  }
}
