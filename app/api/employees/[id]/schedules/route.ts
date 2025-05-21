import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// 获取员工排班记录
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

    // 构建查询条件
    const whereClause: any = {
      employeeId: id,
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      }
    } else if (startDate) {
      whereClause.date = {
        gte: startDate,
      }
    } else if (endDate) {
      whereClause.date = {
        lte: endDate,
      }
    }

    // 查询排班记录
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching employee schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch employee schedules" },
      { status: 500 }
    )
  }
}
