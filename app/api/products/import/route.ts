import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { syncNewProductToInventory } from "@/lib/services/product-inventory-sync"

export async function POST(request: Request) {
  try {
    const requestBody = await request.json()
    const { products, options = {} } = requestBody
    console.log("🔄 [POST /api/products/import] 导入产品数据:", {
      count: products?.length,
      options,
      sampleData: products?.slice(0, 2) // 显示前两条数据样本
    })

    if (!Array.isArray(products) || products.length === 0) {
      console.error("❌ [POST /api/products/import] 产品数据无效:", { products, type: typeof products })
      return NextResponse.json({
        error: "缺少产品数据",
        details: "请确保上传的文件包含有效的产品数据"
      }, { status: 400 })
    }

    const {
      skipDuplicates = true,
      updateExisting = false,
      validateData = true
    } = options

    const results = {
      total: products.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 获取现有分类和标签映射
    const [categories, tags] = await Promise.all([
      prisma.productCategory.findMany({
        select: { id: true, name: true }
      }),
      prisma.productTag.findMany({
        select: { id: true, name: true }
      })
    ])
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]))
    const tagMap = new Map(tags.map(tag => [tag.name, tag.id]))

    // 处理每个产品
    for (let i = 0; i < products.length; i++) {
      const productData = products[i]
      
      try {
        // 数据验证
        if (validateData) {
          const productName = productData.name || productData['产品名称']
          const productPrice = productData.price || productData['价格']

          if (!productName) {
            results.failed++
            results.errors.push(`第${i + 1}行: 缺少产品名称字段`)
            console.error(`❌ [Import] 第${i + 1}行缺少产品名称:`, productData)
            continue
          }

          if (!productPrice) {
            results.failed++
            results.errors.push(`第${i + 1}行: 缺少价格字段`)
            console.error(`❌ [Import] 第${i + 1}行缺少价格:`, productData)
            continue
          }

          if (isNaN(parseFloat(productPrice)) || parseFloat(productPrice) < 0) {
            results.failed++
            results.errors.push(`第${i + 1}行: 价格格式无效 (${productPrice})`)
            console.error(`❌ [Import] 第${i + 1}行价格格式无效:`, productPrice)
            continue
          }
        }

        // 处理分类 - 支持多种字段名
        let categoryId = null
        const categoryName = productData.categoryName || productData.category || productData['分类']
        if (categoryName && typeof categoryName === 'string') {
          const trimmedName = categoryName.trim()
          if (trimmedName && trimmedName !== '未分类') {
            categoryId = categoryMap.get(trimmedName)
            if (!categoryId) {
              // 创建新分类
              const newCategory = await prisma.productCategory.create({
                data: {
                  name: trimmedName,
                  isActive: true,
                  level: 1,
                  path: trimmedName
                }
              })
              categoryId = newCategory.id
              categoryMap.set(trimmedName, categoryId)
              console.log(`✅ [Import] 创建新分类: ${trimmedName}`)
            }
          }
        }

        // 处理标签
        const tagIds: number[] = []
        if (productData.tags && typeof productData.tags === 'string') {
          const tagNames = productData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          for (const tagName of tagNames) {
            if (tagMap.has(tagName)) {
              tagIds.push(tagMap.get(tagName)!)
            } else {
              // 创建新标签
              try {
                const newTag = await prisma.productTag.create({
                  data: {
                    name: tagName,
                    color: '#3b82f6'
                  }
                })
                tagMap.set(tagName, newTag.id)
                tagIds.push(newTag.id)
                console.log(`✅ [Import] 创建新标签: ${tagName}`)
              } catch (error) {
                console.error(`❌ [Import] 创建标签失败: ${tagName}`, error)
              }
            }
          }
        }

        // 准备产品数据 - 支持多种字段名
        const productName = productData.name || productData['产品名称']
        const productPrice = productData.price || productData['价格'] || 0
        const productDescription = productData.description || productData['描述']
        const productMaterial = productData.material || productData['材质'] || "珐琅"
        const productUnit = productData.unit || productData['单位'] || "套"
        const productDimensions = productData.dimensions || productData['尺寸']
        const productInventory = productData.inventory || productData['库存']
        const productBarcode = productData.barcode || productData['序列号']

        // 处理图片链接 - 支持多种字段名
        const mainImageUrl = productData.imageUrl || productData['主图链接'] || productData['图片URL']
        const allImageUrls = productData.imageUrls || productData['图片链接']

        // 处理图片URL列表
        let imageUrlsArray: string[] = []
        if (typeof allImageUrls === 'string' && allImageUrls.trim()) {
          // 支持分号或逗号分隔的URL列表
          imageUrlsArray = allImageUrls.split(/[;,]/).map(url => url.trim()).filter(Boolean)
        } else if (Array.isArray(allImageUrls)) {
          imageUrlsArray = allImageUrls.filter(Boolean)
        }

        // 如果有主图但不在图片列表中，添加到列表开头
        if (mainImageUrl && !imageUrlsArray.includes(mainImageUrl)) {
          imageUrlsArray.unshift(mainImageUrl)
        }

        const productCreateData = {
          name: productName.trim(),
          price: parseFloat(productPrice) || 0,
          commissionRate: 0, // 添加必需的佣金率字段
          type: "product",
          description: productDescription || null,
          imageUrl: mainImageUrl || (imageUrlsArray.length > 0 ? imageUrlsArray[0] : null),
          imageUrls: imageUrlsArray,
          barcode: productBarcode || null,
          categoryId,
          dimensions: productDimensions || null,
          material: productMaterial,
          unit: productUnit,
          inventory: productInventory ? parseInt(productInventory) : null,
        }

        // 检查是否存在重复产品
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: productCreateData.name,
            type: "product"
          }
        })

        if (existingProduct) {
          if (skipDuplicates && !updateExisting) {
            results.skipped++
            continue
          } else if (updateExisting) {
            // 更新现有产品
            await prisma.$transaction(async (tx) => {
              // 更新产品基本信息
              await tx.product.update({
                where: { id: existingProduct.id },
                data: productCreateData
              })

              // 更新标签关联
              if (tagIds.length > 0) {
                // 删除现有标签关联
                await tx.productTagsOnProducts.deleteMany({
                  where: { productId: existingProduct.id }
                })

                // 创建新的标签关联
                await tx.productTagsOnProducts.createMany({
                  data: tagIds.map(tagId => ({
                    productId: existingProduct.id,
                    tagId: tagId
                  })),
                  skipDuplicates: true
                })
              }
            })
            results.updated++
            continue
          }
        }

        // 创建新产品
        const newProduct = await prisma.$transaction(async (tx) => {
          // 创建产品
          const product = await tx.product.create({
            data: productCreateData
          })

          // 创建标签关联
          if (tagIds.length > 0) {
            await tx.productTagsOnProducts.createMany({
              data: tagIds.map(tagId => ({
                productId: product.id,
                tagId: tagId
              })),
              skipDuplicates: true
            })
          }

          return product
        })

        // 异步同步到库存模块
        if (newProduct && productCreateData.inventory && productCreateData.inventory > 0) {
          syncNewProductToInventory(newProduct.id).then(syncResult => {
            if (syncResult.success) {
              console.log(`✅ [ProductSync] 导入产品 ${newProduct.id} 同步到库存模块成功`)
            } else {
              console.error(`❌ [ProductSync] 导入产品 ${newProduct.id} 同步到库存模块失败:`, syncResult.message)
            }
          }).catch(error => {
            console.error(`❌ [ProductSync] 导入产品 ${newProduct.id} 同步异常:`, error)
          })
        }

        results.imported++

      } catch (error) {
        results.failed++
        results.errors.push(`第${i + 1}行: ${error instanceof Error ? error.message : '未知错误'}`)
        console.error(`导入第${i + 1}行失败:`, error)
      }
    }

    console.log("✅ [POST /api/products/import] 导入完成:", results)

    return NextResponse.json({
      success: true,
      message: `导入完成: 成功${results.imported}个，更新${results.updated}个，跳过${results.skipped}个，失败${results.failed}个`,
      results
    })
  } catch (error) {
    console.error("Error importing products:", error)
    return NextResponse.json({ error: "Failed to import products" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const categoryId = searchParams.get("categoryId")

    console.log("📤 [GET /api/products/import] 导出产品数据:", { format, categoryId })

    // 构建查询条件
    const where: any = {
      type: {
        notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
      }
    }

    if (categoryId && categoryId !== "all") {
      where.categoryId = parseInt(categoryId)
    }

    // 获取产品数据
    const products = await prisma.product.findMany({
      where,
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        id: "asc"
      }
    })

    // 格式化导出数据 - 排除指定字段
    const exportData = products.map(product => {
      const tags = product.productTags?.map(pt => pt.tag.name).join(', ') || ''

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        categoryName: product.productCategory?.name || '',
        material: product.material,
        unit: product.unit,
        dimensions: product.dimensions,
        inventory: product.inventory,
        barcode: product.barcode,
        tags: tags,
        imageUrl: product.imageUrl,
        imageUrls: (product.imageUrls || []).join('; '),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })

    if (format === "csv") {
      // 生成CSV格式
      const headers = [
        'ID', '产品名称', '价格', '描述', '分类', '材料', '单位',
        '尺寸', '库存', '条码', '标签', '图片URL', '图片列表', '创建时间', '更新时间'
      ]

      const csvRows = [
        headers.join(','),
        ...exportData.map(product => [
          product.id,
          `"${product.name}"`,
          product.price,
          `"${product.description || ''}"`,
          `"${product.categoryName}"`,
          `"${product.material || ''}"`,
          `"${product.unit || ''}"`,
          `"${product.dimensions || ''}"`,
          product.inventory || 0,
          `"${product.barcode || ''}"`,
          `"${product.tags || ''}"`,
          `"${product.imageUrl || ''}"`,
          `"${product.imageUrls || ''}"`,
          product.createdAt.toISOString(),
          product.updatedAt.toISOString()
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="products_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // 返回JSON格式
      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        exportedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error("Error exporting products:", error)
    return NextResponse.json({ error: "Failed to export products" }, { status: 500 })
  }
}
