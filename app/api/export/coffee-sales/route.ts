import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const employeeId = searchParams.get("employeeId")
    const exportFormat = searchParams.get("format") || "excel"

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // 构建查询条件
    let whereClause: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
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

    // 如果没有数据，返回空数据提示
    if (filteredSales.length === 0) {
      return NextResponse.json({ message: "No data found for the specified criteria" }, { status: 404 })
    }

    // 获取系统设置
    const settings = await prisma.systemSetting.findFirst()
    const commissionRate = settings?.coffeeSalesCommissionRate || 20

    // 根据导出格式处理数据
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆"
      workbook.created = new Date()

      // 创建销售记录工作表
      const salesSheet = workbook.addWorksheet("咖啡店销售记录")
      salesSheet.columns = [
        { header: "日期", key: "date", width: 15 },
        { header: "顾客数", key: "customerCount", width: 10 },
        { header: "销售额", key: "totalSales", width: 12 },
        { header: "现金", key: "cashAmount", width: 12 },
        { header: "刷卡", key: "cardAmount", width: 12 },
        { header: "微信", key: "wechatAmount", width: 12 },
        { header: "支付宝", key: "alipayAmount", width: 12 },
        { header: "其他", key: "otherAmount", width: 12 },
        { header: "提成", key: "commission", width: 12 },
        { header: "值班员工", key: "employees", width: 20 },
        { header: "备注", key: "notes", width: 30 },
      ]

      // 添加销售记录数据
      filteredSales.forEach(sale => {
        const commission = sale.totalSales * (commissionRate / 100)
        const employees = sale.shifts.map(shift => shift.employee.name).join(", ")

        salesSheet.addRow({
          date: format(new Date(sale.date), "yyyy-MM-dd"),
          customerCount: sale.customerCount,
          totalSales: sale.totalSales,
          cashAmount: sale.cashAmount,
          cardAmount: sale.cardAmount,
          wechatAmount: sale.wechatAmount,
          alipayAmount: sale.alipayAmount,
          otherAmount: sale.otherAmount,
          commission,
          employees,
          notes: sale.notes || "",
        })
      })

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
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          itemsSheet.addRow({
            date: format(new Date(sale.date), "yyyy-MM-dd"),
            name: item.name,
            category: getCategoryLabel(item.category),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })
        })
      })

      // 创建汇总工作表
      const summarySheet = workbook.addWorksheet("销售汇总")
      
      // 计算汇总数据
      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalSales, 0)
      const totalCustomers = filteredSales.reduce((sum, sale) => sum + sale.customerCount, 0)
      const totalCommission = totalSales * (commissionRate / 100)
      const averagePerCustomer = totalCustomers > 0 ? totalSales / totalCustomers : 0
      
      const cashTotal = filteredSales.reduce((sum, sale) => sum + sale.cashAmount, 0)
      const cardTotal = filteredSales.reduce((sum, sale) => sum + sale.cardAmount, 0)
      const wechatTotal = filteredSales.reduce((sum, sale) => sum + sale.wechatAmount, 0)
      const alipayTotal = filteredSales.reduce((sum, sale) => sum + sale.alipayAmount, 0)
      const otherTotal = filteredSales.reduce((sum, sale) => sum + sale.otherAmount, 0)
      
      // 添加汇总数据
      summarySheet.addRow(["报表周期", `${format(new Date(startDate), "yyyy-MM-dd")} 至 ${format(new Date(endDate), "yyyy-MM-dd")}`])
      summarySheet.addRow(["总销售额", totalSales])
      summarySheet.addRow(["总顾客数", totalCustomers])
      summarySheet.addRow(["客单价", averagePerCustomer])
      summarySheet.addRow(["总提成", totalCommission])
      summarySheet.addRow(["提成比例", `${commissionRate}%`])
      summarySheet.addRow([])
      summarySheet.addRow(["支付方式", "金额", "占比"])
      summarySheet.addRow(["现金", cashTotal, totalSales > 0 ? cashTotal / totalSales : 0])
      summarySheet.addRow(["刷卡", cardTotal, totalSales > 0 ? cardTotal / totalSales : 0])
      summarySheet.addRow(["微信", wechatTotal, totalSales > 0 ? wechatTotal / totalSales : 0])
      summarySheet.addRow(["支付宝", alipayTotal, totalSales > 0 ? alipayTotal / totalSales : 0])
      summarySheet.addRow(["其他", otherTotal, totalSales > 0 ? otherTotal / totalSales : 0])
      
      // 设置表格样式
      [salesSheet, itemsSheet].forEach(sheet => {
        // 设置表头样式
        sheet.getRow(1).font = { bold: true }
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        
        // 设置数字列的格式
        sheet.columns.forEach(column => {
          if (['totalSales', 'cashAmount', 'cardAmount', 'wechatAmount', 'alipayAmount', 'otherAmount', 'commission', 'unitPrice', 'totalPrice'].includes(column.key)) {
            column.numFmt = '#,##0.00'
          }
        })
      })
      
      // 设置汇总表样式
      summarySheet.getColumn(2).numFmt = '#,##0.00'
      summarySheet.getColumn(3).numFmt = '0.00%'
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `咖啡店销售报表_${format(new Date(startDate), "yyyyMMdd")}_${format(new Date(endDate), "yyyyMMdd")}.xlsx`
      
      // 返回Excel文件
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    } else {
      // 如果不是Excel格式，返回JSON数据
      return NextResponse.json(filteredSales)
    }
  } catch (error) {
    console.error("Error exporting coffee sales data:", error)
    return NextResponse.json({ error: "Failed to export coffee sales data" }, { status: 500 })
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
