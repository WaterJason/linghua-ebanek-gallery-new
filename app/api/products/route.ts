import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { syncNewProductToInventory } from "@/lib/services/product-inventory-sync"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      },
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })

    // 转换为前端期望的格式
    const formattedProducts = products.map(product => ({
      ...product,
      categoryName: product.productCategory?.name || null,
      tags: product.productTags?.map(pt => pt.tag) || [],
      tagIds: product.productTags?.map(pt => pt.tagId) || [],
    }))

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("🔄 [POST /api/products] 接收到的产品数据:", data)

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

    // 验证佣金率（如果提供）- 佣金率可以为空，但不能为负数
    let validatedCommissionRate = 0; // 默认佣金率为0
    if (data.commissionRate !== null && data.commissionRate !== undefined) {
      const commissionValue = Number(data.commissionRate);
      if (isNaN(commissionValue) || commissionValue < 0) {
        return NextResponse.json({ error: "佣金率不能为负数" }, { status: 400 })
      }
      validatedCommissionRate = commissionValue;
    }

    // 准备产品数据 - 排除指定字段
    const productData = {
      name: data.name.trim(),
      price: validatedPrice, // 使用验证后的价格
      commissionRate: validatedCommissionRate, // 添加必需的佣金率字段
      type: data.type || "product",
      imageUrl: data.imageUrl || null,
      imageUrls: data.imageUrls || [],
      description: data.description || null,
      categoryId: data.categoryId === "uncategorized" ? null : data.categoryId ? parseInt(data.categoryId) : null,
      barcode: data.barcode || null,
      dimensions: data.dimensions || null,
      material: data.material || "珐琅", // 保留用于兼容性
      unit: data.unit || "套", // 保留用于兼容性
      inventory: data.inventory ? Number.parseInt(data.inventory) : null,
    }

    console.log("🔄 [POST /api/products] 处理后的产品数据:", productData)

    // 提取标签ID
    const tagIds = data.tagIds || []

    try {
      // 使用事务创建产品和标签关联
      const product = await prisma.$transaction(async (tx) => {
        // 创建产品
        const newProduct = await tx.product.create({
          data: productData,
        })

        // 创建标签关联
        if (tagIds.length > 0) {
          await tx.productTagsOnProducts.createMany({
            data: tagIds.map((tagId: number) => ({
              productId: newProduct.id,
              tagId: tagId,
            })),
          })
        }

        // 返回包含关联数据的产品
        return await tx.product.findUnique({
          where: { id: newProduct.id },
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

      // 转换为前端期望的格式
      const formattedProduct = {
        ...product,
        categoryName: product?.productCategory?.name || null,
        tags: product?.productTags?.map(pt => pt.tag) || [],
        tagIds: product?.productTags?.map(pt => pt.tagId) || [],
      }

      console.log("✅ [POST /api/products] 产品创建成功:", formattedProduct.id)

      // 异步同步到库存模块
      syncNewProductToInventory(product.id).then(syncResult => {
        if (syncResult.success) {
          console.log(`✅ [ProductSync] 产品 ${product.id} 同步到库存模块成功`)
        } else {
          console.error(`❌ [ProductSync] 产品 ${product.id} 同步到库存模块失败:`, syncResult.message)
        }
      }).catch(error => {
        console.error(`❌ [ProductSync] 产品 ${product.id} 同步异常:`, error)
      })

      return NextResponse.json({
        success: true,
        product: formattedProduct,
        syncStatus: "pending" // 表示同步正在进行中
      })
    } catch (dbError) {
      console.error("🔥 [POST /api/products] 数据库错误:", dbError)
      return NextResponse.json({
        error: "数据库操作失败",
        details: dbError instanceof Error ? dbError.message : "未知错误"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("🔥 [POST /api/products] 服务器错误:", error)
    return NextResponse.json({
      error: "服务器内部错误",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
