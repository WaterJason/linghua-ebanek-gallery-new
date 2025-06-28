import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * POST /api/inventory/products/import - 导入产品库存数据
 * 支持CSV和Excel文件格式
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const warehouseId = formData.get('warehouseId') as string
    const mode = formData.get('mode') as string || 'upsert'

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 })
    }

    if (!warehouseId) {
      return NextResponse.json({ error: "缺少仓库ID" }, { status: 400 })
    }

    // 验证文件类型
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      return NextResponse.json({ 
        error: "不支持的文件格式，请使用CSV或Excel文件" 
      }, { status: 400 })
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "文件大小超过10MB限制" 
      }, { status: 400 })
    }

    // 验证仓库是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) }
    })

    if (!warehouse) {
      return NextResponse.json({ error: "仓库不存在" }, { status: 404 })
    }

    // 读取文件内容
    const fileContent = await file.text()
    
    // 解析CSV数据
    const rows = parseCSV(fileContent)
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "文件为空或格式错误" }, { status: 400 })
    }

    // 获取标题行
    const headers = rows[0].map(h => h.trim().toLowerCase())
    const dataRows = rows.slice(1)

    // 验证必要的列
    const requiredColumns = ['产品名称', 'productname', 'name']
    const hasRequiredColumn = requiredColumns.some(col => 
      headers.some(h => h.includes(col.toLowerCase()))
    )

    if (!hasRequiredColumn) {
      return NextResponse.json({ 
        error: "文件必须包含产品名称列" 
      }, { status: 400 })
    }

    // 映射列索引
    const columnMap = mapColumns(headers)
    
    const results = {
      total: dataRows.length,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    // 处理每一行数据
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + 2 // 考虑标题行

      try {
        // 提取行数据
        const rowData = extractRowData(row, columnMap)
        
        if (!rowData.productName) {
          results.errors.push(`第${rowNumber}行: 产品名称为空`)
          continue
        }

        // 查找产品
        const product = await findProduct(rowData)
        
        if (!product) {
          results.errors.push(`第${rowNumber}行: 未找到产品 "${rowData.productName}"`)
          continue
        }

        // 处理库存数据
        const success = await processInventoryItem(
          product.id,
          parseInt(warehouseId),
          rowData,
          mode
        )

        if (success.created) {
          results.created++
        } else if (success.updated) {
          results.updated++
        }

        results.processed++

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        results.errors.push(`第${rowNumber}行: ${error instanceof Error ? error.message : '处理失败'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `导入完成: 处理${results.processed}条，创建${results.created}条，更新${results.updated}条`,
      results
    })

  } catch (error) {
    console.error("Error importing inventory data:", error)
    return NextResponse.json({ 
      error: "导入失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * 解析CSV内容
 */
function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim())
  return lines.map(line => {
    // 简单的CSV解析，支持逗号和制表符分隔
    return line.split(/[,\t]/).map(cell => cell.trim().replace(/^"|"$/g, ''))
  })
}

/**
 * 映射列索引
 */
function mapColumns(headers: string[]) {
  const map: Record<string, number> = {}
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase()
    
    // 产品名称
    if (h.includes('产品名称') || h.includes('productname') || h === 'name') {
      map.productName = index
    }
    // SKU/条码
    else if (h.includes('sku') || h.includes('条码') || h.includes('barcode')) {
      map.sku = index
    }
    // 库存数量
    else if (h.includes('库存') || h.includes('quantity') || h.includes('数量')) {
      map.quantity = index
    }
    // 最低库存
    else if (h.includes('最低库存') || h.includes('minquantity') || h.includes('min')) {
      map.minQuantity = index
    }
    // 销售价格
    else if (h.includes('销售价格') || h.includes('saleprice') || h.includes('price')) {
      map.salePrice = index
    }
    // 成本价格
    else if (h.includes('成本价格') || h.includes('costprice') || h.includes('cost')) {
      map.costPrice = index
    }
  })
  
  return map
}

/**
 * 提取行数据
 */
function extractRowData(row: string[], columnMap: Record<string, number>) {
  return {
    productName: row[columnMap.productName] || '',
    sku: row[columnMap.sku] || '',
    quantity: parseInt(row[columnMap.quantity]) || 0,
    minQuantity: parseInt(row[columnMap.minQuantity]) || 0,
    salePrice: parseFloat(row[columnMap.salePrice]) || 0,
    costPrice: parseFloat(row[columnMap.costPrice]) || 0
  }
}

/**
 * 查找产品
 */
async function findProduct(rowData: any) {
  // 优先通过SKU/条码查找
  if (rowData.sku) {
    const product = await prisma.product.findFirst({
      where: { barcode: rowData.sku }
    })
    if (product) return product
  }

  // 通过产品名称查找
  return await prisma.product.findFirst({
    where: {
      name: { contains: rowData.productName, mode: 'insensitive' }
    }
  })
}

/**
 * 处理库存项
 */
async function processInventoryItem(
  productId: number,
  warehouseId: number,
  rowData: any,
  mode: string
) {
  // 查找现有库存
  const existingInventory = await prisma.inventoryItem.findFirst({
    where: { productId, warehouseId }
  })

  const inventoryData = {
    productId,
    warehouseId,
    quantity: rowData.quantity,
    minQuantity: rowData.minQuantity,
    notes: '批量导入'
  }

  if (existingInventory) {
    // 更新现有记录
    const newQuantity = mode === 'add' 
      ? existingInventory.quantity + rowData.quantity
      : rowData.quantity

    await prisma.inventoryItem.update({
      where: { id: existingInventory.id },
      data: {
        quantity: newQuantity,
        minQuantity: inventoryData.minQuantity,
        notes: inventoryData.notes
      }
    })

    // 记录库存变更
    const quantityChange = newQuantity - existingInventory.quantity
    if (quantityChange !== 0) {
      await prisma.inventoryTransaction.create({
        data: {
          productId,
          quantity: quantityChange,
          type: 'adjustment',
          notes: `批量导入更新`,
          targetWarehouseId: warehouseId
        }
      })
    }

    return { updated: true, created: false }
  } else {
    // 创建新记录
    await prisma.inventoryItem.create({
      data: inventoryData
    })

    // 记录库存变更
    await prisma.inventoryTransaction.create({
      data: {
        productId,
        quantity: rowData.quantity,
        type: 'initial',
        notes: `批量导入创建`,
        targetWarehouseId: warehouseId
      }
    })

    return { created: true, updated: false }
  }
}
