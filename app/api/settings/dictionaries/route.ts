import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "@/lib/auth-helpers"
import { withPermission } from "@/lib/auth-middleware"

/**
 * 获取数据字典列表
 */
export async function GET(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.view")
    if (permissionCheck) return permissionCheck

    // 获取数据字典列表
    const dictionaries = await prisma.dataDictionary.findMany({
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    })

    // 如果没有数据，初始化默认字典
    if (dictionaries.length === 0) {
      const defaultDictionaries = [
        {
          code: "customer_source",
          name: "客户来源",
          description: "客户来源类型",
          isActive: true,
          isSystem: true,
          items: [
            { code: "pos", name: "POS销售", sortOrder: 1, isActive: true, isDefault: false },
            { code: "online", name: "线上渠道", sortOrder: 2, isActive: true, isDefault: false },
            { code: "workshop", name: "工作坊", sortOrder: 3, isActive: true, isDefault: false },
            { code: "referral", name: "推荐", sortOrder: 4, isActive: true, isDefault: false },
          ]
        },
        {
          code: "order_status",
          name: "订单状态",
          description: "订单处理状态",
          isActive: true,
          isSystem: true,
          items: [
            { code: "pending", name: "待付款", sortOrder: 1, isActive: true, isDefault: true },
            { code: "paid", name: "已付款", sortOrder: 2, isActive: true, isDefault: false },
            { code: "processing", name: "处理中", sortOrder: 3, isActive: true, isDefault: false },
            { code: "shipped", name: "已发货", sortOrder: 4, isActive: true, isDefault: false },
            { code: "completed", name: "已完成", sortOrder: 5, isActive: true, isDefault: false },
            { code: "cancelled", name: "已取消", sortOrder: 6, isActive: true, isDefault: false },
          ]
        },
        {
          code: "product_category",
          name: "产品分类",
          description: "产品类别分类",
          isActive: true,
          isSystem: true,
          items: [
            { code: "enamel", name: "掐丝珐琅", sortOrder: 1, isActive: true, isDefault: false },
            { code: "jewelry", name: "首饰", sortOrder: 2, isActive: true, isDefault: false },
            { code: "decoration", name: "装饰品", sortOrder: 3, isActive: true, isDefault: false },
            { code: "gift", name: "礼品", sortOrder: 4, isActive: true, isDefault: false },
          ]
        },
        {
          code: "payment_method",
          name: "支付方式",
          description: "支付方式类型",
          isActive: true,
          isSystem: true,
          items: [
            { code: "cash", name: "现金", sortOrder: 1, isActive: true, isDefault: false },
            { code: "card", name: "银行卡", sortOrder: 2, isActive: true, isDefault: false },
            { code: "wechat", name: "微信支付", sortOrder: 3, isActive: true, isDefault: true },
            { code: "alipay", name: "支付宝", sortOrder: 4, isActive: true, isDefault: false },
            { code: "transfer", name: "银行转账", sortOrder: 5, isActive: true, isDefault: false },
          ]
        }
      ]

      // 批量创建默认字典
      for (const dict of defaultDictionaries) {
        const { items, ...dictData } = dict
        const createdDict = await prisma.dataDictionary.create({
          data: dictData
        })

        // 创建字典项
        if (items && items.length > 0) {
          await prisma.dataDictionaryItem.createMany({
            data: items.map(item => ({
              ...item,
              dictionaryId: createdDict.id
            }))
          })
        }
      }

      // 重新获取数据
      return NextResponse.json(await prisma.dataDictionary.findMany({
        include: {
          items: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: [
          { isSystem: 'desc' },
          { name: 'asc' }
        ]
      }))
    }

    return NextResponse.json(dictionaries)
  } catch (error) {
    console.error("获取数据字典失败:", error)
    return NextResponse.json(
      { error: "获取数据字典失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建数据字典
 */
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.create")
    if (permissionCheck) return permissionCheck

    const data = await req.json()
    const { code, name, description, isActive } = data

    // 验证必填字段
    if (!code || !name) {
      return NextResponse.json(
        { error: "字典代码和名称为必填项" },
        { status: 400 }
      )
    }

    // 检查代码是否已存在
    const existingDict = await prisma.dataDictionary.findUnique({
      where: { code }
    })

    if (existingDict) {
      return NextResponse.json(
        { error: "字典代码已存在" },
        { status: 400 }
      )
    }

    // 创建新字典
    const newDictionary = await prisma.dataDictionary.create({
      data: {
        code,
        name,
        description: description || "",
        isActive: isActive !== undefined ? isActive : true,
        isSystem: false,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(newDictionary)
  } catch (error) {
    console.error("创建数据字典失败:", error)
    return NextResponse.json(
      { error: "创建数据字典失败" },
      { status: 500 }
    )
  }
}
