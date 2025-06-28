import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/inventory/products - 获取产品库存清单
 * 支持按仓库筛选，返回可编辑的产品库存数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    
    if (!warehouseId) {
      return NextResponse.json({ error: "缺少仓库ID参数" }, { status: 400 })
    }

    // 获取指定仓库的产品库存数据
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        warehouseId: parseInt(warehouseId)
      },
      include: {
        product: {
          include: {
            productCategory: true
          }
        },
        warehouse: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    })

    // 转换为前端期望的格式
    const formattedData = inventoryItems.map(item => {
      const product = item.product
      const minQuantity = item.minQuantity || 10 // 默认最低库存
      
      // 计算库存状态
      let status: 'sufficient' | 'low' | 'out' = 'sufficient'
      if (item.quantity === 0) {
        status = 'out'
      } else if (item.quantity < minQuantity) {
        status = 'low'
      }

      return {
        id: item.id,
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        category: product.productCategory?.name || product.category || '未分类',
        sku: product.barcode, // 使用barcode作为SKU
        barcode: product.barcode,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        quantity: item.quantity,
        minQuantity: item.minQuantity || 0,
        salePrice: product.price,
        costPrice: 0, // 产品表中没有成本价格字段，使用默认值
        lastUpdated: item.updatedAt.toISOString(),
        status
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    })
  } catch (error) {
    console.error("Error fetching product inventory:", error)
    return NextResponse.json({ 
      error: "获取产品库存数据失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * POST /api/inventory/products - 批量创建或更新产品库存
 * 用于导入功能
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, warehouseId, mode = 'upsert' } = body

    if (!items || !Array.isArray(items) || !warehouseId) {
      return NextResponse.json({ 
        error: "缺少必要参数：items 和 warehouseId" 
      }, { status: 400 })
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    // 验证仓库是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) }
    })

    if (!warehouse) {
      return NextResponse.json({ error: "仓库不存在" }, { status: 404 })
    }

    // 处理每个库存项
    for (const item of items) {
      try {
        // 查找产品
        let product = null
        
        if (item.productId) {
          product = await prisma.product.findUnique({
            where: { id: parseInt(item.productId) }
          })
        } else if (item.sku || item.barcode) {
          product = await prisma.product.findFirst({
            where: {
              OR: [
                { barcode: item.sku || item.barcode },
                { name: { contains: item.productName || '', mode: 'insensitive' } }
              ]
            }
          })
        } else if (item.productName) {
          product = await prisma.product.findFirst({
            where: {
              name: { contains: item.productName, mode: 'insensitive' }
            }
          })
        }

        if (!product) {
          results.errors.push(`未找到产品: ${item.productName || item.sku || item.barcode}`)
          continue
        }

        // 查找现有库存记录
        const existingInventory = await prisma.inventoryItem.findFirst({
          where: {
            productId: product.id,
            warehouseId: parseInt(warehouseId)
          }
        })

        const inventoryData = {
          productId: product.id,
          warehouseId: parseInt(warehouseId),
          quantity: parseInt(item.quantity) || 0,
          minQuantity: parseInt(item.minQuantity) || 0,
          notes: item.notes || '批量导入'
        }

        if (existingInventory) {
          // 更新现有记录
          await prisma.inventoryItem.update({
            where: { id: existingInventory.id },
            data: {
              quantity: mode === 'add' 
                ? existingInventory.quantity + inventoryData.quantity
                : inventoryData.quantity,
              minQuantity: inventoryData.minQuantity,
              notes: inventoryData.notes
            }
          })

          // 记录库存变更
          await prisma.inventoryTransaction.create({
            data: {
              productId: product.id,
              quantity: mode === 'add' 
                ? inventoryData.quantity 
                : inventoryData.quantity - existingInventory.quantity,
              type: 'adjustment',
              notes: `批量导入更新 - ${inventoryData.notes}`,
              targetWarehouseId: parseInt(warehouseId)
            }
          })

          results.updated++
        } else {
          // 创建新记录
          await prisma.inventoryItem.create({
            data: inventoryData
          })

          // 记录库存变更
          await prisma.inventoryTransaction.create({
            data: {
              productId: product.id,
              quantity: inventoryData.quantity,
              type: 'initial',
              notes: `批量导入创建 - ${inventoryData.notes}`,
              targetWarehouseId: parseInt(warehouseId)
            }
          })

          results.created++
        }

        // 如果有价格信息，同步更新产品价格
        if (item.salePrice !== undefined) {
          await prisma.product.update({
            where: { id: product.id },
            data: { price: parseFloat(item.salePrice) }
          })
        }

      } catch (itemError) {
        console.error(`Error processing item:`, itemError)
        results.errors.push(`处理项目失败: ${item.productName || 'Unknown'} - ${itemError instanceof Error ? itemError.message : '未知错误'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `批量操作完成`,
      results: {
        ...results,
        total: items.length,
        imported: results.created + results.updated
      }
    })

  } catch (error) {
    console.error("Error in bulk inventory operation:", error)
    return NextResponse.json({ 
      error: "批量操作失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
