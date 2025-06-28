import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/products/tags - 获取产品标签列表
 */
export async function GET() {
  try {
    console.log("🔄 [GET /api/products/tags] 获取产品标签列表...")

    const tags = await prisma.productTag.findMany({
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // 转换为前端期望的格式
    const formattedTags = tags.map(tag => ({
      ...tag,
      productCount: tag.products.length,
    }))

    console.log(`✅ [GET /api/products/tags] 获取成功: ${formattedTags.length} 个标签`)

    return NextResponse.json({
      tags: formattedTags,
      total: formattedTags.length
    })
  } catch (error) {
    console.error("Error fetching product tags:", error)
    return NextResponse.json({ error: "Failed to fetch product tags" }, { status: 500 })
  }
}

/**
 * POST /api/products/tags - 创建新标签
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("🔄 [POST /api/products/tags] 创建标签:", data)

    // 验证必填字段
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 })
    }

    const tagName = data.name.trim()

    // 检查标签是否已存在
    const existingTag = await prisma.productTag.findFirst({
      where: { name: tagName }
    })

    if (existingTag) {
      return NextResponse.json({ error: "标签名称已存在" }, { status: 400 })
    }

    // 创建标签
    const tag = await prisma.productTag.create({
      data: {
        name: tagName,
        color: data.color || "#3b82f6",
        description: data.description || null,
      },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    })

    const formattedTag = {
      ...tag,
      productCount: tag.products.length,
    }

    console.log("✅ [POST /api/products/tags] 标签创建成功:", formattedTag.id)

    return NextResponse.json({
      success: true,
      tag: formattedTag,
      message: `标签 "${tagName}" 创建成功`
    })
  } catch (error) {
    console.error("Error creating product tag:", error)
    return NextResponse.json({ 
      error: "创建标签失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/tags - 删除标签
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    if (!tagId || isNaN(parseInt(tagId))) {
      return NextResponse.json({ error: "无效的标签ID" }, { status: 400 })
    }

    const id = parseInt(tagId)
    console.log(`🔄 [DELETE /api/products/tags] 删除标签: ${id}`)

    // 检查标签是否存在
    const existingTag = await prisma.productTag.findUnique({
      where: { id },
      include: {
        products: true,
      },
    })

    if (!existingTag) {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 })
    }

    // 检查标签是否有产品使用
    if (existingTag.products.length > 0) {
      return NextResponse.json({ 
        error: "无法删除标签：存在关联产品",
        details: `该标签被 ${existingTag.products.length} 个产品使用`
      }, { status: 400 })
    }

    // 删除标签
    await prisma.productTag.delete({
      where: { id }
    })

    console.log("✅ [DELETE /api/products/tags] 标签删除成功:", id)

    return NextResponse.json({
      success: true,
      message: "标签删除成功"
    })
  } catch (error) {
    console.error("Error deleting product tag:", error)
    return NextResponse.json({ 
      error: "删除标签失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
