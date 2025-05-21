import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type") || "all"
    const exportFormat = searchParams.get("format") || "excel"

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // 获取销售数据
    let gallerySales = []
    let coffeeSales = []

    if (type === "gallery" || type === "all") {
      gallerySales = await prisma.gallerySale.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
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
        orderBy: {
          date: "desc",
        },
      })
    }

    if (type === "coffee" || type === "all") {
      coffeeSales = await prisma.coffeeShopSale.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
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
        orderBy: {
          date: "desc",
        },
      })
    }

    // 如果没有数据，返回空数据提示
    if (gallerySales.length === 0 && coffeeSales.length === 0) {
      return NextResponse.json({ message: "No data found for the specified criteria" }, { status: 404 })
    }

    // 根据导出格式处理数据
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆"
      workbook.created = new Date()

      // 创建销售汇总工作表
      const summarySheet = workbook.addWorksheet("销售汇总")
      
      // 计算汇总数据
      const totalGallerySales = gallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalCoffeeSales = coffeeSales.reduce((sum, sale) => sum + sale.totalSales, 0)
      const totalSales = totalGallerySales + totalCoffeeSales
      const totalOrders = gallerySales.length + coffeeSales.length
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
      
      // 添加汇总数据
      summarySheet.addRow(["报表周期", `${format(new Date(startDate), "yyyy-MM-dd")} 至 ${format(new Date(endDate), "yyyy-MM-dd")}`])
      summarySheet.addRow(["总销售额", totalSales])
      summarySheet.addRow(["珐琅馆销售额", totalGallerySales])
      summarySheet.addRow(["咖啡店销售额", totalCoffeeSales])
      summarySheet.addRow(["订单总数", totalOrders])
      summarySheet.addRow(["平均订单金额", averageOrderValue])
      
      // 如果包含珐琅馆销售数据，创建珐琅馆销售工作表
      if (gallerySales.length > 0) {
        const gallerySheet = workbook.addWorksheet("珐琅馆销售记录")
        gallerySheet.columns = [
          { header: "日期", key: "date", width: 15 },
          { header: "销售额", key: "totalAmount", width: 12 },
          { header: "销售员", key: "employee", width: 12 },
          { header: "备注", key: "notes", width: 30 },
        ]

        // 添加珐琅馆销售数据
        gallerySales.forEach(sale => {
          gallerySheet.addRow({
            date: format(new Date(sale.date), "yyyy-MM-dd"),
            totalAmount: sale.totalAmount,
            employee: sale.employee.name,
            notes: sale.notes || "",
          })
        })
        
        // 创建珐琅馆销售明细工作表
        const galleryItemsSheet = workbook.addWorksheet("珐琅馆销售明细")
        galleryItemsSheet.columns = [
          { header: "日期", key: "date", width: 15 },
          { header: "产品名称", key: "productName", width: 20 },
          { header: "类别", key: "category", width: 15 },
          { header: "数量", key: "quantity", width: 10 },
          { header: "单价", key: "price", width: 12 },
          { header: "金额", key: "amount", width: 12 },
        ]

        // 添加珐琅馆销售明细数据
        gallerySales.forEach(sale => {
          sale.salesItems.forEach(item => {
            galleryItemsSheet.addRow({
              date: format(new Date(sale.date), "yyyy-MM-dd"),
              productName: item.product.name,
              category: item.product.category || "未分类",
              quantity: item.quantity,
              price: item.price,
              amount: item.price * item.quantity,
            })
          })
        })
      }
      
      // 如果包含咖啡店销售数据，创建咖啡店销售工作表
      if (coffeeSales.length > 0) {
        const coffeeSheet = workbook.addWorksheet("咖啡店销售记录")
        coffeeSheet.columns = [
          { header: "日期", key: "date", width: 15 },
          { header: "顾客数", key: "customerCount", width: 10 },
          { header: "销售额", key: "totalSales", width: 12 },
          { header: "现金", key: "cashAmount", width: 12 },
          { header: "刷卡", key: "cardAmount", width: 12 },
          { header: "微信", key: "wechatAmount", width: 12 },
          { header: "支付宝", key: "alipayAmount", width: 12 },
          { header: "其他", key: "otherAmount", width: 12 },
          { header: "值班员工", key: "employees", width: 20 },
          { header: "备注", key: "notes", width: 30 },
        ]

        // 添加咖啡店销售数据
        coffeeSales.forEach(sale => {
          const employees = sale.shifts.map(shift => shift.employee.name).join(", ")

          coffeeSheet.addRow({
            date: format(new Date(sale.date), "yyyy-MM-dd"),
            customerCount: sale.customerCount,
            totalSales: sale.totalSales,
            cashAmount: sale.cashAmount,
            cardAmount: sale.cardAmount,
            wechatAmount: sale.wechatAmount,
            alipayAmount: sale.alipayAmount,
            otherAmount: sale.otherAmount,
            employees,
            notes: sale.notes || "",
          })
        })
        
        // 创建咖啡店销售明细工作表
        const coffeeItemsSheet = workbook.addWorksheet("咖啡店销售明细")
        coffeeItemsSheet.columns = [
          { header: "日期", key: "date", width: 15 },
          { header: "商品名称", key: "name", width: 20 },
          { header: "类别", key: "category", width: 15 },
          { header: "数量", key: "quantity", width: 10 },
          { header: "单价", key: "unitPrice", width: 12 },
          { header: "金额", key: "totalPrice", width: 12 },
        ]

        // 添加咖啡店销售明细数据
        coffeeSales.forEach(sale => {
          sale.items.forEach(item => {
            coffeeItemsSheet.addRow({
              date: format(new Date(sale.date), "yyyy-MM-dd"),
              name: item.name,
              category: getCategoryLabel(item.category),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })
          })
        })
      }
      
      // 设置表格样式
      workbook.eachSheet(sheet => {
        // 设置表头样式
        sheet.getRow(1).font = { bold: true }
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        
        // 设置数字列的格式
        sheet.columns.forEach(column => {
          if (['totalAmount', 'totalSales', 'cashAmount', 'cardAmount', 'wechatAmount', 'alipayAmount', 'otherAmount', 'price', 'amount', 'unitPrice', 'totalPrice'].includes(column.key)) {
            column.numFmt = '#,##0.00'
          }
        })
      })
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `销售报表_${format(new Date(startDate), "yyyyMMdd")}_${format(new Date(endDate), "yyyyMMdd")}.xlsx`
      
      // 返回Excel文件
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    } else {
      // 如果不是Excel格式，返回JSON数据
      return NextResponse.json({
        gallerySales,
        coffeeSales
      })
    }
  } catch (error) {
    console.error("Error exporting sales report:", error)
    return NextResponse.json({ error: "Failed to export sales report" }, { status: 500 })
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
