import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { action, productIds, updates } = await request.json()
    console.log("🔄 [POST /api/products/batch] 批量操作:", { action, productIds, updates })

    if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    switch (action) {
      case "delete":
        return await handleBatchDelete(productIds)
      case "update":
        return await handleBatchUpdate(productIds, updates)
      default:
        return NextResponse.json({ error: "不支持的操作类型" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in batch operation:", error)
    return NextResponse.json({ error: "批量操作失败" }, { status: 500 })
  }
}

async function handleBatchDelete(productIds: number[]) {
  try {
    // 检查产品是否存在
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })

    if (existingProducts.length !== productIds.length) {
      const existingIds = existingProducts.map(p => p.id)
      const missingIds = productIds.filter(id => !existingIds.includes(id))
      return NextResponse.json({ 
        error: `以下产品不存在: ${missingIds.join(", ")}` 
      }, { status: 404 })
    }

    // 执行批量删除
    const result = await prisma.product.deleteMany({
      where: { id: { in: productIds } }
    })

    console.log("✅ [批量删除] 删除产品数量:", result.count)

    return NextResponse.json({
      success: true,
      message: `成功删除 ${result.count} 个产品`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error("Error in batch delete:", error)
    throw error
  }
}

async function handleBatchUpdate(productIds: number[], updates: any) {
  try {
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "缺少更新数据" }, { status: 400 })
    }

    // 检查产品是否存在
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })

    if (existingProducts.length !== productIds.length) {
      const existingIds = existingProducts.map(p => p.id)
      const missingIds = productIds.filter(id => !existingIds.includes(id))
      return NextResponse.json({ 
        error: `以下产品不存在: ${missingIds.join(", ")}` 
      }, { status: 404 })
    }

    // 准备更新数据 - 排除指定字段
    const updateData: any = {}
    
    if (updates.price !== undefined) {
      updateData.price = Number.parseFloat(updates.price)
    }
    if (updates.categoryId !== undefined) {
      updateData.categoryId = updates.categoryId === "uncategorized" ? null : 
        updates.categoryId ? parseInt(updates.categoryId) : null
    }
    if (updates.material !== undefined) {
      updateData.material = updates.material
    }
    if (updates.unit !== undefined) {
      updateData.unit = updates.unit
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description
    }
    if (updates.dimensions !== undefined) {
      updateData.dimensions = updates.dimensions
    }
    if (updates.inventory !== undefined) {
      updateData.inventory = updates.inventory ? Number.parseInt(updates.inventory) : null
    }

    // 执行批量更新
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData
    })

    console.log("✅ [批量更新] 更新产品数量:", result.count)

    return NextResponse.json({
      success: true,
      message: `成功更新 ${result.count} 个产品`,
      updatedCount: result.count
    })
  } catch (error) {
    console.error("Error in batch update:", error)
    throw error
  }
}

export async function PUT(request: Request) {
  // 支持PUT方法进行批量更新
  return POST(request)
}
