import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

// 获取单个分类
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的分类ID" }, { status: 400 })
    }

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // 计算产品数量
    const categoryWithProductCount = {
      ...category,
      productCount: category._count.products,
      _count: undefined,
    }

    return NextResponse.json(categoryWithProductCount)
  } catch (error) {
    console.error("Error fetching product category:", error)
    return NextResponse.json({ error: "获取产品分类失败" }, { status: 500 })
  }
}

// 删除分类
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的分类ID" }, { status: 400 })
    }

    // 检查分类是否存在
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 })
    }

    // 检查是否有子分类
    if (category._count.children > 0) {
      return NextResponse.json({ 
        error: "无法删除包含子分类的分类",
        details: "请先删除所有子分类"
      }, { status: 400 })
    }

    // 检查是否有关联的产品
    if (category._count.products > 0) {
      return NextResponse.json({ 
        error: "无法删除包含产品的分类",
        details: "请先移除或删除所有关联的产品"
      }, { status: 400 })
    }

    // 删除分类
    await prisma.productCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product category:", error)
    return NextResponse.json({
      error: "删除产品分类失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
