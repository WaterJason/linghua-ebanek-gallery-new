import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"

// 批量库存转移
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取表单数据
    const formData = await request.formData()
    const file = formData.get("file") as File
    const sourceWarehouseId = formData.get("sourceWarehouseId") as string
    const targetWarehouseId = formData.get("targetWarehouseId") as string
    const notes = formData.get("notes") as string || "批量转移"
    const attachment = formData.get("attachment") as File

    // 验证必填字段
    if (!file || !sourceWarehouseId || !targetWarehouseId) {
      return NextResponse.json({ error: "文件、源仓库ID和目标仓库ID为必填项" }, { status: 400 })
    }

    // 检查源仓库和目标仓库是否相同
    if (sourceWarehouseId === targetWarehouseId) {
      return NextResponse.json({ error: "源仓库和目标仓库不能相同" }, { status: 400 })
    }

    // 检查文件类型
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "请上传Excel文件(.xlsx或.xls)" }, { status: 400 })
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 解析Excel文件
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    // 获取第一个工作表
    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      return NextResponse.json({ error: "Excel文件中没有工作表" }, { status: 400 })
    }

    // 验证表头
    const requiredHeaders = ["产品ID", "数量"]
    const optionalHeaders = ["产品条码", "产品名称", "备注"]
    const headerRow = worksheet.getRow(1)
    const headers = headerRow.values as string[]

    // 检查是否包含所有必需的列
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Excel文件缺少必需的列: ${missingHeaders.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // 获取列索引
    const productIdIndex = headers.indexOf("产品ID")
    const barcodeIndex = headers.indexOf("产品条码")
    const productNameIndex = headers.indexOf("产品名称")
    const quantityIndex = headers.indexOf("数量")
    const notesIndex = headers.indexOf("备注")

    // 准备转移数据
    const transferItems = []
    const errors = []

    // 从第二行开始读取数据（跳过表头）
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i)
      const values = row.values as any[]

      // 跳过空行
      if (!values[productIdIndex] && !values[barcodeIndex] && !values[productNameIndex]) continue

      try {
        let productId = values[productIdIndex]
        const quantity = Number.parseInt(values[quantityIndex])
        const itemNotes = values[notesIndex] || notes

        // 验证数量
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`第${i}行: 数量必须是正整数`)
          continue
        }

        // 如果没有直接提供产品ID，则通过条码或名称查找
        if (!productId && (values[barcodeIndex] || values[productNameIndex])) {
          let product
          
          if (values[barcodeIndex]) {
            product = await prisma.product.findFirst({
              where: { barcode: values[barcodeIndex] },
            })
          }
          
          if (!product && values[productNameIndex]) {
            product = await prisma.product.findFirst({
              where: { name: values[productNameIndex] },
            })
          }
          
          if (!product) {
            errors.push(`第${i}行: 无法找到产品`)
            continue
          }
          
          productId = product.id
        }

        // 检查源仓库库存是否足够
        const sourceInventory = await prisma.inventoryItem.findFirst({
          where: {
            warehouseId: Number(sourceWarehouseId),
            productId: Number(productId),
          },
        })

        if (!sourceInventory || sourceInventory.quantity < quantity) {
          errors.push(`第${i}行: 源仓库库存不足`)
          continue
        }

        // 添加到转移列表
        transferItems.push({
          productId: Number(productId),
          quantity,
          notes: itemNotes,
        })
      } catch (error) {
        errors.push(`第${i}行: 数据格式错误`)
      }
    }

    // 如果有错误，返回错误信息
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "导入数据有错误",
          details: errors,
        },
        { status: 400 },
      )
    }

    // 如果没有要转移的项目，返回错误
    if (transferItems.length === 0) {
      return NextResponse.json({ error: "没有有效的转移项目" }, { status: 400 })
    }

    // 保存附件（如果有）
    let attachmentUrl = null
    if (attachment) {
      // 这里简化处理，实际应该上传到存储服务
      attachmentUrl = `attachments/${Date.now()}_${attachment.name}`
    }

    // 执行批量转移
    const result = await prisma.$transaction(async (tx) => {
      const transferResults = []

      for (const item of transferItems) {
        // 查找源仓库库存
        const sourceInventory = await tx.inventoryItem.findFirst({
          where: {
            warehouseId: Number(sourceWarehouseId),
            productId: item.productId,
          },
        })

        if (!sourceInventory || sourceInventory.quantity < item.quantity) {
          throw new Error(`产品ID ${item.productId} 的源仓库库存不足`)
        }

        // 减少源仓库库存
        const updatedSourceInventory = await tx.inventoryItem.update({
          where: { id: sourceInventory.id },
          data: {
            quantity: sourceInventory.quantity - item.quantity,
          },
        })

        // 查找目标仓库库存
        const targetInventory = await tx.inventoryItem.findFirst({
          where: {
            warehouseId: Number(targetWarehouseId),
            productId: item.productId,
          },
        })

        let updatedTargetInventory

        if (targetInventory) {
          // 更新目标仓库库存
          updatedTargetInventory = await tx.inventoryItem.update({
            where: { id: targetInventory.id },
            data: {
              quantity: targetInventory.quantity + item.quantity,
            },
          })
        } else {
          // 创建目标仓库库存
          updatedTargetInventory = await tx.inventoryItem.create({
            data: {
              warehouseId: Number(targetWarehouseId),
              productId: item.productId,
              quantity: item.quantity,
            },
          })
        }

        // 记录库存交易
        const transaction = await tx.inventoryTransaction.create({
          data: {
            type: "transfer",
            sourceWarehouseId: Number(sourceWarehouseId),
            targetWarehouseId: Number(targetWarehouseId),
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes || "批量转移",
            referenceType: "batch_transfer",
            attachmentUrl,
          },
        })

        transferResults.push({
          productId: item.productId,
          quantity: item.quantity,
          transaction: transaction.id,
        })
      }

      return {
        success: true,
        transferred: transferResults.length,
        items: transferResults,
        attachmentUrl,
      }
    })

    return NextResponse.json({
      success: true,
      message: `成功转移${result.transferred}个产品`,
      ...result,
    })
  } catch (error) {
    console.error("批量转移库存失败:", error)
    return NextResponse.json({ error: "批量转移库存失败", message: error.message }, { status: 500 })
  }
}
