import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

// 获取所有团建活动
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")

    let whereClause = {}
    if (isActive === "true") {
      whereClause = { isActive: true }
    } else if (isActive === "false") {
      whereClause = { isActive: false }
    }

    const activities = await prisma.workshopActivity.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching workshop activities:", error)
    return NextResponse.json({ error: "获取团建活动失败" }, { status: 500 })
  }
}

// 创建团建活动
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.name || !data.productId) {
      return NextResponse.json({ error: "活动名称和产品为必填项" }, { status: 400 })
    }

    // 创建团建活动
    const activity = await prisma.workshopActivity.create({
      data: {
        name: data.name,
        description: data.description || "",
        productId: data.productId,
        duration: data.duration || 2,
        minParticipants: data.minParticipants || 5,
        maxParticipants: data.maxParticipants || 20,
        price: data.price || 0,
        materialFee: data.materialFee || 0,
        teacherFee: data.teacherFee || 0,
        assistantFee: data.assistantFee || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
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
    console.error("Error creating workshop activity:", error)
    return NextResponse.json({ error: "创建团建活动失败" }, { status: 500 })
  }
}
