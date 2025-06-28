import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/products/units - 获取产品单位列表
 * 从产品表中提取所有使用过的单位，缓存30分钟
 */
export async function GET(request: Request) {
  try {
    console.log("🔄 [GET /api/products/units] 获取产品单位列表...")

    // 从产品表中获取所有不为空的单位（包括占位符）
    const units = await prisma.product.findMany({
      where: {
        unit: {
          not: null
        }
      },
      select: {
        unit: true
      },
      distinct: ['unit']
    })

    // 提取单位名称并去重
    const unitList = units
      .map(item => item.unit)
      .filter(unit => unit && unit.trim() !== '')
      .sort()

    // 获取每个单位的使用次数
    const unitsWithCount = await Promise.all(
      unitList.map(async (unit) => {
        const count = await prisma.product.count({
          where: {
            unit,
            type: {
              notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
            }
          }
        })
        return {
          name: unit,
          count,
          id: unit // 使用单位名称作为ID
        }
      })
    )

    console.log(`✅ [GET /api/products/units] 获取成功: ${unitsWithCount.length} 个单位`)

    return NextResponse.json({
      units: unitsWithCount,
      total: unitsWithCount.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=1800', // 缓存30分钟
      }
    })
  } catch (error) {
    console.error("❌ [GET /api/products/units] 错误:", error)
    return NextResponse.json({
      error: "Failed to fetch units",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * POST /api/products/units - 添加新产品单位
 * 通过创建占位产品的方式添加单位
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const unit = body.unit || body.name // 支持两种参数名
    console.log(`🔄 [POST /api/products/units] 添加单位: ${unit}`)

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return NextResponse.json({
        error: "Invalid unit",
        details: "单位名称不能为空"
      }, { status: 400 })
    }

    const unitName = unit.trim()

    // 检查单位是否已存在
    const existingProduct = await prisma.product.findFirst({
      where: {
        unit: unitName
      }
    })

    if (existingProduct) {
      return NextResponse.json({
        error: "Unit already exists",
        details: `单位 "${unitName}" 已存在`
      }, { status: 409 })
    }

    // 创建占位产品来添加单位
    const placeholder = await prisma.product.create({
      data: {
        name: `单位占位符_${unitName}`,
        price: 0,
        commissionRate: 0, // 添加必需的佣金率字段
        type: "unit_placeholder",
        material: "珐琅", // 添加默认材质
        unit: unitName,
        description: `单位 ${unitName} 的占位符产品`
      }
    })

    console.log(`✅ [POST /api/products/units] 单位添加成功: ${unitName}`)

    return NextResponse.json({
      success: true,
      message: `单位 "${unitName}" 添加成功`,
      unit: {
        name: unitName,
        count: 0,
        id: unitName
      }
    })
  } catch (error) {
    console.error("❌ [POST /api/products/units] 添加单位失败:", error)
    return NextResponse.json({
      error: "Failed to add unit",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/units - 删除产品单位
 * 检查是否有产品在使用该单位
 */
export async function DELETE(request: Request) {
  try {
    const { unit } = await request.json()
    console.log(`🔄 [DELETE /api/products/units] 删除单位: ${unit}`)

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return NextResponse.json({
        error: "Invalid unit",
        details: "单位名称不能为空"
      }, { status: 400 })
    }

    const unitName = unit.trim()

    // 检查是否有正常产品在使用该单位
    const productsUsingUnit = await prisma.product.count({
      where: {
        unit: unitName,
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    })

    if (productsUsingUnit > 0) {
      return NextResponse.json({
        error: "Unit in use",
        details: `无法删除单位 "${unitName}"，还有 ${productsUsingUnit} 个产品在使用`,
        conflicts: {
          products: productsUsingUnit
        }
      }, { status: 409 })
    }

    // 删除单位占位符产品
    const deleteResult = await prisma.product.deleteMany({
      where: {
        unit: unitName,
        type: "unit_placeholder"
      }
    })

    console.log(`✅ [DELETE /api/products/units] 单位删除成功: ${unitName}`)

    return NextResponse.json({
      success: true,
      message: `单位 "${unitName}" 删除成功`,
      deletedCount: deleteResult.count
    })
  } catch (error) {
    console.error("❌ [DELETE /api/products/units] 删除单位失败:", error)
    return NextResponse.json({
      error: "Failed to delete unit",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
