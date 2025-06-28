import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
// 获取单个团建活动
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const activity = await prisma.workshopActivity.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: "团建活动不存在" }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Error fetching workshop activity:", error)
    return NextResponse.json({ error: "获取团建活动失败" }, { status: 500 })
  }
}

// 更新团建活动
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.name || !data.productId) {
      return NextResponse.json({ error: "活动名称和产品为必填项" }, { status: 400 })
    }

    // 检查活动是否存在
    const existingActivity = await prisma.workshopActivity.findUnique({
      where: { id },
    })

    if (!existingActivity) {
      return NextResponse.json({ error: "团建活动不存在" }, { status: 404 })
    }

    // 更新团建活动
    const activity = await prisma.workshopActivity.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        productId: data.productId,
        duration: data.duration,
        minParticipants: data.minParticipants,
        maxParticipants: data.maxParticipants,
        price: data.price,
        materialFee: data.materialFee || 0,
        teacherFee: data.teacherFee || 0,
        assistantFee: data.assistantFee || 0,
        isActive: data.isActive,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Error updating workshop activity:", error)
    return NextResponse.json({ error: "更新团建活动失败" }, { status: 500 })
  }
}

// 删除团建活动
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    // 检查活动是否存在
    const existingActivity = await prisma.workshopActivity.findUnique({
      where: { id },
      include: {
        workshops: {
          select: { id: true },
        },
      },
    })

    if (!existingActivity) {
      return NextResponse.json({ error: "团建活动不存在" }, { status: 404 })
    }

    // 检查是否有关联的团建记录
    if (existingActivity.workshops.length > 0) {
      // 如果有关联记录，可以选择不删除，或者将关联记录的activityId设为null
      // 这里选择将关联记录的activityId设为null
      await prisma.workshop.updateMany({
        where: { activityId: id },
        data: { activityId: null },
      })
    }

    // 删除团建活动
    await prisma.workshopActivity.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workshop activity:", error)
    return NextResponse.json({ error: "删除团建活动失败" }, { status: 500 })
  }
}
