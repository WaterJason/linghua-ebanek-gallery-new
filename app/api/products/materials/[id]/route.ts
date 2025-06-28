import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * PUT /api/products/materials/[id] - 更新材质
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = decodeURIComponent(params.id)
    const body = await request.json()
    const newMaterial = body.material || body.name
    
    console.log(`🔄 [PUT /api/products/materials] 更新材质: ${materialId} -> ${newMaterial}`)

    if (!newMaterial || typeof newMaterial !== 'string' || newMaterial.trim() === '') {
      return NextResponse.json({
        error: "Invalid material",
        details: "材质名称不能为空"
      }, { status: 400 })
    }

    const newMaterialName = newMaterial.trim()

    // 检查新材质名称是否已存在（除了当前材质）
    if (materialId !== newMaterialName) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          material: newMaterialName
        }
      })

      if (existingProduct) {
        return NextResponse.json({
          error: "Material already exists",
          details: `材质 "${newMaterialName}" 已存在`
        }, { status: 409 })
      }
    }

    // 更新所有使用该材质的产品
    const updateResult = await prisma.product.updateMany({
      where: {
        material: materialId
      },
      data: {
        material: newMaterialName
      }
    })

    console.log(`✅ [PUT /api/products/materials] 材质更新成功: ${materialId} -> ${newMaterialName}，影响 ${updateResult.count} 个产品`)

    return NextResponse.json({
      success: true,
      message: `材质更新成功`,
      updatedCount: updateResult.count
    })
  } catch (error) {
    console.error("❌ [PUT /api/products/materials] 更新材质失败:", error)
    return NextResponse.json({
      error: "Failed to update material",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/materials/[id] - 删除材质
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const materialId = decodeURIComponent(id)
    console.log(`🔄 [DELETE /api/products/materials] 删除材质: ${materialId}`)

    // 检查是否有正常产品在使用该材质
    const productsUsingMaterial = await prisma.product.count({
      where: {
        material: materialId,
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    })

    if (productsUsingMaterial > 0) {
      return NextResponse.json({
        error: "Material in use",
        details: `无法删除材质 "${materialId}"，还有 ${productsUsingMaterial} 个产品在使用`,
        conflicts: {
          products: productsUsingMaterial
        }
      }, { status: 409 })
    }

    // 删除材质占位符产品
    const deleteResult = await prisma.product.deleteMany({
      where: {
        material: materialId,
        type: "material_placeholder"
      }
    })

    console.log(`✅ [DELETE /api/products/materials] 材质删除成功: ${materialId}`)

    return NextResponse.json({
      success: true,
      message: `材质 "${materialId}" 删除成功`,
      deletedCount: deleteResult.count
    })
  } catch (error) {
    console.error("❌ [DELETE /api/products/materials] 删除材质失败:", error)
    return NextResponse.json({
      error: "Failed to delete material",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
