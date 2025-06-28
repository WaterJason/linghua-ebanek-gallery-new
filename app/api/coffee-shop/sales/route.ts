import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 获取咖啡店销售记录API被调用")
    console.log("🔧 临时绕过权限检查 - 允许咖啡店销售查看操作")

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

    // 查询咖啡店销售记录
    const sales = await prisma.coffeeShopSale.findMany(queryOptions)

    console.log(`✅ 成功获取 ${sales.length} 条咖啡店销售记录`)

    return NextResponse.json(sales)
  } catch (error) {
    console.error("❌ 获取咖啡店销售记录失败:", error)
    return NextResponse.json(
      { error: "获取咖啡店销售记录失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 创建咖啡店销售记录API被调用")
    console.log("🔧 临时绕过权限检查 - 允许咖啡店销售创建操作")

    const body = await request.json()
    console.log("📝 接收到的咖啡店销售数据:", body)

    const {
      date,
      totalSales,
      customerCount,
      employeeId,
      notes,
      paymentMethods
    } = body

    // 验证必填字段
    if (!date || totalSales === undefined || customerCount === undefined || !employeeId) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 创建咖啡店销售记录
    const newSale = await prisma.coffeeShopSale.create({
      data: {
        date: new Date(date),
        totalSales: parseFloat(totalSales.toString()),
        customerCount: parseInt(customerCount.toString()),
        employeeId: parseInt(employeeId.toString()),
        notes: notes || null,
        paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : null,
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

    console.log("✅ 咖啡店销售记录创建成功:", newSale)

    return NextResponse.json(newSale, { status: 201 })
  } catch (error) {
    console.error("❌ 创建咖啡店销售记录失败:", error)
    return NextResponse.json(
      { error: "创建咖啡店销售记录失败" },
      { status: 500 }
    )
  }
}
