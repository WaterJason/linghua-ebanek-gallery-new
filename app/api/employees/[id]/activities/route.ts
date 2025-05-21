import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// 获取员工活动记录（包括销售、计件工作、工作坊等）
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

    // 获取员工的销售记录
    const gallerySales = await prisma.gallerySale.findMany({
      where: {
        employeeId: id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: {
        id: true,
        date: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // 获取员工的计件工作记录
    const pieceWorks = await prisma.pieceWork.findMany({
      where: {
        employeeId: id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: {
        id: true,
        date: true,
        workType: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // 获取员工的工作坊记录（作为讲师）
    const teacherWorkshops = await prisma.workshop.findMany({
      where: {
        teacherId: id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: {
        id: true,
        date: true,
        role: true,
        locationType: true,
        location: true,
        participants: true,
        duration: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // 获取员工的工作坊记录（作为助教）
    const assistantWorkshops = await prisma.workshop.findMany({
      where: {
        assistantId: id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: {
        id: true,
        date: true,
        role: true,
        locationType: true,
        location: true,
        participants: true,
        duration: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // 获取员工的咖啡店值班记录
    const coffeeShopShifts = await prisma.coffeeShopShift.findMany({
      where: {
        employeeId: id,
      },
      select: {
        id: true,
        coffeeShopSale: {
          select: {
            id: true,
            date: true,
            totalSales: true,
            customerCount: true,
            notes: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 转换咖啡店值班记录格式
    const formattedCoffeeShopShifts = coffeeShopShifts.map(shift => ({
      id: `coffee-${shift.id}`,
      date: shift.coffeeShopSale.date,
      type: '咖啡店值班',
      details: `销售额: ¥${shift.coffeeShopSale.totalSales.toFixed(2)}, 顾客数: ${shift.coffeeShopSale.customerCount}`,
      notes: shift.coffeeShopSale.notes,
      createdAt: shift.createdAt,
    }))

    // 转换销售记录格式
    const formattedGallerySales = gallerySales.map(sale => ({
      id: `gallery-${sale.id}`,
      date: sale.date,
      type: '画廊销售',
      details: `销售额: ¥${sale.totalAmount.toFixed(2)}`,
      notes: sale.notes,
      createdAt: sale.createdAt,
    }))

    // 转换计件工作记录格式
    const formattedPieceWorks = pieceWorks.map(work => ({
      id: `piece-${work.id}`,
      date: work.date,
      type: work.workType === 'accessory' ? '配件制作' : '珐琅制作',
      details: `金额: ¥${work.totalAmount.toFixed(2)}`,
      notes: work.notes,
      createdAt: work.createdAt,
    }))

    // 转换工作坊记录格式（讲师）
    const formattedTeacherWorkshops = teacherWorkshops.map(workshop => ({
      id: `workshop-teacher-${workshop.id}`,
      date: workshop.date,
      type: '工作坊讲师',
      details: `地点: ${workshop.location}, 参与人数: ${workshop.participants}, 时长: ${workshop.duration}小时`,
      notes: workshop.notes,
      createdAt: workshop.createdAt,
    }))

    // 转换工作坊记录格式（助教）
    const formattedAssistantWorkshops = assistantWorkshops.map(workshop => ({
      id: `workshop-assistant-${workshop.id}`,
      date: workshop.date,
      type: '工作坊助教',
      details: `地点: ${workshop.location}, 参与人数: ${workshop.participants}, 时长: ${workshop.duration}小时`,
      notes: workshop.notes,
      createdAt: workshop.createdAt,
    }))

    // 合并所有活动记录
    let allActivities = [
      ...formattedGallerySales,
      ...formattedPieceWorks,
      ...formattedTeacherWorkshops,
      ...formattedAssistantWorkshops,
      ...formattedCoffeeShopShifts,
    ]

    // 按日期排序
    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 如果指定了限制数量，则截取相应数量的记录
    if (limit) {
      allActivities = allActivities.slice(0, limit)
    }

    return NextResponse.json(allActivities)
  } catch (error) {
    console.error("Error fetching employee activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch employee activities" },
      { status: 500 }
    )
  }
}
