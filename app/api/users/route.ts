import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { withPermission } from "@/lib/auth-middleware"

// 获取所有用户
export async function GET(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "users.view")
    if (permissionCheck) return permissionCheck

    // 获取用户列表
    const users = await prisma.user.findMany({
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // 格式化用户数据
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      employeeId: user.employeeId,
      employeeName: user.employee?.name,
      employeePosition: user.employee?.position,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map(ur => ({
        id: ur.id,
        userId: ur.userId,
        roleId: ur.roleId,
        role: ur.role,
        createdAt: ur.createdAt,
        updatedAt: ur.updatedAt,
      })),
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("获取用户列表失败:", error)
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}

// 创建新用户
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "users.create")
    if (permissionCheck) return permissionCheck

    // 获取请求数据
    const data = await req.json()
    const { name, email, password, employeeId, roleIds } = data

    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json({ error: "姓名、邮箱和密码为必填项" }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "邮箱已被使用" }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "user", // 默认角色
        employeeId: employeeId || null,
      },
    })

    // 分配角色
    if (roleIds && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: number) => ({
          userId: user.id,
          roleId,
        })),
        skipDuplicates: true,
      })
    }

    // 获取完整用户信息
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "users",
        level: "info",
        message: `创建用户: ${email}`,
        details: JSON.stringify({
          userId: user.id,
          name,
          email,
          employeeId,
          roleIds,
        }),
      },
    })

    // 格式化用户数据
    const formattedUser = {
      id: createdUser?.id,
      name: createdUser?.name,
      email: createdUser?.email,
      emailVerified: createdUser?.emailVerified,
      image: createdUser?.image,
      role: createdUser?.role,
      employeeId: createdUser?.employeeId,
      employeeName: createdUser?.employee?.name,
      employeePosition: createdUser?.employee?.position,
      createdAt: createdUser?.createdAt,
      updatedAt: createdUser?.updatedAt,
      roles: createdUser?.userRoles.map(ur => ({
        id: ur.id,
        userId: ur.userId,
        roleId: ur.roleId,
        role: ur.role,
        createdAt: ur.createdAt,
        updatedAt: ur.updatedAt,
      })) || [],
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("创建用户失败:", error)
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
  }
}
