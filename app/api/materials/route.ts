import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/materials - 获取材质列表
 * 重定向到 /api/products/materials 以保持一致性
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    console.log("🔄 [GET /api/materials] 重定向到 /api/products/materials")
    
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

    const responseTime = Date.now() - startTime
    console.log(`✅ [GET /api/materials] 获取成功: ${materialsWithCount.length} 个材质 (${responseTime}ms)`)

    return NextResponse.json({
      materials: materialsWithCount,
      total: materialsWithCount.length
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ [GET /api/materials] 错误 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to fetch materials",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

/**
 * POST /api/materials - 添加新材质
 * 重定向到 /api/products/materials 以保持一致性
 */
export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const material = body.material || body.name // 支持两种参数名
    console.log(`🔄 [POST /api/materials] 添加材质: ${material}`)

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
        type: "material_placeholder",
        material: materialName,
        description: `材质 ${materialName} 的占位符产品`
      }
    })

    const responseTime = Date.now() - startTime
    console.log(`✅ [POST /api/materials] 材质添加成功: ${materialName} (${responseTime}ms)`)

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
    console.error(`❌ [POST /api/materials] 添加材质失败 (${responseTime}ms):`, error)
    return NextResponse.json({
      error: "Failed to add material",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
