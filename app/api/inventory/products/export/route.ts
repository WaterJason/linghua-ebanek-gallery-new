import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/inventory/products/export - 导出产品库存数据为CSV
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    
    if (!warehouseId) {
      return NextResponse.json({ error: "缺少仓库ID参数" }, { status: 400 })
    }

    // 验证仓库是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) },
      select: { name: true }
    })

    if (!warehouse) {
      return NextResponse.json({ error: "仓库不存在" }, { status: 404 })
    }

    // 获取库存数据
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        warehouseId: parseInt(warehouseId)
      },
      include: {
        product: {
          include: {
            productCategory: true
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    })

    // 生成CSV内容
    const csvContent = generateCSV(inventoryItems, warehouse.name)
    
    // 创建响应
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory-${warehouse.name}-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    })

    return response

  } catch (error) {
    console.error("Error exporting inventory data:", error)
    return NextResponse.json({ 
      error: "导出失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * 生成CSV内容
 */
function generateCSV(inventoryItems: any[], warehouseName: string): string {
  // CSV标题行
  const headers = [
    '产品ID',
    '产品名称',
    '产品分类',
    'SKU/条码',
    '库存数量',
    '最低库存',
    '销售价格',
    '成本价格',
    '库存状态',
    '最后更新时间',
    '仓库名称',
    '备注'
  ]

  // 数据行
  const rows = inventoryItems.map(item => {
    const product = item.product
    const minQuantity = item.minQuantity || 10
    
    // 计算库存状态
    let status = '充足'
    if (item.quantity === 0) {
      status = '缺货'
    } else if (item.quantity < minQuantity) {
      status = '不足'
    }

    // 从notes中提取成本价格
    const costPrice = extractCostPriceFromNotes(item.notes)

    return [
      product.id.toString(),
      `"${product.name}"`, // 用引号包围以处理包含逗号的产品名称
      `"${product.productCategory?.name || product.category || '未分类'}"`,
      product.barcode || '',
      item.quantity.toString(),
      (item.minQuantity || 0).toString(),
      product.price.toFixed(2),
      costPrice.toFixed(2),
      status,
      new Date(item.updatedAt).toLocaleString('zh-CN'),
      `"${warehouseName}"`,
      `"${item.notes || ''}"`
    ]
  })

  // 组合CSV内容
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ]

  // 添加BOM以支持Excel正确显示中文
  const BOM = '\uFEFF'
  return BOM + csvLines.join('\n')
}

/**
 * 从notes中提取成本价格
 */
function extractCostPriceFromNotes(notes: string | null): number {
  if (!notes) return 0
  
  const match = notes.match(/成本价格: ¥([\d.]+)/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * POST /api/inventory/products/export - 导出指定条件的库存数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { warehouseId, filters = {}, format = 'csv' } = body

    if (!warehouseId) {
      return NextResponse.json({ error: "缺少仓库ID参数" }, { status: 400 })
    }

    // 构建查询条件
    const whereCondition: any = {
      warehouseId: parseInt(warehouseId)
    }

    // 应用筛选条件
    if (filters.category && filters.category !== 'all') {
      whereCondition.product = {
        OR: [
          { category: filters.category },
          { productCategory: { name: filters.category } }
        ]
      }
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'out') {
        whereCondition.quantity = 0
      } else if (filters.status === 'low') {
        // 这个条件需要在应用层处理，因为涉及到minQuantity的比较
      }
    }

    // 获取库存数据
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereCondition,
      include: {
        product: {
          include: {
            productCategory: true
          }
        },
        warehouse: {
          select: { name: true }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    })

    // 应用状态筛选（需要在应用层处理）
    let filteredItems = inventoryItems
    if (filters.status === 'low') {
      filteredItems = inventoryItems.filter(item => {
        const minQuantity = item.minQuantity || 10
        return item.quantity > 0 && item.quantity < minQuantity
      })
    }

    if (format === 'json') {
      // 返回JSON格式
      const jsonData = filteredItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.productCategory?.name || item.product.category || '未分类',
        sku: item.product.barcode,
        quantity: item.quantity,
        minQuantity: item.minQuantity || 0,
        salePrice: item.product.price,
        costPrice: extractCostPriceFromNotes(item.notes),
        status: getInventoryStatus(item.quantity, item.minQuantity || 10),
        lastUpdated: item.updatedAt,
        warehouseName: item.warehouse.name,
        notes: item.notes
      }))

      return NextResponse.json({
        success: true,
        data: jsonData,
        total: jsonData.length,
        exportTime: new Date().toISOString()
      })
    } else {
      // 返回CSV格式
      const csvContent = generateCSV(filteredItems, filteredItems[0]?.warehouse.name || '未知仓库')
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="filtered-inventory-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache'
        }
      })
    }

  } catch (error) {
    console.error("Error exporting filtered inventory data:", error)
    return NextResponse.json({ 
      error: "导出失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * 获取库存状态
 */
function getInventoryStatus(quantity: number, minQuantity: number): string {
  if (quantity === 0) return '缺货'
  if (quantity < minQuantity) return '不足'
  return '充足'
}
