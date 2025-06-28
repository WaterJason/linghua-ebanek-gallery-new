import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 获取订单项
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

    const orderId = Number(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "无效的订单ID" }, { status: 400 })
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId,
      },
      include: {
        product: true,
      },
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(orderItems)
  } catch (error) {
    console.error("获取订单项失败:", error)
    return NextResponse.json({ error: "获取订单项失败" }, { status: 500 })
  }
}

// 添加订单项
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const orderId = Number(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "无效的订单ID" }, { status: 400 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.productId || data.quantity === undefined || data.price === undefined) {
      return NextResponse.json({ error: "产品ID、数量和价格为必填项" }, { status: 400 })
    }

    // 检查订单是否存在
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建订单项
      const orderItem = await tx.orderItem.create({
        data: {
          orderId,
          productId: Number(data.productId),
          quantity: Number(data.quantity),
          price: Number(data.price),
          discount: Number(data.discount || 0),
          notes: data.notes,
        },
        include: {
          product: true,
        },
      })

      // 更新订单总金额
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      })

      const totalAmount = orderItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity - item.discount)
      }, 0)

      await tx.order.update({
        where: { id: orderId },
        data: {
          totalAmount,
        },
      })

      return orderItem
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("添加订单项失败:", error)
    return NextResponse.json({ error: "添加订单项失败" }, { status: 500 })
  }
}

// 更新订单项
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

    const orderId = Number(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "无效的订单ID" }, { status: 400 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "订单项ID为必填项" }, { status: 400 })
    }

    // 检查订单项是否存在
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: Number(id) },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "订单项不存在" }, { status: 404 })
    }

    if (orderItem.orderId !== orderId) {
      return NextResponse.json({ error: "订单项不属于该订单" }, { status: 400 })
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新订单项
      const updatedOrderItem = await tx.orderItem.update({
        where: { id: Number(id) },
        data: {
          quantity: updateData.quantity ? Number(updateData.quantity) : undefined,
          price: updateData.price ? Number(updateData.price) : undefined,
          discount: updateData.discount ? Number(updateData.discount) : undefined,
          notes: updateData.notes,
        },
        include: {
          product: true,
        },
      })

      // 更新订单总金额
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      })

      const totalAmount = orderItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity - item.discount)
      }, 0)

      await tx.order.update({
        where: { id: orderId },
        data: {
          totalAmount,
        },
      })

      return updatedOrderItem
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("更新订单项失败:", error)
    return NextResponse.json({ error: "更新订单项失败" }, { status: 500 })
  }
}

// 删除订单项
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

    const orderId = Number(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "无效的订单ID" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json({ error: "订单项ID为必填项" }, { status: 400 })
    }

    // 检查订单项是否存在
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: Number(itemId) },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "订单项不存在" }, { status: 404 })
    }

    if (orderItem.orderId !== orderId) {
      return NextResponse.json({ error: "订单项不属于该订单" }, { status: 400 })
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 删除订单项
      await tx.orderItem.delete({
        where: { id: Number(itemId) },
      })

      // 更新订单总金额
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      })

      const totalAmount = orderItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity - item.discount)
      }, 0)

      await tx.order.update({
        where: { id: orderId },
        data: {
          totalAmount,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除订单项失败:", error)
    return NextResponse.json({ error: "删除订单项失败" }, { status: 500 })
  }
}
