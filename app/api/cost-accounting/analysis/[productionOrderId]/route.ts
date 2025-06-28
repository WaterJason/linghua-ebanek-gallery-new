import { NextRequest, NextResponse } from 'next/server'
import { CostAccountingEngine } from '@/lib/cost-accounting/cost-accounting-engine'

const costEngine = new CostAccountingEngine()

/**
 * GET /api/cost-accounting/analysis/[productionOrderId] - 获取生产订单成本分析
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productionOrderId: string } }
) {
  try {
    const productionOrderId = parseInt(params.productionOrderId)

    if (isNaN(productionOrderId)) {
      return NextResponse.json(
        { error: '无效的生产订单ID' },
        { status: 400 }
      )
    }

    // 生成成本分析报告
    const analysis = await costEngine.generateCostAnalysis(productionOrderId)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('生成成本分析失败:', error)
    return NextResponse.json(
      { error: error.message || '生成成本分析失败' },
      { status: 500 }
    )
  }
}
