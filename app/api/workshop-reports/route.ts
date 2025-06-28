import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { format, parseISO, startOfMonth, endOfMonth, getMonth, getYear } from "date-fns"
import { zhCN } from "date-fns/locale"

// 获取团建报表数据
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    // 解析日期参数
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = parseISO(startDateParam)
      endDate = parseISO(endDateParam)
    } else {
      // 默认为当年数据
      const now = new Date()
      startDate = new Date(now.getFullYear(), 0, 1) // 当年1月1日
      endDate = now
    }

    // 获取团建记录
    const workshops = await prisma.workshop.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        teacher: true,
        assistant: true,
        product: true,
        activity: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // 计算总体统计数据
    const totalWorkshops = workshops.length
    const totalParticipants = workshops.reduce((sum, workshop) => sum + workshop.participants, 0)
    
    // 计算总收入（基于活动价格和参与人数）
    let totalRevenue = 0
    for (const workshop of workshops) {
      if (workshop.activity) {
        totalRevenue += workshop.activity.price * workshop.participants
      } else if (workshop.product) {
        totalRevenue += workshop.product.price * workshop.participants
      }
    }

    const averageParticipants = totalWorkshops > 0 ? Math.round(totalParticipants / totalWorkshops) : 0
    const averageRevenuePerWorkshop = totalWorkshops > 0 ? Math.round(totalRevenue / totalWorkshops) : 0
    const averageRevenuePerParticipant = totalParticipants > 0 ? Math.round(totalRevenue / totalParticipants) : 0

    // 按渠道分组统计
    const channelMap = new Map()
    for (const workshop of workshops) {
      const channelId = workshop.channelId || 0
      const channelName = channelId === 0 ? "直营渠道" : "未知渠道" // 这里应该从数据库获取渠道名称
      
      if (!channelMap.has(channelId)) {
        channelMap.set(channelId, {
          name: channelName,
          count: 0,
          participants: 0,
          revenue: 0,
        })
      }
      
      const channelData = channelMap.get(channelId)
      channelData.count += 1
      channelData.participants += workshop.participants
      
      if (workshop.activity) {
        channelData.revenue += workshop.activity.price * workshop.participants
      } else if (workshop.product) {
        channelData.revenue += workshop.product.price * workshop.participants
      }
    }
    
    const byChannel = Array.from(channelMap.values())

    // 按产品分组统计
    const productMap = new Map()
    for (const workshop of workshops) {
      const productId = workshop.activity?.productId || workshop.productId || 0
      const productName = workshop.activity?.product?.name || workshop.product?.name || "未知产品"
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          name: productName,
          count: 0,
          participants: 0,
          revenue: 0,
        })
      }
      
      const productData = productMap.get(productId)
      productData.count += 1
      productData.participants += workshop.participants
      
      if (workshop.activity) {
        productData.revenue += workshop.activity.price * workshop.participants
      } else if (workshop.product) {
        productData.revenue += workshop.product.price * workshop.participants
      }
    }
    
    const byProduct = Array.from(productMap.values())

    // 按讲师分组统计
    const teacherMap = new Map()
    for (const workshop of workshops) {
      const teacherId = workshop.teacherId
      const teacherName = workshop.teacher.name
      
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          name: teacherName,
          count: 0,
          participants: 0,
          revenue: 0,
          rating: 5.0, // 默认评分，实际应该从评价系统获取
        })
      }
      
      const teacherData = teacherMap.get(teacherId)
      teacherData.count += 1
      teacherData.participants += workshop.participants
      
      if (workshop.activity) {
        teacherData.revenue += workshop.activity.price * workshop.participants
      } else if (workshop.product) {
        teacherData.revenue += workshop.product.price * workshop.participants
      }
    }
    
    const byTeacher = Array.from(teacherMap.values()).map(teacher => ({
      ...teacher,
      averageParticipants: Math.round(teacher.participants / teacher.count),
      percentage: Math.round((teacher.count / totalWorkshops) * 100),
    }))

    // 按月份分组统计
    const monthMap = new Map()
    for (const workshop of workshops) {
      const month = `${getYear(workshop.date)}-${String(getMonth(workshop.date) + 1).padStart(2, '0')}`
      
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          count: 0,
          participants: 0,
          revenue: 0,
        })
      }
      
      const monthData = monthMap.get(month)
      monthData.count += 1
      monthData.participants += workshop.participants
      
      if (workshop.activity) {
        monthData.revenue += workshop.activity.price * workshop.participants
      } else if (workshop.product) {
        monthData.revenue += workshop.product.price * workshop.participants
      }
    }
    
    // 计算月度平均值
    for (const monthData of monthMap.values()) {
      monthData.averageParticipants = Math.round(monthData.participants / monthData.count)
      monthData.averageRevenue = Math.round(monthData.revenue / monthData.count)
    }
    
    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))

    // 按地点分组统计
    const locationMap = new Map()
    for (const workshop of workshops) {
      const locationType = workshop.locationType
      const locationName = locationType === "in-gallery" ? "馆内" : "馆外"
      
      if (!locationMap.has(locationType)) {
        locationMap.set(locationType, {
          name: locationName,
          count: 0,
          participants: 0,
          revenue: 0,
        })
      }
      
      const locationData = locationMap.get(locationType)
      locationData.count += 1
      locationData.participants += workshop.participants
      
      if (workshop.activity) {
        locationData.revenue += workshop.activity.price * workshop.participants
      } else if (workshop.product) {
        locationData.revenue += workshop.product.price * workshop.participants
      }
    }
    
    const byLocation = Array.from(locationMap.values()).map(location => ({
      ...location,
      percentage: Math.round((location.count / totalWorkshops) * 100),
    }))

    // 格式化最近的团建记录
    const recentWorkshops = workshops.slice(0, 10).map(workshop => ({
      id: workshop.id,
      date: format(workshop.date, "yyyy-MM-dd"),
      product: workshop.activity?.product?.name || workshop.product?.name || "未知产品",
      teacher: workshop.teacher.name,
      assistant: workshop.assistant?.name || null,
      channel: "直营渠道", // 这里应该从数据库获取渠道名称
      location: workshop.locationType === "in-gallery" ? "馆内" : `馆外 - ${workshop.location}`,
      participants: workshop.participants,
      revenue: workshop.activity 
        ? workshop.activity.price * workshop.participants 
        : (workshop.product ? workshop.product.price * workshop.participants : 0),
    }))

    // 构建响应数据
    const reportData = {
      summary: {
        totalWorkshops,
        totalParticipants,
        totalRevenue,
        averageParticipants,
        averageRevenuePerWorkshop,
        averageRevenuePerParticipant,
      },
      byChannel,
      byProduct,
      byTeacher,
      byMonth,
      byLocation,
      recentWorkshops,
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating workshop report:", error)
    return NextResponse.json({ error: "生成团建报表失败" }, { status: 500 })
  }
}
