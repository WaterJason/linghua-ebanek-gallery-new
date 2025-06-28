import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { checkUserPermission } from "@/lib/services/purchase-permissions"
import prisma from "@/lib/db"
import { inferProductAttributes, ProductInferenceResult } from "@/lib/services/smart-product-inference"

// 产品匹配请求类型
interface ProductMatchRequest {
  productName: string
  row: number
  price?: number
  quantity?: number
}

// 产品匹配结果类型
interface ProductMatchResult {
  row: number
  productName: string
  matches: Array<{
    id: number
    name: string
    similarity: number
    material?: string
    unit?: string
    price?: number
  }>
  selectedProductId?: number
  smartInference?: ProductInferenceResult // 智能推断结果
}

// 手动关联请求类型
interface ManualAssociationRequest {
  associations: Array<{
    row: number
    productName: string
    productId: number
  }>
}

// 计算字符串相似度
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

// Levenshtein距离算法
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// 智能产品匹配
async function findProductMatches(productName: string): Promise<Array<{
  id: number
  name: string
  similarity: number
  material?: string
  unit?: string
  price?: number
}>> {
  console.log(`🔍 搜索产品匹配: ${productName}`)

  // 1. 精确匹配
  const exactMatch = await prisma.product.findFirst({
    where: {
      name: {
        equals: productName,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      name: true,
      material: true,
      unit: true,
      price: true
    }
  })

  if (exactMatch) {
    return [{
      ...exactMatch,
      similarity: 1.0
    }]
  }

  // 2. 模糊匹配
  const fuzzyMatches = await prisma.product.findMany({
    where: {
      name: {
        contains: productName,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      name: true,
      material: true,
      unit: true,
      price: true
    },
    take: 10
  })

  // 3. 关键词匹配
  const keywords = productName.split(/\s+/).filter(word => word.length > 1)
  const keywordMatches = await prisma.product.findMany({
    where: {
      OR: keywords.map(keyword => ({
        name: {
          contains: keyword,
          mode: "insensitive"
        }
      }))
    },
    select: {
      id: true,
      name: true,
      material: true,
      unit: true,
      price: true
    },
    take: 10
  })

  // 合并结果并去重
  const allMatches = [...fuzzyMatches, ...keywordMatches]
  const uniqueMatches = allMatches.filter((match, index, self) => 
    index === self.findIndex(m => m.id === match.id)
  )

  // 计算相似度并排序
  const matchesWithSimilarity = uniqueMatches.map(match => ({
    ...match,
    similarity: calculateSimilarity(productName, match.name)
  }))

  // 按相似度排序，只返回相似度 > 0.3 的结果
  return matchesWithSimilarity
    .filter(match => match.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5) // 最多返回5个匹配结果
}

/**
 * POST /api/purchase-orders/import/match-products - 批量产品匹配
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 产品匹配API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const permissionCheck = await checkUserPermission(session.user.id, "purchase_create")
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: "权限不足",
        details: permissionCheck.reason || "您没有采购订单创建权限"
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { products } = body as { products: ProductMatchRequest[] }
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "无效的请求数据" }, { status: 400 })
    }
    
    console.log(`📊 开始匹配 ${products.length} 个产品`)
    
    const results: ProductMatchResult[] = []
    
    for (const product of products) {
      try {
        const matches = await findProductMatches(product.productName)

        // 如果没有找到匹配的产品，进行智能推断
        let smartInference: ProductInferenceResult | undefined
        if (matches.length === 0 || (matches.length > 0 && matches[0].similarity < 0.8)) {
          try {
            smartInference = await inferProductAttributes(
              product.productName,
              product.price,
              product.quantity
            )
            console.log(`🧠 智能推断产品属性: ${product.productName}`, smartInference)
          } catch (inferenceError) {
            console.warn(`⚠️ 智能推断失败: ${product.productName}`, inferenceError)
          }
        }

        results.push({
          row: product.row,
          productName: product.productName,
          matches,
          selectedProductId: matches.length > 0 && matches[0].similarity > 0.8
            ? matches[0].id
            : undefined,
          smartInference
        })
      } catch (error) {
        console.error(`❌ 产品匹配失败: ${product.productName}`, error)
        results.push({
          row: product.row,
          productName: product.productName,
          matches: []
        })
      }
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 产品匹配完成，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: results,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 产品匹配失败:", error)
    
    return NextResponse.json({
      error: "产品匹配失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

/**
 * PUT /api/purchase-orders/import/match-products - 手动关联产品
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🔗 手动产品关联API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const permissionCheck = await checkUserPermission(session.user.id, "purchase_create")
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: "权限不足",
        details: permissionCheck.reason || "您没有采购订单创建权限"
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { associations } = body as ManualAssociationRequest
    
    if (!associations || !Array.isArray(associations)) {
      return NextResponse.json({ error: "无效的关联数据" }, { status: 400 })
    }
    
    console.log(`🔗 处理 ${associations.length} 个手动关联`)
    
    // 验证产品ID是否存在
    const productIds = associations.map(a => a.productId)
    const existingProducts = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })
    
    const existingProductIds = new Set(existingProducts.map(p => p.id))
    const validAssociations = associations.filter(a => existingProductIds.has(a.productId))
    const invalidAssociations = associations.filter(a => !existingProductIds.has(a.productId))
    
    if (invalidAssociations.length > 0) {
      console.warn("⚠️ 发现无效的产品关联:", invalidAssociations)
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 手动产品关联完成，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: {
        validAssociations,
        invalidAssociations,
        processedCount: validAssociations.length
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 手动产品关联失败:", error)
    
    return NextResponse.json({
      error: "手动产品关联失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
