import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import { checkUserPermission } from "@/lib/services/purchase-permissions"
import prisma from "@/lib/db"

// 验证项目类型
interface ValidationItem {
  row: number
  productName: string
  quantity: number
  price: number
  notes?: string
  productId?: number
}

// 验证结果类型
interface ValidationResult {
  row: number
  productName: string
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// 验证规则配置
const VALIDATION_RULES = {
  productName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[^<>'"&]*$/ // 防止XSS
  },
  quantity: {
    required: true,
    min: 1,
    max: 999999,
    integer: true
  },
  price: {
    required: true,
    min: 0,
    max: 999999.99,
    decimal: true,
    precision: 2
  },
  notes: {
    required: false,
    maxLength: 500
  }
}

// 数据验证函数
function validateItem(item: ValidationItem): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // 产品名称验证
  if (!item.productName || typeof item.productName !== 'string') {
    errors.push("产品名称不能为空")
  } else {
    const name = item.productName.trim()
    if (name.length < VALIDATION_RULES.productName.minLength) {
      errors.push("产品名称不能为空")
    } else if (name.length > VALIDATION_RULES.productName.maxLength) {
      errors.push(`产品名称长度不能超过${VALIDATION_RULES.productName.maxLength}个字符`)
    } else if (!VALIDATION_RULES.productName.pattern.test(name)) {
      errors.push("产品名称包含非法字符")
    }
  }

