import { NextRequest, NextResponse } from "next/server"
import { getServerSession, isAdmin } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取单个数据字典
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = parseInt(params.id)

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const includeItems = searchParams.get("includeItems") === "true"

    // 查询数据字典
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id },
      include: includeItems ? {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      } : undefined,
    })

    // 检查数据字典是否存在
    if (!dictionary) {
      return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
    }

    return NextResponse.json(dictionary)
  } catch (error) {
    console.error("获取数据字典失败:", error)
    return NextResponse.json(
      { error: "获取数据字典失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新数据字典
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = parseInt(params.id)

    // 获取请求数据
    const data = await req.json()
    const { name, description, isSystem } = data

    // 查询数据字典
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id },
    })

    // 检查数据字典是否存在
    if (!dictionary) {
      return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
    }

    // 系统数据字典只能修改名称和描述
    if (dictionary.isSystem && isSystem === false) {
      return NextResponse.json(
        { error: "系统数据字典不能修改为非系统数据字典" },
        { status: 400 }
      )
    }

    // 更新数据字典
    const updatedDictionary = await prisma.dataDictionary.update({
      where: { id },
      data: {
        name,
        description,
        isSystem,
      },
    })

    // 记录审计日志
    await createAuditLog({
      action: "update",
      entityType: "system",
      entityId: id.toString(),
      details: `更新数据字典: ${name || dictionary.name} (${dictionary.code})`,
    })

    return NextResponse.json(updatedDictionary)
  } catch (error) {
    console.error("更新数据字典失败:", error)
    return NextResponse.json(
      { error: "更新数据字典失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除数据字典
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = parseInt(params.id)

    // 查询数据字典
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id },
      include: { items: true },
    })

    // 检查数据字典是否存在
    if (!dictionary) {
      return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
    }

    // 系统数据字典不能删除
    if (dictionary.isSystem) {
      return NextResponse.json(
        { error: "系统数据字典不能删除" },
        { status: 400 }
      )
    }

    // 删除数据字典
    await prisma.dataDictionary.delete({
      where: { id },
    })

    // 记录审计日志
    await createAuditLog({
      action: "delete",
      entityType: "system",
      entityId: id.toString(),
      details: `删除数据字典: ${dictionary.name} (${dictionary.code})，包含 ${dictionary.items.length} 个字典项`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除数据字典失败:", error)
    return NextResponse.json(
      { error: "删除数据字典失败" },
      { status: 500 }
    )
  }
}
