import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const employeeId = searchParams.get("employeeId")

    // 构建查询条件
    let whereClause: any = {}

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // 如果指定了员工ID，则查询该员工参与的销售记录
    let includeClause: any = {
      shifts: {
        include: {
          employee: true,
        },
      },
      items: true,
    }

    if (employeeId && employeeId !== "all") {
      includeClause = {
        shifts: {
          where: {
            employeeId: Number.parseInt(employeeId),
          },
          include: {
            employee: true,
          },
        },
        items: true,
      }
    }

    // 获取咖啡店销售记录
    const coffeeShopSales = await prisma.coffeeShopSale.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: {
        date: "desc",
      },
    })

    // 如果指定了员工ID，过滤掉该员工未参与的销售记录
    let filteredSales = coffeeShopSales
    if (employeeId && employeeId !== "all") {
      filteredSales = coffeeShopSales.filter(sale => sale.shifts.length > 0)
    }

    return NextResponse.json(filteredSales)
  } catch (error) {
    console.error("Error fetching coffee shop sales:", error)
    return NextResponse.json({ error: "Failed to fetch coffee shop sales" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建咖啡店销售记录
      const coffeeShopSale = await tx.coffeeShopSale.create({
        data: {
          date: new Date(data.date),
          totalSales: Number.parseFloat(data.totalSales),
          cashAmount: Number.parseFloat(data.cashAmount || 0),
          cardAmount: Number.parseFloat(data.cardAmount || 0),
          wechatAmount: Number.parseFloat(data.wechatAmount || 0),
          alipayAmount: Number.parseFloat(data.alipayAmount || 0),
          otherAmount: Number.parseFloat(data.otherAmount || 0),
          customerCount: Number.parseInt(data.customerCount || 0),
          notes: data.notes,
        },
      })

      // 创建值班员工记录
      for (const employeeId of data.staffOnDuty) {
        await tx.coffeeShopShift.create({
          data: {
            coffeeShopSaleId: coffeeShopSale.id,
            employeeId: Number.parseInt(employeeId),
          },
        })
      }

      // 创建销售项目记录
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.coffeeShopItem.create({
            data: {
              coffeeShopSaleId: coffeeShopSale.id,
              name: item.name,
              category: item.category,
              quantity: Number.parseInt(item.quantity),
              unitPrice: Number.parseFloat(item.unitPrice),
              totalPrice: Number.parseFloat(item.totalPrice),
            },
          })
        }
      }

      return coffeeShopSale
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating coffee shop sale:", error)
    return NextResponse.json({ error: "Failed to create coffee shop sale" }, { status: 500 })
  }
}
