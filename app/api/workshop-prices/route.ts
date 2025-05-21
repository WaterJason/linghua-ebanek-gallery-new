import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 获取所有团建价格
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const activityId = searchParams.get("activityId")
    const isActive = searchParams.get("isActive")

    let whereClause: any = {}

    if (channelId) {
      whereClause.channelId = parseInt(channelId)
    }

    if (activityId) {
      whereClause.activityId = parseInt(activityId)
    }

    if (isActive === "true") {
      whereClause.isActive = true
    } else if (isActive === "false") {
      whereClause.isActive = false
    }

    const prices = await prisma.workshopPrice.findMany({
      where: whereClause,
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
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error("Error fetching workshop prices:", error)
    return NextResponse.json({ error: "获取团建价格失败" }, { status: 500 })
  }
}

// 创建团建价格
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.channelId || !data.basePrice || !data.pricePerPerson) {
      return NextResponse.json({ error: "渠道、基础价格和人均价格为必填项" }, { status: 400 })
    }

    // 检查渠道是否存在
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(data.channelId) },
    })

    if (!channel) {
      return NextResponse.json({ error: "渠道不存在" }, { status: 400 })
    }

    // 如果提供了活动ID，检查活动是否存在
    if (data.activityId) {
      const activity = await prisma.workshopActivity.findUnique({
        where: { id: parseInt(data.activityId) },
      })

      if (!activity) {
        return NextResponse.json({ error: "团建活动不存在" }, { status: 400 })
      }

      // 检查是否已存在相同活动和渠道的价格
      const existingPrice = await prisma.workshopPrice.findFirst({
        where: {
          activityId: parseInt(data.activityId),
          channelId: parseInt(data.channelId),
        },
      })

      if (existingPrice) {
        return NextResponse.json({ error: "该活动在该渠道已有价格配置" }, { status: 400 })
      }
    }

    // 创建价格
    const price = await prisma.workshopPrice.create({
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
        isActive: data.isActive !== undefined ? data.isActive : true,
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
    console.error("Error creating workshop price:", error)
    return NextResponse.json({ error: "创建团建价格失败" }, { status: 500 })
  }
}
