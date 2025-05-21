import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { withPermission } from "@/lib/auth-middleware"

/**
 * 获取所有权限
 */
export async function GET(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.view")
    if (permissionCheck) return permissionCheck

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const module = searchParams.get("module")

    // 构建查询条件
    const whereClause = module ? { module } : {}

    // 获取权限列表
    const permissions = await prisma.permission.findMany({
      where: whereClause,
      orderBy: [
        { module: "asc" },
        { name: "asc" },
      ],
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("获取权限列表失败:", error)
    return NextResponse.json({ error: "获取权限列表失败" }, { status: 500 })
  }
}

/**
 * 创建权限
 */
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.create")
    if (permissionCheck) return permissionCheck

    // 获取请求数据
    const data = await req.json()
    const { name, code, module, description } = data

    // 验证必填字段
    if (!name || !code || !module) {
      return NextResponse.json({ error: "名称、代码和模块为必填项" }, { status: 400 })
    }

    // 检查权限代码是否已存在
    const existingPermission = await prisma.permission.findUnique({
      where: { code },
    })

    if (existingPermission) {
      return NextResponse.json({ error: "权限代码已被使用" }, { status: 400 })
    }

    // 创建权限
    const permission = await prisma.permission.create({
      data: {
        name,
        code,
        module,
        description,
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "permissions",
        level: "info",
        message: `创建权限: ${name}`,
        details: JSON.stringify({
          permissionId: permission.id,
          name,
          code,
          module,
        }),
      },
    })

    return NextResponse.json(permission)
  } catch (error) {
    console.error("创建权限失败:", error)
    return NextResponse.json({ error: "创建权限失败" }, { status: 500 })
  }
}
