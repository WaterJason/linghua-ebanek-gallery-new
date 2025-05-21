import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category")
    const exportFormat = searchParams.get("format") || "excel"

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // 构建查询条件
    let whereClause: any = {
      coffeeShopSale: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
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

    // 如果没有数据，返回空数据提示
    if (coffeeShopItems.length === 0) {
      return NextResponse.json({ message: "No data found for the specified criteria" }, { status: 404 })
    }

    // 根据导出格式处理数据
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆"
      workbook.created = new Date()

      // 创建商品明细工作表
      const itemsSheet = workbook.addWorksheet("商品销售明细")
      itemsSheet.columns = [
        { header: "日期", key: "date", width: 15 },
        { header: "商品名称", key: "name", width: 20 },
        { header: "类别", key: "category", width: 15 },
        { header: "数量", key: "quantity", width: 10 },
        { header: "单价", key: "unitPrice", width: 12 },
        { header: "金额", key: "totalPrice", width: 12 },
      ]

      // 添加商品明细数据
      coffeeShopItems.forEach(item => {
        itemsSheet.addRow({
          date: format(new Date(item.coffeeShopSale.date), "yyyy-MM-dd"),
          name: item.name,
          category: getCategoryLabel(item.category),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })
      })

      // 创建类别汇总工作表
      const categorySheet = workbook.addWorksheet("类别销售汇总")
      categorySheet.columns = [
        { header: "类别", key: "category", width: 15 },
        { header: "商品种类", key: "itemCount", width: 12 },
        { header: "销售数量", key: "totalQuantity", width: 12 },
        { header: "销售金额", key: "totalSales", width: 15 },
        { header: "占比", key: "percentage", width: 10 },
      ]

      // 按类别分组统计
      const categoryMap = new Map()
      
      coffeeShopItems.forEach(item => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, {
            category: item.category,
            totalQuantity: 0,
            totalSales: 0,
            items: new Set()
          })
        }
        
        const categoryStats = categoryMap.get(item.category)
        categoryStats.totalQuantity += item.quantity
        categoryStats.totalSales += item.totalPrice
        categoryStats.items.add(item.name)
      })
      
      // 计算总销售额
      const totalSales = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalSales, 0)
      
      // 添加类别汇总数据
      Array.from(categoryMap.values()).forEach(category => {
        const percentage = totalSales > 0 ? category.totalSales / totalSales : 0
        
        categorySheet.addRow({
          category: getCategoryLabel(category.category),
          itemCount: category.items.size,
          totalQuantity: category.totalQuantity,
          totalSales: category.totalSales,
          percentage,
        })
      })

      // 创建热销商品工作表
      const topItemsSheet = workbook.addWorksheet("热销商品")
      topItemsSheet.columns = [
        { header: "排名", key: "rank", width: 10 },
        { header: "商品名称", key: "name", width: 20 },
        { header: "类别", key: "category", width: 15 },
        { header: "销售数量", key: "totalQuantity", width: 12 },
        { header: "销售金额", key: "totalSales", width: 15 },
        { header: "平均单价", key: "averagePrice", width: 12 },
      ]

      // 计算热销商品
      const itemMap = new Map()
      
      coffeeShopItems.forEach(item => {
        const key = item.name
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: item.name,
            category: item.category,
            totalQuantity: 0,
            totalSales: 0,
          })
        }
        
        const itemStats = itemMap.get(key)
        itemStats.totalQuantity += item.quantity
        itemStats.totalSales += item.totalPrice
      })
      
      // 计算平均价格并排序
      const itemStats = Array.from(itemMap.values()).map(item => ({
        ...item,
        averagePrice: item.totalSales / item.totalQuantity
      }))
      
      // 按销售额排序
      const sortedItems = itemStats.sort((a, b) => b.totalSales - a.totalSales)
      
      // 添加热销商品数据
      sortedItems.forEach((item, index) => {
        topItemsSheet.addRow({
          rank: index + 1,
          name: item.name,
          category: getCategoryLabel(item.category),
          totalQuantity: item.totalQuantity,
          totalSales: item.totalSales,
          averagePrice: item.averagePrice,
        })
      })
      
      // 设置表格样式
      [itemsSheet, categorySheet, topItemsSheet].forEach(sheet => {
        // 设置表头样式
        sheet.getRow(1).font = { bold: true }
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
      })
      
      // 设置数字列的格式
      itemsSheet.getColumn('unitPrice').numFmt = '#,##0.00'
      itemsSheet.getColumn('totalPrice').numFmt = '#,##0.00'
      
      categorySheet.getColumn('totalSales').numFmt = '#,##0.00'
      categorySheet.getColumn('percentage').numFmt = '0.00%'
      
      topItemsSheet.getColumn('totalSales').numFmt = '#,##0.00'
      topItemsSheet.getColumn('averagePrice').numFmt = '#,##0.00'
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `咖啡店商品报表_${format(new Date(startDate), "yyyyMMdd")}_${format(new Date(endDate), "yyyyMMdd")}.xlsx`
      
      // 返回Excel文件
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    } else {
      // 如果不是Excel格式，返回JSON数据
      return NextResponse.json(coffeeShopItems)
    }
  } catch (error) {
    console.error("Error exporting coffee items data:", error)
    return NextResponse.json({ error: "Failed to export coffee items data" }, { status: 500 })
  }
}

function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    "coffee": "咖啡",
    "tea": "茶饮",
    "food": "食品",
    "dessert": "甜点",
    "other": "其他"
  }
  return categoryMap[category] || category
}
