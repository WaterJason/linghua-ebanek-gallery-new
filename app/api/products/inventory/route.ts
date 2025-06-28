import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (productId) {
      // 获取单个产品的库存信息
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        select: {
          id: true,
          name: true,
          inventory: true,
          inventoryItems: {
            include: {
              warehouse: true
            }
          }
        }
      })

      if (!product) {
        return NextResponse.json({ error: "产品不存在" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        inventory: {
          productId: product.id,
          productName: product.name,
          totalInventory: product.inventory || 0,
          warehouseInventory: product.inventoryItems.map(item => ({
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse.name,
            quantity: item.quantity,
            minQuantity: item.minQuantity
          }))
        }
      })
    } else {
      // 获取所有产品的库存概览
      const products = await prisma.product.findMany({
        where: {
          type: {
            notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
          }
        },
        select: {
          id: true,
          name: true,
          inventory: true,
          material: true,
          unit: true,
          productCategory: {
            select: { name: true }
          }
        },
        orderBy: {
          inventory: "asc"
        }
      })

      // 计算库存统计
      const totalProducts = products.length
      const lowStockProducts = products.filter(p => (p.inventory || 0) < 10).length
      const outOfStockProducts = products.filter(p => (p.inventory || 0) === 0).length
      const totalInventory = products.reduce((sum, p) => sum + (p.inventory || 0), 0)

      return NextResponse.json({
        success: true,
        inventory: {
          overview: {
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalInventory
          },
          products: products.map(product => ({
            id: product.id,
            name: product.name,
            inventory: product.inventory || 0,
            material: product.material,
            unit: product.unit,
            categoryName: product.productCategory?.name || '未分类',
            status: (product.inventory || 0) === 0 ? 'out_of_stock' : 
                   (product.inventory || 0) < 10 ? 'low_stock' : 'in_stock'
          }))
        }
      })
    }
  } catch (error) {
    console.error("Error fetching product inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { productId, warehouseId, quantity, operation = "set" } = await request.json()
    console.log("🔄 [POST /api/products/inventory] 库存操作:", { productId, warehouseId, quantity, operation })

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    let newInventory: number

    if (operation === "set") {
      // 直接设置库存
      newInventory = parseInt(quantity)
    } else if (operation === "add") {
      // 增加库存
      newInventory = (product.inventory || 0) + parseInt(quantity)
    } else if (operation === "subtract") {
      // 减少库存
      newInventory = Math.max(0, (product.inventory || 0) - parseInt(quantity))
    } else {
      return NextResponse.json({ error: "不支持的操作类型" }, { status: 400 })
    }

    // 更新产品库存
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { inventory: newInventory },
      select: {
        id: true,
        name: true,
        inventory: true,
        material: true,
        unit: true
      }
    })

    // 如果指定了仓库，同时更新仓库库存
    if (warehouseId) {
      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: parseInt(warehouseId),
            productId: parseInt(productId)
          }
        },
        update: {
          quantity: newInventory
        },
        create: {
          warehouseId: parseInt(warehouseId),
          productId: parseInt(productId),
          quantity: newInventory
        }
      })
    }

    // 记录库存变更
    await prisma.inventoryTransaction.create({
      data: {
        type: operation === "add" ? "inbound" : operation === "subtract" ? "outbound" : "adjustment",
        productId: parseInt(productId),
        quantity: Math.abs(parseInt(quantity)),
        notes: `库存${operation === "set" ? "调整" : operation === "add" ? "入库" : "出库"}操作`,
        targetWarehouseId: warehouseId ? parseInt(warehouseId) : null
      }
    })

    console.log("✅ [POST /api/products/inventory] 库存更新成功:", {
      productId,
      oldInventory: product.inventory,
      newInventory
    })

    return NextResponse.json({
      success: true,
      message: "库存更新成功",
      inventory: {
        productId: updatedProduct.id,
        productName: updatedProduct.name,
        oldInventory: product.inventory || 0,
        newInventory: updatedProduct.inventory || 0,
        change: newInventory - (product.inventory || 0)
      }
    })
  } catch (error) {
    console.error("Error updating product inventory:", error)
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { updates } = await request.json()
    console.log("🔄 [PUT /api/products/inventory] 批量库存更新:", updates)

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "缺少更新数据" }, { status: 400 })
    }

    const results = []

    // 使用事务处理批量更新
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        const { productId, inventory } = update

        if (!productId || inventory === undefined) {
          continue
        }

        // 更新产品库存
        const updatedProduct = await tx.product.update({
          where: { id: parseInt(productId) },
          data: { inventory: parseInt(inventory) },
          select: {
            id: true,
            name: true,
            inventory: true
          }
        })

        // 记录库存变更
        await tx.inventoryTransaction.create({
          data: {
            type: "adjustment",
            productId: parseInt(productId),
            quantity: parseInt(inventory),
            notes: "批量库存调整"
          }
        })

        results.push({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          newInventory: updatedProduct.inventory
        })
      }
    })

    console.log("✅ [PUT /api/products/inventory] 批量库存更新成功:", results.length)

    return NextResponse.json({
      success: true,
      message: `成功更新 ${results.length} 个产品的库存`,
      results
    })
  } catch (error) {
    console.error("Error batch updating inventory:", error)
    return NextResponse.json({ error: "Failed to batch update inventory" }, { status: 500 })
  }
}
