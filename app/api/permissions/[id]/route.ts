import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { withPermission } from "@/lib/auth-middleware"

/**
 * 获取单个权限
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.view")
    if (permissionCheck) return permissionCheck

    const permissionId = parseInt(params.id)
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: "无效的权限ID" }, { status: 400 })
    }

    // 获取权限信息
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    })

    if (!permission) {
      return NextResponse.json({ error: "权限不存在" }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error) {
    console.error("获取权限信息失败:", error)
    return NextResponse.json({ error: "获取权限信息失败" }, { status: 500 })
  }
}

/**
 * 更新权限
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.edit")
    if (permissionCheck) return permissionCheck

    const permissionId = parseInt(params.id)
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: "无效的权限ID" }, { status: 400 })
    }

    const data = await req.json()
    const { name, module, description } = data

    // 验证必填字段
    if (!name || !module) {
      return NextResponse.json({ error: "名称和模块为必填项" }, { status: 400 })
    }

    // 检查权限是否存在
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    })

    if (!existingPermission) {
      return NextResponse.json({ error: "权限不存在" }, { status: 404 })
    }

    // 更新权限
    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name,
        module,
        description,
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "permissions",
        level: "info",
        message: `更新权限: ${name}`,
        details: JSON.stringify({
          permissionId,
          name,
          module,
          description,
        }),
      },
    })

    return NextResponse.json(permission)
  } catch (error) {
    console.error("更新权限失败:", error)
    return NextResponse.json({ error: "更新权限失败" }, { status: 500 })
  }
}

/**
 * 删除权限
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.delete")
    if (permissionCheck) return permissionCheck

    const permissionId = parseInt(params.id)
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: "无效的权限ID" }, { status: 400 })
    }

    // 检查权限是否存在
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    })

    if (!existingPermission) {
      return NextResponse.json({ error: "权限不存在" }, { status: 404 })
    }

    // 检查权限是否被角色使用
    const rolePermissionCount = await prisma.rolePermission.count({
      where: { permissionId },
    })

    if (rolePermissionCount > 0) {
      return NextResponse.json({ error: "权限已分配给角色，不能删除" }, { status: 400 })
    }

    // 删除权限
    await prisma.permission.delete({
      where: { id: permissionId },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "permissions",
        level: "info",
        message: `删除权限: ${existingPermission.name}`,
        details: JSON.stringify({
          permissionId,
          name: existingPermission.name,
          code: existingPermission.code,
          module: existingPermission.module,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除权限失败:", error)
    return NextResponse.json({ error: "删除权限失败" }, { status: 500 })
  }
}
