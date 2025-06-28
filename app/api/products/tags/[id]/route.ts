import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * PUT /api/products/tags/[id] - 更新标签
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = parseInt(params.id)
    const data = await request.json()
    
    console.log(`🔄 [PUT /api/products/tags] 更新标签: ${tagId}`, data)

    // 验证标签ID
    if (isNaN(tagId)) {
      return NextResponse.json({ error: "无效的标签ID" }, { status: 400 })
    }

    // 验证必填字段
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 })
    }

    const tagName = data.name.trim()

    // 检查标签是否存在
    const existingTag = await prisma.productTag.findUnique({
      where: { id: tagId }
    })

    if (!existingTag) {
      return NextResponse.json({ error: "标签不存在" }, { status: 404 })
    }

    // 检查标签名称是否已被其他标签使用
    if (existingTag.name !== tagName) {
      const duplicateTag = await prisma.productTag.findFirst({
        where: { 
          name: tagName,
          id: { not: tagId }
        }
      })

      if (duplicateTag) {
        return NextResponse.json({ error: "标签名称已存在" }, { status: 400 })
      }
    }

    // 更新标签
    const updatedTag = await prisma.productTag.update({
      where: { id: tagId },
      data: {
        name: tagName,
        color: data.color || existingTag.color,
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
      ...updatedTag,
      productCount: updatedTag.products.length,
    }

    console.log("✅ [PUT /api/products/tags] 标签更新成功:", tagId)

    return NextResponse.json({
      success: true,
      tag: formattedTag,
      message: `标签 "${tagName}" 更新成功`
    })
  } catch (error) {
    console.error("Error updating product tag:", error)
    return NextResponse.json({ 
      error: "更新标签失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/tags/[id] - 删除标签
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = parseInt(params.id)
    console.log(`🔄 [DELETE /api/products/tags] 删除标签: ${tagId}`)

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "无效的标签ID" }, { status: 400 })
    }

    // 检查标签是否存在
    const existingTag = await prisma.productTag.findUnique({
      where: { id: tagId },
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
      where: { id: tagId }
    })

    console.log("✅ [DELETE /api/products/tags] 标签删除成功:", tagId)

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
