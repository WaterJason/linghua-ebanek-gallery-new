import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取单个数据字典项
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = parseInt(params.id)

    // 查询数据字典项
    const item = await prisma.dataDictionaryItem.findUnique({
      where: { id },
      include: {
        dictionary: true,
      },
    })

    // 检查数据字典项是否存在
    if (!item) {
      return NextResponse.json({ error: "数据字典项不存在" }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("获取数据字典项失败:", error)
    return NextResponse.json(
      { error: "获取数据字典项失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新数据字典项
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = parseInt(params.id)

    // 获取请求数据
    const data = await req.json()
    const { value, label, sortOrder, isDefault, isActive } = data

    // 查询数据字典项
    const item = await prisma.dataDictionaryItem.findUnique({
      where: { id },
    })

    // 检查数据字典项是否存在
    if (!item) {
      return NextResponse.json({ error: "数据字典项不存在" }, { status: 404 })
    }

    // 如果设置为默认项，需要将其他项设置为非默认
    if (isDefault) {
      await prisma.dataDictionaryItem.updateMany({
        where: {
          dictionaryId: item.dictionaryId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    // 更新数据字典项
    const updatedItem = await prisma.dataDictionaryItem.update({
      where: { id },
      data: {
        value,
        label,
        sortOrder,
        isDefault,
        isActive,
      },
    })

    // 记录审计日志
    await createAuditLog({
      action: "update",
      entityType: "system",
      entityId: id.toString(),
      details: `更新数据字典项: ${label || item.label}`,
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("更新数据字典项失败:", error)
    return NextResponse.json(
      { error: "更新数据字典项失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除数据字典项
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const id = parseInt(params.id)

    // 查询数据字典项
    const item = await prisma.dataDictionaryItem.findUnique({
      where: { id },
      include: {
        dictionary: true,
      },
    })

    // 检查数据字典项是否存在
    if (!item) {
      return NextResponse.json({ error: "数据字典项不存在" }, { status: 404 })
    }

    // 检查是否为系统数据字典的项
    if (item.dictionary.isSystem) {
      return NextResponse.json(
        { error: "系统数据字典项不能删除" },
        { status: 400 }
      )
    }

    // 删除数据字典项
    await prisma.dataDictionaryItem.delete({
      where: { id },
    })

    // 记录审计日志
    await createAuditLog({
      action: "delete",
      entityType: "system",
      entityId: id.toString(),
      details: `删除数据字典项: ${item.label} (${item.code}) - 字典: ${item.dictionary.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除数据字典项失败:", error)
    return NextResponse.json(
      { error: "删除数据字典项失败" },
      { status: 500 }
    )
  }
}
