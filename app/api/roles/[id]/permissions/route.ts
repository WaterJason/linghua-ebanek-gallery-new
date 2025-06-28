import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { withPermission } from "@/lib/auth-middleware"
import { triggerRolePermissionChange } from "@/lib/sync-manager"

/**
 * 获取角色权限
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.view")
    if (permissionCheck) return permissionCheck

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: "无效的角色ID" }, { status: 400 })
    }

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 })
    }

    // 获取角色权限
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    })

    // 格式化权限数据
    const permissions = rolePermissions.map(rp => rp.permission)
    const permissionIds = rolePermissions.map(rp => rp.permissionId)

    return NextResponse.json({
      permissions,
      permissionIds,
    })
  } catch (error) {
    console.error("获取角色权限失败:", error)
    return NextResponse.json({ error: "获取角色权限失败" }, { status: 500 })
  }
}

/**
 * 更新角色权限
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.edit")
    if (permissionCheck) return permissionCheck

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: "无效的角色ID" }, { status: 400 })
    }

    const data = await req.json()
    const { permissionIds } = data

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "权限ID列表格式不正确" }, { status: 400 })
    }

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json({ error: "角色不存在" }, { status: 404 })
    }

    // 检查是否为系统角色
    if (role.isSystem) {
      return NextResponse.json({ error: "系统角色不能修改权限" }, { status: 400 })
    }

    // 开始事务
    await prisma.$transaction(async (tx) => {
      // 删除现有角色权限
      await tx.rolePermission.deleteMany({
        where: { roleId },
      })

      // 添加新的角色权限
      if (permissionIds.length > 0) {
        const permissionData = permissionIds.map(permissionId => ({
          roleId,
          permissionId: typeof permissionId === 'string' ? parseInt(permissionId) : permissionId,
        }))

        await tx.rolePermission.createMany({
          data: permissionData,
          skipDuplicates: true,
        })
      }
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "roles",
        level: "info",
        message: `更新角色权限: ${role.name}`,
        details: JSON.stringify({
          roleId,
          roleName: role.name,
          permissionIds,
        }),
      },
    })

    // 获取更新后的角色权限
    const updatedRolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    })

    // 格式化权限数据
    const updatedPermissions = updatedRolePermissions.map(rp => rp.permission)
    const updatedPermissionIds = updatedRolePermissions.map(rp => rp.permissionId)

    // 触发角色权限变更同步事件
    await triggerRolePermissionChange(roleId, {
      roleName: role.name,
      oldPermissionIds: [], // 这里可以传入旧的权限ID列表
      newPermissionIds: updatedPermissionIds
    })

    return NextResponse.json({
      success: true,
      message: "角色权限更新成功，相关缓存已自动刷新",
      permissions: updatedPermissions,
      permissionIds: updatedPermissionIds,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("更新角色权限失败:", error)
    return NextResponse.json({ error: "更新角色权限失败" }, { status: 500 })
  }
}
