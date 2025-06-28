import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * PUT /api/materials/[id] - 更新材质
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    const materialId = decodeURIComponent(params.id)
    const body = await request.json()
    const newMaterial = body.material || body.name
    
    console.log(`🔄 [PUT /api/materials] 更新材质: ${materialId} -> ${newMaterial}`)

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

    const responseTime = Date.now() - startTime
    console.log(`✅ [PUT /api/materials] 材质更新成功: ${materialId} -> ${newMaterialName}，影响 ${updateResult.count} 个产品 (${responseTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `材质更新成功`,
      updatedCount: updateResult.count,
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [PUT /api/materials] 更新材质失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to update material",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/materials/[id] - 删除材质
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    const materialId = decodeURIComponent(params.id)
    console.log(`🔄 [DELETE /api/materials] 删除材质: ${materialId}`)

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

    const responseTime = Date.now() - startTime
    console.log(`✅ [DELETE /api/materials] 材质删除成功: ${materialId} (${responseTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `材质 "${materialId}" 删除成功`,
      deletedCount: deleteResult.count,
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [DELETE /api/materials] 删除材质失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to delete material",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
