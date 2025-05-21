import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ExcelJS from "exceljs"
import { calculatePayroll } from "@/lib/actions/employee-actions";

export async function GET(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    if (!year || !month) {
      return NextResponse.json({ error: "年份和月份是必需的" }, { status: 400 })
    }

    // 计算薪酬数据
    const payrollData = await calculatePayroll(Number(year), Number(month))

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "聆花掐丝珐琅馆管理系统"
    workbook.created = new Date()
    workbook.modified = new Date()

    // 创建工作表
    const worksheet = workbook.addWorksheet(`薪酬报表-${year}年${month}月`)

    // 设置列头
    worksheet.columns = [
      { header: "员工", key: "employee", width: 15 },
      { header: "职位", key: "position", width: 15 },
      { header: "出勤天数", key: "workDays", width: 10 },
      { header: "基本工资", key: "baseSalary", width: 15 },
      { header: "手作团建费", key: "workshopFee", width: 15 },
      { header: "咖啡店提成", key: "coffeeSalesCommission", width: 15 },
      { header: "珐琅馆提成", key: "gallerySalesCommission", width: 15 },
      { header: "配饰工费", key: "accessoryFee", width: 15 },
      { header: "点蓝工费", key: "enamellingFee", width: 15 },
      { header: "总薪酬", key: "totalSalary", width: 15 },
    ]

    // 添加数据
    payrollData.forEach((payroll) => {
      worksheet.addRow({
        employee: payroll.employee,
        position: payroll.position,
        workDays: payroll.workDays,
        baseSalary: payroll.baseSalary,
        workshopFee: payroll.workshopFee,
        coffeeSalesCommission: payroll.coffeeSalesCommission,
        gallerySalesCommission: payroll.gallerySalesCommission,
        accessoryFee: payroll.accessoryFee,
        enamellingFee: payroll.enamellingFee,
        totalSalary: payroll.totalSalary,
      })
    })

    // 设置样式
    worksheet.getRow(1).font = { bold: true }
    const moneyColumns = [
      "baseSalary",
      "workshopFee",
      "coffeeSalesCommission",
      "gallerySalesCommission",
      "accessoryFee",
      "enamellingFee",
      "totalSalary",
    ]
    moneyColumns.forEach((col) => {
      worksheet.getColumn(col).numFmt = "¥#,##0.00"
    })

    // 添加总计行
    const totalRow = worksheet.addRow({
      employee: "总计",
      position: "",
      workDays: "",
      baseSalary: payrollData.reduce((sum, p) => sum + p.baseSalary, 0),
      workshopFee: payrollData.reduce((sum, p) => sum + p.workshopFee, 0),
      coffeeSalesCommission: payrollData.reduce((sum, p) => sum + p.coffeeSalesCommission, 0),
      gallerySalesCommission: payrollData.reduce((sum, p) => sum + p.gallerySalesCommission, 0),
      accessoryFee: payrollData.reduce((sum, p) => sum + p.accessoryFee, 0),
      enamellingFee: payrollData.reduce((sum, p) => sum + p.enamellingFee, 0),
      totalSalary: payrollData.reduce((sum, p) => sum + p.totalSalary, 0),
    })
    totalRow.font = { bold: true }

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 设置响应头
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set("Content-Disposition", `attachment; filename="payroll-report-${year}-${month}.xlsx"`)

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("导出薪酬数据失败:", error)
    return NextResponse.json({ error: "导出薪酬数据失败" }, { status: 500 })
  }
}
