import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    // 获取所有数据表的数据
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      data: {
        employees: await prisma.employee.findMany(),
        products: await prisma.product.findMany(),
        pieceWorkItems: await prisma.pieceWorkItem.findMany(),
        schedules: await prisma.schedule.findMany(),
        scheduleTemplates: await prisma.scheduleTemplate.findMany(),
        gallerySales: await prisma.gallerySale.findMany({
          include: {
            salesItems: true,
            files: true
          }
        }),
        workshops: await prisma.workshop.findMany(),
        pieceWorks: await prisma.pieceWork.findMany({
          include: {
            details: true
          }
        }),
        coffeeShopSales: await prisma.coffeeShopSale.findMany({
          include: {
            shifts: true,
            items: true
          }
        }),
        systemSettings: await prisma.systemSetting.findMany(),
        warehouses: await prisma.warehouse.findMany(),
        inventoryItems: await prisma.inventoryItem.findMany(),
        inventoryTransactions: await prisma.inventoryTransaction.findMany(),
        customers: await prisma.customer.findMany(),
        orders: await prisma.order.findMany({
          include: {
            items: true
          }
        }),
        channels: await prisma.channel.findMany({
          include: {
            prices: true
          }
        }),
        salaryRecords: await prisma.salaryRecord.findMany(),
        salaryAdjustments: await prisma.salaryAdjustment.findMany()
      }
    }
    
    return NextResponse.json(backup)
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    )
  }
}
