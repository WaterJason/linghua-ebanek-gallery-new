import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { batchInferProductAttributes, ProductInferenceResult } from "@/lib/services/smart-product-inference"
import * as XLSX from "xlsx"

// 导入项目接口
interface ImportItem {
  productName: string
  quantity: number
  price: number
  notes?: string
  row: number
}

// 产品预览结果接口
interface ProductPreviewResult {
  row: number
  productName: string
  quantity: number
  price: number
  notes?: string
  matchStatus: 'exact' | 'fuzzy' | 'new' | 'error'
  existingProduct?: {
    id: number
    name: string
    material: string
    unit: string
    price: number
  }
  inferredProduct?: ProductInferenceResult
  confidence: number
  actions: string[] // 可执行的操作
}

/**
 * 解析上传的文件并生成产品预览
 */
async function parseFileAndGeneratePreview(file: File): Promise<ImportItem[]> {
  console.log("📝 解析文件:", file.name)

  const buffer = await file.arrayBuffer()
  const items: ImportItem[] = []

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

      const productName = columns[0]?.trim().replace(/"/g, '')
      const quantity = Number(columns[1]?.trim()) || 0
      const price = Number(columns[2]?.trim()) || 0
      const notes = columns[3]?.trim().replace(/"/g, '') || undefined

      if (productName && quantity > 0 && price >= 0) {
        items.push({
          productName,
          quantity,
          price,
          notes,
          row: i
        })
      }
    }
  } else {
    // Excel解析
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // 转换为JSON格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // 跳过标题行，解析数据
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length < 3) continue

      const productName = String(row[0] || "").trim()
      const quantity = Number(row[1]) || 0
      const price = Number(row[2]) || 0
      const notes = String(row[3] || "").trim()

      if (productName && quantity > 0 && price >= 0) {
        items.push({
          productName,
          quantity,
          price,
          notes: notes || undefined,
          row: i + 1
        })
      }
    }
  }

  return items
}

/**
 * 查找产品匹配
 */
async function findProductMatch(productName: string): Promise<{
  status: 'exact' | 'fuzzy' | 'none'
  product?: any
  confidence: number
}> {
  // 1. 精确匹配
  const exactMatch = await prisma.product.findFirst({
    where: {
      name: {
        equals: productName,
        mode: "insensitive"
      },
      type: 'product'
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
    return { status: 'exact', product: exactMatch, confidence: 1.0 }
  }

  // 2. 模糊匹配
  const fuzzyMatch = await prisma.product.findFirst({
    where: {
      name: {
        contains: productName,
        mode: "insensitive"
      },
      type: 'product'
    },
    select: {
      id: true,
      name: true,
      material: true,
      unit: true,
      price: true
    }
  })

  if (fuzzyMatch) {
    // 计算相似度
    const similarity = calculateSimilarity(productName, fuzzyMatch.name)
    if (similarity > 0.6) {
      return { status: 'fuzzy', product: fuzzyMatch, confidence: similarity }
    }
  }

  return { status: 'none', confidence: 0 }
}

/**
 * 计算字符串相似度
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * 计算编辑距离
 */
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

/**
 * POST /api/purchase-orders/import/product-preview - 生成产品导入预览
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 产品预览API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
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
    const items = await parseFileAndGeneratePreview(file)
    
    if (items.length === 0) {
      return NextResponse.json({ 
        error: "文件中没有找到有效的产品数据" 
      }, { status: 400 })
    }
    
    console.log(`📊 解析到 ${items.length} 条产品项目`)
    
    // 生成预览结果
    const previewResults: ProductPreviewResult[] = []
    
    for (const item of items) {
      try {
        // 查找现有产品匹配
        const matchResult = await findProductMatch(item.productName)
        
        let previewItem: ProductPreviewResult = {
          row: item.row,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          matchStatus: matchResult.status === 'none' ? 'new' : matchResult.status,
          confidence: matchResult.confidence,
          actions: []
        }
        
        if (matchResult.product) {
          previewItem.existingProduct = matchResult.product
          previewItem.actions.push(
            matchResult.status === 'exact' ? '使用现有产品' : '使用相似产品'
          )
        } else {
          // 智能推断新产品属性
          const inference = await batchInferProductAttributes([{
            name: item.productName,
            price: item.price,
            quantity: item.quantity
          }])
          
          previewItem.inferredProduct = inference[0]
          previewItem.actions.push('创建新产品')
        }
        
        previewResults.push(previewItem)
        
      } catch (error) {
        console.error(`❌ 处理产品预览失败: ${item.productName}`, error)
        previewResults.push({
          row: item.row,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          matchStatus: 'error',
          confidence: 0,
          actions: ['需要手动处理']
        })
      }
    }
    
    // 统计信息
    const stats = {
      total: previewResults.length,
      exactMatches: previewResults.filter(r => r.matchStatus === 'exact').length,
      fuzzyMatches: previewResults.filter(r => r.matchStatus === 'fuzzy').length,
      newProducts: previewResults.filter(r => r.matchStatus === 'new').length,
      errors: previewResults.filter(r => r.matchStatus === 'error').length
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 产品预览生成完成，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        previewResults,
        statistics: stats
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 产品预览生成失败:", error)
    
    return NextResponse.json({
      error: "预览生成失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
