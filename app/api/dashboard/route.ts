import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { zhCN } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    // 获取查询参数
    const url = new URL(request.url)
    const timeRange = url.searchParams.get("timeRange") || "month"

    // 获取当前日期信息
    const now = new Date()

    // 根据时间范围确定日期范围
    let startDate: Date
    let endDate: Date = now
    let previousStartDate: Date
    let previousEndDate: Date

    switch (timeRange) {
      case "week":
        startDate = subDays(now, 7)
        previousStartDate = subDays(startDate, 7)
        previousEndDate = subDays(startDate, 1)
        break
      case "month":
        startDate = startOfMonth(now)
        previousStartDate = startOfMonth(subMonths(now, 1))
        previousEndDate = endOfMonth(subMonths(now, 1))
        break
      case "quarter":
        startDate = subDays(now, 90)
        previousStartDate = subDays(startDate, 90)
        previousEndDate = subDays(startDate, 1)
        break
      default:
        startDate = startOfMonth(now)
        previousStartDate = startOfMonth(subMonths(now, 1))
        previousEndDate = endOfMonth(subMonths(now, 1))
    }

    // 获取珐琅馆销售数据
    const gallerySales = await prisma.gallerySale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
        salesItems: {
          include: {
            product: true,
          },
        },
      },
    })

    const previousGallerySales = await prisma.gallerySale.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    })

    // 计算珐琅馆销售总额
    const gallerySalesTotal = gallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const previousGallerySalesTotal = previousGallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const gallerySalesGrowth = previousGallerySalesTotal > 0
      ? ((gallerySalesTotal - previousGallerySalesTotal) / previousGallerySalesTotal) * 100
      : 0

    // 获取咖啡店销售数据
    const coffeeSales = await prisma.coffeeShopSale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        shifts: {
          include: {
            employee: true,
          },
        },
        items: true,
      },
    })

    const previousCoffeeSales = await prisma.coffeeShopSale.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    })

    // 计算咖啡店销售总额
    const coffeeSalesTotal = coffeeSales.reduce((sum, sale) => sum + sale.totalSales, 0)
    const previousCoffeeSalesTotal = previousCoffeeSales.reduce((sum, sale) => sum + sale.totalSales, 0)
    const coffeeSalesGrowth = previousCoffeeSalesTotal > 0
      ? ((coffeeSalesTotal - previousCoffeeSalesTotal) / previousCoffeeSalesTotal) * 100
      : 0

    // 获取手作体验数据
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
      },
    })

    const previousWorkshops = await prisma.workshop.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    })

    // 计算手作体验增长率
    const workshopsCount = workshops.length
    const previousWorkshopsCount = previousWorkshops.length
    const workshopsGrowth = previousWorkshopsCount > 0
      ? ((workshopsCount - previousWorkshopsCount) / previousWorkshopsCount) * 100
      : 0

    // 获取员工数据
    const employees = await prisma.employee.findMany({
      where: {
        status: "active",
      },
    })

    // 获取库存数据
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        product: true,
        warehouse: true,
      },
    })

    // 计算库存总量和低库存商品数量
    const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
    const lowStockItems = inventoryItems.filter(item => item.quantity < (item.minQuantity || 10))

    // 生成销售趋势数据
    const salesTrendData = []
    const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      const dateString = format(date, "yyyy-MM-dd")

      // 查找当天的珐琅馆销售
      const dailyGallerySales = gallerySales.filter(
        sale => format(new Date(sale.date), "yyyy-MM-dd") === dateString
      )
      const dailyGallerySalesTotal = dailyGallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0)

      // 查找当天的咖啡店销售
      const dailyCoffeeSales = coffeeSales.filter(
        sale => format(new Date(sale.date), "yyyy-MM-dd") === dateString
      )
      const dailyCoffeeSalesTotal = dailyCoffeeSales.reduce((sum, sale) => sum + sale.totalSales, 0)

      salesTrendData.push({
        date: format(date, "MM-dd", { locale: zhCN }),
        gallery: dailyGallerySalesTotal,
        coffee: dailyCoffeeSalesTotal,
        total: dailyGallerySalesTotal + dailyCoffeeSalesTotal
      })
    }

    // 计算热销作品
    const artworkSales = new Map()

    // 统计珐琅馆作品销售
    gallerySales.forEach(sale => {
      sale.salesItems.forEach(item => {
        const artworkName = item.product.name
        const salesAmount = item.price * item.quantity

        if (artworkSales.has(artworkName)) {
          artworkSales.set(artworkName, artworkSales.get(artworkName) + salesAmount)
        } else {
          artworkSales.set(artworkName, salesAmount)
        }
      })
    })

    // 统计咖啡店产品销售
    coffeeSales.forEach(sale => {
      sale.items.forEach(item => {
        const productName = item.name
        const salesAmount = item.price * item.quantity

        if (artworkSales.has(productName)) {
          artworkSales.set(productName, artworkSales.get(productName) + salesAmount)
        } else {
          artworkSales.set(productName, salesAmount)
        }
      })
    })

    // 转换为数组并排序
    const topArtworks = Array.from(artworkSales.entries())
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // 构建响应数据
    const dashboardData = {
      gallerySales: {
        current: gallerySalesTotal,
        previous: previousGallerySalesTotal,
        growth: gallerySalesGrowth,
        data: salesTrendData.map(item => ({ date: item.date, value: item.gallery }))
      },
      coffeeSales: {
        current: coffeeSalesTotal,
        previous: previousCoffeeSalesTotal,
        growth: coffeeSalesGrowth,
        data: salesTrendData.map(item => ({ date: item.date, value: item.coffee }))
      },
      workshops: {
        current: workshopsCount,
        previous: previousWorkshopsCount,
        growth: workshopsGrowth,
        data: []
      },
      employees: {
        total: employees.length,
        active: employees.filter(emp => emp.status === "active").length,
        performance: []
      },
      inventory: {
        total: totalInventory,
        lowStock: lowStockItems.length,
        distribution: []
      },
      recentSales: gallerySales
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(sale => ({
          id: sale.id,
          product: sale.salesItems[0]?.product.name || "未知作品",
          employee: sale.employee.name,
          amount: sale.totalAmount,
          date: sale.date
        })),
      topArtworks: topArtworks,
      salesTrend: salesTrendData
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
