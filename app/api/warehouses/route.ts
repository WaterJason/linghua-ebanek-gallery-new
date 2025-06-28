import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 获取所有仓库
export async function GET() {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const warehouses = await prisma.warehouse.findMany({
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error("获取仓库列表失败:", error)
    return NextResponse.json({ error: "获取仓库列表失败" }, { status: 500 })
  }
}

// 创建新仓库
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.name || !data.type) {
      return NextResponse.json({ error: "仓库名称和类型为必填项" }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        type: data.type,
        location: data.location || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error("创建仓库失败:", error)
    return NextResponse.json({ error: "创建仓库失败" }, { status: 500 })
  }
}

// 更新仓库
export async function PUT(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "仓库ID为必填项" }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: Number(id) },
      data: {
        name: updateData.name,
        type: updateData.type,
        location: updateData.location,
        description: updateData.description,
        isActive: updateData.isActive,
      },
    })

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error("更新仓库失败:", error)
    return NextResponse.json({ error: "更新仓库失败" }, { status: 500 })
  }
}

// 删除仓库
export async function DELETE(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "仓库ID为必填项" }, { status: 400 })
    }

    // 检查仓库是否有库存
    const inventoryCount = await prisma.inventoryItem.count({
      where: { warehouseId: Number(id) },
    })

    if (inventoryCount > 0) {
      return NextResponse.json({ error: "仓库中存在库存，无法删除" }, { status: 400 })
    }

    await prisma.warehouse.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除仓库失败:", error)
    return NextResponse.json({ error: "删除仓库失败" }, { status: 500 })
  }
}
