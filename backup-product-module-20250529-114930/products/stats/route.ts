import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { withApiCache } from "@/lib/api-cache"
import { withApiRateLimit } from "@/lib/api-rate-limit"

// 获取产品统计信息
async function getProductStats(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "all"
    
    // 构建日期过滤条件
    let dateFilter = {}
    const now = new Date()
    
    if (period === "today") {
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      
      dateFilter = {
        createdAt: {
          gte: startOfDay
        }
      }
    } else if (period === "week") {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      dateFilter = {
        createdAt: {
          gte: startOfWeek
        }
      }
    } else if (period === "month") {
      const startOfMonth = new Date(now)
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      dateFilter = {
        createdAt: {
          gte: startOfMonth
        }
      }
    }
    
    // 并行查询各种统计信息
    const [
      totalProducts,
      totalCategories,
      productsByCategory,
      productsByPrice,
      productsWithoutImage,
      productsWithoutInventory,
      recentlyCreated,
      recentlyUpdated
    ] = await Promise.all([
      // 总产品数
      prisma.product.count({
        where: dateFilter
      }),
      
      // 总分类数
      prisma.productCategory.count(),
      
      // 按分类统计产品数
      prisma.product.groupBy({
        by: ["categoryId"],
        _count: {
          id: true
        },
        where: dateFilter
      }),
      
      // 按价格区间统计产品数
      prisma.$transaction([
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { lt: 100 }
          }
        }),
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { gte: 100, lt: 500 }
          }
        }),
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { gte: 500, lt: 1000 }
          }
        }),
        prisma.product.count({
          where: {
            ...dateFilter,
            price: { gte: 1000 }
          }
        })
      ]),
      
      // 无图片产品数
      prisma.product.count({
        where: {
          ...dateFilter,
          imageUrl: null
        }
      }),
      
      // 无库存产品数
      prisma.product.count({
        where: {
          ...dateFilter,
          inventory: 0
        }
      }),
      
      // 最近创建的产品
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }),
      
      // 最近更新的产品
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5
      })
    ])
    
    // 获取分类名称
    const categories = await prisma.productCategory.findMany({
      select: {
        id: true,
        name: true
      }
    })
    
    // 构建分类映射
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]))
    
    // 格式化按分类统计结果
    const formattedProductsByCategory = productsByCategory.map(item => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId) || "未分类",
      count: item._count.id
    }))
    
    // 格式化按价格区间统计结果
    const formattedProductsByPrice = [
      { range: "0-100", count: productsByPrice[0] },
      { range: "100-500", count: productsByPrice[1] },
      { range: "500-1000", count: productsByPrice[2] },
      { range: "1000+", count: productsByPrice[3] }
    ]
    
    // 返回统计结果
    return NextResponse.json({
      totalProducts,
      totalCategories,
      productsByCategory: formattedProductsByCategory,
      productsByPrice: formattedProductsByPrice,
      productsWithoutImage,
      productsWithoutInventory,
      recentlyCreated,
      recentlyUpdated,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("获取产品统计信息失败:", error)
    return NextResponse.json(
      { error: "获取产品统计信息失败" },
      { status: 500 }
    )
  }
}

// 导出GET处理程序
export async function GET(request: NextRequest) {
  // 应用限流中间件
  return withApiRateLimit(
    request,
    // 应用缓存中间件
    () => withApiCache(
      request,
      () => getProductStats(request),
      {
        maxAge: 300, // 缓存5分钟
        staleWhileRevalidate: 3600, // 过期后可使用1小时
        varyByQuery: true, // 按查询参数缓存
        varyByUser: false // 不按用户缓存
      }
    ),
    {
      limit: 60, // 每分钟60个请求
      windowMs: 60 * 1000 // 1分钟窗口
    }
  )
}
