import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 获取采购订单项
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

    const purchaseOrderId = Number(params.id)

    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }

    const purchaseOrderItems = await prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrderId,
      },
      include: {
        product: true,
      },
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(purchaseOrderItems)
  } catch (error) {
    console.error("获取采购订单项失败:", error)
    return NextResponse.json({ error: "获取采购订单项失败" }, { status: 500 })
  }
}

// 更新采购订单项
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

    const purchaseOrderId = Number(params.id)

    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!Array.isArray(data.items)) {
      return NextResponse.json({ error: "订单项为必填项" }, { status: 400 })
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 删除原有订单项
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId },
      })

      // 创建新订单项
      const items = []
      for (const item of data.items) {
        const newItem = await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            receivedQuantity: Number(item.receivedQuantity || 0),
            notes: item.notes,
          },
          include: {
            product: true,
          },
        })
        items.push(newItem)
      }

      // 计算总金额
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // 更新采购订单总金额
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          totalAmount,
        },
      })

      return items
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("更新采购订单项失败:", error)
    return NextResponse.json({ error: "更新采购订单项失败" }, { status: 500 })
  }
}
