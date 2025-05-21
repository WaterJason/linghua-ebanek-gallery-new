import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/db"
import { withPermission } from "@/lib/auth-middleware"

/**
 * 获取用户角色
 */
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

    // 如果是查看自己的角色，直接允许
    if (token.id !== userId) {
      // 如果是查看他人的角色，检查权限
      const permissionCheck = await withPermission(req, "permissions.view")
      if (permissionCheck) return permissionCheck
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 获取用户角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    })

    // 格式化角色数据
    const roles = userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
    }))

    // 同时返回角色ID数组，方便前端使用
    const roleIds = userRoles.map(ur => ur.roleId)

    return NextResponse.json({
      roles,
      roleIds,
      // 保持兼容性，返回旧版roles字段
      legacyRoles: user.roles || [],
    })
  } catch (error) {
    console.error("获取用户角色失败:", error)
    return NextResponse.json({ error: "获取用户角色失败" }, { status: 500 })
  }
}

/**
 * 更新用户角色
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

    // 如果是更新自己的角色，直接允许
    if (token.id !== userId) {
      // 如果是更新他人的角色，检查权限
      const permissionCheck = await withPermission(req, "permissions.edit")
      if (permissionCheck) return permissionCheck
    }
    const data = await req.json()
    const { roleIds } = data

    if (!Array.isArray(roleIds)) {
      return NextResponse.json({ error: "角色ID列表格式不正确" }, { status: 400 })
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 开始事务
    await prisma.$transaction(async (tx) => {
      // 删除现有用户角色
      await tx.userRole.deleteMany({
        where: { userId },
      })

      // 添加新的用户角色
      if (roleIds.length > 0) {
        const roleData = roleIds.map(roleId => ({
          userId,
          roleId: typeof roleId === 'string' ? parseInt(roleId) : roleId,
        }))

        await tx.userRole.createMany({
          data: roleData,
          skipDuplicates: true,
        })
      }

      // 同时更新旧版roles字段，保持兼容性
      await tx.user.update({
        where: { id: userId },
        data: {
          roles: roleIds.map(r => typeof r === 'string' ? parseInt(r) : r),
        },
      })
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "users",
        level: "info",
        message: `更新用户角色: ${user.email}`,
        details: JSON.stringify({
          userId,
          roleIds,
        }),
      },
    })

    // 获取更新后的用户角色
    const updatedUserRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    })

    // 格式化角色数据
    const updatedRoles = updatedUserRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
    }))

    // 同时返回角色ID数组，方便前端使用
    const updatedRoleIds = updatedUserRoles.map(ur => ur.roleId)

    return NextResponse.json({
      success: true,
      roles: updatedRoles,
      roleIds: updatedRoleIds,
    })
  } catch (error) {
    console.error("更新用户角色失败:", error)
    return NextResponse.json({ error: "更新用户角色失败" }, { status: 500 })
  }
}
