import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import nodemailer from "nodemailer"

/**
 * 请求密码重置
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { email } = data

    if (!email) {
      return NextResponse.json({ error: "邮箱地址为必填项" }, { status: 400 })
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // 为了安全，不告诉用户邮箱不存在
      return NextResponse.json({ success: true })
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    // 保存重置令牌
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // 发送重置邮件
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      secure: process.env.EMAIL_SERVER_PORT === "465",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // 发送邮件
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "密码重置请求",
      text: `您好，\n\n请点击以下链接重置您的密码：\n\n${resetUrl}\n\n如果您没有请求重置密码，请忽略此邮件。\n`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">密码重置请求</h2>
          <p>您好，</p>
          <p>我们收到了重置您账户密码的请求。请点击下面的按钮重置密码：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">重置密码</a>
          </div>
          <p>或者，您可以复制以下链接到浏览器地址栏：</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>此链接将在24小时后失效。</p>
          <p>如果您没有请求重置密码，请忽略此邮件，您的账户将保持安全。</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #777; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "auth",
        level: "info",
        message: `密码重置请求: ${email}`,
        details: JSON.stringify({
          userId: user.id,
          email,
          resetTokenExpiry,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("密码重置请求失败:", error)
    return NextResponse.json({ error: "密码重置请求失败" }, { status: 500 })
  }
}

/**
 * 执行密码重置
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { token, password } = data

    if (!token || !password) {
      return NextResponse.json({ error: "令牌和密码为必填项" }, { status: 400 })
    }

    // 检查令牌是否有效
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "无效或已过期的令牌" }, { status: 400 })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 更新用户密码并清除重置令牌
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "auth",
        level: "info",
        message: `密码重置成功: ${user.email}`,
        details: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("密码重置失败:", error)
    return NextResponse.json({ error: "密码重置失败" }, { status: 500 })
  }
}
