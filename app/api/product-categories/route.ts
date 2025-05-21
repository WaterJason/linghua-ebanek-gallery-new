import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"

// 获取所有产品分类
export async function GET() {
  try {
    // 获取所有分类
    const categories = await prisma.productCategory.findMany({
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
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    // 计算每个分类的产品数量
    const categoriesWithProductCount = categories.map(category => ({
      ...category,
      productCount: category._count.products,
      _count: undefined,
    }))

    return NextResponse.json(categoriesWithProductCount)
  } catch (error) {
    console.error("Error fetching product categories:", error)
    return NextResponse.json({ error: "获取产品分类失败" }, { status: 500 })
  }
}

// 添加新分类
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 解析请求数据
    const data = await request.json()
    console.log("Creating category with data:", data)

    // 验证必填字段
    if (!data.name || data.name.trim() === "") {
      return NextResponse.json({
        error: "分类名称不能为空",
      }, { status: 400 })
    }

    // 规范化分类名称
    const categoryName = data.name.trim()

    // 检查分类是否已存在
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        name: categoryName,
        parentId: data.parentId || null,
      },
    })

    if (existingCategory) {
      return NextResponse.json({
        error: "同一父分类下已存在相同名称的分类",
      }, { status: 400 })
    }

    // 处理父分类
    let path = ""
    let level = 1

    if (data.parentId) {
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: data.parentId },
      })

      if (!parentCategory) {
        return NextResponse.json({
          error: "父分类不存在",
        }, { status: 400 })
      }

      level = (parentCategory.level || 1) + 1
      path = parentCategory.path
        ? `${parentCategory.path},${parentCategory.id}`
        : `${parentCategory.id}`
    }

    // 创建新分类
    const newCategory = await prisma.productCategory.create({
      data: {
        name: categoryName,
        code: data.code || null,
        parentId: data.parentId || null,
        level,
        path,
        description: data.description || "",
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder || 0,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(newCategory)
  } catch (error) {
    console.error("Error creating product category:", error)
    return NextResponse.json({
      error: "创建产品分类失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

// 更新分类
export async function PUT(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 解析请求数据
    const data = await request.json()
    console.log("Updating category with data:", data)

    // 验证必填字段
    if (!data.id || !data.name || data.name.trim() === "") {
      return NextResponse.json({
        error: "分类ID和名称不能为空",
      }, { status: 400 })
    }

    // 规范化分类名称
    const categoryName = data.name.trim()

    // 查找要更新的分类
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: data.id },
    })

    if (!existingCategory) {
      return NextResponse.json({
        error: "分类不存在",
      }, { status: 404 })
    }

    // 检查新名称是否与其他分类冲突（同一父分类下）
    if (categoryName !== existingCategory.name) {
      const conflictCategory = await prisma.productCategory.findFirst({
        where: {
          name: categoryName,
          parentId: data.parentId || null,
          id: { not: data.id },
        },
      })

      if (conflictCategory) {
        return NextResponse.json({
          error: "同一父分类下已存在相同名称的分类",
        }, { status: 400 })
      }
    }

    // 处理父分类变更
    let path = existingCategory.path
    let level = existingCategory.level

    // 如果父分类发生变化
    if (data.parentId !== existingCategory.parentId) {
      // 检查是否将分类设为自己的子分类（循环引用）
      if (data.parentId === data.id) {
        return NextResponse.json({
          error: "不能将分类设为自己的子分类",
        }, { status: 400 })
      }

      // 检查是否将分类设为自己的后代分类（循环引用）
      if (data.parentId && existingCategory.path) {
        const ancestorIds = existingCategory.path.split(',').map(id => parseInt(id))
        if (ancestorIds.includes(data.id)) {
          return NextResponse.json({
            error: "不能将分类设为自己的后代分类",
          }, { status: 400 })
        }
      }

      // 重新计算level和path
      if (data.parentId) {
        const parentCategory = await prisma.productCategory.findUnique({
          where: { id: data.parentId },
        })

        if (!parentCategory) {
          return NextResponse.json({
            error: "父分类不存在",
          }, { status: 400 })
        }

        level = (parentCategory.level || 1) + 1
        path = parentCategory.path
          ? `${parentCategory.path},${parentCategory.id}`
          : `${parentCategory.id}`
      } else {
        // 如果移动到顶级分类
        level = 1
        path = ""
      }
    }

    // 更新分类
    const updatedCategory = await prisma.productCategory.update({
      where: { id: data.id },
      data: {
        name: categoryName,
        code: data.code !== undefined ? data.code : existingCategory.code,
        parentId: data.parentId !== undefined ? data.parentId : existingCategory.parentId,
        level,
        path,
        description: data.description !== undefined ? data.description : existingCategory.description,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existingCategory.imageUrl,
        isActive: data.isActive !== undefined ? data.isActive : existingCategory.isActive,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existingCategory.sortOrder,
      },
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

    // 如果父分类发生变化，需要更新所有子分类的level和path
    if (data.parentId !== existingCategory.parentId) {
      // 递归更新所有子分类
      await updateChildrenLevelAndPath(data.id, level, path)
    }

    // 计算产品数量
    const categoryWithProductCount = {
      ...updatedCategory,
      productCount: updatedCategory._count.products,
      _count: undefined,
    }

    return NextResponse.json(categoryWithProductCount)
  } catch (error) {
    console.error("Error updating product category:", error)
    return NextResponse.json({
      error: "更新产品分类失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

// 递归更新子分类的level和path
async function updateChildrenLevelAndPath(parentId: number, parentLevel: number, parentPath: string) {
  // 查找所有直接子分类
  const children = await prisma.productCategory.findMany({
    where: { parentId },
  })

  for (const child of children) {
    // 计算新的level和path
    const newLevel = parentLevel + 1
    const newPath = parentPath ? `${parentPath},${parentId}` : `${parentId}`

    // 更新子分类
    await prisma.productCategory.update({
      where: { id: child.id },
      data: {
        level: newLevel,
        path: newPath,
      },
    })

    // 递归更新子分类的子分类
    await updateChildrenLevelAndPath(child.id, newLevel, newPath)
  }
}