  // 数量验证
  if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
    errors.push("数量必须是有效数字")
  } else {
    if (!Number.isInteger(item.quantity)) {
      errors.push("数量必须是整数")
    } else if (item.quantity < VALIDATION_RULES.quantity.min) {
      errors.push(`数量不能小于${VALIDATION_RULES.quantity.min}`)
    } else if (item.quantity > VALIDATION_RULES.quantity.max) {
      errors.push(`数量不能大于${VALIDATION_RULES.quantity.max}`)
    } else if (item.quantity > 10000) {
      warnings.push("数量较大，请确认是否正确")
    }
  }

  // 价格验证
  if (typeof item.price !== 'number' || isNaN(item.price)) {
    errors.push("单价必须是有效数字")
  } else {
    if (item.price < VALIDATION_RULES.price.min) {
      errors.push(`单价不能小于${VALIDATION_RULES.price.min}`)
    } else if (item.price > VALIDATION_RULES.price.max) {
      errors.push(`单价不能大于${VALIDATION_RULES.price.max}`)
    } else {
      // 检查小数位数
      const decimalPlaces = (item.price.toString().split('.')[1] || '').length
      if (decimalPlaces > VALIDATION_RULES.price.precision) {
        warnings.push(`单价小数位数超过${VALIDATION_RULES.price.precision}位，将自动四舍五入`)
      }
      
      // 价格合理性检查
      if (item.price === 0) {
        warnings.push("单价为0，请确认是否正确")
      } else if (item.price > 10000) {
        warnings.push("单价较高，请确认是否正确")
      }
    }
  }

  // 备注验证
  if (item.notes && typeof item.notes === 'string') {
    if (item.notes.length > VALIDATION_RULES.notes.maxLength) {
      errors.push(`备注长度不能超过${VALIDATION_RULES.notes.maxLength}个字符`)
    }
  }

  // 业务逻辑验证
  if (errors.length === 0) {
    // 总金额检查
    const totalAmount = item.quantity * item.price
    if (totalAmount > 1000000) {
      warnings.push("订单总金额较大，可能需要特殊审批")
    }

    // 产品匹配建议
    if (!item.productId) {
      suggestions.push("建议手动关联现有产品以便库存管理")
    }
  }

  return {
    row: item.row,
    productName: item.productName,
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

// 检测重复数据
function detectDuplicates(items: ValidationItem[]): Map<string, number[]> {
  const duplicates = new Map<string, number[]>()
  const seen = new Map<string, number>()

  for (const item of items) {
    // 生成唯一键（产品名称 + 数量 + 单价）
    const key = `${item.productName.trim().toLowerCase()}-${item.quantity}-${item.price}`
    
    if (seen.has(key)) {
      const firstRow = seen.get(key)!
      if (!duplicates.has(key)) {
        duplicates.set(key, [firstRow])
      }
      duplicates.get(key)!.push(item.row)
    } else {
      seen.set(key, item.row)
    }
  }

  return duplicates
}

// 数据一致性检查
async function checkDataConsistency(items: ValidationItem[]): Promise<{
  supplierConsistency: boolean
  priceConsistency: Array<{
    productName: string
    rows: number[]
    prices: number[]
    suggestion: string
  }>
}> {
  const priceConsistency: Array<{
    productName: string
    rows: number[]
    prices: number[]
    suggestion: string
  }> = []

  // 按产品名称分组检查价格一致性
  const productGroups = new Map<string, Array<{ row: number; price: number }>>()
  
  for (const item of items) {
    const productName = item.productName.trim().toLowerCase()
    if (!productGroups.has(productName)) {
      productGroups.set(productName, [])
    }
    productGroups.get(productName)!.push({ row: item.row, price: item.price })
  }

  // 检查每个产品的价格一致性
  for (const [productName, entries] of productGroups) {
    if (entries.length > 1) {
      const prices = [...new Set(entries.map(e => e.price))]
      if (prices.length > 1) {
        // 价格不一致
        priceConsistency.push({
          productName,
          rows: entries.map(e => e.row),
          prices,
          suggestion: `同一产品存在不同价格：${prices.join(', ')}，建议统一价格`
        })
      }
    }
  }

  return {
    supplierConsistency: true, // 暂时默认为true
    priceConsistency
  }
}

/**
 * POST /api/purchase-orders/import/validate - 验证导入数据
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("✅ 数据验证API被调用")
    
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
    const { items } = body as { items: ValidationItem[] }
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "无效的验证数据" }, { status: 400 })
    }
    
    console.log(`📊 开始验证 ${items.length} 条数据`)
    
    // 1. 基础数据验证
    const validationResults = items.map(validateItem)
    
    // 2. 重复数据检测
    const duplicates = detectDuplicates(items)
    
    // 为重复数据添加错误信息
    for (const [key, rows] of duplicates) {
      for (const row of rows.slice(1)) { // 跳过第一个，只标记后续重复项
        const result = validationResults.find(r => r.row === row)
        if (result) {
          result.errors.push("检测到重复数据")
          result.isValid = false
        }
      }
    }
    
    // 3. 数据一致性检查
    const consistencyCheck = await checkDataConsistency(items)
    
    // 为价格不一致的数据添加警告
    for (const inconsistency of consistencyCheck.priceConsistency) {
      for (const row of inconsistency.rows) {
        const result = validationResults.find(r => r.row === row)
        if (result) {
          result.warnings.push(inconsistency.suggestion)
        }
      }
    }
    
    // 4. 生成统计信息
    const validCount = validationResults.filter(r => r.isValid).length
    const invalidCount = validationResults.length - validCount
    const warningCount = validationResults.filter(r => r.warnings.length > 0).length
    const duplicateCount = Array.from(duplicates.values()).reduce((sum, rows) => sum + rows.length - 1, 0)
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 数据验证完成，耗时: ${responseTime}ms`)
    console.log(`📊 有效: ${validCount}, 无效: ${invalidCount}, 警告: ${warningCount}, 重复: ${duplicateCount}`)
    
    return NextResponse.json({
      success: true,
      data: {
        results: validationResults,
        summary: {
          totalCount: items.length,
          validCount,
          invalidCount,
          warningCount,
          duplicateCount
        },
        consistency: consistencyCheck,
        duplicates: Array.from(duplicates.entries()).map(([key, rows]) => ({
          key,
          rows,
          count: rows.length
        }))
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 数据验证失败:", error)
    
    return NextResponse.json({
      error: "数据验证失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
