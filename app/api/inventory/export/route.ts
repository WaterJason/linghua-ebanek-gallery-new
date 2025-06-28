import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// 导出库存数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")
    const format = searchParams.get("format") || "csv"

    // 构建查询条件
    const where: any = {}
    if (warehouseId) {
      where.warehouseId = parseInt(warehouseId)
    }

    // 获取库存数据
    const inventoryData = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            material: true,
            unit: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true
          }
        }
      },
      orderBy: [
        { warehouse: { name: "asc" } },
        { product: { name: "asc" } }
      ]
    })

    if (format === "csv") {
      // 生成CSV格式
      const csvHeaders = [
        "库存ID",
        "产品名称",
        "产品SKU",
        "仓库名称",
        "仓库类型",
        "仓库位置",
        "当前库存",
        "最小库存",
        "产品价格",
        "材质",
        "单位",
        "库存价值",
        "更新时间"
      ]

      const csvRows = inventoryData.map(item => [
        item.id,
        item.product.name,
        item.product.sku || "",
        item.warehouse.name,
        item.warehouse.type,
        item.warehouse.location || "",
        item.quantity,
        item.minQuantity || 0,
        item.product.price,
        item.product.material || "",
        item.product.unit || "",
        (item.quantity * item.product.price).toFixed(2),
        item.updatedAt.toISOString()
      ])

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="inventory_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === "json") {
      // 生成JSON格式
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalItems: inventoryData.length,
        totalValue: inventoryData.reduce((sum, item) => sum + (item.quantity * item.product.price), 0),
        data: inventoryData.map(item => ({
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            price: item.product.price,
            material: item.product.material,
            unit: item.product.unit
          },
          warehouse: {
            id: item.warehouse.id,
            name: item.warehouse.name,
            type: item.warehouse.type,
            location: item.warehouse.location
          },
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          value: item.quantity * item.product.price,
          updatedAt: item.updatedAt
        }))
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="inventory_export_${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else {
      return NextResponse.json({ error: "不支持的导出格式" }, { status: 400 })
    }

  } catch (error) {
    console.error("导出库存数据失败:", error)
    return NextResponse.json({ error: "导出库存数据失败" }, { status: 500 })
  }
}
