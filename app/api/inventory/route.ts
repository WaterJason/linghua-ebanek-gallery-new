import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 获取库存
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")
    const productId = searchParams.get("productId")

    let whereClause = {}

    if (warehouseId) {
      whereClause = {
        ...whereClause,
        warehouseId: Number(warehouseId),
      }
    }

    if (productId) {
      whereClause = {
        ...whereClause,
        productId: Number(productId),
      }
    }

    const inventory = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error("获取库存失败:", error)
    return NextResponse.json({ error: "获取库存失败" }, { status: 500 })
  }
}

// 更新库存
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.warehouseId || !data.productId || data.quantity === undefined) {
      return NextResponse.json({ error: "仓库ID、产品ID和数量为必填项" }, { status: 400 })
    }

    // 检查产品和仓库是否存在
    const product = await prisma.product.findUnique({
      where: { id: Number(data.productId) },
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(data.warehouseId) },
    })

    if (!warehouse) {
      return NextResponse.json({ error: "仓库不存在" }, { status: 404 })
    }

    // 查找现有库存
    const existingInventory = await prisma.inventoryItem.findFirst({
      where: {
        warehouseId: Number(data.warehouseId),
        productId: Number(data.productId),
      },
    })

    let inventoryItem

    if (existingInventory) {
      // 更新现有库存
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: existingInventory.id },
        data: {
          quantity: Number(data.quantity),
          minQuantity: data.minQuantity ? Number(data.minQuantity) : existingInventory.minQuantity,
        },
        include: {
          product: true,
          warehouse: true,
        },
      })
    } else {
      // 创建新库存
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          warehouseId: Number(data.warehouseId),
          productId: Number(data.productId),
          quantity: Number(data.quantity),
          minQuantity: data.minQuantity ? Number(data.minQuantity) : null,
        },
        include: {
          product: true,
          warehouse: true,
        },
      })
    }

    // 记录库存交易
    await prisma.inventoryTransaction.create({
      data: {
        type: existingInventory ? "in" : "in", // 都是入库，但一个是新建，一个是更新
        targetWarehouseId: Number(data.warehouseId),
        productId: Number(data.productId),
        quantity: Number(data.quantity) - (existingInventory ? existingInventory.quantity : 0),
        notes: data.notes || "手动更新库存",
        referenceType: "manual",
      },
    })

    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error("更新库存失败:", error)
    return NextResponse.json({ error: "更新库存失败" }, { status: 500 })
  }
}
