import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/products/materials - 获取产品材质列表
 * 从产品表中提取所有使用过的材质，缓存30分钟
 */
export async function GET(request: Request) {
  try {
    console.log("🔄 [GET /api/products/materials] 获取产品材质列表...")

    // 从产品表中获取所有不为空的材质（包括占位符）
    const materials = await prisma.product.findMany({
      where: {
        material: {
          not: null
        }
      },
      select: {
        material: true
      },
      distinct: ['material']
    })

    // 提取材质名称并去重
    const materialList = materials
      .map(item => item.material)
      .filter(material => material && material.trim() !== '')
      .sort()

    // 获取每个材质的使用次数
    const materialsWithCount = await Promise.all(
      materialList.map(async (material) => {
        const count = await prisma.product.count({
          where: {
            material,
            type: {
              notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
            }
          }
        })
        return {
          name: material,
          count,
          id: material // 使用材质名称作为ID
        }
      })
    )

    console.log(`✅ [GET /api/products/materials] 获取成功: ${materialsWithCount.length} 个材质`)

    return NextResponse.json({
      materials: materialsWithCount,
      total: materialsWithCount.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=1800', // 缓存30分钟
      }
    })
  } catch (error) {
    console.error("❌ [GET /api/products/materials] 错误:", error)
    return NextResponse.json({
      error: "Failed to fetch materials",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * POST /api/products/materials - 添加新产品材质
 * 通过创建占位产品的方式添加材质
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const material = body.material || body.name // 支持两种参数名
    console.log(`🔄 [POST /api/products/materials] 添加材质: ${material}`)

    if (!material || typeof material !== 'string' || material.trim() === '') {
      return NextResponse.json({
        error: "Invalid material",
        details: "材质名称不能为空"
      }, { status: 400 })
    }

    const materialName = material.trim()

    // 检查材质是否已存在
    const existingProduct = await prisma.product.findFirst({
      where: {
        material: materialName
      }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: "Material already exists",
        details: `材质 "${materialName}" 已存在`
      }, { status: 409 })
    }

    // 创建占位产品来添加材质
    const placeholder = await prisma.product.create({
      data: {
        name: `材质占位符_${materialName}`,
        price: 0,
        commissionRate: 0, // 添加必需的佣金率字段
        type: "material_placeholder",
        material: materialName,
        unit: "套", // 添加默认单位
        description: `材质 ${materialName} 的占位符产品`
      }
    })

    const responseTime = Date.now() - startTime
    console.log(`✅ [POST /api/products/materials] 材质添加成功: ${materialName} (${responseTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `材质 "${materialName}" 添加成功`,
      material: {
        name: materialName,
        count: 0,
        id: materialName
      },
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [POST /api/products/materials] 添加材质失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to add material",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/materials - 删除产品材质
 * 检查是否有产品在使用该材质
 */
export async function DELETE(request: Request) {
  try {
    const { material } = await request.json()
    console.log(`🔄 [DELETE /api/products/materials] 删除材质: ${material}`)

    if (!material || typeof material !== 'string' || material.trim() === '') {
      return NextResponse.json({
        error: "Invalid material",
        details: "材质名称不能为空"
      }, { status: 400 })
    }

    const materialName = material.trim()

    // 检查是否有正常产品在使用该材质
    const productsUsingMaterial = await prisma.product.count({
      where: {
        material: materialName,
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    })

    if (productsUsingMaterial > 0) {
      return NextResponse.json({
        error: "Material in use",
        details: `无法删除材质 "${materialName}"，还有 ${productsUsingMaterial} 个产品在使用`,
        conflicts: {
          products: productsUsingMaterial
        }
      }, { status: 409 })
    }

    // 删除材质占位符产品
    const deleteResult = await prisma.product.deleteMany({
      where: {
        material: materialName,
        type: "material_placeholder"
      }
    })

    console.log(`✅ [DELETE /api/products/materials] 材质删除成功: ${materialName}`)

    return NextResponse.json({
      success: true,
      message: `材质 "${materialName}" 删除成功`,
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
