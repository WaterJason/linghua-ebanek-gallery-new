/**
 * 智能产品属性推断服务
 * 基于产品名称、价格等信息智能推断产品属性
 */

import prisma from "@/lib/db"

// 产品推断结果接口
export interface ProductInferenceResult {
  name: string
  material: string
  unit: string
  category?: string
  description?: string
  estimatedPrice?: number
  confidence: number // 0-1之间的置信度
  inferenceReasons: string[] // 推断依据
}

// 材质推断规则
const MATERIAL_INFERENCE_RULES = [
  { keywords: ['珐琅', '景泰蓝'], material: '珐琅', confidence: 0.9 },
  { keywords: ['陶瓷', '瓷器', '瓷'], material: '陶瓷', confidence: 0.8 },
  { keywords: ['玻璃', '水晶'], material: '玻璃', confidence: 0.8 },
  { keywords: ['金属', '铜', '银', '金'], material: '金属', confidence: 0.7 },
  { keywords: ['木', '竹'], material: '木材', confidence: 0.7 },
  { keywords: ['布', '丝绸', '棉'], material: '纺织品', confidence: 0.6 },
]

// 单位推断规则
const UNIT_INFERENCE_RULES = [
  { keywords: ['套装', '套', '组合'], unit: '套', confidence: 0.9 },
  { keywords: ['个', '只', '件'], unit: '个', confidence: 0.8 },
  { keywords: ['对', '双'], unit: '对', confidence: 0.9 },
  { keywords: ['盒', '箱'], unit: '盒', confidence: 0.8 },
]

// 类别推断规则（基于价格范围）
const CATEGORY_PRICE_RULES = [
  { minPrice: 0, maxPrice: 50, category: '日用品', confidence: 0.6 },
  { minPrice: 50, maxPrice: 200, category: '装饰品', confidence: 0.7 },
  { minPrice: 200, maxPrice: 500, category: '工艺品', confidence: 0.8 },
  { minPrice: 500, maxPrice: Infinity, category: '收藏品', confidence: 0.9 },
]

/**
 * 智能推断产品属性
 */
export async function inferProductAttributes(
  productName: string,
  price?: number,
  quantity?: number
): Promise<ProductInferenceResult> {
  const inferenceReasons: string[] = []
  let totalConfidence = 0
  let confidenceCount = 0

  // 1. 推断材质
  const material = inferMaterial(productName, inferenceReasons)
  if (material.confidence > 0) {
    totalConfidence += material.confidence
    confidenceCount++
  }

  // 2. 推断单位
  const unit = inferUnit(productName, inferenceReasons)
  if (unit.confidence > 0) {
    totalConfidence += unit.confidence
    confidenceCount++
  }

  // 3. 推断类别（基于价格）
  const category = price ? inferCategory(price, inferenceReasons) : null

  // 4. 生成描述
  const description = generateDescription(productName, material.value, unit.value, price)

  // 5. 价格合理性检查
  const estimatedPrice = price || estimatePriceByName(productName)

  // 计算总体置信度
  const overallConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.3

  return {
    name: productName.trim(),
    material: material.value,
    unit: unit.value,
    category: category?.value,
    description,
    estimatedPrice,
    confidence: overallConfidence,
    inferenceReasons
  }
}

/**
 * 推断材质
 */
function inferMaterial(productName: string, reasons: string[]): { value: string, confidence: number } {
  const lowerName = productName.toLowerCase()
  
  for (const rule of MATERIAL_INFERENCE_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        reasons.push(`基于关键词"${keyword}"推断材质为${rule.material}`)
        return { value: rule.material, confidence: rule.confidence }
      }
    }
  }
  
  // 默认材质（基于系统设置）
  reasons.push('未找到明确材质关键词，使用默认材质')
  return { value: '珐琅', confidence: 0.3 }
}

/**
 * 推断单位
 */
function inferUnit(productName: string, reasons: string[]): { value: string, confidence: number } {
  const lowerName = productName.toLowerCase()
  
  for (const rule of UNIT_INFERENCE_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        reasons.push(`基于关键词"${keyword}"推断单位为${rule.unit}`)
        return { value: rule.unit, confidence: rule.confidence }
      }
    }
  }
  
  // 默认单位
  reasons.push('未找到明确单位关键词，使用默认单位')
  return { value: '套', confidence: 0.3 }
}

/**
 * 推断类别（基于价格）
 */
function inferCategory(price: number, reasons: string[]): { value: string, confidence: number } | null {
  for (const rule of CATEGORY_PRICE_RULES) {
    if (price >= rule.minPrice && price < rule.maxPrice) {
      reasons.push(`基于价格${price}元推断类别为${rule.category}`)
      return { value: rule.category, confidence: rule.confidence }
    }
  }
  
  return null
}

/**
 * 生成产品描述
 */
function generateDescription(name: string, material: string, unit: string, price?: number): string {
  const parts = []
  
  parts.push(`${material}材质的${name}`)
  
  if (price) {
    if (price > 200) {
      parts.push('精工制作')
    } else if (price > 100) {
      parts.push('工艺精良')
    }
  }
  
  parts.push(`以${unit}为单位销售`)
  
  return parts.join('，') + '。'
}

/**
 * 基于名称估算价格
 */
function estimatePriceByName(productName: string): number {
  const lowerName = productName.toLowerCase()
  
  // 基于关键词的价格估算
  if (lowerName.includes('收藏') || lowerName.includes('限量')) {
    return 500
  } else if (lowerName.includes('工艺') || lowerName.includes('精品')) {
    return 200
  } else if (lowerName.includes('装饰') || lowerName.includes('摆件')) {
    return 100
  } else {
    return 50
  }
}

/**
 * 批量推断产品属性
 */
export async function batchInferProductAttributes(
  products: Array<{ name: string, price?: number, quantity?: number }>
): Promise<ProductInferenceResult[]> {
  const results: ProductInferenceResult[] = []
  
  for (const product of products) {
    try {
      const inference = await inferProductAttributes(product.name, product.price, product.quantity)
      results.push(inference)
    } catch (error) {
      console.error(`推断产品属性失败: ${product.name}`, error)
      // 提供默认推断结果
      results.push({
        name: product.name,
        material: '珐琅',
        unit: '套',
        description: `${product.name}，具体属性待确认。`,
        estimatedPrice: product.price || 50,
        confidence: 0.1,
        inferenceReasons: ['推断过程出错，使用默认值']
      })
    }
  }
  
  return results
}

/**
 * 获取系统中已有的材质和单位选项
 */
export async function getSystemMaterialsAndUnits(): Promise<{
  materials: string[]
  units: string[]
}> {
  try {
    // 从产品表中获取已使用的材质和单位
    const products = await prisma.product.findMany({
      select: {
        material: true,
        unit: true
      },
      where: {
        type: 'product'
      }
    })
    
    const materials = [...new Set(products.map(p => p.material).filter(Boolean))]
    const units = [...new Set(products.map(p => p.unit).filter(Boolean))]
    
    return { materials, units }
  } catch (error) {
    console.error('获取系统材质和单位失败:', error)
    return {
      materials: ['珐琅', '陶瓷', '玻璃', '金属', '木材'],
      units: ['套', '个', '对', '盒']
    }
  }
}
