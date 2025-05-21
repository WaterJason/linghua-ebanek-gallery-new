import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")
    const exportFormat = searchParams.get("format") || "excel"

    // 构建查询条件
    let whereClause: any = {}
    
    if (warehouseId && warehouseId !== "all") {
      whereClause.warehouseId = Number.parseInt(warehouseId)
    }

    // 获取库存数据
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        warehouse: true,
        product: true,
      },
      orderBy: [
        {
          warehouseId: "asc",
        },
        {
          productId: "asc",
        },
      ],
    })

    // 如果没有数据，返回空数据提示
    if (inventoryItems.length === 0) {
      return NextResponse.json({ message: "No data found for the specified criteria" }, { status: 404 })
    }

    // 如果是Excel格式，生成Excel文件
    if (exportFormat === "excel") {
      // 创建Excel工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "聆花掐丝珐琅馆管理系统"
      workbook.created = new Date()
      workbook.modified = new Date()

      // 创建库存明细工作表
      const inventorySheet = workbook.addWorksheet("库存明细")
      inventorySheet.columns = [
        { header: "仓库", key: "warehouse", width: 15 },
        { header: "产品ID", key: "productId", width: 10 },
        { header: "产品名称", key: "productName", width: 30 },
        { header: "类别", key: "category", width: 15 },
        { header: "库存数量", key: "quantity", width: 10 },
        { header: "最小库存量", key: "minQuantity", width: 10 },
        { header: "状态", key: "status", width: 10 },
      ]

      // 添加库存数据
      inventoryItems.forEach(item => {
        const isLowStock = item.minQuantity !== null && item.quantity < item.minQuantity
        
        inventorySheet.addRow({
          warehouse: item.warehouse.name,
          productId: item.product.id,
          productName: item.product.name,
          category: item.product.category || "未分类",
          quantity: item.quantity,
          minQuantity: item.minQuantity || "-",
          status: isLowStock ? "库存不足" : "库存充足",
        })
      })

      // 创建仓库汇总工作表
      const warehouseSheet = workbook.addWorksheet("仓库汇总")
      warehouseSheet.columns = [
        { header: "仓库", key: "warehouse", width: 20 },
        { header: "产品种类", key: "productCount", width: 10 },
        { header: "总库存数量", key: "totalQuantity", width: 15 },
        { header: "低库存产品数", key: "lowStockCount", width: 15 },
      ]

      // 按仓库分组统计
      const warehouseMap = new Map()
      
      inventoryItems.forEach(item => {
        const warehouseId = item.warehouse.id
        if (!warehouseMap.has(warehouseId)) {
          warehouseMap.set(warehouseId, {
            warehouse: item.warehouse.name,
            productCount: 0,
            totalQuantity: 0,
            lowStockCount: 0,
          })
        }
        
        const warehouseStats = warehouseMap.get(warehouseId)
        warehouseStats.productCount += 1
        warehouseStats.totalQuantity += item.quantity
        
        if (item.minQuantity !== null && item.quantity < item.minQuantity) {
          warehouseStats.lowStockCount += 1
        }
      })
      
      // 添加仓库汇总数据
      Array.from(warehouseMap.values()).forEach(stats => {
        warehouseSheet.addRow(stats)
      })

      // 创建类别汇总工作表
      const categorySheet = workbook.addWorksheet("类别汇总")
      categorySheet.columns = [
        { header: "类别", key: "category", width: 20 },
        { header: "产品种类", key: "productCount", width: 10 },
        { header: "总库存数量", key: "totalQuantity", width: 15 },
        { header: "低库存产品数", key: "lowStockCount", width: 15 },
      ]

      // 按类别分组统计
      const categoryMap = new Map()
      
      inventoryItems.forEach(item => {
        const category = item.product.category || "未分类"
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            productCount: 0,
            totalQuantity: 0,
            lowStockCount: 0,
          })
        }
        
        const categoryStats = categoryMap.get(category)
        categoryStats.productCount += 1
        categoryStats.totalQuantity += item.quantity
        
        if (item.minQuantity !== null && item.quantity < item.minQuantity) {
          categoryStats.lowStockCount += 1
        }
      })
      
      // 添加类别汇总数据
      Array.from(categoryMap.values()).forEach(stats => {
        categorySheet.addRow(stats)
      })

      // 创建低库存警告工作表
      const lowStockSheet = workbook.addWorksheet("低库存警告")
      lowStockSheet.columns = [
        { header: "仓库", key: "warehouse", width: 15 },
        { header: "产品名称", key: "productName", width: 30 },
        { header: "类别", key: "category", width: 15 },
        { header: "当前库存", key: "quantity", width: 10 },
        { header: "最小库存量", key: "minQuantity", width: 10 },
        { header: "缺口", key: "shortage", width: 10 },
      ]

      // 筛选低库存产品
      const lowStockItems = inventoryItems.filter(item => 
        item.minQuantity !== null && item.quantity < item.minQuantity
      )
      
      // 添加低库存数据
      lowStockItems.forEach(item => {
        lowStockSheet.addRow({
          warehouse: item.warehouse.name,
          productName: item.product.name,
          category: item.product.category || "未分类",
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          shortage: item.minQuantity - item.quantity,
        })
      })

      // 设置样式
      inventorySheet.getRow(1).font = { bold: true }
      warehouseSheet.getRow(1).font = { bold: true }
      categorySheet.getRow(1).font = { bold: true }
      lowStockSheet.getRow(1).font = { bold: true }
      
      // 设置条件格式
      inventorySheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const status = row.getCell("status").value
          if (status === "库存不足") {
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFD6D6" }, // 浅红色
              }
            })
          }
        }
      })
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer()
      
      // 设置文件名
      const fileName = `库存报表_${format(new Date(), "yyyyMMdd")}.xlsx`
      
      // 返回Excel文件
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      })
    } else {
      // 如果不是Excel格式，返回JSON数据
      return NextResponse.json(inventoryItems)
    }
  } catch (error) {
    console.error("Error exporting inventory report:", error)
    return NextResponse.json({ error: "Failed to export inventory report" }, { status: 500 })
  }
}
