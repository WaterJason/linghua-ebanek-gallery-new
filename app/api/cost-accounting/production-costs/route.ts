import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { CostAccountingEngine } from '@/lib/cost-accounting/cost-accounting-engine'

const costEngine = new CostAccountingEngine()

/**
 * GET /api/cost-accounting/production-costs - 获取生产成本记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const productionOrderId = searchParams.get('productionOrderId')
    const costCategory = searchParams.get('costCategory')
    const stage = searchParams.get('stage')
    const location = searchParams.get('location')
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (productionOrderId) {
      where.productionOrderId = parseInt(productionOrderId)
    }
    
    if (costCategory) {
      where.costCategory = costCategory
    }
    
    if (stage) {
      where.stage = stage
    }
    
    if (location) {
      where.location = { contains: location }
    }
    
    if (employeeId) {
      where.employeeId = parseInt(employeeId)
    }
    
    if (startDate || endDate) {
      where.recordedDate = {}
      if (startDate) {
        where.recordedDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.recordedDate.lte = new Date(endDate)
      }
    }

    // 获取成本记录
    const [costs, total] = await Promise.all([
      prisma.productionCostDetail.findMany({
        where,
        include: {
          productionOrder: {
            include: {
              product: true
            }
          },
          employee: true,
          recordedByUser: true
        },
        orderBy: {
          recordedDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.productionCostDetail.count({ where })
    ])

    // 计算汇总信息
    const summary = await prisma.productionCostDetail.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true }
    })

    return NextResponse.json({
      data: costs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalRecords: summary._count.id || 0
      }
    })
  } catch (error) {
    console.error('获取生产成本记录失败:', error)
    return NextResponse.json(
      { error: '获取生产成本记录失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cost-accounting/production-costs - 记录生产成本
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productionOrderId,
      costCategory,
      costType,
      stage,
      location,
      amount,
      quantity,
      description,
      employeeId,
      recordedBy,
      workType,
      workHours,
      hourlyRate,
      pieceRate,
      pieceCount,
      materialType,
      supplier,
      shippingMethod,
      distance,
      weight
    } = body

    // 验证必填字段
    if (!productionOrderId || !costCategory || !costType || !stage || !location || !amount || !recordedBy) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 验证生产订单是否存在
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId }
    })

    if (!productionOrder) {
      return NextResponse.json(
        { error: '生产订单不存在' },
        { status: 404 }
      )
    }

    // 记录生产成本
    const costRecord = await costEngine.recordProductionCost({
      productionOrderId,
      costCategory,
      costType,
      stage,
      location,
      amount,
      quantity,
      description,
      employeeId,
      recordedBy,
      workType,
      workHours,
      hourlyRate,
      pieceRate,
      pieceCount,
      materialType,
      supplier,
      shippingMethod,
      distance,
      weight
    })

    return NextResponse.json(costRecord, { status: 201 })
  } catch (error) {
    console.error('记录生产成本失败:', error)
    return NextResponse.json(
      { error: error.message || '记录生产成本失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/cost-accounting/production-costs - 批量更新成本记录
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { costIds, updateData } = body

    if (!costIds || !Array.isArray(costIds) || !updateData) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 批量更新成本记录
    const updatedCosts = await prisma.productionCostDetail.updateMany({
      where: {
        id: { in: costIds }
      },
      data: updateData
    })

    // 重新计算相关生产订单的总成本
    const affectedOrders = await prisma.productionCostDetail.findMany({
      where: { id: { in: costIds } },
      select: { productionOrderId: true },
      distinct: ['productionOrderId']
    })

    for (const order of affectedOrders) {
      const totalCost = await prisma.productionCostDetail.aggregate({
        where: { productionOrderId: order.productionOrderId },
        _sum: { amount: true }
      })

      await prisma.productionOrder.update({
        where: { id: order.productionOrderId },
        data: { totalAmount: totalCost._sum.amount || 0 }
      })
    }

    return NextResponse.json({
      message: '批量更新成功',
      updatedCount: updatedCosts.count
    })
  } catch (error) {
    console.error('批量更新成本记录失败:', error)
    return NextResponse.json(
      { error: '批量更新成本记录失败' },
      { status: 500 }
    )
  }
}
