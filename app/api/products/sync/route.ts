import { NextRequest, NextResponse } from "next/server"
import { 
  validateProductInventoryConsistency,
  batchSyncProductsToInventory,
  syncNewProductToInventory,
  syncProductUpdateToInventory,
  syncProductDeleteToInventory
} from "@/lib/services/product-inventory-sync"

/**
 * GET /api/products/sync - 验证产品与库存数据一致性
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'validate'

    if (action === 'validate') {
      const result = await validateProductInventoryConsistency()
      
      return NextResponse.json({
        success: true,
        validation: result,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      availableActions: [
        "validate",
        "batch_sync",
        "sync_product",
        "fix_inconsistencies"
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error in product sync validation:", error)
    return NextResponse.json({ 
      error: "同步验证失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * POST /api/products/sync - 执行产品与库存同步操作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productId, productIds, data } = body

    if (!action) {
      return NextResponse.json({ error: "缺少操作类型" }, { status: 400 })
    }

    let result

    switch (action) {
      case 'sync_new_product':
        if (!productId) {
          return NextResponse.json({ error: "缺少产品ID" }, { status: 400 })
        }
        result = await syncNewProductToInventory(productId)
        break

      case 'sync_product_update':
        if (!productId || !data) {
          return NextResponse.json({ error: "缺少产品ID或更新数据" }, { status: 400 })
        }
        result = await syncProductUpdateToInventory(productId, data)
        break

      case 'sync_product_delete':
        if (!productId) {
          return NextResponse.json({ error: "缺少产品ID" }, { status: 400 })
        }
        result = await syncProductDeleteToInventory(productId)
        break

      case 'batch_sync':
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json({ error: "缺少产品ID列表" }, { status: 400 })
        }
        result = await batchSyncProductsToInventory(productIds)
        break

      case 'fix_inconsistencies':
        // 先验证数据一致性
        const validation = await validateProductInventoryConsistency()
        
        if (validation.success) {
          result = {
            success: true,
            message: "数据一致，无需修复",
            details: validation.details
          }
        } else {
          // 自动修复不一致的数据
          const inconsistencies = validation.details?.inconsistencies || []
          const fixResults = []
          
          for (const issue of inconsistencies) {
            try {
              // 使用实际库存更新产品表
              const fixResult = await syncProductUpdateToInventory(
                issue.productId, 
                { inventory: issue.actualInventory }
              )
              fixResults.push({ productId: issue.productId, ...fixResult })
            } catch (error) {
              fixResults.push({
                productId: issue.productId,
                success: false,
                message: "修复失败",
                details: error instanceof Error ? error.message : "未知错误"
              })
            }
          }
          
          const successCount = fixResults.filter(r => r.success).length
          
          result = {
            success: successCount === fixResults.length,
            message: `数据修复完成: 成功 ${successCount}/${fixResults.length} 个`,
            details: {
              totalIssues: inconsistencies.length,
              fixResults
            }
          }
        }
        break

      default:
        return NextResponse.json({ error: "不支持的操作类型" }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.details,
      affectedItems: result.affectedInventoryItems,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error in product sync operation:", error)
    return NextResponse.json({ 
      error: "同步操作失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
