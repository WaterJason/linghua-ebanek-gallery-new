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
      whereClause.employeeId = Number(employeeId)
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

    // 根据导出格式处理数据
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆"
      workbook.created = new Date()

      // 创建工单明细工作表
      const detailSheet = workbook.addWorksheet("制作工单明细")
      detailSheet.columns = [
        { header: "工单ID", key: "id", width: 10 },
        { header: "日期", key: "date", width: 15 },
        { header: "员工", key: "employee", width: 15 },
        { header: "工作类型", key: "workType", width: 15 },
        { header: "项目名称", key: "itemName", width: 20 },
        { header: "数量", key: "quantity", width: 10 },
        { header: "单价", key: "price", width: 12 },
        { header: "金额", key: "amount", width: 12 },
        { header: "备注", key: "notes", width: 30 },
      ]

      // 添加工单明细数据
      pieceWorks.forEach(pieceWork => {
        pieceWork.details.forEach(detail => {
          detailSheet.addRow({
            id: pieceWork.id,
            date: format(new Date(pieceWork.date), "yyyy-MM-dd"),
            employee: pieceWork.employee.name,
            workType: pieceWork.workType === "accessory" ? "配饰制作" : "点蓝制作",
            itemName: detail.pieceWorkItem.name,
            quantity: detail.quantity,
            price: detail.price,
            amount: detail.quantity * detail.price,
            notes: pieceWork.notes || "",
          })
        })
      })

      // 创建员工汇总工作表
      const employeeSummarySheet = workbook.addWorksheet("员工汇总")
      employeeSummarySheet.columns = [
        { header: "员工", key: "employee", width: 15 },
        { header: "工单数", key: "workCount", width: 10 },
        { header: "配饰制作金额", key: "accessoryAmount", width: 15 },
        { header: "点蓝制作金额", key: "enamellingAmount", width: 15 },
        { header: "总金额", key: "totalAmount", width: 15 },
      ]

      // 计算员工汇总数据
      const employeeMap = new Map()
      
      pieceWorks.forEach(pieceWork => {
        const empKey = pieceWork.employee.id
        if (!employeeMap.has(empKey)) {
          employeeMap.set(empKey, {
            employee: pieceWork.employee.name,
            workCount: 0,
            accessoryAmount: 0,
            enamellingAmount: 0,
            totalAmount: 0,
          })
        }
        
        const empStats = employeeMap.get(empKey)
        empStats.workCount += 1
        
        if (pieceWork.workType === "accessory") {
          empStats.accessoryAmount += pieceWork.totalAmount
        } else if (pieceWork.workType === "enamelling") {
          empStats.enamellingAmount += pieceWork.totalAmount
        }
        
        empStats.totalAmount += pieceWork.totalAmount
      })
      
      // 添加员工汇总数据
      Array.from(employeeMap.values()).forEach(empStats => {
        employeeSummarySheet.addRow(empStats)
      })

      // 创建项目汇总工作表
      const itemSummarySheet = workbook.addWorksheet("项目汇总")
      itemSummarySheet.columns = [
        { header: "项目名称", key: "itemName", width: 20 },
        { header: "类型", key: "type", width: 15 },
        { header: "总数量", key: "totalQuantity", width: 15 },
        { header: "总金额", key: "totalAmount", width: 15 },
      ]

      // 计算项目汇总数据
      const itemMap = new Map()
      
      pieceWorks.forEach(pieceWork => {
        pieceWork.details.forEach(detail => {
          const itemKey = detail.pieceWorkItem.id
          if (!itemMap.has(itemKey)) {
            itemMap.set(itemKey, {
              itemName: detail.pieceWorkItem.name,
              type: detail.pieceWorkItem.type === "accessory" ? "配饰制作" : "点蓝制作",
              totalQuantity: 0,
              totalAmount: 0,
            })
          }
          
          const itemStats = itemMap.get(itemKey)
          itemStats.totalQuantity += detail.quantity
          itemStats.totalAmount += detail.quantity * detail.price
        })
      })
      
      // 添加项目汇总数据
      Array.from(itemMap.values()).forEach(itemStats => {
        itemSummarySheet.addRow(itemStats)
      })

      // 设置表格样式
      [detailSheet, employeeSummarySheet, itemSummarySheet].forEach(sheet => {
        // 设置表头样式
        sheet.getRow(1).font = { bold: true }
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        
        // 设置数字列的格式
        sheet.columns.forEach(column => {
          if (['quantity', 'price', 'amount', 'accessoryAmount', 'enamellingAmount', 'totalAmount', 'totalQuantity'].includes(column.key)) {
            column.numFmt = '#,##0.00'
          }
        })
      })

      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `制作报表_${format(new Date(startDate), "yyyyMMdd")}_${format(new Date(endDate), "yyyyMMdd")}.xlsx`
      
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
    console.error("Error exporting production data:", error)
    return NextResponse.json({ error: "Failed to export production data" }, { status: 500 })
  }
}
