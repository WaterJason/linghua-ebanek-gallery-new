import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 获取库存交易记录
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")
    const productId = searchParams.get("productId")
    const type = searchParams.get("type")
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 50
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset") as string) : 0

    let whereClause = {}

    if (warehouseId) {
      whereClause = {
        ...whereClause,
        OR: [
          { sourceWarehouseId: Number(warehouseId) },
          { targetWarehouseId: Number(warehouseId) },
        ],
      }
    }

    if (productId) {
      whereClause = {
        ...whereClause,
        productId: Number(productId),
      }
    }

    if (type) {
      whereClause = {
        ...whereClause,
        type,
      }
    }

    // 获取总记录数
    const total = await prisma.inventoryTransaction.count({
      where: whereClause,
    })

    // 获取分页数据
    const transactions = await prisma.inventoryTransaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    })

    // 获取相关产品和仓库信息
    const productIds = [...new Set(transactions.map(t => t.productId))]
    const warehouseIds = [...new Set([
      ...transactions.filter(t => t.sourceWarehouseId).map(t => t.sourceWarehouseId as number),
      ...transactions.filter(t => t.targetWarehouseId).map(t => t.targetWarehouseId as number),
    ])]

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })

    const warehouses = await prisma.warehouse.findMany({
      where: {
        id: {
          in: warehouseIds,
        },
      },
    })

    // 构建结果
    const result = {
      total,
      offset,
      limit,
      data: transactions.map(transaction => {
        const product = products.find(p => p.id === transaction.productId)
        const sourceWarehouse = transaction.sourceWarehouseId
          ? warehouses.find(w => w.id === transaction.sourceWarehouseId)
          : null
        const targetWarehouse = transaction.targetWarehouseId
          ? warehouses.find(w => w.id === transaction.targetWarehouseId)
          : null

        return {
          ...transaction,
          product,
          sourceWarehouse,
          targetWarehouse,
        }
      }),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("获取库存交易记录失败:", error)
    return NextResponse.json({ error: "获取库存交易记录失败" }, { status: 500 })
  }
}
