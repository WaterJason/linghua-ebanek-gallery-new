import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/products/stats - 获取产品统计信息
 * 提供产品数量、分类分布、价格分析等统计数据
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    console.log("🔄 [GET /api/products/stats] 获取产品统计信息...")

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all"
    
    // 构建日期过滤条件
    let dateFilter = {}
    const now = new Date()
    
    if (period === "today") {
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      dateFilter = {
        createdAt: { gte: startOfDay }
      }
    } else if (period === "week") {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      dateFilter = {
        createdAt: { gte: startOfWeek }
      }
    } else if (period === "month") {
      const startOfMonth = new Date(now)
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      dateFilter = {
        createdAt: { gte: startOfMonth }
      }
    }
    
    // 并行查询各种统计信息
    const [
      totalProducts,
      totalCategories,
      productsByCategory,
      productsByPrice,
      productsWithoutImage,
      lowInventoryProducts,
      recentlyCreated
    ] = await Promise.all([
      // 总产品数（排除占位符）
      prisma.product.count({
        where: {
          ...dateFilter,
          type: {
            notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
          }
        }
      }),
      
      // 总分类数
      prisma.productCategory.count({
        where: { isActive: true }
      }),
      
      // 按分类统计产品数
      prisma.product.groupBy({
        by: ["categoryId"],
        _count: { id: true },
        where: {
          ...dateFilter,
          type: {
            notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
          }
        }
      }),
      
      // 按价格区间统计产品数
      Promise.all([
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { lt: 100 },
            type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
          }
        }),
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { gte: 100, lt: 500 },
            type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
          }
        }),
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { gte: 500, lt: 1000 },
            type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
          }
        }),
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { gte: 1000 },
            type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
          }
        })
      ]),
      
      // 无图片产品数
      prisma.product.count({
        where: {
          ...dateFilter,
          imageUrl: null,
          type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
        }
      }),
      
      // 低库存产品数（库存小于10）
      prisma.product.count({
        where: {
          ...dateFilter,
          inventory: { lt: 10 },
          type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
        }
      }),
      
      // 最近创建的产品
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true,
          productCategory: {
            select: { name: true }
          }
        },
        where: {
          type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ])
    
    // 获取分类信息
    const categories = await prisma.productCategory.findMany({
      select: { id: true, name: true },
      where: { isActive: true }
    })
    
    // 构建分类映射
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]))
    
    // 格式化按分类统计结果
    const formattedProductsByCategory = productsByCategory.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryId ? categoryMap.get(item.categoryId) || "未知分类" : "未分类",
      count: item._count.id
    }))
    
    // 格式化按价格区间统计结果
    const formattedProductsByPrice = [
      { range: "0-100元", count: productsByPrice[0] },
      { range: "100-500元", count: productsByPrice[1] },
      { range: "500-1000元", count: productsByPrice[2] },
      { range: "1000元以上", count: productsByPrice[3] }
    ]

    // 计算总价值
    const totalValue = await prisma.product.aggregate({
      _sum: { price: true },
      where: {
        type: { notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"] }
      }
    })

    // 计算平均价格
    const avgPrice = totalProducts > 0 ? (totalValue._sum.price || 0) / totalProducts : 0

    const responseTime = Date.now() - startTime
    console.log(`✅ [GET /api/products/stats] 统计完成, 响应时间: ${responseTime}ms`)
    
    // 返回统计结果
    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalProducts,
          totalCategories,
          totalValue: totalValue._sum.price || 0,
          averagePrice: Math.round(avgPrice * 100) / 100
        },
        distribution: {
          byCategory: formattedProductsByCategory,
          byPrice: formattedProductsByPrice
        },
        quality: {
          productsWithoutImage,
          lowInventoryProducts,
          completionRate: totalProducts > 0 ? 
            Math.round(((totalProducts - productsWithoutImage) / totalProducts) * 100) : 0
        },
        recent: {
          recentlyCreated: recentlyCreated.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            categoryName: product.productCategory?.name || '未分类',
            createdAt: product.createdAt
          }))
        }
      },
      metadata: {
        period,
        generatedAt: new Date().toISOString(),
        responseTime
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 缓存5分钟
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [GET /api/products/stats] 获取统计信息失败:", error)
    return NextResponse.json({
      error: "Failed to get product statistics",
      details: error instanceof Error ? error.message : "Unknown error",
      performance: { responseTime }
    }, { status: 500 })
  }
}
