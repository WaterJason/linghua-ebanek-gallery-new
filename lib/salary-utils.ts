import prisma from "@/lib/db"
import { format, eachDayOfInterval, isWeekend, isWithinInterval } from "date-fns"
import { getSystemSettings } from "@/lib/actions/system-actions";

// 计算员工月度薪资
export async function calculateMonthlySalary(employeeId: number, year: number, month: number) {
  try {
    // 获取员工信息
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      throw new Error(`员工ID ${employeeId} 不存在`)
    }

    // 获取系统设置
    const settings = await getSystemSettings()

    // 计算月份的开始和结束日期
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // 上个月的最后一天

    // 获取排班记录
    const schedules = await prisma.schedule.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 获取珐琅馆销售记录
    const gallerySales = await prisma.gallerySale.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 获取POS销售记录
    const posSales = await prisma.posSale.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 获取计件工作记录
    const pieceWorks = await prisma.pieceWork.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 获取工作坊记录（作为讲师）
    const teacherWorkshops = await prisma.workshop.findMany({
      where: {
        teacherId: employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 获取工作坊记录（作为助教）
    const assistantWorkshops = await prisma.workshop.findMany({
      where: {
        assistantId: employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 获取咖啡店值班记录
    const coffeeShopShifts = await prisma.coffeeShopShift.findMany({
      where: {
        employeeId,
      },
      include: {
        coffeeShopSale: true,
      },
    })

    // 过滤出本月的咖啡店值班记录
    const monthlyCoffeeShopShifts = coffeeShopShifts.filter(shift => {
      const saleDate = new Date(shift.coffeeShopSale.date)
      return isWithinInterval(saleDate, { start: startDate, end: endDate })
    })

    // 计算基本工资（按日薪和工作日计算）
    const baseSalary = employee.dailySalary * settings.basicWorkingDays

    // 计算排班工资 - 直接使用日薪乘以排班天数
    const scheduleSalary = schedules.reduce((sum, schedule) => {
      // 检查是否是周末或节假日（简化处理，只检查周末）
      const scheduleDate = new Date(schedule.date)
      const isWeekendDay = isWeekend(scheduleDate)

      // 应用加班费率
      let rate = 1
      if (isWeekendDay) {
        rate = settings.weekendOvertimeRate || 1.5
      }

      // 计算当天工资 - 直接使用日薪
      return sum + (employee.dailySalary * rate)
    }, 0)

    // 计算珐琅馆销售提成
    const gallerySalesCommission = gallerySales.reduce((sum, sale) => {
      // 应用销售提成率
      return sum + (sale.totalAmount * (settings.gallerySalesCommissionRate / 100))
    }, 0)

    // 计算POS销售提成
    const posSalesCommission = posSales.reduce((sum, sale) => {
      // 应用销售提成率
      return sum + (sale.totalAmount * (settings.gallerySalesCommissionRate / 100))
    }, 0)

    // 合并所有销售提成
    const salesCommission = gallerySalesCommission + posSalesCommission

    // 计算计件工作收入
    const pieceWorkIncome = pieceWorks.reduce((sum, work) => {
      return sum + work.totalAmount
    }, 0)

    // 计算工作坊收入
    const teacherWorkshopIncome = teacherWorkshops.length * settings.teacherWorkshopFee
    const assistantWorkshopIncome = assistantWorkshops.length * settings.assistantWorkshopFee
    const workshopIncome = teacherWorkshopIncome + assistantWorkshopIncome

    // 计算咖啡店值班提成
    const coffeeShiftCommission = monthlyCoffeeShopShifts.reduce((sum, shift) => {
      // 应用咖啡店销售提成率
      return sum + (shift.coffeeShopSale.totalSales * (settings.coffeeSalesCommissionRate / 100))
    }, 0)

    // 计算总收入
    const totalIncome = baseSalary + scheduleSalary + salesCommission + pieceWorkIncome + workshopIncome + coffeeShiftCommission

    // 计算社保和个税
    const socialInsurance = totalIncome * ((settings.socialInsuranceRate || 0) / 100)
    const tax = totalIncome * ((settings.taxRate || 0) / 100)

    // 计算实发工资
    const netIncome = totalIncome - socialInsurance - tax

    return {
      employeeId,
      year,
      month,
      baseSalary,
      scheduleSalary,
      salesCommission,
      pieceWorkIncome,
      workshopIncome,
      coffeeShiftCommission,
      overtimePay: 0, // 加班费已包含在排班工资中
      bonus: 0, // 奖金需要手动设置
      deductions: 0, // 扣款需要手动设置
      socialInsurance,
      tax,
      totalIncome,
      netIncome,
      details: {
        schedulesCount: schedules.length,
        gallerySalesCount: gallerySales.length,
        posSalesCount: posSales.length,
        pieceWorksCount: pieceWorks.length,
        workshopsCount: teacherWorkshops.length + assistantWorkshops.length,
        coffeeShiftsCount: monthlyCoffeeShifts.length,
        gallerySalesCommission,
        posSalesCommission,
        teacherWorkshopIncome,
        assistantWorkshopIncome,
        dailySalary: employee.dailySalary
      }
    }
  } catch (error) {
    console.error("Error calculating monthly salary:", error)
    throw new Error("Failed to calculate monthly salary")
  }
}

// 生成薪资单PDF
export async function generateSalarySlip(salaryRecordId: number) {
  try {
    // 获取薪资记录
    const salaryRecord = await prisma.salaryRecord.findUnique({
      where: { id: salaryRecordId },
      include: {
        employee: true,
      },
    })

    if (!salaryRecord) {
      throw new Error(`薪资记录ID ${salaryRecordId} 不存在`)
    }

    // 获取系统设置
    const settings = await getSystemSettings()

    // 构建薪资单数据
    const salarySlipData = {
      companyName: settings.companyName,
      employeeName: salaryRecord.employee.name,
      employeePosition: salaryRecord.employee.position,
      year: salaryRecord.year,
      month: salaryRecord.month,
      baseSalary: salaryRecord.baseSalary,
      scheduleSalary: salaryRecord.scheduleSalary,
      salesCommission: salaryRecord.salesCommission,
      pieceWorkIncome: salaryRecord.pieceWorkIncome,
      workshopIncome: salaryRecord.workshopIncome,
      coffeeShiftCommission: salaryRecord.coffeeShiftCommission,
      overtimePay: salaryRecord.overtimePay,
      bonus: salaryRecord.bonus,
      totalIncome: salaryRecord.totalIncome,
      deductions: salaryRecord.deductions,
      socialInsurance: salaryRecord.socialInsurance,
      tax: salaryRecord.tax,
      netIncome: salaryRecord.netIncome,
      paymentDate: salaryRecord.paymentDate ? format(new Date(salaryRecord.paymentDate), 'yyyy-MM-dd') : '未发放',
      notes: salaryRecord.notes || '',
    }

    // 这里应该调用PDF生成库生成PDF
    // 由于这里不实际生成PDF，我们只返回数据
    return salarySlipData
  } catch (error) {
    console.error("Error generating salary slip:", error)
    throw new Error("Failed to generate salary slip")
  }
}
