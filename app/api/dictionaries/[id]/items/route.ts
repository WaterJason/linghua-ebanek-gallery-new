import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取数据字典项列表
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

    const dictionaryId = parseInt(params.id)

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const activeOnly = searchParams.get("activeOnly") === "true"

    // 检查数据字典是否存在
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id: dictionaryId },
    })

    if (!dictionary) {
      return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
    }

    // 构建查询条件
    const where: any = { dictionaryId }
    if (activeOnly) {
      where.isActive = true
    }

    // 查询数据字典项
    const items = await prisma.dataDictionaryItem.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("获取数据字典项列表失败:", error)
    return NextResponse.json(
      { error: "获取数据字典项列表失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建数据字典项
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const dictionaryId = parseInt(params.id)

    // 获取请求数据
    const data = await req.json()
    const { code, value, label, sortOrder, isDefault, isActive } = data

    // 验证必填字段
    if (!code || !value || !label) {
      return NextResponse.json(
        { error: "代码、值和标签为必填项" },
        { status: 400 }
      )
    }

    // 检查数据字典是否存在
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id: dictionaryId },
    })

    if (!dictionary) {
      return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
    }

    // 检查代码是否已存在
    const existingItem = await prisma.dataDictionaryItem.findFirst({
      where: {
        dictionaryId,
        code,
      },
    })

    if (existingItem) {
      return NextResponse.json(
        { error: `数据字典项代码 ${code} 已存在` },
        { status: 400 }
      )
    }

    // 如果设置为默认项，需要将其他项设置为非默认
    if (isDefault) {
      await prisma.dataDictionaryItem.updateMany({
        where: {
          dictionaryId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // 创建数据字典项
    const item = await prisma.dataDictionaryItem.create({
      data: {
        dictionaryId,
        code,
        value,
        label,
        sortOrder: sortOrder || 0,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "system",
      entityId: item.id.toString(),
      details: `创建数据字典项: ${label} (${code}) - 字典: ${dictionary.name}`,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("创建数据字典项失败:", error)
    return NextResponse.json(
      { error: "创建数据字典项失败" },
      { status: 500 }
    )
  }
}

/**
 * 批量创建数据字典项
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const dictionaryId = parseInt(params.id)

    // 获取请求数据
    const data = await req.json()
    const { items } = data

    // 验证必填字段
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "缺少字典项数据" },
        { status: 400 }
      )
    }

    // 检查数据字典是否存在
    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id: dictionaryId },
    })

    if (!dictionary) {
      return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
    }

    // 检查是否有默认项
    const hasDefault = items.some(item => item.isDefault)

    // 如果有默认项，需要将其他项设置为非默认
    if (hasDefault) {
      await prisma.dataDictionaryItem.updateMany({
        where: {
          dictionaryId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // 批量创建数据字典项
    const result = await prisma.dataDictionaryItem.createMany({
      data: items.map(item => ({
        dictionaryId,
        code: item.code,
        value: item.value,
        label: item.label,
        sortOrder: item.sortOrder || 0,
        isDefault: item.isDefault || false,
        isActive: item.isActive !== undefined ? item.isActive : true,
      })),
      skipDuplicates: true,
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "system",
      entityId: dictionaryId.toString(),
      details: `批量创建数据字典项，共 ${result.count} 项 - 字典: ${dictionary.name}`,
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error("批量创建数据字典项失败:", error)
    return NextResponse.json(
      { error: "批量创建数据字典项失败" },
      { status: 500 }
    )
  }
}
