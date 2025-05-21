import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const gallerySales = await prisma.gallerySale.findMany({
      include: {
        employee: true,
        salesItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(gallerySales)
  } catch (error) {
    console.error("Error fetching gallery sales:", error)
    return NextResponse.json({ error: "Failed to fetch gallery sales" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建销售记录
      const gallerySale = await tx.gallerySale.create({
        data: {
          employeeId: Number.parseInt(data.employee),
          date: new Date(data.date),
          totalAmount: Number.parseFloat(data.totalAmount),
          notes: data.notes,
          imageUrl: data.imageUrl,
        },
      })

      // 创建销售项目明细
      for (const item of data.items) {
        await tx.salesItem.create({
          data: {
            gallerySaleId: gallerySale.id,
            productId: Number.parseInt(item.productId),
            quantity: Number.parseInt(item.quantity),
            price: Number.parseFloat(item.price),
          },
        })
      }

      return gallerySale
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating gallery sale:", error)
    return NextResponse.json({ error: "Failed to create gallery sale" }, { status: 500 })
  }
}
