import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    // 获取系统设置，如果不存在则创建默认设置
    let settings = await prisma.systemSetting.findFirst()

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          companyName: "聆花掐丝珐琅馆",
          coffeeSalesCommissionRate: 20,
          gallerySalesCommissionRate: 10,
          teacherWorkshopFee: 200,
          assistantWorkshopFee: 130,
          teacherWorkshopFeeOutside: 200,
          assistantWorkshopFeeOutside: 130,
          teacherWorkshopFeeInside: 180,
          assistantWorkshopFeeInside: 110,
          enableImageUpload: true,
          enableNotifications: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // 获取当前设置
    let settings = await prisma.systemSetting.findFirst()

    if (settings) {
      // 更新现有设置
      settings = await prisma.systemSetting.update({
        where: { id: settings.id },
        data: {
          companyName: data.companyName,
          coffeeSalesCommissionRate: Number.parseFloat(data.coffeeSalesCommissionRate),
          gallerySalesCommissionRate: Number.parseFloat(data.gallerySalesCommissionRate),
          teacherWorkshopFee: Number.parseFloat(data.teacherWorkshopFee),
          assistantWorkshopFee: Number.parseFloat(data.assistantWorkshopFee),
          teacherWorkshopFeeOutside: Number.parseFloat(data.teacherWorkshopFeeOutside || "200"),
          assistantWorkshopFeeOutside: Number.parseFloat(data.assistantWorkshopFeeOutside || "130"),
          teacherWorkshopFeeInside: Number.parseFloat(data.teacherWorkshopFeeInside || "180"),
          assistantWorkshopFeeInside: Number.parseFloat(data.assistantWorkshopFeeInside || "110"),
          enableImageUpload: data.enableImageUpload,
          enableNotifications: data.enableNotifications,
        },
      })
    } else {
      // 创建新设置
      settings = await prisma.systemSetting.create({
        data: {
          companyName: data.companyName,
          coffeeSalesCommissionRate: Number.parseFloat(data.coffeeSalesCommissionRate),
          gallerySalesCommissionRate: Number.parseFloat(data.gallerySalesCommissionRate),
          teacherWorkshopFee: Number.parseFloat(data.teacherWorkshopFee),
          assistantWorkshopFee: Number.parseFloat(data.assistantWorkshopFee),
          teacherWorkshopFeeOutside: Number.parseFloat(data.teacherWorkshopFeeOutside || "200"),
          assistantWorkshopFeeOutside: Number.parseFloat(data.assistantWorkshopFeeOutside || "130"),
          teacherWorkshopFeeInside: Number.parseFloat(data.teacherWorkshopFeeInside || "180"),
          assistantWorkshopFeeInside: Number.parseFloat(data.assistantWorkshopFeeInside || "110"),
          enableImageUpload: data.enableImageUpload,
          enableNotifications: data.enableNotifications,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
