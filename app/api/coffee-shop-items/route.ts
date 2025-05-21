import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category")
    
    // 构建查询条件
    let whereClause: any = {}
    
    if (startDate && endDate) {
      whereClause = {
        coffeeShopSale: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      }
    }
    
    if (category && category !== "all") {
      whereClause.category = category
    }
    
    // 获取咖啡店商品销售记录
    const coffeeShopItems = await prisma.coffeeShopItem.findMany({
      where: whereClause,
      include: {
        coffeeShopSale: {
          select: {
            date: true,
          },
        },
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    })
    
    return NextResponse.json(coffeeShopItems)
  } catch (error) {
    console.error("Error fetching coffee shop items:", error)
    return NextResponse.json({ error: "Failed to fetch coffee shop items" }, { status: 500 })
  }
}
