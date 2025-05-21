import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 获取员工关联的用户
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const employeeId = Number(params.id)

    // 检查员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: "员工不存在" }, { status: 404 })
    }

    // 获取关联的用户
    const user = await prisma.user.findFirst({
      where: { employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json(null)
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("获取员工关联用户失败:", error)
    return NextResponse.json(
      { error: "获取员工关联用户失败" },
      { status: 500 }
    )
  }
}

// 关联员工和用户
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const employeeId = Number(params.id)
    const { userId } = await request.json()

    // 检查员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: "员工不存在" }, { status: 404 })
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 检查用户是否已关联其他员工
    if (user.employeeId && user.employeeId !== employeeId) {
      return NextResponse.json(
        { error: "该用户已关联其他员工" },
        { status: 400 }
      )
    }

    // 检查员工是否已关联其他用户
    const existingUser = await prisma.user.findFirst({
      where: { employeeId },
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: "该员工已关联其他用户" },
        { status: 400 }
      )
    }

    // 关联员工和用户
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        image: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("关联员工和用户失败:", error)
    return NextResponse.json(
      { error: "关联员工和用户失败" },
      { status: 500 }
    )
  }
}

// 解除员工和用户的关联
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const employeeId = Number(params.id)

    // 检查员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: "员工不存在" }, { status: 404 })
    }

    // 获取关联的用户
    const user = await prisma.user.findFirst({
      where: { employeeId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "该员工未关联任何用户" },
        { status: 404 }
      )
    }

    // 解除关联
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("解除员工和用户关联失败:", error)
    return NextResponse.json(
      { error: "解除员工和用户关联失败" },
      { status: 500 }
    )
  }
}
