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

    if (employeeId && employeeId !== "all") {
      whereClause.employeeId = Number.parseInt(employeeId)
    }

    // 获取制作工单数据
    const pieceWorks = await prisma.pieceWork.findMany({
      where: whereClause,
      include: {
        employee: true,
        details: {
          include: {
            pieceWorkItem: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // 如果没有数据，返回空数据提示
    if (pieceWorks.length === 0) {
      return NextResponse.json({ message: "No data found for the specified criteria" }, { status: 404 })
    }

    // 如果是Excel格式，生成Excel文件
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆管理系统"
      workbook.created = new Date()
      workbook.modified = new Date()

      // 创建生产明细工作表
      const detailSheet = workbook.addWorksheet("生产明细")
      detailSheet.columns = [
        { header: "日期", key: "date", width: 15 },
        { header: "员工", key: "employee", width: 15 },
        { header: "工作类型", key: "workType", width: 15 },
        { header: "工作项目", key: "workItem", width: 30 },
        { header: "数量", key: "quantity", width: 10 },
        { header: "单价", key: "price", width: 10 },
        { header: "金额", key: "amount", width: 15 },
      ]

      // 添加生产明细数据
      pieceWorks.forEach(work => {
        work.details.forEach(detail => {
          detailSheet.addRow({
            date: format(new Date(work.date), "yyyy-MM-dd"),
            employee: work.employee.name,
            workType: work.workType === "accessory" ? "配饰制作" : "点蓝制作",
            workItem: detail.pieceWorkItem.name,
            quantity: detail.quantity,
            price: detail.price,
            amount: detail.quantity * detail.price,
          })
        })
      })

      // 创建员工汇总工作表
      const employeeSheet = workbook.addWorksheet("员工汇总")
      employeeSheet.columns = [
        { header: "员工", key: "employee", width: 15 },
        { header: "职位", key: "position", width: 15 },
        { header: "配饰制作数量", key: "accessoryCount", width: 15 },
        { header: "配饰制作金额", key: "accessoryAmount", width: 15 },
        { header: "点蓝制作数量", key: "enamellingCount", width: 15 },
        { header: "点蓝制作金额", key: "enamellingAmount", width: 15 },
        { header: "总数量", key: "totalCount", width: 15 },
        { header: "总金额", key: "totalAmount", width: 15 },
      ]

      // 按员工分组统计
      const employeeMap = new Map()
      
      pieceWorks.forEach(work => {
        const employeeId = work.employee.id
        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, {
            employee: work.employee.name,
            position: work.employee.position,
            accessoryCount: 0,
            accessoryAmount: 0,
            enamellingCount: 0,
            enamellingAmount: 0,
            totalCount: 0,
            totalAmount: 0,
          })
        }
        
        const employeeStats = employeeMap.get(employeeId)
        const totalQuantity = work.details.reduce((sum, detail) => sum + detail.quantity, 0)
        
        if (work.workType === "accessory") {
          employeeStats.accessoryCount += totalQuantity
          employeeStats.accessoryAmount += work.totalAmount
        } else {
          employeeStats.enamellingCount += totalQuantity
          employeeStats.enamellingAmount += work.totalAmount
        }
        
        employeeStats.totalCount += totalQuantity
        employeeStats.totalAmount += work.totalAmount
      })
      
      // 添加员工汇总数据
      Array.from(employeeMap.values()).forEach(stats => {
        employeeSheet.addRow(stats)
      })

      // 创建日期汇总工作表
      const dateSheet = workbook.addWorksheet("日期汇总")
      dateSheet.columns = [
        { header: "日期", key: "date", width: 15 },
        { header: "员工数", key: "employeeCount", width: 10 },
        { header: "生产数量", key: "quantity", width: 15 },
        { header: "生产金额", key: "amount", width: 15 },
      ]

      // 按日期分组统计
      const dateMap = new Map()
      
      pieceWorks.forEach(work => {
        const date = format(new Date(work.date), "yyyy-MM-dd")
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            employeeCount: new Set(),
            quantity: 0,
            amount: 0,
          })
        }
        
        const dateStats = dateMap.get(date)
        dateStats.employeeCount.add(work.employee.id)
        
        const totalQuantity = work.details.reduce((sum, detail) => sum + detail.quantity, 0)
        dateStats.quantity += totalQuantity
        dateStats.amount += work.totalAmount
      })
      
      // 添加日期汇总数据
      Array.from(dateMap.entries()).forEach(([date, stats]) => {
        dateSheet.addRow({
          date,
          employeeCount: stats.employeeCount.size,
          quantity: stats.quantity,
          amount: stats.amount,
        })
      })

      // 创建工作项目汇总工作表
      const itemSheet = workbook.addWorksheet("工作项目汇总")
      itemSheet.columns = [
        { header: "工作类型", key: "workType", width: 15 },
        { header: "工作项目", key: "workItem", width: 30 },
        { header: "数量", key: "quantity", width: 15 },
        { header: "金额", key: "amount", width: 15 },
      ]

      // 按工作项目分组统计
      const itemMap = new Map()
      
      pieceWorks.forEach(work => {
        work.details.forEach(detail => {
          const itemKey = `${work.workType}|${detail.pieceWorkItem.id}`
          if (!itemMap.has(itemKey)) {
            itemMap.set(itemKey, {
              workType: work.workType === "accessory" ? "配饰制作" : "点蓝制作",
              workItem: detail.pieceWorkItem.name,
              quantity: 0,
              amount: 0,
            })
          }
          
          const itemStats = itemMap.get(itemKey)
          itemStats.quantity += detail.quantity
          itemStats.amount += detail.quantity * detail.price
        })
      })
      
      // 添加工作项目汇总数据
      Array.from(itemMap.values()).forEach(stats => {
        itemSheet.addRow(stats)
      })

      // 设置样式
      detailSheet.getRow(1).font = { bold: true }
      employeeSheet.getRow(1).font = { bold: true }
      dateSheet.getRow(1).font = { bold: true }
      itemSheet.getRow(1).font = { bold: true }
      
      // 设置金额列格式
      detailSheet.getColumn("price").numFmt = "¥#,##0.00"
      detailSheet.getColumn("amount").numFmt = "¥#,##0.00"
      
      employeeSheet.getColumn("accessoryAmount").numFmt = "¥#,##0.00"
      employeeSheet.getColumn("enamellingAmount").numFmt = "¥#,##0.00"
      employeeSheet.getColumn("totalAmount").numFmt = "¥#,##0.00"
      
      dateSheet.getColumn("amount").numFmt = "¥#,##0.00"
      
      itemSheet.getColumn("amount").numFmt = "¥#,##0.00"
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `生产报表_${format(new Date(startDate), "yyyyMMdd")}_${format(new Date(endDate), "yyyyMMdd")}.xlsx`
      
      // 返回Excel文件
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    } else {
      // 如果不是Excel格式，返回JSON数据
      return NextResponse.json(pieceWorks)
    }
  } catch (error) {
    console.error("Error exporting production report:", error)
    return NextResponse.json({ error: "Failed to export production report" }, { status: 500 })
  }
}
