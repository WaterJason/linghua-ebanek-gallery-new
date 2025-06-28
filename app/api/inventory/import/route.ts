import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// 导入库存数据
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: "请选择要导入的文件" }, { status: 400 })
    }

    // 检查文件类型
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件格式，请上传CSV或Excel文件" }, { status: 400 })
    }

    // 读取文件内容
    const fileContent = await file.text()
    
    // 解析CSV数据
    const lines = fileContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: "文件内容为空或格式不正确" }, { status: 400 })
    }

    // 解析表头
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    
    // 验证必需的列
    const requiredColumns = ['产品名称', '仓库名称', '当前库存']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `缺少必需的列: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    const results = []
    const errors = []

    // 使用事务处理导入
    await prisma.$transaction(async (tx) => {
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
          const rowData: any = {}
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || ''
          })

          // 验证必需字段
          if (!rowData['产品名称'] || !rowData['仓库名称'] || !rowData['当前库存']) {
            errors.push({ row: i + 1, error: "缺少必需字段" })
            continue
          }

          const quantity = parseInt(rowData['当前库存'])
          if (isNaN(quantity) || quantity < 0) {
            errors.push({ row: i + 1, error: "库存数量必须是非负整数" })
            continue
          }

          // 查找产品
          const product = await tx.product.findFirst({
            where: { name: rowData['产品名称'] }
          })

          if (!product) {
            errors.push({ row: i + 1, error: `产品不存在: ${rowData['产品名称']}` })
            continue
          }

          // 查找仓库
          const warehouse = await tx.warehouse.findFirst({
            where: { name: rowData['仓库名称'] }
          })

          if (!warehouse) {
            errors.push({ row: i + 1, error: `仓库不存在: ${rowData['仓库名称']}` })
            continue
          }

          // 检查是否已存在库存记录
          const existingInventory = await tx.inventoryItem.findFirst({
            where: {
              productId: product.id,
              warehouseId: warehouse.id
            }
          })

          const minQuantity = rowData['最小库存'] ? parseInt(rowData['最小库存']) : undefined

          if (existingInventory) {
            // 更新现有记录
            const oldQuantity = existingInventory.quantity
            
            const updatedInventory = await tx.inventoryItem.update({
              where: { id: existingInventory.id },
              data: {
                quantity,
                ...(minQuantity !== undefined && { minQuantity }),
                updatedAt: new Date()
              }
            })

            // 记录库存变更
            if (quantity !== oldQuantity) {
              await tx.inventoryTransaction.create({
                data: {
                  type: quantity > oldQuantity ? "import_in" : "import_out",
                  productId: product.id,
                  quantity: Math.abs(quantity - oldQuantity),
                  notes: `导入更新库存: ${file.name}`,
                  ...(quantity > oldQuantity && { targetWarehouseId: warehouse.id }),
                  ...(quantity < oldQuantity && { sourceWarehouseId: warehouse.id }),
                  referenceType: "import"
                }
              })
            }

            results.push({
              row: i + 1,
              action: "updated",
              productName: product.name,
              warehouseName: warehouse.name,
              oldQuantity,
              newQuantity: quantity
            })
          } else {
            // 创建新记录
            const newInventory = await tx.inventoryItem.create({
              data: {
                productId: product.id,
                warehouseId: warehouse.id,
                quantity,
                ...(minQuantity !== undefined && { minQuantity })
              }
            })

            // 记录库存创建
            await tx.inventoryTransaction.create({
              data: {
                type: "import_in",
                productId: product.id,
                quantity,
                notes: `导入创建库存: ${file.name}`,
                targetWarehouseId: warehouse.id,
                referenceType: "import"
              }
            })

            results.push({
              row: i + 1,
              action: "created",
              productName: product.name,
              warehouseName: warehouse.name,
              quantity
            })
          }

        } catch (error) {
          console.error(`处理第 ${i + 1} 行数据失败:`, error)
          errors.push({ 
            row: i + 1, 
            error: error instanceof Error ? error.message : "处理失败" 
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `导入完成，成功处理 ${results.length} 条记录`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalRows: lines.length - 1,
        successful: results.length,
        failed: errors.length,
        created: results.filter(r => r.action === "created").length,
        updated: results.filter(r => r.action === "updated").length
      }
    })

  } catch (error) {
    console.error("导入库存数据失败:", error)
    return NextResponse.json({ error: "导入库存数据失败" }, { status: 500 })
  }
}
