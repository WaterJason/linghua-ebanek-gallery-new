import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import * as XLSX from "xlsx"

// 导入预览数据类型
interface PreviewItem {
  row: number
  productName: string
  quantity: number
  price: number
  notes?: string
  isValid: boolean
  errors: string[]
  matchedProduct?: {
    id: number
    name: string
    similarity: number
  }
}

interface PreviewResult {
  items: PreviewItem[]
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    duplicateRows: number
  }
  suggestions: string[]
}

// 解析Excel/CSV文件并返回预览数据
async function parseFileForPreview(file: File): Promise<PreviewItem[]> {
  console.log("📝 解析文件预览:", file.name)

  const buffer = await file.arrayBuffer()
  const items: PreviewItem[] = []

  if (file.type === "text/csv") {
    // CSV解析
    const text = await file.text()
    const lines = text.split('\n')

    // 跳过标题行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns = line.split(',')
      if (columns.length < 3) continue

      const productName = columns[0]?.trim().replace(/"/g, '') || ""
      const quantity = Number(columns[1]?.trim()) || 0
      const price = Number(columns[2]?.trim()) || 0
      const notes = columns[3]?.trim().replace(/"/g, '') || undefined

      // 数据验证
      const errors: string[] = []
      if (!productName) errors.push("产品名称不能为空")
      if (quantity <= 0) errors.push("数量必须大于0")
      if (price < 0) errors.push("单价不能为负数")

      items.push({
        row: i + 1,
        productName,
        quantity,
        price,
        notes,
        isValid: errors.length === 0,
        errors
      })
    }
  } else {
    // Excel解析
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // 跳过标题行
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length < 3) continue

      const productName = String(row[0] || "").trim()
      const quantity = Number(row[1]) || 0
      const price = Number(row[2]) || 0
      const notes = String(row[3] || "").trim() || undefined

      // 数据验证
      const errors: string[] = []
      if (!productName) errors.push("产品名称不能为空")
      if (quantity <= 0) errors.push("数量必须大于0")
      if (price < 0) errors.push("单价不能为负数")

      items.push({
        row: i + 1,
        productName,
        quantity,
        price,
        notes,
        isValid: errors.length === 0,
        errors
      })
    }
  }

  return items
}

// 产品匹配功能
async function matchProducts(items: PreviewItem[]) {
  console.log("🔍 开始产品匹配...")

  for (const item of items) {
    if (!item.productName || !item.isValid) continue

    try {
      // 精确匹配
      let product = await prisma.product.findFirst({
        where: {
          name: {
            equals: item.productName,
            mode: "insensitive"
          }
        },
        select: { id: true, name: true }
      })

      if (product) {
        item.matchedProduct = {
          id: product.id,
          name: product.name,
          similarity: 1.0
        }
        continue
      }

      // 模糊匹配
      const products = await prisma.product.findMany({
        where: {
          name: {
            contains: item.productName,
            mode: "insensitive"
          }
        },
        select: { id: true, name: true },
        take: 3
      })

      if (products.length > 0) {
        // 计算相似度（简单实现）
        const similarities = products.map(p => {
          const similarity = calculateSimilarity(item.productName, p.name)
          return { ...p, similarity }
        })

        // 选择相似度最高的产品
        const bestMatch = similarities.reduce((best, current) => 
          current.similarity > best.similarity ? current : best
        )

        if (bestMatch.similarity > 0.6) {
          item.matchedProduct = bestMatch
        }
      }
    } catch (error) {
      console.warn(`⚠️ 产品匹配失败: ${item.productName}`, error)
    }
  }
}

// 简单的字符串相似度计算
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

// 检测重复数据
function detectDuplicates(items: PreviewItem[]): number {
  const seen = new Set<string>()
  let duplicates = 0

  for (const item of items) {
    const key = `${item.productName}-${item.quantity}-${item.price}`
    if (seen.has(key)) {
      duplicates++
      item.errors.push("检测到重复数据")
      item.isValid = false
    } else {
      seen.add(key)
    }
  }

  return duplicates
}

/**
 * POST /api/purchase-orders/import/preview - 预览导入文件内容
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 文件预览API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    // 简化权限检查（参考产品管理模块模式）
    console.log("🔓 采购预览权限检查通过，用户:", session.user.email)
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    // 验证文件
    if (!file) {
      return NextResponse.json({ error: "请选择要预览的文件" }, { status: 400 })
    }
    
    // 验证文件类型
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv" // .csv
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "不支持的文件格式，请上传Excel(.xlsx, .xls)或CSV文件" 
      }, { status: 400 })
    }
    
    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "文件大小超过限制，最大支持10MB" 
      }, { status: 400 })
    }
    
    console.log("📝 开始解析预览文件:", file.name)
    
    // 解析文件内容
    const items = await parseFileForPreview(file)
    
    if (items.length === 0) {
      return NextResponse.json({ 
        error: "文件中没有找到有效的数据行" 
      }, { status: 400 })
    }
    
    // 产品匹配
    await matchProducts(items)
    
    // 检测重复数据
    const duplicateCount = detectDuplicates(items)
    
    // 生成统计信息
    const validRows = items.filter(item => item.isValid).length
    const invalidRows = items.length - validRows
    
    // 生成建议
    const suggestions: string[] = []
    if (invalidRows > 0) {
      suggestions.push(`发现 ${invalidRows} 行数据存在问题，请检查并修正`)
    }
    if (duplicateCount > 0) {
      suggestions.push(`发现 ${duplicateCount} 行重复数据，建议去重后再导入`)
    }
    
    const unmatchedCount = items.filter(item => item.isValid && !item.matchedProduct).length
    if (unmatchedCount > 0) {
      suggestions.push(`有 ${unmatchedCount} 个产品未能自动匹配，这些行将被跳过。请先在产品管理中创建相应产品`)
    }
    
    const result: PreviewResult = {
      items,
      summary: {
        totalRows: items.length,
        validRows,
        invalidRows,
        duplicateRows: duplicateCount
      },
      suggestions
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 文件预览完成，耗时: ${responseTime}ms`)
    console.log(`📊 总计: ${items.length}, 有效: ${validRows}, 无效: ${invalidRows}`)
    
    return NextResponse.json({
      success: true,
      data: result,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 文件预览失败:", error)
    
    return NextResponse.json({
      error: "文件预览失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
