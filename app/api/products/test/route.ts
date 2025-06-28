import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { ProductDataAdapter, ExtendedPrismaProduct } from "@/lib/data-adapter"

/**
 * GET /api/products/test - 测试产品API功能（无认证）
 * 用于验证API架构和数据适配层
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    console.log("🔄 [GET /api/products/test] 开始测试...")

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    let result: any = {}

    switch (action) {
      case 'list':
        // 测试产品列表
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
          take: 5, // 只取5条记录用于测试
        })

        // 使用数据适配层转换数据格式
        const frontendProducts = products.map(product =>
          ProductDataAdapter.toFrontend(product as ExtendedPrismaProduct)
        )

        result = {
          action: 'list',
          products: frontendProducts,
          count: products.length
        }
        break

      case 'categories':
        // 测试分类列表
        const categories = await prisma.productCategory.findMany({
          where: { isActive: true },
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    type: {
                      notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
                    }
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' },
          take: 5
        })

        result = {
          action: 'categories',
          categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            productCount: cat._count.products
          })),
          count: categories.length
        }
        break

      case 'adapter':
        // 测试数据适配层
        const testData = {
          name: "测试产品",
          price: "99.99",
          commissionRate: "10",
          categoryId: "1",
          sku: "TEST-001"
        }

        try {
          const validatedData = ProductDataAdapter.validateAndTransform(testData)
          result = {
            action: 'adapter',
            input: testData,
            output: validatedData,
            success: true
          }
        } catch (error) {
          result = {
            action: 'adapter',
            input: testData,
            error: error instanceof Error ? error.message : "Unknown error",
            success: false
          }
        }
        break

      case 'database':
        // 测试数据库连接
        const productCount = await prisma.product.count({
          where: {
            type: {
              notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
            }
          }
        })
        const categoryCount = await prisma.productCategory.count({
          where: { isActive: true }
        })

        result = {
          action: 'database',
          productCount,
          categoryCount,
          connection: 'success'
        }
        break

      case 'category_hierarchy':
        // 测试分类层级结构
        const hierarchyCategories = await prisma.productCategory.findMany({
          where: { isActive: true },
          include: {
            parent: true,
            children: {
              where: { isActive: true }
            },
            _count: {
              select: {
                products: {
                  where: {
                    type: {
                      notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { level: 'asc' },
            { sortOrder: 'asc' },
            { name: 'asc' }
          ]
        })

        result = {
          action: 'category_hierarchy',
          categories: hierarchyCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            level: cat.level,
            path: cat.path,
            parentId: cat.parentId,
            parentName: cat.parent?.name || null,
            childrenCount: cat.children.length,
            productCount: cat._count.products,
            sortOrder: cat.sortOrder
          })),
          totalCategories: hierarchyCategories.length
        }
        break

      case 'category_validation':
        // 测试分类验证功能
        const testCategoryData = {
          name: "测试分类",
          description: "这是一个测试分类",
          isActive: true,
          sortOrder: 1
        }

        try {
          // 模拟验证过程
          if (!testCategoryData.name || testCategoryData.name.trim() === '') {
            throw new Error("分类名称不能为空")
          }

          if (testCategoryData.name.length > 100) {
            throw new Error("分类名称不能超过100个字符")
          }

          result = {
            action: 'category_validation',
            input: testCategoryData,
            validation: 'success',
            message: '分类数据验证通过'
          }
        } catch (error) {
          result = {
            action: 'category_validation',
            input: testCategoryData,
            validation: 'failed',
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
        break

      case 'category_constraints':
        // 测试分类约束检查
        const constraintChecks = []

        // 检查是否有分类包含产品
        const categoriesWithProducts = await prisma.productCategory.findMany({
          where: {
            isActive: true,
            products: {
              some: {
                type: {
                  notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
                }
              }
            }
          },
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    type: {
                      notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
                    }
                  }
                }
              }
            }
          }
        })

        constraintChecks.push({
          type: 'categories_with_products',
          count: categoriesWithProducts.length,
          details: categoriesWithProducts.map(cat => ({
            id: cat.id,
            name: cat.name,
            productCount: cat._count.products
          }))
        })

        // 检查是否有父子关系
        const parentCategories = await prisma.productCategory.findMany({
          where: {
            isActive: true,
            children: {
              some: {
                isActive: true
              }
            }
          },
          include: {
            _count: {
              select: {
                children: {
                  where: { isActive: true }
                }
              }
            }
          }
        })

        constraintChecks.push({
          type: 'parent_categories',
          count: parentCategories.length,
          details: parentCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            childrenCount: cat._count.children
          }))
        })

        result = {
          action: 'category_constraints',
          checks: constraintChecks,
          summary: {
            categoriesWithProducts: categoriesWithProducts.length,
            parentCategories: parentCategories.length
          }
        }
        break

      default:
        result = {
          error: 'Invalid action',
          availableActions: ['list', 'categories', 'adapter', 'database', 'category_hierarchy', 'category_validation', 'category_constraints']
        }
    }

    const responseTime = Date.now() - startTime
    console.log(`✅ [GET /api/products/test] ${action} 测试完成, 响应时间: ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      ...result,
      performance: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [GET /api/products/test] 测试失败:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      performance: { responseTime }
    }, { status: 500 })
  }
}

/**
 * POST /api/products/test - 测试产品和分类创建功能（无认证）
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    console.log("🔄 [POST /api/products/test] 开始创建测试...")

    const data = await request.json()
    console.log("接收到的数据:", data)

    const { type = 'product', ...testData } = data

    if (type === 'category') {
      // 测试分类创建
      console.log("测试分类创建...")

      // 计算层级和路径
      let level = 1
      let path = testData.name
      let parentCategory = null

      if (testData.parentId) {
        parentCategory = await prisma.productCategory.findUnique({
          where: { id: parseInt(testData.parentId) }
        })

        if (!parentCategory) {
          throw new Error("父分类不存在")
        }

        level = parentCategory.level + 1
        path = `${parentCategory.path}/${testData.name}`
      }

      // 创建测试分类
      const category = await prisma.productCategory.create({
        data: {
          name: testData.name.trim(),
          code: testData.code?.trim() || null,
          description: testData.description?.trim() || null,
          imageUrl: testData.imageUrl || null,
          isActive: testData.isActive !== false,
          sortOrder: testData.sortOrder || 0,
          parentId: testData.parentId ? parseInt(testData.parentId) : null,
          level,
          path,
        },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      const responseTime = Date.now() - startTime
      console.log(`✅ [POST /api/products/test] 分类创建成功: ${category.id}, 响应时间: ${responseTime}ms`)

      return NextResponse.json({
        success: true,
        type: 'category',
        category: {
          ...category,
          productCount: category._count.products
        },
        performance: {
          responseTime,
          operation: "create_category"
        }
      })
    } else {
      // 测试产品创建（原有逻辑）
      console.log("测试产品创建...")

      // 使用数据适配层验证和转换数据
      const backendData = ProductDataAdapter.validateAndTransform(testData)
      console.log("转换后的数据:", backendData)

      // 创建测试产品
      const product = await prisma.product.create({
        data: {
          name: backendData.name.trim(),
          price: Number.parseFloat(backendData.price),
          commissionRate: Number.parseFloat(backendData.commissionRate || "0"),
          type: backendData.type || "product",
          imageUrl: backendData.imageUrl || null,
          imageUrls: backendData.imageUrls || [],
          barcode: backendData.barcode || null,
          categoryId: backendData.categoryId ? parseInt(backendData.categoryId) : null,
          cost: backendData.cost ? Number.parseFloat(backendData.cost) : null,
          sku: backendData.sku || null,
          description: backendData.description || null,
          dimensions: backendData.dimensions || null,
          material: backendData.material || null,
          unit: backendData.unit || null,
          details: backendData.details || null,
          inventory: backendData.inventory || null,
        },
        include: {
          productCategory: true,
          productTags: {
            include: {
              tag: true,
            },
          },
        },
      })

      // 使用数据适配层转换返回数据
      const frontendProduct = ProductDataAdapter.toFrontend(product as ExtendedPrismaProduct)

      const responseTime = Date.now() - startTime
      console.log(`✅ [POST /api/products/test] 产品创建成功: ${product.id}, 响应时间: ${responseTime}ms`)

      return NextResponse.json({
        success: true,
        type: 'product',
        product: frontendProduct,
        performance: {
          responseTime,
          operation: "create_product"
        }
      })
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [POST /api/products/test] 创建测试失败:", error)
    return NextResponse.json({
      success: false,
      error: "Create test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      performance: { responseTime }
    }, { status: 500 })
  }
}
