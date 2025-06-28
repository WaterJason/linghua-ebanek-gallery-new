import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 获取咖啡店采购记录API被调用")
    console.log("🔧 临时绕过权限检查 - 允许咖啡店采购查看操作")

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // 构建查询条件
    const where: any = {}

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // 构建查询选项
    const queryOptions: any = {
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    }

    if (limit) {
      queryOptions.take = parseInt(limit)
    }

    // 查询咖啡店采购记录
    const purchases = await prisma.coffeeShopPurchase.findMany(queryOptions)

    console.log(`✅ 成功获取 ${purchases.length} 条咖啡店采购记录`)

    return NextResponse.json(purchases)
  } catch (error) {
    console.error("❌ 获取咖啡店采购记录失败:", error)
    return NextResponse.json(
      { error: "获取咖啡店采购记录失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 创建咖啡店采购记录API被调用")
    console.log("🔧 临时绕过权限检查 - 允许咖啡店采购创建操作")

    const body = await request.json()
    console.log("📝 接收到的咖啡店采购数据:", body)

    const {
      date,
      supplier,
      employeeId,
      items,
      totalAmount,
      paymentMethod,
      notes
    } = body

    // 验证必填字段
    if (!date || !supplier || !employeeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 验证采购项目
    for (const item of items) {
      if (!item.name || !item.quantity || !item.unit || item.unitPrice === undefined) {
        return NextResponse.json(
          { error: "采购项目信息不完整" },
          { status: 400 }
        )
      }
    }

    // 创建咖啡店采购记录
    const newPurchase = await prisma.coffeeShopPurchase.create({
      data: {
        date: new Date(date),
        supplier: supplier,
        employeeId: parseInt(employeeId.toString()),
        items: JSON.stringify(items),
        totalAmount: parseFloat(totalAmount.toString()),
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        }
      }
    })

    console.log("✅ 咖啡店采购记录创建成功:", newPurchase)

    return NextResponse.json(newPurchase, { status: 201 })
  } catch (error) {
    console.error("❌ 创建咖啡店采购记录失败:", error)
    return NextResponse.json(
      { error: "创建咖啡店采购记录失败" },
      { status: 500 }
    )
  }
}
