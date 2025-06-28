import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "无效的分类ID" }, { status: 400 })
    }

    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
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

    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 })
    }

    // 转换为前端期望的格式
    const formattedCategory = {
      ...category,
      productCount: category._count.products,
    }

    return NextResponse.json({
      success: true,
      category: formattedCategory
    })
  } catch (error) {
    console.error("Error fetching product category:", error)
    return NextResponse.json({ error: "Failed to fetch product category" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "无效的分类ID" }, { status: 400 })
    }

    const data = await request.json()
    console.log("🔄 [PUT /api/products/categories] 更新分类数据:", data)

    // 验证必填字段
    if (!data.name) {
      return NextResponse.json({ error: "分类名称为必填项" }, { status: 400 })
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 })
    }

    // 检查分类名称是否已存在（排除当前分类）
    const duplicateCategory = await prisma.productCategory.findFirst({
      where: { 
        name: data.name.trim(),
        parentId: data.parentId || null,
        id: { not: categoryId }
      }
    })

    if (duplicateCategory) {
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
      
      // 防止循环引用
      if (parentCategory.id === categoryId) {
        return NextResponse.json({ error: "不能将分类设置为自己的父分类" }, { status: 400 })
      }
      
      level = (parentCategory.level || 1) + 1
      path = `${parentCategory.path || parentCategory.name}/${data.name.trim()}`
    }

    // 更新分类
    const category = await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        parentId: data.parentId ? parseInt(data.parentId) : null,
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
        level,
        path,
      },
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

    console.log("✅ [PUT /api/products/categories] 分类更新成功:", categoryId)

    return NextResponse.json({
      success: true,
      category: formattedCategory
    })
  } catch (error) {
    console.error("Error updating product category:", error)
    return NextResponse.json({ error: "Failed to update product category" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "无效的分类ID" }, { status: 400 })
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 })
    }

    // 检查是否有子分类
    if (existingCategory.children && existingCategory.children.length > 0) {
      const childNames = existingCategory.children.slice(0, 3).map(child => child.name).join(', ')
      const moreChildren = existingCategory.children.length > 3 ? ` 等${existingCategory.children.length}个子分类` : ''
      return NextResponse.json({
        error: "该分类下有子分类，无法删除",
        details: `请先删除或移动以下子分类：${childNames}${moreChildren}`,
        conflicts: {
          children: existingCategory.children.length,
          childNames: existingCategory.children.map(child => child.name)
        }
      }, { status: 400 })
    }

    // 检查是否有关联的产品
    if (existingCategory._count.products > 0) {
      return NextResponse.json({
        error: "该分类下有产品，无法删除",
        details: `该分类下有 ${existingCategory._count.products} 个产品，请先移动或删除这些产品`,
        conflicts: {
          products: existingCategory._count.products
        }
      }, { status: 400 })
    }

    // 删除分类
    await prisma.productCategory.delete({
      where: { id: categoryId }
    })

    console.log("✅ [DELETE /api/products/categories] 分类删除成功:", categoryId)

    return NextResponse.json({
      success: true,
      message: "分类删除成功"
    })
  } catch (error) {
    console.error("Error deleting product category:", error)
    return NextResponse.json({ error: "Failed to delete product category" }, { status: 500 })
  }
}
