import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/units - 获取单位列表
 * 重定向到 /api/products/units 以保持一致性
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    console.log("🔄 [GET /api/units] 重定向到 /api/products/units")
    
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

    const responseTime = Date.now() - startTime
    console.log(`✅ [GET /api/units] 获取成功: ${unitsWithCount.length} 个单位 (${responseTime}ms)`)

    return NextResponse.json({
      units: unitsWithCount,
      total: unitsWithCount.length
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [GET /api/units] 错误 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to fetch units",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * POST /api/units - 添加新单位
 * 重定向到 /api/products/units 以保持一致性
 */
export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const unit = body.unit || body.name // 支持两种参数名
    console.log(`🔄 [POST /api/units] 添加单位: ${unit}`)

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
        type: "unit_placeholder",
        unit: unitName,
        description: `单位 ${unitName} 的占位符产品`
      }
    })

    const responseTime = Date.now() - startTime
    console.log(`✅ [POST /api/units] 单位添加成功: ${unitName} (${responseTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `单位 "${unitName}" 添加成功`,
      unit: {
        name: unitName,
        count: 0,
        id: unitName
      },
      responseTime
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [POST /api/units] 添加单位失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to add unit",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
