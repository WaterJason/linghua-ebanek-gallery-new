import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    if (!year || !month) {
      return NextResponse.json({ error: "Year and month are required" }, { status: 400 })
    }

    // 计算月份的开始和结束日期
    const startDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    const endDate = new Date(Number.parseInt(year), Number.parseInt(month), 0)

    // 获取所有员工
    const employees = await prisma.employee.findMany({
      where: {
        status: "active",
      },
    })

    // 获取系统设置
    const settings = await prisma.systemSetting.findFirst()

    // 计算每个员工的薪酬
    const payrollData = await Promise.all(
      employees.map(async (employee) => {
        // 1. 计算基本工资（日薪 * 出勤天数）
        const schedules = await prisma.schedule.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
        const workDays = schedules.length
        const baseSalary = employee.dailySalary * workDays

        // 2. 计算手作团建费
        const workshops = await prisma.workshop.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        })

        let workshopFee = 0
        workshops.forEach((workshop) => {
          if (workshop.role === "teacher") {
            workshopFee += settings?.teacherWorkshopFee || 200
          } else {
            workshopFee += settings?.assistantWorkshopFee || 130
          }
        })

        // 3. 计算咖啡店提成
        const coffeeShifts = await prisma.coffeeShopShift.findMany({
          where: {
            employeeId: employee.id,
            coffeeShopSale: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          include: {
            coffeeShopSale: true,
          },
        })

        let coffeeSalesCommission = 0
        for (const shift of coffeeShifts) {
          // 获取当天所有值班员工数量
          const totalShifts = await prisma.coffeeShopShift.count({
            where: {
              coffeeShopSaleId: shift.coffeeShopSaleId,
            },
          })

          // 计算提成：总销售额 * 提成比例 / 值班员工数
          const commissionRate = settings?.coffeeSalesCommissionRate || 20
          const commission = (shift.coffeeShopSale.totalSales * (commissionRate / 100)) / totalShifts
          coffeeSalesCommission += commission
        }

        // 4. 计算珐琅馆销售提成
        const gallerySales = await prisma.gallerySale.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        })

        const commissionRate = settings?.gallerySalesCommissionRate || 10
        const gallerySalesCommission = gallerySales.reduce(
          (sum, sale) => sum + sale.totalAmount * (commissionRate / 100),
          0,
        )

        // 5. 计算计件工费
        const pieceWorks = await prisma.pieceWork.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            details: true,
          },
        })

        // 分别计算配饰和点蓝工费
        let accessoryFee = 0
        let enamellingFee = 0

        pieceWorks.forEach((pieceWork) => {
          if (pieceWork.workType === "accessory") {
            accessoryFee += pieceWork.totalAmount
          } else if (pieceWork.workType === "enamelling") {
            enamellingFee += pieceWork.totalAmount
          }
        })

        // 6. 计算总薪酬
        const totalSalary =
          baseSalary + workshopFee + coffeeSalesCommission + gallerySalesCommission + accessoryFee + enamellingFee

        return {
          id: employee.id,
          employee: employee.name,
          position: employee.position,
          dailySalary: employee.dailySalary,
          workDays,
          baseSalary,
          workshopFee,
          coffeeSalesCommission,
          gallerySalesCommission,
          accessoryFee,
          enamellingFee,
          totalSalary,
        }
      }),
    )

    return NextResponse.json(payrollData)
  } catch (error) {
    console.error("Error calculating payroll:", error)
    return NextResponse.json({ error: "Failed to calculate payroll" }, { status: 500 })
  }
}
