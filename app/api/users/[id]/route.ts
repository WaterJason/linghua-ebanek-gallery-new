import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { withPermission } from "@/lib/auth-middleware"
import { getToken } from "next-auth/jwt"

// 获取单个用户
export async function GET(
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

    // 如果是查看自己的信息，直接允许
    if (token.id === userId) {
      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          employee: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json({ error: "用户不存在" }, { status: 404 })
      }

      // 格式化用户数据
      const formattedUser = {
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
      }

      return NextResponse.json(formattedUser)
    }

    // 如果是查看他人信息，检查权限
    const permissionCheck = await withPermission(req, "users.view")
    if (permissionCheck) return permissionCheck

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 格式化用户数据
    const formattedUser = {
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
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("获取用户信息失败:", error)
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 })
  }
}

// 更新用户
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

    // 如果是更新自己的信息，直接允许
    let isSelfUpdate = token.id === userId

    // 如果不是更新自己的信息，检查权限
    if (!isSelfUpdate) {
      const permissionCheck = await withPermission(req, "users.edit")
      if (permissionCheck) return permissionCheck
    }

    const data = await req.json()
    const { name, email, password, employeeId, roleIds } = data

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json({ error: "邮箱已被使用" }, { status: 400 })
      }
    }

    // 准备更新数据
    const updateData: any = {}

    if (name) updateData.name = name
    if (email) updateData.email = email

    // 如果提供了新密码，则加密
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // 如果提供了员工ID，且用户有权限，则更新
    if (employeeId !== undefined && !isSelfUpdate) {
      updateData.employeeId = employeeId
    }

    // 如果提供了角色，则更新角色
    if (data.role) {
      console.log("API: Updating user role:", data.role);
      updateData.role = data.role;
    }

    // 更新用户
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    // 如果提供了角色ID，且用户有权限，则更新角色
    if (roleIds && !isSelfUpdate) {
      // 检查权限
      const rolePermissionCheck = await withPermission(req, "permissions.edit")
      if (!rolePermissionCheck) {
        // 删除现有角色
        await prisma.userRole.deleteMany({
          where: { userId },
        })

        // 添加新角色
        if (roleIds.length > 0) {
          await prisma.userRole.createMany({
            data: roleIds.map((roleId: number) => ({
              userId,
              roleId,
            })),
            skipDuplicates: true,
          })
        }
      }
    }

    // 获取更新后的用户信息
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
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
        message: `更新用户: ${email || existingUser.email}`,
        details: JSON.stringify({
          userId,
          name,
          email,
          employeeId,
          roleIds,
          passwordChanged: !!password,
          updatedBy: token.id,
        }),
      },
    })

    // 格式化用户数据
    const formattedUser = {
      id: updatedUser?.id,
      name: updatedUser?.name,
      email: updatedUser?.email,
      emailVerified: updatedUser?.emailVerified,
      image: updatedUser?.image,
      role: updatedUser?.role,
      employeeId: updatedUser?.employeeId,
      employeeName: updatedUser?.employee?.name,
      employeePosition: updatedUser?.employee?.position,
      createdAt: updatedUser?.createdAt,
      updatedAt: updatedUser?.updatedAt,
      roles: updatedUser?.userRoles.map(ur => ({
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
    console.error("更新用户失败:", error)
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 })
  }
}

// 删除用户
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "users.delete")
    if (permissionCheck) return permissionCheck

    const userId = params.id

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 删除用户角色
    await prisma.userRole.deleteMany({
      where: { userId },
    })

    // 删除用户
    await prisma.user.delete({
      where: { id: userId },
    })

    // 记录系统日志
    const token = await getToken({ req })
    await prisma.systemLog.create({
      data: {
        module: "users",
        level: "info",
        message: `删除用户: ${existingUser.email}`,
        details: JSON.stringify({
          userId,
          name: existingUser.name,
          email: existingUser.email,
          deletedBy: token?.id || "unknown",
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除用户失败:", error)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}
