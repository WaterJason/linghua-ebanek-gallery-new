import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 })
    }

    // 检查文件类型
    if (!file.name.endsWith(".xlsx")) {
      return NextResponse.json({ error: "请上传Excel文件(.xlsx)" }, { status: 400 })
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
    const requiredHeaders = ["产品名称", "价格"]
    const optionalHeaders = ["提成比例", "分类", "条码", "尺寸", "材质", "单位", "描述", "库存"]
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
    const nameIndex = headers.indexOf("产品名称")
    const priceIndex = headers.indexOf("价格")
    const commissionRateIndex = headers.indexOf("提成比例")
    const categoryIndex = headers.indexOf("分类")
    const barcodeIndex = headers.indexOf("条码")
    const dimensionsIndex = headers.indexOf("尺寸")
    const materialIndex = headers.indexOf("材质")
    const unitIndex = headers.indexOf("单位")
    const descriptionIndex = headers.indexOf("描述")
    const inventoryIndex = headers.indexOf("库存")

    // 准备导入数据
    const products = []
    const errors = []

    // 从第二行开始读取数据（跳过表头）
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i)
      const values = row.values as any[]

      if (!values[nameIndex]) continue // 跳过空行

      try {
        const name = values[nameIndex]
        const price = Number.parseFloat(values[priceIndex])

        // 验证必填数据
        if (isNaN(price) || price < 0) {
          errors.push(`第${i}行: 价格必须是正数`)
          continue
        }

        // 准备产品数据对象
        const productData: any = {
          name,
          price,
          type: "product",
          status: "active",
        }

        // 处理可选字段
        if (commissionRateIndex > 0 && values[commissionRateIndex] !== undefined) {
          const commissionRate = Number.parseFloat(values[commissionRateIndex])
          if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
            errors.push(`第${i}行: 提成比例必须在0-100之间`)
            continue
          }
          productData.commissionRate = commissionRate
        } else {
          productData.commissionRate = 0 // 默认值
        }

        // 分类
        if (categoryIndex > 0 && values[categoryIndex]) {
          productData.category = values[categoryIndex]
        }

        // 条码
        if (barcodeIndex > 0 && values[barcodeIndex]) {
          productData.barcode = values[barcodeIndex]
        }

        // 尺寸
        if (dimensionsIndex > 0 && values[dimensionsIndex]) {
          productData.dimensions = values[dimensionsIndex]
        }

        // 材质
        if (materialIndex > 0 && values[materialIndex]) {
          productData.material = values[materialIndex]
        }

        // 单位
        if (unitIndex > 0 && values[unitIndex]) {
          productData.unit = values[unitIndex]
        }

        // 描述
        if (descriptionIndex > 0 && values[descriptionIndex]) {
          productData.description = values[descriptionIndex]
        }

        // 库存 - 这里只是记录，实际库存会在库存模块中管理
        if (inventoryIndex > 0 && values[inventoryIndex] !== undefined) {
          const inventory = Number.parseInt(values[inventoryIndex])
          if (!isNaN(inventory) && inventory >= 0) {
            productData.inventory = inventory
          }
        }

        // 添加到导入列表
        products.push(productData)
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

    // 导入数据到数据库
    const result = await prisma.$transaction(async (tx) => {
      const createdProducts = []
      const updatedProducts = []
      const failedProducts = []

      for (const product of products) {
        try {
          // 检查产品是否已存在
          const existingProduct = await tx.product.findFirst({
            where: { name: product.name },
          })

          if (existingProduct) {
            // 更新现有产品
            const updated = await tx.product.update({
              where: { id: existingProduct.id },
              data: {
                price: product.price,
                commissionRate: product.commissionRate,
                category: product.category,
                barcode: product.barcode,
                dimensions: product.dimensions,
                material: product.material,
                unit: product.unit,
                description: product.description,
                // 不直接更新库存，因为库存应该通过库存模块管理
              },
            })
            updatedProducts.push(updated)
          } else {
            // 创建新产品
            const created = await tx.product.create({
              data: product,
            })
            createdProducts.push(created)

            // 如果有库存数据，创建库存记录
            if (product.inventory && product.inventory > 0) {
              try {
                // 获取默认仓库
                const defaultWarehouse = await tx.warehouse.findFirst({
                  where: { isDefault: true },
                })

                if (defaultWarehouse) {
                  // 创建库存记录
                  await tx.inventoryItem.create({
                    data: {
                      warehouseId: defaultWarehouse.id,
                      productId: created.id,
                      quantity: product.inventory,
                    },
                  })
                }
              } catch (inventoryError) {
                console.error("创建库存记录失败:", inventoryError)
                // 不阻止产品创建，只记录错误
              }
            }
          }
        } catch (error) {
          console.error("处理产品失败:", error, product)
          failedProducts.push(product.name)
        }
      }

      return {
        created: createdProducts,
        updated: updatedProducts,
        failed: failedProducts,
      }
    })

    return NextResponse.json({
      success: true,
      message: `成功导入${result.created.length + result.updated.length}个产品`,
      created: result.created.length,
      updated: result.updated.length,
      failed: result.failed.length,
      errors: result.failed.map(name => `导入失败: ${name}`),
      products: [...result.created, ...result.updated],
    })
  } catch (error) {
    console.error("导入产品数据失败:", error)
    return NextResponse.json({ error: "导入产品数据失败" }, { status: 500 })
  }
}
