import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * PUT /api/units/[id] - 更新单位
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    const unitId = decodeURIComponent(params.id)
    const body = await request.json()
    const newUnit = body.unit || body.name
    
    console.log(`🔄 [PUT /api/units] 更新单位: ${unitId} -> ${newUnit}`)

    if (!newUnit || typeof newUnit !== 'string' || newUnit.trim() === '') {
      return NextResponse.json({
        error: "Invalid unit",
        details: "单位名称不能为空"
      }, { status: 400 })
    }

    const newUnitName = newUnit.trim()

    // 检查新单位名称是否已存在（除了当前单位）
    if (unitId !== newUnitName) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          unit: newUnitName
        }
      })

      if (existingProduct) {
        return NextResponse.json({
          error: "Unit already exists",
          details: `单位 "${newUnitName}" 已存在`
        }, { status: 409 })
      }
    }

    // 更新所有使用该单位的产品
    const updateResult = await prisma.product.updateMany({
      where: {
        unit: unitId
      },
      data: {
        unit: newUnitName
      }
    })

    const responseTime = Date.now() - startTime
    console.log(`✅ [PUT /api/units] 单位更新成功: ${unitId} -> ${newUnitName}，影响 ${updateResult.count} 个产品 (${responseTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `单位更新成功`,
      updatedCount: updateResult.count,
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [PUT /api/units] 更新单位失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to update unit",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/units/[id] - 删除单位
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    const unitId = decodeURIComponent(params.id)
    console.log(`🔄 [DELETE /api/units] 删除单位: ${unitId}`)

    // 检查是否有正常产品在使用该单位
    const productsUsingUnit = await prisma.product.count({
      where: {
        unit: unitId,
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    })

    if (productsUsingUnit > 0) {
      return NextResponse.json({
        error: "Unit in use",
        details: `无法删除单位 "${unitId}"，还有 ${productsUsingUnit} 个产品在使用`,
        conflicts: {
          products: productsUsingUnit
        }
      }, { status: 409 })
    }

    // 删除单位占位符产品
    const deleteResult = await prisma.product.deleteMany({
      where: {
        unit: unitId,
        type: "unit_placeholder"
      }
    })

    const responseTime = Date.now() - startTime
    console.log(`✅ [DELETE /api/units] 单位删除成功: ${unitId} (${responseTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `单位 "${unitId}" 删除成功`,
      deletedCount: deleteResult.count,
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [DELETE /api/units] 删除单位失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to delete unit",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
