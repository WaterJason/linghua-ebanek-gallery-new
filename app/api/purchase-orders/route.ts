import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 生成采购订单编号
function generatePurchaseOrderNumber() {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const day = now.getDate().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `PO${year}${month}${day}${random}`
}

// 获取采购订单列表
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const supplierId = searchParams.get("supplierId")
    const employeeId = searchParams.get("employeeId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 50
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset") as string) : 0

    let whereClause = {}

    if (status) {
      whereClause = {
        ...whereClause,
        status,
      }
    }

    if (supplierId) {
      whereClause = {
        ...whereClause,
        supplierId: Number(supplierId),
      }
    }

    if (employeeId) {
      whereClause = {
        ...whereClause,
        employeeId: Number(employeeId),
      }
    }

    if (startDate && endDate) {
      whereClause = {
        ...whereClause,
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
    }

    // 获取总记录数
    const total = await prisma.purchaseOrder.count({
      where: whereClause,
    })

    // 获取分页数据
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: true,
        employee: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
      skip: offset,
      take: limit,
    })

    return NextResponse.json({
      total,
      offset,
      limit,
      data: purchaseOrders,
    })
  } catch (error) {
    console.error("获取采购订单列表失败:", error)
    return NextResponse.json({ error: "获取采购订单列表失败" }, { status: 500 })
  }
}

// 创建采购订单
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.supplierId || !data.employeeId || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "供应商、员工和订单项为必填项" }, { status: 400 })
    }

    // 生成订单编号
    const orderNumber = generatePurchaseOrderNumber()

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建采购订单
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: Number(data.supplierId),
          employeeId: Number(data.employeeId),
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          status: data.status || "pending",
          totalAmount: Number(data.totalAmount),
          paidAmount: Number(data.paidAmount || 0),
          paymentStatus: data.paymentStatus || "unpaid",
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      })

      // 创建采购订单项
      for (const item of data.items) {
        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            receivedQuantity: Number(item.receivedQuantity || 0),
            notes: item.notes,
          },
        })
      }

      return purchaseOrder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("创建采购订单失败:", error)
    return NextResponse.json({ error: error.message || "创建采购订单失败" }, { status: 500 })
  }
}

// 更新采购订单
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
      return NextResponse.json({ error: "采购订单ID为必填项" }, { status: 400 })
    }

    // 获取原采购订单信息
    const originalPurchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: {
        items: true,
      },
    })

    if (!originalPurchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新采购订单
      const purchaseOrder = await tx.purchaseOrder.update({
        where: { id: Number(id) },
        data: {
          supplierId: Number(updateData.supplierId),
          employeeId: Number(updateData.employeeId),
          orderDate: updateData.orderDate ? new Date(updateData.orderDate) : originalPurchaseOrder.orderDate,
          expectedDate: updateData.expectedDate ? new Date(updateData.expectedDate) : originalPurchaseOrder.expectedDate,
          status: updateData.status || originalPurchaseOrder.status,
          totalAmount: Number(updateData.totalAmount),
          paidAmount: Number(updateData.paidAmount || 0),
          paymentStatus: updateData.paymentStatus || originalPurchaseOrder.paymentStatus,
          paymentMethod: updateData.paymentMethod,
          notes: updateData.notes,
        },
      })

      // 如果有更新订单项
      if (updateData.items && updateData.items.length > 0) {
        // 删除原有订单项
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: Number(id) },
        })

        // 创建新订单项
        for (const item of updateData.items) {
          await tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              productId: Number(item.productId),
              quantity: Number(item.quantity),
              price: Number(item.price),
              receivedQuantity: Number(item.receivedQuantity || 0),
              notes: item.notes,
            },
          })
        }
      }

      return purchaseOrder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("更新采购订单失败:", error)
    return NextResponse.json({ error: error.message || "更新采购订单失败" }, { status: 500 })
  }
}

// 删除采购订单
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
      return NextResponse.json({ error: "采购订单ID为必填项" }, { status: 400 })
    }

    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: {
        items: true,
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }

    // 检查是否已经有入库记录
    const hasReceivedItems = purchaseOrder.items.some(item => item.receivedQuantity > 0)
    if (hasReceivedItems) {
      return NextResponse.json({ error: "该采购订单已有入库记录，无法删除" }, { status: 400 })
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 删除订单项
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: Number(id) },
      })

      // 删除采购订单
      await tx.purchaseOrder.delete({
        where: { id: Number(id) },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除采购订单失败:", error)
    return NextResponse.json({ error: error.message || "删除采购订单失败" }, { status: 500 })
  }
}
