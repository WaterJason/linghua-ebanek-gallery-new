import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 获取单个团建价格
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

    const price = await prisma.workshopPrice.findUnique({
      where: { id },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!price) {
      return NextResponse.json({ error: "团建价格不存在" }, { status: 404 })
    }

    return NextResponse.json(price)
  } catch (error) {
    console.error("Error fetching workshop price:", error)
    return NextResponse.json({ error: "获取团建价格失败" }, { status: 500 })
  }
}

// 更新团建价格
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
    if (!data.channelId || !data.basePrice || !data.pricePerPerson) {
      return NextResponse.json({ error: "渠道、基础价格和人均价格为必填项" }, { status: 400 })
    }

    // 检查价格是否存在
    const existingPrice = await prisma.workshopPrice.findUnique({
      where: { id },
    })

    if (!existingPrice) {
      return NextResponse.json({ error: "团建价格不存在" }, { status: 404 })
    }

    // 如果更改了活动ID或渠道ID，检查是否已存在相同活动和渠道的价格
    if (
      (data.activityId && parseInt(data.activityId) !== existingPrice.activityId) ||
      parseInt(data.channelId) !== existingPrice.channelId
    ) {
      const duplicatePrice = await prisma.workshopPrice.findFirst({
        where: {
          activityId: data.activityId ? parseInt(data.activityId) : null,
          channelId: parseInt(data.channelId),
          NOT: {
            id,
          },
        },
      })

      if (duplicatePrice) {
        return NextResponse.json({ error: "该活动在该渠道已有价格配置" }, { status: 400 })
      }
    }

    // 更新价格
    const price = await prisma.workshopPrice.update({
      where: { id },
      data: {
        activityId: data.activityId ? parseInt(data.activityId) : null,
        channelId: parseInt(data.channelId),
        basePrice: parseFloat(data.basePrice),
        pricePerPerson: parseFloat(data.pricePerPerson),
        minParticipants: parseInt(data.minParticipants) || 5,
        maxParticipants: parseInt(data.maxParticipants) || 30,
        materialFee: parseFloat(data.materialFee) || 0,
        teacherFee: parseFloat(data.teacherFee) || 0,
        assistantFee: parseFloat(data.assistantFee) || 0,
        isActive: data.isActive,
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json(price)
  } catch (error) {
    console.error("Error updating workshop price:", error)
    return NextResponse.json({ error: "更新团建价格失败" }, { status: 500 })
  }
}

// 删除团建价格
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

    // 检查价格是否存在
    const existingPrice = await prisma.workshopPrice.findUnique({
      where: { id },
    })

    if (!existingPrice) {
      return NextResponse.json({ error: "团建价格不存在" }, { status: 404 })
    }

    // 删除价格
    await prisma.workshopPrice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workshop price:", error)
    return NextResponse.json({ error: "删除团建价格失败" }, { status: 500 })
  }
}
