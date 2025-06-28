import { NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * GET /api/products/export - 导出产品数据
 * 支持CSV和Excel格式导出
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // csv 或 excel
    const includeImages = searchParams.get('includeImages') !== 'false' // 默认包含图片

    console.log(`🔄 [GET /api/products/export] 开始导出产品数据，格式: ${format}`)

    // 获取所有产品数据
    const products = await prisma.product.findMany({
      where: {
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      },
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })

    console.log(`✅ [GET /api/products/export] 获取到 ${products.length} 个产品`)

    // 转换数据格式
    const exportData = products.map(product => {
      const tags = product.productTags?.map(pt => pt.tag.name).join(', ') || ''
      const mainImageUrl = product.imageUrl || ''
      const allImageUrls = (product.imageUrls || []).join('; ')

      return {
        'ID': product.id,
        '产品名称': product.name,
        '价格': product.price || 0,
        '分类': product.productCategory?.name || '未分类',
        '材质': product.material || '',
        '单位': product.unit || '',
        '库存': product.inventory || 0,
        '尺寸': product.dimensions || '',
        '序列号': product.barcode || '',
        '描述': product.description || '',
        '标签': tags,
        '主图链接': mainImageUrl,
        '图片链接': allImageUrls,
        '创建时间': product.createdAt?.toISOString() || '',
        '更新时间': product.updatedAt?.toISOString() || '',
      }
    })

    if (format === 'csv') {
      // 生成CSV格式
      const headers = Object.keys(exportData[0] || {})
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // 处理包含逗号或引号的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      // 添加BOM以支持中文
      const bom = '\uFEFF'
      const csvWithBom = bom + csvContent

      return new NextResponse(csvWithBom, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else if (format === 'excel') {
      // 对于Excel格式，返回JSON数据，前端使用库处理
      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        filename: `products_export_${new Date().toISOString().split('T')[0]}.xlsx`
      })
    } else {
      return NextResponse.json({ error: "不支持的导出格式" }, { status: 400 })
    }

  } catch (error) {
    console.error("🔥 [GET /api/products/export] 导出失败:", error)
    return NextResponse.json({
      error: "导出产品数据失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
