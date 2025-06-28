import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // 构建查询条件
    let whereClause = {}
    if (startDate && endDate) {
      whereClause = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
    }

    // 获取销售数据
    const sales = await prisma.gallerySale.findMany({
      where: whereClause,
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

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "聆花掐丝珐琅馆管理系统"
    workbook.created = new Date()
    workbook.modified = new Date()

    // 创建工作表
    const worksheet = workbook.addWorksheet("销售记录")

    // 设置列头
    worksheet.columns = [
      { header: "销售ID", key: "id", width: 10 },
      { header: "日期", key: "date", width: 15 },
      { header: "销售员工", key: "employee", width: 15 },
      { header: "产品", key: "product", width: 20 },
      { header: "数量", key: "quantity", width: 10 },
      { header: "单价", key: "price", width: 15 },
      { header: "小计", key: "subtotal", width: 15 },
      { header: "总金额", key: "totalAmount", width: 15 },
      { header: "备注", key: "notes", width: 30 },
    ]

    // 添加数据
    sales.forEach((sale) => {
      sale.salesItems.forEach((item, index) => {
        worksheet.addRow({
          id: sale.id,
          date: format(new Date(sale.date), "yyyy-MM-dd"),
          employee: sale.employee.name,
          product: item.product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          totalAmount: index === 0 ? sale.totalAmount : null, // 只在第一行显示总金额
          notes: index === 0 ? sale.notes : null, // 只在第一行显示备注
        })
      })
    })

    // 设置样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getColumn("price").numFmt = "¥#,##0.00"
    worksheet.getColumn("subtotal").numFmt = "¥#,##0.00"
    worksheet.getColumn("totalAmount").numFmt = "¥#,##0.00"

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 设置响应头
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set("Content-Disposition", `attachment; filename="sales-report-${format(new Date(), "yyyy-MM-dd")}.xlsx"`)

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("导出销售数据失败:", error)
    return NextResponse.json({ error: "导出销售数据失败" }, { status: 500 })
  }
}
