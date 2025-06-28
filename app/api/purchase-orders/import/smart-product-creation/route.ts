import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { ProductInferenceResult } from "@/lib/services/smart-product-inference"
import { syncNewProductToInventory } from "@/lib/services/product-inventory-sync"

// 智能产品创建请求接口
interface SmartProductCreationRequest {
  products: Array<{
    row: number
    name: string
    material: string
    unit: string
    price: number
    description?: string
    categoryName?: string
    quantity: number // 采购数量
    notes?: string // 采购备注
  }>
  purchaseOrderData: {
    supplierId: number
    employeeId: number
    expectedDate?: string
    notes?: string
  }
}

// 产品创建结果接口
interface ProductCreationResult {
  row: number
  productName: string
  success: boolean
  productId?: number
  error?: string
  warnings?: string[]
}

/**
 * 查找或创建产品分类
 */
async function findOrCreateCategory(categoryName: string): Promise<number | null> {
  if (!categoryName) return null
  
  try {
    // 先查找现有分类
    let category = await prisma.productCategory.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: "insensitive"
        }
      }
    })
    
    // 如果不存在则创建
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: categoryName,
          description: `自动创建的分类：${categoryName}`
        }
      })
      console.log(`✅ 创建新分类: ${categoryName}`)
    }
    
    return category.id
  } catch (error) {
    console.error(`❌ 处理分类失败: ${categoryName}`, error)
    return null
  }
}

/**
 * 创建单个产品
 */
async function createSingleProduct(
  productData: SmartProductCreationRequest['products'][0],
  tx: any
): Promise<ProductCreationResult> {
  try {
    console.log(`🔍 开始创建产品: ${productData.name}`)

    // 数据验证
    if (!productData.name || productData.name.trim().length === 0) {
      return {
        row: productData.row,
        productName: productData.name,
        success: false,
        error: '产品名称不能为空'
      }
    }

    if (productData.price < 0) {
      return {
        row: productData.row,
        productName: productData.name,
        success: false,
        error: '产品价格不能为负数'
      }
    }

    // 检查产品名称是否已存在（不区分大小写）
    const existingProduct = await tx.product.findFirst({
      where: {
        name: {
          equals: productData.name.trim(),
          mode: "insensitive"
        },
        type: 'product'
      }
    })

    if (existingProduct) {
      console.log(`⚠️ 产品名称已存在: ${productData.name} (ID: ${existingProduct.id})`)
      return {
        row: productData.row,
        productName: productData.name,
        success: false,
        error: '产品名称已存在',
        warnings: [`现有产品ID: ${existingProduct.id}，建议使用现有产品或修改产品名称`]
      }
    }
    
    // 查找或创建分类
    let categoryId = null
    if (productData.categoryName && productData.categoryName.trim()) {
      try {
        categoryId = await findOrCreateCategory(productData.categoryName.trim())
        console.log(`✅ 分类处理成功: ${productData.categoryName} (ID: ${categoryId})`)
      } catch (categoryError) {
        console.warn(`⚠️ 分类处理失败: ${productData.categoryName}`, categoryError)
        // 分类创建失败不影响产品创建，继续使用null
      }
    }

    // 准备产品数据
    const productCreateData = {
      name: productData.name.trim(),
      price: Math.max(0, productData.price), // 确保价格非负
      commissionRate: 0, // 默认佣金率
      type: "product",
      description: productData.description?.trim() || `${productData.material}材质的${productData.name}，以${productData.unit}为单位销售。`,
      material: productData.material?.trim() || '珐琅',
      unit: productData.unit?.trim() || '套',
      categoryId,
      inventory: 0, // 初始库存为0，通过采购入库增加
      imageUrl: null,
      imageUrls: [],
      barcode: null,
      dimensions: null
    }

    console.log(`📝 创建产品数据:`, productCreateData)

    // 创建产品
    const product = await tx.product.create({
      data: productCreateData
    })
    
    console.log(`✅ 创建产品成功: ${product.name} (ID: ${product.id})`)
    
    console.log(`✅ 产品创建成功: ${product.name} (ID: ${product.id})`)

    // 同步到库存系统（异步处理，不阻塞主流程）
    try {
      await syncNewProductToInventory(product.id)
      console.log(`✅ 产品库存同步成功: ${product.name}`)
    } catch (syncError) {
      console.warn(`⚠️ 产品库存同步失败: ${product.name}`, syncError)
      // 库存同步失败不影响产品创建，记录警告但继续
    }

    return {
      row: productData.row,
      productName: productData.name,
      success: true,
      productId: product.id,
      warnings: categoryId ? undefined : ['未指定分类，产品已创建但未分类']
    }
    
  } catch (error) {
    console.error(`❌ 创建产品失败: ${productData.name}`, error)
    
    let errorMessage = "创建失败"
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        errorMessage = "产品名称重复"
      } else if (error.message.includes("Foreign key constraint")) {
        errorMessage = "关联数据错误"
      } else {
        errorMessage = error.message
      }
    }
    
    return {
      row: productData.row,
      productName: productData.name,
      success: false,
      error: errorMessage
    }
  }
}

