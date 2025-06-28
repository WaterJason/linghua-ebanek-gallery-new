import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { level: "asc" },
        { sortOrder: "asc" },
        { name: "asc" }
      ],
    })

    // 转换为前端期望的格式
    const formattedCategories = categories.map(category => ({
      ...category,
      productCount: category._count.products,
    }))

    return NextResponse.json({
      categories: formattedCategories,
      total: formattedCategories.length
    })
  } catch (error) {
    console.error("Error fetching product categories:", error)
    return NextResponse.json({ error: "Failed to fetch product categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("🔄 [POST /api/products/categories] 接收到的分类数据:", data)

    // 验证必填字段
    if (!data.name) {
      return NextResponse.json({ error: "分类名称为必填项" }, { status: 400 })
    }

    // 检查分类名称是否已存在
    const existingCategory = await prisma.productCategory.findFirst({
      where: { 
        name: data.name.trim(),
        parentId: data.parentId || null
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: "同级分类名称已存在" }, { status: 400 })
    }

    // 计算层级和路径
    let level = 1
    let path = data.name.trim()
    
    if (data.parentId) {
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: parseInt(data.parentId) }
      })
      
      if (!parentCategory) {
        return NextResponse.json({ error: "父分类不存在" }, { status: 400 })
      }
      
      level = (parentCategory.level || 1) + 1
      path = `${parentCategory.path || parentCategory.name}/${data.name.trim()}`
    }

    // 准备分类数据
    const categoryData = {
      name: data.name.trim(),
      code: data.code?.trim() || null,
      parentId: data.parentId ? parseInt(data.parentId) : null,
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      sortOrder: data.sortOrder || 0,
      level,
      path,
    }

    console.log("🔄 [POST /api/products/categories] 处理后的分类数据:", categoryData)

    try {
      // 创建分类
      const category = await prisma.productCategory.create({
        data: categoryData,
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      })

      // 转换为前端期望的格式
      const formattedCategory = {
        ...category,
        productCount: category._count.products,
      }

      console.log("✅ [POST /api/products/categories] 分类创建成功:", formattedCategory.id)

      return NextResponse.json({
        success: true,
        category: formattedCategory
      })
    } catch (dbError) {
      console.error("🔥 [POST /api/products/categories] 数据库错误:", dbError)
      return NextResponse.json({ 
        error: "数据库操作失败",
        details: dbError instanceof Error ? dbError.message : "未知错误"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("🔥 [POST /api/products/categories] 服务器错误:", error)
    return NextResponse.json({ 
      error: "服务器内部错误",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
