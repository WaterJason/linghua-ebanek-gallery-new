import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const exportFormat = searchParams.get("format") || "excel"

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // 获取收入数据
    // 获取珐琅馆销售数据
    const gallerySales = await prisma.gallerySale.findMany({
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

    // 获取咖啡店销售数据
    const coffeeSales = await prisma.coffeeShopSale.findMany({
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

    // 获取支出数据
    // 获取计件工资数据
    const pieceWorks = await prisma.pieceWork.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        employee: true,
        details: {
          include: {
            pieceWorkItem: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // 获取薪资数据
    const salaryRecords = await prisma.salaryRecord.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        employee: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    // 获取采购订单数据
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        employee: true,
      },
      orderBy: {
        orderDate: "desc",
      },
    })

    // 如果是Excel格式，生成Excel文件
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆管理系统"
      workbook.created = new Date()
      workbook.modified = new Date()

      // 创建收入工作表
      const revenueSheet = workbook.addWorksheet("收入明细")
      revenueSheet.columns = [
        { header: "日期", key: "date", width: 15 },
        { header: "类型", key: "type", width: 15 },
        { header: "描述", key: "description", width: 30 },
        { header: "金额", key: "amount", width: 15 },
      ]

      // 添加珐琅馆销售数据
      gallerySales.forEach(sale => {
        revenueSheet.addRow({
          date: format(new Date(sale.date), "yyyy-MM-dd"),
          type: "珐琅馆销售",
          description: `销售员: ${sale.employee.name}, 产品数量: ${sale.salesItems.length}`,
          amount: sale.totalAmount,
        })
      })

      // 添加咖啡店销售数据
      coffeeSales.forEach(sale => {
        revenueSheet.addRow({
          date: format(new Date(sale.date), "yyyy-MM-dd"),
          type: "咖啡店销售",
          description: `顾客数: ${sale.customerCount}, 商品数量: ${sale.items.length}`,
          amount: sale.totalSales,
        })
      })

      // 创建支出工作表
      const expenseSheet = workbook.addWorksheet("支出明细")
      expenseSheet.columns = [
        { header: "日期", key: "date", width: 15 },
        { header: "类型", key: "type", width: 15 },
        { header: "描述", key: "description", width: 30 },
        { header: "金额", key: "amount", width: 15 },
      ]

      // 添加计件工资数据
      pieceWorks.forEach(work => {
        expenseSheet.addRow({
          date: format(new Date(work.date), "yyyy-MM-dd"),
          type: "计件工资",
          description: `员工: ${work.employee.name}, 工作类型: ${work.workType === "accessory" ? "配饰制作" : "点蓝制作"}`,
          amount: work.totalAmount,
        })
      })

      // 添加薪资数据
      salaryRecords.forEach(record => {
        expenseSheet.addRow({
          date: format(new Date(record.date), "yyyy-MM-dd"),
          type: "固定工资",
          description: `员工: ${record.employee.name}, 职位: ${record.employee.position}`,
          amount: record.totalAmount,
        })
      })

      // 添加采购订单数据
      purchaseOrders.forEach(order => {
        const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        expenseSheet.addRow({
          date: format(new Date(order.orderDate), "yyyy-MM-dd"),
          type: "采购支出",
          description: `采购员: ${order.employee.name}, 供应商: ${order.supplierName}, 产品数量: ${order.items.length}`,
          amount: totalAmount,
        })
      })

      // 创建汇总工作表
      const summarySheet = workbook.addWorksheet("财务汇总")
      summarySheet.columns = [
        { header: "类别", key: "category", width: 20 },
        { header: "金额", key: "amount", width: 15 },
      ]

      // 计算总收入
      const totalGallerySales = gallerySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalCoffeeSales = coffeeSales.reduce((sum, sale) => sum + sale.totalSales, 0)
      const totalRevenue = totalGallerySales + totalCoffeeSales

      // 计算总支出
      const totalPieceWorks = pieceWorks.reduce((sum, work) => sum + work.totalAmount, 0)
      const totalSalaries = salaryRecords.reduce((sum, record) => sum + record.totalAmount, 0)
      const totalPurchases = purchaseOrders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0)
      const totalExpense = totalPieceWorks + totalSalaries + totalPurchases

      // 计算净利润
      const netProfit = totalRevenue - totalExpense

      // 添加汇总数据
      summarySheet.addRow({ category: "珐琅馆销售收入", amount: totalGallerySales })
      summarySheet.addRow({ category: "咖啡店销售收入", amount: totalCoffeeSales })
      summarySheet.addRow({ category: "总收入", amount: totalRevenue })
      summarySheet.addRow({ category: "计件工资支出", amount: totalPieceWorks })
      summarySheet.addRow({ category: "固定工资支出", amount: totalSalaries })
      summarySheet.addRow({ category: "采购支出", amount: totalPurchases })
      summarySheet.addRow({ category: "总支出", amount: totalExpense })
      summarySheet.addRow({ category: "净利润", amount: netProfit })

      // 设置样式
      revenueSheet.getRow(1).font = { bold: true }
      revenueSheet.getColumn("amount").numFmt = "¥#,##0.00"
      
      expenseSheet.getRow(1).font = { bold: true }
      expenseSheet.getColumn("amount").numFmt = "¥#,##0.00"
      
      summarySheet.getRow(1).font = { bold: true }
      summarySheet.getColumn("amount").numFmt = "¥#,##0.00"
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `财务报表_${format(new Date(startDate), "yyyyMMdd")}_${format(new Date(endDate), "yyyyMMdd")}.xlsx`
      
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
        revenue: {
          gallerySales,
          coffeeSales,
        },
        expense: {
          pieceWorks,
          salaryRecords,
          purchaseOrders,
        },
      })
    }
  } catch (error) {
    console.error("Error exporting finance report:", error)
    return NextResponse.json({ error: "Failed to export finance report" }, { status: 500 })
  }
}