/**
 * POST /api/purchase-orders/import/smart-product-creation - 智能批量创建产品
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 智能产品创建API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    // 验证用户存在
    let userId = session.user.id
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!userExists) {
      // 查找管理员用户
      const adminUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: "admin@linghua.com" },
            { email: "simon@linghuaart.com" },
            { role: "admin" }
          ]
        }
      })

      if (adminUser) {
        userId = adminUser.id
        console.log("✅ 使用管理员用户进行操作:", adminUser.email)
      } else {
        return NextResponse.json({
          error: "用户验证失败",
          details: "系统中未找到有效的管理员用户"
        }, { status: 500 })
      }
    }

    const body = await request.json()
    const { products, purchaseOrderData } = body as SmartProductCreationRequest
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "缺少产品数据" }, { status: 400 })
    }
    
    if (!purchaseOrderData || !purchaseOrderData.supplierId || !purchaseOrderData.employeeId) {
      return NextResponse.json({ error: "缺少采购订单数据" }, { status: 400 })
    }
    
    console.log(`📊 开始智能创建 ${products.length} 个产品`)
    
    // 使用数据库事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      const productResults: ProductCreationResult[] = []
      const createdProducts: Array<{ id: number, name: string, row: number, quantity: number, price: number, notes?: string }> = []
      
      // 批量创建产品
      for (const productData of products) {
        const result = await createSingleProduct(productData, tx)
        productResults.push(result)
        
        if (result.success && result.productId) {
          createdProducts.push({
            id: result.productId,
            name: productData.name,
            row: productData.row,
            quantity: productData.quantity,
            price: productData.price,
            notes: productData.notes
          })
        }
      }
      
      // 如果有成功创建的产品，创建对应的采购订单
      const purchaseOrders = []
      if (createdProducts.length > 0) {
        // 导入订单号生成逻辑
        const { generateOrderNumber, OrderType } = await import("@/lib/order-number-generator")
        const orderNumber = await generateOrderNumber(OrderType.PURCHASE)
        
        // 计算总金额
        const totalAmount = createdProducts.reduce((sum, product) => 
          sum + (product.quantity * product.price), 0
        )
        
        // 创建采购订单
        const purchaseOrder = await tx.purchaseOrder.create({
          data: {
            orderNumber,
            supplierId: purchaseOrderData.supplierId,
            employeeId: purchaseOrderData.employeeId,
            orderDate: new Date(),
            expectedDate: purchaseOrderData.expectedDate ? new Date(purchaseOrderData.expectedDate) : null,
            status: "pending",
            approvalStatus: "draft",
            totalAmount,
            notes: purchaseOrderData.notes || "智能产品创建批量导入",
            items: {
              create: createdProducts.map(product => ({
                productId: product.id,
                productName: product.name,
                quantity: product.quantity,
                price: product.price,
                notes: product.notes
              }))
            }
          },
          include: {
            items: true,
            supplier: true,
            employee: true
          }
        })
        
        purchaseOrders.push(purchaseOrder)
        console.log(`✅ 创建采购订单成功: ${purchaseOrder.orderNumber}`)
      }
      
      return {
        productResults,
        createdProducts,
        purchaseOrders
      }
    })
    
    // 统计结果
    const stats = {
      total: result.productResults.length,
      successful: result.productResults.filter(r => r.success).length,
      failed: result.productResults.filter(r => !r.success).length,
      purchaseOrdersCreated: result.purchaseOrders.length
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 智能产品创建完成，耗时: ${responseTime}ms`)
    console.log(`📊 成功: ${stats.successful}/${stats.total}`)
    
    return NextResponse.json({
      success: true,
      message: `成功创建 ${stats.successful} 个产品，生成 ${stats.purchaseOrdersCreated} 个采购订单`,
      data: {
        statistics: stats,
        productResults: result.productResults,
        purchaseOrders: result.purchaseOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          supplierName: order.supplier.name,
          totalAmount: order.totalAmount,
          itemCount: order.items.length
        })),
        failedProducts: result.productResults.filter(r => !r.success)
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 智能产品创建失败:", error)
    
    return NextResponse.json({
      error: "智能产品创建失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
