import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { syncProductUpdateToInventory, syncProductDeleteToInventory } from "@/lib/services/product-inventory-sync"
import { syncInventoryToProductModule } from "@/lib/services/inventory-sync-service"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return NextResponse.json({ error: "无效的产品ID" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 转换为前端期望的格式，确保所有字段都正确包含
    const formattedProduct = {
      ...product,
      categoryName: product.productCategory?.name || null,
      // 确保标签数据格式正确
      tags: product.productTags?.map(pt => pt.tag) || [],
      tagIds: product.productTags?.map(pt => pt.tagId) || [],
      // 确保图片数据正确
      imageUrl: product.imageUrl || null,
      imageUrls: product.imageUrls || [],
      // 确保基本字段有默认值
      material: product.material || "珐琅",
      unit: product.unit || "套",
      dimensions: product.dimensions || null,
      barcode: product.barcode || null,
      description: product.description || null,
      inventory: product.inventory || null,
      price: product.price || null,
    }

    console.log("✅ [GET /api/products] 格式化产品数据:", formattedProduct)

    return NextResponse.json({
      success: true,
      product: formattedProduct
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PATCH方法用于部分更新（内联编辑）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const data = await request.json()

    console.log(`🔄 [PATCH /api/products] 部分更新产品 ${productId}:`, data)

    // 验证产品ID
    if (isNaN(productId)) {
      return NextResponse.json({ error: "无效的产品ID" }, { status: 400 })
    }

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 只更新提供的字段
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.price !== undefined) updateData.price = data.price !== null ? Number.parseFloat(data.price) : null
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions
    if (data.inventory !== undefined) updateData.inventory = data.inventory !== null ? Number.parseInt(data.inventory) : null
    if (data.material !== undefined) updateData.material = data.material
    if (data.unit !== undefined) updateData.unit = data.unit

    // 更新产品
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    console.log("✅ [PATCH /api/products] 产品部分更新成功:", productId)

    // 如果更新了库存字段，需要同步到库存模块
    if (data.inventory !== undefined) {
      console.log(`🔄 [PATCH /api/products] 检测到库存更新，同步到库存模块: ${data.inventory}`)

      // 异步同步库存到库存模块
      syncProductUpdateToInventory(productId, { inventory: data.inventory }).then(syncResult => {
        if (syncResult.success) {
          console.log(`✅ [ProductSync] 产品 ${productId} 库存同步到库存模块成功`)
        } else {
          console.error(`❌ [ProductSync] 产品 ${productId} 库存同步到库存模块失败:`, syncResult.message)
        }
      }).catch(error => {
        console.error(`❌ [ProductSync] 产品 ${productId} 库存同步异常:`, error)
      })
    }

    return NextResponse.json({
      success: true,
      product: {
        ...updatedProduct,
        categoryName: updatedProduct.productCategory?.name || null,
        tags: updatedProduct.productTags?.map(pt => pt.tag) || [],
        tagIds: updatedProduct.productTags?.map(pt => pt.tagId) || [],
      },
      syncStatus: data.inventory !== undefined ? "pending" : "none"
    })
  } catch (error) {
    console.error("🔥 [PATCH /api/products] 错误:", error)
    return NextResponse.json({
      error: "更新产品失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return NextResponse.json({ error: "无效的产品ID" }, { status: 400 })
    }

    const data = await request.json()
    console.log("🔄 [PUT /api/products] 更新产品数据:", data)

    // 验证必填字段 - 只验证产品名称
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json({ error: "产品名称为必填项" }, { status: 400 })
    }

    // 验证价格（如果提供）- 价格可以为空，但不能为负数
    let validatedPrice = 0; // 默认价格为0
    if (data.price !== null && data.price !== undefined) {
      const priceValue = Number(data.price);
      if (isNaN(priceValue) || priceValue < 0) {
        return NextResponse.json({ error: "产品价格不能为负数" }, { status: 400 })
      }
      validatedPrice = priceValue;
    }

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 使用事务更新产品和标签关联
    const product = await prisma.$transaction(async (tx) => {
      // 更新产品基本信息
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name.trim(),
          price: validatedPrice, // 使用验证后的价格
          type: data.type || "product",
          imageUrl: data.imageUrl || null,
          imageUrls: data.imageUrls || [],
          description: data.description || null,
          categoryId: data.categoryId === "uncategorized" ? null : data.categoryId ? parseInt(data.categoryId) : null,
          barcode: data.barcode || null,
          dimensions: data.dimensions || null,
          material: data.material || "珐琅",
          unit: data.unit || "套",
          inventory: data.inventory ? Number.parseInt(data.inventory) : null,
        },
      })

      // 处理标签关联
      if (data.tagIds && Array.isArray(data.tagIds)) {
        console.log("🔄 [PUT /api/products] 更新产品标签:", data.tagIds)

        // 删除现有的标签关联
        await tx.productTagsOnProducts.deleteMany({
          where: { productId: productId }
        })

        // 创建新的标签关联
        if (data.tagIds.length > 0) {
          const tagAssociations = data.tagIds.map((tagId: number) => ({
            productId: productId,
            tagId: tagId
          }))

          await tx.productTagsOnProducts.createMany({
            data: tagAssociations,
            skipDuplicates: true
          })
        }
      }

      // 返回完整的产品数据
      return await tx.product.findUnique({
        where: { id: productId },
        include: {
          productCategory: true,
          productTags: {
            include: {
              tag: true,
            },
          },
        },
      })
    })

    if (!product) {
      throw new Error("产品更新失败：无法获取更新后的产品数据")
    }

    console.log("✅ [PUT /api/products] 产品更新成功:", productId)

    // 转换为前端期望的格式
    const formattedProduct = {
      ...product,
      categoryName: product.productCategory?.name || null,
      tags: product.productTags?.map(pt => pt.tag) || [],
      tagIds: product.productTags?.map(pt => pt.tagId) || [],
    }

    console.log("✅ [PUT /api/products] 格式化产品数据:", formattedProduct)

    // 异步同步到库存模块
    const updatedFields = {
      name: data.name,
      price: data.price,
      inventory: data.inventory,
      categoryId: data.categoryId,
      material: data.material,
      unit: data.unit,
      dimensions: data.dimensions
    }

    syncProductUpdateToInventory(productId, updatedFields).then(syncResult => {
      if (syncResult.success) {
        console.log(`✅ [ProductSync] 产品 ${productId} 更新同步到库存模块成功`)
      } else {
        console.error(`❌ [ProductSync] 产品 ${productId} 更新同步到库存模块失败:`, syncResult.message)
      }
    }).catch(error => {
      console.error(`❌ [ProductSync] 产品 ${productId} 更新同步异常:`, error)
    })

    return NextResponse.json({
      success: true,
      product: formattedProduct,
      syncStatus: "pending" // 表示同步正在进行中
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return NextResponse.json({ error: "无效的产品ID" }, { status: 400 })
    }

    console.log(`🔄 [DELETE /api/products] 开始删除产品: ${productId}`)

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 检查业务关联数据，提供删除前的信息
    const businessRelations = await prisma.$transaction(async (tx) => {
      const [
        orderItems,
        salesItems,
        purchaseOrderItems,
        productionOrderItems,
        posSaleItems,
        channelSaleItems,
        inventoryTransactions
      ] = await Promise.all([
        tx.orderItem.count({ where: { productId } }),
        tx.salesItem.count({ where: { productId } }),
        tx.purchaseOrderItem.count({ where: { productId } }),
        tx.productionOrderItem.count({ where: { productId } }),
        tx.posSaleItem.count({ where: { productId } }),
        tx.channelSaleItem.count({ where: { productId } }),
        tx.inventoryTransaction.count({ where: { productId } })
      ])

      return {
        orderItems,
        salesItems,
        purchaseOrderItems,
        productionOrderItems,
        posSaleItems,
        channelSaleItems,
        inventoryTransactions,
        total: orderItems + salesItems + purchaseOrderItems + productionOrderItems + posSaleItems + channelSaleItems + inventoryTransactions
      }
    })

    console.log(`📊 [DELETE /api/products] 产品 ${productId} 业务关联统计:`, businessRelations)

    // 使用事务确保数据一致性 - 保留业务数据，删除基础关联
    const deletionResult = await prisma.$transaction(async (tx) => {
      // 1. 将业务关联记录的productId设置为null，保留历史数据
      const businessUpdates = await Promise.all([
        // 订单项目 - 保留订单记录，将产品ID设为null
        businessRelations.orderItems > 0 ? tx.orderItem.updateMany({
          where: { productId: productId },
          data: { productId: null }
        }) : Promise.resolve({ count: 0 }),

        // 销售记录 - 保留销售记录，将产品ID设为null
        businessRelations.salesItems > 0 ? tx.salesItem.updateMany({
          where: { productId: productId },
          data: { productId: null }
        }) : Promise.resolve({ count: 0 }),

        // 采购订单项目 - 保留采购记录，将产品ID设为null
        businessRelations.purchaseOrderItems > 0 ? tx.purchaseOrderItem.updateMany({
          where: { productId: productId },
          data: { productId: null }
        }) : Promise.resolve({ count: 0 }),

        // 生产订单项目 - 保留生产记录，将产品ID设为null
        businessRelations.productionOrderItems > 0 ? tx.productionOrderItem.updateMany({
          where: { productId: productId },
          data: { productId: null }
        }) : Promise.resolve({ count: 0 }),

        // POS销售记录 - 保留POS记录，将产品ID设为null
        businessRelations.posSaleItems > 0 ? tx.posSaleItem.updateMany({
          where: { productId: productId },
          data: { productId: null }
        }) : Promise.resolve({ count: 0 }),

        // 渠道销售记录 - 保留渠道记录，将产品ID设为null
        businessRelations.channelSaleItems > 0 ? tx.channelSaleItem.updateMany({
          where: { productId: productId },
          data: { productId: null }
        }) : Promise.resolve({ count: 0 })
      ])

      // 2. 删除库存交易记录（可以安全删除）
      const deletedInventoryTransactions = await tx.inventoryTransaction.deleteMany({
        where: { productId: productId }
      })

      // 3. 删除库存记录（基础数据，可以删除）
      const deletedInventoryItems = await tx.inventoryItem.deleteMany({
        where: { productId: productId }
      })

      // 4. 删除产品标签关联（可以删除）
      const deletedProductTags = await tx.productTagsOnProducts.deleteMany({
        where: { productId: productId }
      })

      // 5. 删除渠道库存（可以删除）
      const deletedChannelInventory = await tx.channelInventory.deleteMany({
        where: { productId: productId }
      })

      // 6. 删除工坊服务项目（可以删除）
      const deletedWorkshopItems = await tx.workshopServiceItem.deleteMany({
        where: { productId: productId }
      })

      // 7. 删除质量记录（如果没有关联生产订单）
      const deletedQualityRecords = await tx.qualityRecord.deleteMany({
        where: {
          productId: productId,
          productionOrderId: null
        }
      })

      // 8. 最后删除产品
      await tx.product.delete({
        where: { id: productId }
      })

      return {
        businessUpdates,
        deletedInventoryTransactions: deletedInventoryTransactions.count,
        deletedInventoryItems: deletedInventoryItems.count,
        deletedProductTags: deletedProductTags.count,
        deletedChannelInventory: deletedChannelInventory.count,
        deletedWorkshopItems: deletedWorkshopItems.count,
        deletedQualityRecords: deletedQualityRecords.count
      }
    })

    console.log("✅ [DELETE /api/products] 产品删除成功:", productId)

    // 异步同步到库存模块 - 清理相关库存数据
    syncProductDeleteToInventory(productId).then(syncResult => {
      if (syncResult.success) {
        console.log(`✅ [ProductSync] 产品 ${productId} 删除同步到库存模块成功`)
      } else {
        console.error(`❌ [ProductSync] 产品 ${productId} 删除同步到库存模块失败:`, syncResult.message)
      }
    }).catch(error => {
      console.error(`❌ [ProductSync] 产品 ${productId} 删除同步异常:`, error)
    })

    // 准备删除报告
    const deletionReport = {
      productId,
      businessRelations,
      preservedRecords: {
        orderItems: businessRelations.orderItems,
        salesItems: businessRelations.salesItems,
        purchaseOrderItems: businessRelations.purchaseOrderItems,
        productionOrderItems: businessRelations.productionOrderItems,
        posSaleItems: businessRelations.posSaleItems,
        channelSaleItems: businessRelations.channelSaleItems
      },
      deletedRecords: {
        inventoryTransactions: deletionResult.deletedInventoryTransactions,
        inventoryItems: deletionResult.deletedInventoryItems,
        productTags: deletionResult.deletedProductTags,
        channelInventory: deletionResult.deletedChannelInventory,
        workshopItems: deletionResult.deletedWorkshopItems,
        qualityRecords: deletionResult.deletedQualityRecords
      }
    }

    return NextResponse.json({
      success: true,
      message: "产品删除成功",
      report: deletionReport,
      summary: {
        preservedBusinessRecords: businessRelations.total,
        deletedBasicRecords: Object.values(deletionResult).reduce((sum, count) =>
          typeof count === 'number' ? sum + count : sum, 0
        )
      },
      syncStatus: "pending" // 表示同步正在进行中
    })
  } catch (error) {
    console.error("Error deleting product:", error)

    // 提供更详细的错误信息
    let errorMessage = "删除产品失败"
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        errorMessage = "无法删除产品：存在关联数据"
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
