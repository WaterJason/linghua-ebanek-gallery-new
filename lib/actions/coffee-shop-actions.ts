"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface CoffeeShopSaleData {
  id: number
  date: Date
  totalSales: number
  cashAmount: number
  cardAmount: number
  wechatAmount: number
  alipayAmount: number
  otherAmount: number
  customerCount: number
  notes?: string
  staffOnDuty?: string[]
  items?: CoffeeShopItemData[]
  createdAt: Date
  updatedAt: Date
}

export interface CoffeeShopItemData {
  id: number
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CreateCoffeeShopSaleInput {
  date: Date | string
  totalSales: number
  cashAmount?: number
  cardAmount?: number
  wechatAmount?: number
  alipayAmount?: number
  otherAmount?: number
  customerCount?: number
  staffOnDuty?: string[]
  items?: {
    name: string
    category: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  notes?: string
}

/**
 * 获取咖啡店销售记录
 */
export async function getCoffeeShopSales(params?: {
  startDate?: Date
  endDate?: Date
  limit?: number
}): Promise<CoffeeShopSaleData[]> {
  try {
    const { startDate, endDate, limit = 100 } = params || {}

    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const sales = await prisma.coffeeShopSale.findMany({
      where: whereClause,
      include: {
        items: true,
        shifts: {
          include: {
            employee: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit
    })

    return sales.map(sale => ({
      id: sale.id,
      date: sale.date,
      totalSales: sale.totalSales,
      cashAmount: sale.cashAmount,
      cardAmount: sale.cardAmount,
      wechatAmount: sale.wechatAmount,
      alipayAmount: sale.alipayAmount,
      otherAmount: sale.otherAmount,
      customerCount: sale.customerCount,
      notes: sale.notes || undefined,
      staffOnDuty: sale.shifts.map(shift => shift.employee.name),
      items: sale.items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt
    }))
  } catch (error) {
    console.error("Error fetching coffee shop sales:", error)
    throw new Error("获取咖啡店销售记录失败")
  }
}

/**
 * 创建咖啡店销售记录
 */
export async function createCoffeeShopSale(data: CreateCoffeeShopSaleInput): Promise<CoffeeShopSaleData> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 创建咖啡店销售记录
      const sale = await tx.coffeeShopSale.create({
        data: {
          date: new Date(data.date),
          totalSales: data.totalSales,
          cashAmount: data.cashAmount || 0,
          cardAmount: data.cardAmount || 0,
          wechatAmount: data.wechatAmount || 0,
          alipayAmount: data.alipayAmount || 0,
          otherAmount: data.otherAmount || 0,
          customerCount: data.customerCount || 0,
          notes: data.notes
        }
      })

      // 创建值班员工记录
      if (data.staffOnDuty && data.staffOnDuty.length > 0) {
        for (const employeeId of data.staffOnDuty) {
          await tx.coffeeShopShift.create({
            data: {
              coffeeShopSaleId: sale.id,
              employeeId: parseInt(employeeId)
            }
          })
        }
      }

      // 创建销售项目记录
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.coffeeShopItem.create({
            data: {
              coffeeShopSaleId: sale.id,
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }
          })
        }
      }

      return sale
    })

    revalidatePath("/coffee-shop")
    revalidatePath("/coffee-shop/sales")
    
    return {
      id: result.id,
      date: result.date,
      totalSales: result.totalSales,
      cashAmount: result.cashAmount,
      cardAmount: result.cardAmount,
      wechatAmount: result.wechatAmount,
      alipayAmount: result.alipayAmount,
      otherAmount: result.otherAmount,
      customerCount: result.customerCount,
      notes: result.notes || undefined,
      staffOnDuty: data.staffOnDuty || [],
      items: data.items || [],
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  } catch (error) {
    console.error("Error creating coffee shop sale:", error)
    throw new Error("创建咖啡店销售记录失败")
  }
}

/**
 * 获取咖啡店销售统计
 */
export async function getCoffeeShopSalesStats(params?: {
  startDate?: Date
  endDate?: Date
}) {
  try {
    const { startDate, endDate } = params || {}

    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const stats = await prisma.coffeeShopSale.aggregate({
      where: whereClause,
      _sum: {
        totalSales: true,
        customerCount: true
      },
      _count: {
        id: true
      }
    })

    return {
      totalSales: stats._sum.totalSales || 0,
      totalCustomers: stats._sum.customerCount || 0,
      totalOrders: stats._count.id || 0,
      averageOrderValue: stats._count.id > 0 ? (stats._sum.totalSales || 0) / stats._count.id : 0
    }
  } catch (error) {
    console.error("Error fetching coffee shop sales stats:", error)
    throw new Error("获取咖啡店销售统计失败")
  }
}

/**
 * 删除咖啡店销售记录
 */
export async function deleteCoffeeShopSale(id: number): Promise<void> {
  try {
    await prisma.coffeeShopSale.delete({
      where: { id }
    })

    revalidatePath("/coffee-shop")
    revalidatePath("/coffee-shop/sales")
  } catch (error) {
    console.error("Error deleting coffee shop sale:", error)
    throw new Error("删除咖啡店销售记录失败")
  }
}

/**
 * 更新咖啡店销售记录
 */
export async function updateCoffeeShopSale(id: number, data: Partial<CreateCoffeeShopSaleInput>): Promise<CoffeeShopSaleData> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 更新销售记录
      const sale = await tx.coffeeShopSale.update({
        where: { id },
        data: {
          ...(data.date && { date: new Date(data.date) }),
          ...(data.totalSales !== undefined && { totalSales: data.totalSales }),
          ...(data.cashAmount !== undefined && { cashAmount: data.cashAmount }),
          ...(data.cardAmount !== undefined && { cardAmount: data.cardAmount }),
          ...(data.wechatAmount !== undefined && { wechatAmount: data.wechatAmount }),
          ...(data.alipayAmount !== undefined && { alipayAmount: data.alipayAmount }),
          ...(data.otherAmount !== undefined && { otherAmount: data.otherAmount }),
          ...(data.customerCount !== undefined && { customerCount: data.customerCount }),
          ...(data.notes !== undefined && { notes: data.notes })
        }
      })

      // 如果有员工数据，先删除旧的再创建新的
      if (data.staffOnDuty) {
        await tx.coffeeShopShift.deleteMany({
          where: { coffeeShopSaleId: id }
        })

        for (const employeeId of data.staffOnDuty) {
          await tx.coffeeShopShift.create({
            data: {
              coffeeShopSaleId: id,
              employeeId: parseInt(employeeId)
            }
          })
        }
      }

      // 如果有商品数据，先删除旧的再创建新的
      if (data.items) {
        await tx.coffeeShopItem.deleteMany({
          where: { coffeeShopSaleId: id }
        })

        for (const item of data.items) {
          await tx.coffeeShopItem.create({
            data: {
              coffeeShopSaleId: id,
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }
          })
        }
      }

      return sale
    })

    revalidatePath("/coffee-shop")
    revalidatePath("/coffee-shop/sales")

    return {
      id: result.id,
      date: result.date,
      totalSales: result.totalSales,
      cashAmount: result.cashAmount,
      cardAmount: result.cardAmount,
      wechatAmount: result.wechatAmount,
      alipayAmount: result.alipayAmount,
      otherAmount: result.otherAmount,
      customerCount: result.customerCount,
      notes: result.notes || undefined,
      staffOnDuty: data.staffOnDuty || [],
      items: data.items || [],
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  } catch (error) {
    console.error("Error updating coffee shop sale:", error)
    throw new Error("更新咖啡店销售记录失败")
  }
}
