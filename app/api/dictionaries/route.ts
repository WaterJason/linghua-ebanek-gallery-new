import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { createAuditLog } from "@/lib/actions/audit-actions"

/**
 * 获取数据字典列表
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const includeItems = searchParams.get("includeItems") === "true"
    const code = searchParams.get("code")
    const initialize = searchParams.get("initialize") === "true"

    // 如果请求初始化，则创建系统预设数据字典
    if (initialize && session.user.role === "admin") {
      // 系统预设数据字典
      const systemDictionaries = [
        {
          code: "order_status",
          name: "订单状态",
          description: "订单处理状态",
          isSystem: true,
          items: [
            { code: "pending", value: "pending", label: "待处理", sortOrder: 1, isDefault: true },
            { code: "processing", value: "processing", label: "处理中", sortOrder: 2 },
            { code: "completed", value: "completed", label: "已完成", sortOrder: 3 },
            { code: "cancelled", value: "cancelled", label: "已取消", sortOrder: 4 },
          ],
        },
        {
          code: "payment_status",
          name: "支付状态",
          description: "订单支付状态",
          isSystem: true,
          items: [
            { code: "unpaid", value: "unpaid", label: "未支付", sortOrder: 1, isDefault: true },
            { code: "partial", value: "partial", label: "部分支付", sortOrder: 2 },
            { code: "paid", value: "paid", label: "已支付", sortOrder: 3 },
            { code: "refunded", value: "refunded", label: "已退款", sortOrder: 4 },
          ],
        },
        {
          code: "payment_method",
          name: "支付方式",
          description: "订单支付方式",
          isSystem: true,
          items: [
            { code: "cash", value: "cash", label: "现金", sortOrder: 1, isDefault: true },
            { code: "wechat", value: "wechat", label: "微信支付", sortOrder: 2 },
            { code: "alipay", value: "alipay", label: "支付宝", sortOrder: 3 },
            { code: "card", value: "card", label: "银行卡", sortOrder: 4 },
            { code: "transfer", value: "transfer", label: "银行转账", sortOrder: 5 },
            { code: "other", value: "other", label: "其他", sortOrder: 6 },
          ],
        },
      ]

      // 创建数据字典和字典项
      const createdDictionaries = []

      for (const dict of systemDictionaries) {
        // 检查是否已存在
        let dictionary = await prisma.dataDictionary.findUnique({
          where: { code: dict.code },
        })

        // 如果不存在，创建数据字典
        if (!dictionary) {
          dictionary = await prisma.dataDictionary.create({
            data: {
              code: dict.code,
              name: dict.name,
              description: dict.description,
              isSystem: dict.isSystem,
            },
          })

          // 创建数据字典项
          await prisma.dataDictionaryItem.createMany({
            data: dict.items.map(item => ({
              dictionaryId: dictionary!.id,
              code: item.code,
              value: item.value,
              label: item.label,
              sortOrder: item.sortOrder || 0,
              isDefault: item.isDefault || false,
              isActive: true,
            })),
            skipDuplicates: true,
          })
        }

        createdDictionaries.push(dictionary)
      }

      // 记录审计日志
      await createAuditLog({
        action: "create",
        entityType: "system",
        entityId: "system_dictionaries",
        details: `初始化系统数据字典，共 ${createdDictionaries.length} 个`,
      })

      return NextResponse.json(createdDictionaries)
    }

    // 如果指定了代码，则获取单个数据字典
    if (code) {
      const dictionary = await prisma.dataDictionary.findUnique({
        where: { code },
        include: includeItems ? {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        } : undefined,
      })

      if (!dictionary) {
        return NextResponse.json({ error: "数据字典不存在" }, { status: 404 })
      }

      return NextResponse.json(dictionary)
    }

    // 获取所有数据字典
    const dictionaries = await prisma.dataDictionary.findMany({
      orderBy: { code: "asc" },
      include: includeItems ? {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      } : undefined,
    })

    return NextResponse.json(dictionaries)
  } catch (error) {
    console.error("获取数据字典列表失败:", error)
    return NextResponse.json(
      { error: "获取数据字典列表失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建数据字典
 */
export async function POST(req: NextRequest) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取请求数据
    const data = await req.json()
    const { code, name, description, isSystem } = data

    // 验证必填字段
    if (!code || !name) {
      return NextResponse.json(
        { error: "代码和名称为必填项" },
        { status: 400 }
      )
    }

    // 检查代码是否已存在
    const existingDictionary = await prisma.dataDictionary.findUnique({
      where: { code },
    })

    if (existingDictionary) {
      return NextResponse.json(
        { error: `数据字典代码 ${code} 已存在` },
        { status: 400 }
      )
    }

    // 创建数据字典
    const dictionary = await prisma.dataDictionary.create({
      data: {
        code,
        name,
        description,
        isSystem: isSystem || false,
      },
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "system",
      entityId: dictionary.id.toString(),
      details: `创建数据字典: ${name} (${code})`,
    })

    return NextResponse.json(dictionary)
  } catch (error) {
    console.error("创建数据字典失败:", error)
    return NextResponse.json(
      { error: "创建数据字典失败" },
      { status: 500 }
    )
  }
}
