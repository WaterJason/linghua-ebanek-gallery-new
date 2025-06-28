import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const categoryId = searchParams.get("categoryId")
    const material = searchParams.get("material")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "id"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    console.log("🔍 [GET /api/products/search] 搜索参数:", {
      query, categoryId, material, priceMin, priceMax, page, limit, sortBy, sortOrder
    })

    // 构建查询条件
    const where: any = {
      type: {
        notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
      }
    }

    // 文本搜索
    if (query.trim()) {
      where.OR = [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { description: { contains: query.trim(), mode: "insensitive" } },
        { barcode: { contains: query.trim(), mode: "insensitive" } },
        { dimensions: { contains: query.trim(), mode: "insensitive" } },
      ]
    }

    // 分类筛选
    if (categoryId && categoryId !== "all") {
      where.categoryId = parseInt(categoryId)
    }

    // 材料筛选
    if (material && material !== "all") {
      where.material = material
    }

    // 价格范围筛选
    if (priceMin || priceMax) {
      where.price = {}
      if (priceMin) {
        where.price.gte = parseFloat(priceMin)
      }
      if (priceMax) {
        where.price.lte = parseFloat(priceMax)
      }
    }

    // 构建排序条件
    const orderBy: any = {}
    if (sortBy === "price" || sortBy === "inventory") {
      orderBy[sortBy] = sortOrder
    } else if (sortBy === "categoryName") {
      orderBy.productCategory = { name: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // 计算分页
    const skip = (page - 1) * limit

    // 执行查询
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          productCategory: true,
          productTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ])

    // 转换为前端期望的格式
    const formattedProducts = products.map(product => ({
      ...product,
      categoryName: product.productCategory?.name || null,
    }))

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    console.log("✅ [GET /api/products/search] 搜索完成:", {
      total, page, totalPages, resultsCount: formattedProducts.length
    })

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        query,
        categoryId,
        material,
        priceMin,
        priceMax,
      }
    })
  } catch (error) {
    console.error("Error searching products:", error)
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const {
      query = "",
      categoryId,
      material,
      priceMin,
      priceMax,
      page = 1,
      limit = 20,
      sortBy = "id",
      sortOrder = "asc"
    } = await request.json()

    console.log("🔍 [POST /api/products/search] 高级搜索参数:", {
      query, categoryId, material, priceMin, priceMax, page, limit, sortBy, sortOrder
    })

    // 构建查询条件
    const where: any = {
      type: {
        notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
      }
    }

    // 文本搜索
    if (query.trim()) {
      where.OR = [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { description: { contains: query.trim(), mode: "insensitive" } },
        { barcode: { contains: query.trim(), mode: "insensitive" } },
        { dimensions: { contains: query.trim(), mode: "insensitive" } },
      ]
    }

    // 分类筛选
    if (categoryId && categoryId !== "all") {
      where.categoryId = parseInt(categoryId)
    }

    // 材料筛选
    if (material && material !== "all") {
      where.material = material
    }

    // 价格范围筛选
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {}
      if (priceMin !== undefined) {
        where.price.gte = parseFloat(priceMin)
      }
      if (priceMax !== undefined) {
        where.price.lte = parseFloat(priceMax)
      }
    }

    // 构建排序条件
    const orderBy: any = {}
    if (sortBy === "price" || sortBy === "inventory") {
      orderBy[sortBy] = sortOrder
    } else if (sortBy === "categoryName") {
      orderBy.productCategory = { name: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // 计算分页
    const skip = (page - 1) * limit

    // 执行查询
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          productCategory: true,
          productTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ])

    // 转换为前端期望的格式
    const formattedProducts = products.map(product => ({
      ...product,
      categoryName: product.productCategory?.name || null,
    }))

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    console.log("✅ [POST /api/products/search] 高级搜索完成:", {
      total, page, totalPages, resultsCount: formattedProducts.length
    })

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        query,
        categoryId,
        material,
        priceMin,
        priceMax,
      }
    })
  } catch (error) {
    console.error("Error in advanced product search:", error)
    return NextResponse.json({ error: "Failed to perform advanced search" }, { status: 500 })
  }
}
