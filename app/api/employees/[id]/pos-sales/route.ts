import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// 获取员工POS销售记录
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : undefined

    // 构建日期查询条件
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.gte = startDate
      dateFilter.lte = endDate
    } else if (startDate) {
      dateFilter.gte = startDate
    } else if (endDate) {
      dateFilter.lte = endDate
    }

    // 获取员工的POS销售记录
    const posSales = await prisma.posSale.findMany({
      where: {
        employeeId: id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: posSales
    })
  } catch (error) {
    console.error("Error fetching employee POS sales:", error)
    return NextResponse.json(
      { error: "Failed to fetch employee POS sales" },
      { status: 500 }
    )
  }
}
