import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 导出薪资单为PDF
export const exportSalarySlipToPDF = (salaryRecord, employee, companyName = "聆花掐丝珐琅馆") => {
  try {
    const doc = new jsPDF()
    
    // 设置字体
    doc.setFont("helvetica")
    
    // 标题
    doc.setFontSize(18)
    doc.text(`${companyName} - 薪资单`, 105, 20, { align: "center" })
    
    // 薪资期间
    doc.setFontSize(12)
    doc.text(`薪资期间: ${salaryRecord.year}年${salaryRecord.month}月`, 105, 30, { align: "center" })
    
    // 员工信息
    doc.setFontSize(10)
    doc.text(`员工姓名: ${employee.name}`, 20, 45)
    doc.text(`职位: ${employee.position}`, 20, 52)
    doc.text(`日薪标准: ¥${employee.dailySalary.toFixed(2)}`, 20, 59)
    
    // 薪资状态
    let statusText = "草稿"
    if (salaryRecord.status === "confirmed") statusText = "已确认"
    if (salaryRecord.status === "paid") statusText = "已发放"
    doc.text(`状态: ${statusText}`, 150, 45)
    
    if (salaryRecord.paymentDate) {
      doc.text(`发放日期: ${format(new Date(salaryRecord.paymentDate), "yyyy-MM-dd", { locale: zhCN })}`, 150, 52)
    }
    
    // 分隔线
    doc.line(20, 65, 190, 65)
    
    // 收入明细标题
    doc.setFontSize(12)
    doc.text("收入明细", 20, 75)
    
    // 收入明细表格
    doc.setFontSize(10)
    doc.text("项目", 30, 85)
    doc.text("金额 (¥)", 150, 85)
    
    let yPos = 95
    
    // 收入项目
    doc.text("基本工资", 30, yPos)
    doc.text(salaryRecord.baseSalary.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("排班工资", 30, yPos)
    doc.text(salaryRecord.scheduleSalary.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("销售提成", 30, yPos)
    doc.text(salaryRecord.salesCommission.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("计件收入", 30, yPos)
    doc.text(salaryRecord.pieceWorkIncome.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("工作坊收入", 30, yPos)
    doc.text(salaryRecord.workshopIncome.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("咖啡店提成", 30, yPos)
    doc.text(salaryRecord.coffeeShiftCommission.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("加班费", 30, yPos)
    doc.text(salaryRecord.overtimePay.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("奖金", 30, yPos)
    doc.text(salaryRecord.bonus.toFixed(2), 150, yPos)
    yPos += 7
    
    // 收入合计
    doc.line(20, yPos, 190, yPos)
    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.text("收入合计", 30, yPos)
    doc.text(salaryRecord.totalIncome.toFixed(2), 150, yPos)
    doc.setFont("helvetica", "normal")
    yPos += 15
    
    // 扣除项目标题
    doc.setFontSize(12)
    doc.text("扣除项目", 20, yPos)
    yPos += 10
    
    // 扣除项目表格
    doc.setFontSize(10)
    doc.text("项目", 30, yPos)
    doc.text("金额 (¥)", 150, yPos)
    yPos += 10
    
    // 扣除项目
    doc.text("扣款", 30, yPos)
    doc.text(salaryRecord.deductions.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("社保", 30, yPos)
    doc.text(salaryRecord.socialInsurance.toFixed(2), 150, yPos)
    yPos += 7
    
    doc.text("个税", 30, yPos)
    doc.text(salaryRecord.tax.toFixed(2), 150, yPos)
    yPos += 7
    
    // 扣除合计
    const totalDeductions = salaryRecord.deductions + salaryRecord.socialInsurance + salaryRecord.tax
    doc.line(20, yPos, 190, yPos)
    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.text("扣除合计", 30, yPos)
    doc.text(totalDeductions.toFixed(2), 150, yPos)
    doc.setFont("helvetica", "normal")
    yPos += 15
    
    // 实发工资
    doc.line(20, yPos, 190, yPos)
    yPos += 10
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("实发工资", 30, yPos)
    doc.text(salaryRecord.netIncome.toFixed(2), 150, yPos)
    doc.setFont("helvetica", "normal")
    
    // 备注
    if (salaryRecord.notes) {
      yPos += 20
      doc.setFontSize(10)
      doc.text("备注:", 20, yPos)
      yPos += 7
      
      // 处理长文本换行
      const splitNotes = doc.splitTextToSize(salaryRecord.notes, 170)
      doc.text(splitNotes, 20, yPos)
    }
    
    // 页脚
    doc.setFontSize(8)
    doc.text(`生成日期: ${format(new Date(), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}`, 105, 280, { align: "center" })
    
    // 保存PDF
    const fileName = `薪资单_${employee.name}_${salaryRecord.year}年${salaryRecord.month}月.pdf`
    doc.save(fileName)
    
    return fileName
  } catch (error) {
    console.error("Error exporting salary slip to PDF:", error)
    throw new Error("导出薪资单PDF失败")
  }
}

// 导出薪资记录为Excel
export const exportSalaryRecordsToExcel = (salaryRecords, employees, fileName = "薪资记录") => {
  try {
    // 准备数据
    const data = salaryRecords.map(record => {
      const employee = employees.find(e => e.id === record.employeeId) || { name: `员工ID: ${record.employeeId}`, position: "未知" }
      
      let statusText = "草稿"
      if (record.status === "confirmed") statusText = "已确认"
      if (record.status === "paid") statusText = "已发放"
      
      return {
        "员工姓名": employee.name,
        "职位": employee.position,
        "年份": `${record.year}年`,
        "月份": `${record.month}月`,
        "基本工资": record.baseSalary,
        "排班工资": record.scheduleSalary,
        "销售提成": record.salesCommission,
        "计件收入": record.pieceWorkIncome,
        "工作坊收入": record.workshopIncome,
        "咖啡店提成": record.coffeeShiftCommission,
        "加班费": record.overtimePay,
        "奖金": record.bonus,
        "扣款": record.deductions,
        "社保": record.socialInsurance,
        "个税": record.tax,
        "总收入": record.totalIncome,
        "实发工资": record.netIncome,
        "状态": statusText,
        "发放日期": record.paymentDate ? format(new Date(record.paymentDate), "yyyy-MM-dd", { locale: zhCN }) : "",
        "备注": record.notes || ""
      }
    })
    
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 员工姓名
      { wch: 10 }, // 职位
      { wch: 8 }, // 年份
      { wch: 8 }, // 月份
      { wch: 10 }, // 基本工资
      { wch: 10 }, // 排班工资
      { wch: 10 }, // 销售提成
      { wch: 10 }, // 计件收入
      { wch: 10 }, // 工作坊收入
      { wch: 10 }, // 咖啡店提成
      { wch: 10 }, // 加班费
      { wch: 10 }, // 奖金
      { wch: 10 }, // 扣款
      { wch: 10 }, // 社保
      { wch: 10 }, // 个税
      { wch: 10 }, // 总收入
      { wch: 10 }, // 实发工资
      { wch: 8 }, // 状态
      { wch: 12 }, // 发放日期
      { wch: 20 } // 备注
    ]
    ws['!cols'] = colWidths
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "薪资记录")
    
    // 导出Excel文件
    const fullFileName = `${fileName}_${format(new Date(), "yyyyMMdd")}.xlsx`
    XLSX.writeFile(wb, fullFileName)
    
    return fullFileName
  } catch (error) {
    console.error("Error exporting salary records to Excel:", error)
    throw new Error("导出薪资记录Excel失败")
  }
}

// 导出薪资统计数据为Excel
export const exportSalaryStatisticsToExcel = (
  overviewData,
  compositionData,
  trendData,
  comparisonData,
  fileName = "薪资统计"
) => {
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // 1. 总览数据工作表
    const overviewWs = XLSX.utils.json_to_sheet(
      overviewData.map(item => ({
        "统计项": item.name,
        "金额": item.value
      }))
    )
    XLSX.utils.book_append_sheet(wb, overviewWs, "薪资总览")
    
    // 2. 薪资构成数据工作表
    const compositionWs = XLSX.utils.json_to_sheet(
      compositionData.map(item => ({
        "薪资项目": item.name,
        "金额": item.value,
        "占比": `${((item.value / compositionData.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(2)}%`
      }))
    )
    XLSX.utils.book_append_sheet(wb, compositionWs, "薪资构成")
    
    // 3. 薪资趋势数据工作表
    const trendWs = XLSX.utils.json_to_sheet(
      trendData.map(item => ({
        "月份": item.month,
        "总薪资": item.totalSalary,
        "员工数量": item.employeeCount,
        "平均薪资": item.avgSalary
      }))
    )
    XLSX.utils.book_append_sheet(wb, trendWs, "薪资趋势")
    
    // 4. 职位薪资对比数据工作表
    const comparisonWs = XLSX.utils.json_to_sheet(
      comparisonData.map(item => ({
        "职位": item.position,
        "平均薪资": item.avgSalary,
        "员工数量": item.employeeCount
      }))
    )
    XLSX.utils.book_append_sheet(wb, comparisonWs, "职位薪资对比")
    
    // 导出Excel文件
    const fullFileName = `${fileName}_${format(new Date(), "yyyyMMdd")}.xlsx`
    XLSX.writeFile(wb, fullFileName)
    
    return fullFileName
  } catch (error) {
    console.error("Error exporting salary statistics to Excel:", error)
    throw new Error("导出薪资统计Excel失败")
  }
}
