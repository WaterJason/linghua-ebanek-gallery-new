import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { CostAccountingEngine } from '@/lib/cost-accounting/cost-accounting-engine'

const costEngine = new CostAccountingEngine()

/**
 * GET /api/cost-accounting/piece-work - 获取计件工资记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const employeeId = searchParams.get('employeeId')
    const workType = searchParams.get('workType')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (employeeId) {
      where.employeeId = parseInt(employeeId)
    }
    
    if (workType) {
      where.workType = workType
    }
    
    if (location) {
      where.location = { contains: location }
    }
    
    if (status) {
      where.status = status
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }
    
    if (startDate || endDate) {
      where.workDate = {}
      if (startDate) {
        where.workDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.workDate.lte = new Date(endDate)
      }
    }

    // 获取计件工资记录
    const [records, total] = await Promise.all([
      prisma.pieceWorkRecord.findMany({
        where,
        include: {
          employee: true,
          productionOrder: {
            include: {
              product: true
            }
          },
          reviewer: true,
          payer: true
        },
        orderBy: {
          workDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.pieceWorkRecord.count({ where })
    ])

    // 计算汇总信息
    const summary = await prisma.pieceWorkRecord.aggregate({
      where,
      _sum: { 
        totalAmount: true,
        pieceCount: true,
        qualityBonus: true,
        qualityPenalty: true
      },
      _count: { id: true }
    })

    return NextResponse.json({
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: summary._sum.totalAmount || 0,
        totalPieces: summary._sum.pieceCount || 0,
        totalBonus: summary._sum.qualityBonus || 0,
        totalPenalty: summary._sum.qualityPenalty || 0,
        totalRecords: summary._count.id || 0
      }
    })
  } catch (error) {
    console.error('获取计件工资记录失败:', error)
    return NextResponse.json(
      { error: '获取计件工资记录失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cost-accounting/piece-work - 记录计件工资
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productionOrderId,
      employeeId,
      workDate,
      workType,
      location,
      pieceCount,
      pieceRate,
      qualityGrade,
      qualityBonus,
      qualityPenalty,
      notes
    } = body

    // 验证必填字段
    if (!employeeId || !workDate || !workType || !location || !pieceCount || !pieceRate) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 验证员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: '员工不存在' },
        { status: 404 }
      )
    }

    // 如果关联了生产订单，验证是否存在
    if (productionOrderId) {
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: productionOrderId }
      })

      if (!productionOrder) {
        return NextResponse.json(
          { error: '生产订单不存在' },
          { status: 404 }
        )
      }
    }

    // 记录计件工资
    const pieceWorkRecord = await costEngine.recordPieceWork({
      productionOrderId,
      employeeId,
      workDate: new Date(workDate),
      workType,
      location,
      pieceCount,
      pieceRate,
      qualityGrade,
      qualityBonus,
      qualityPenalty,
      notes
    })

    return NextResponse.json(pieceWorkRecord, { status: 201 })
  } catch (error) {
    console.error('记录计件工资失败:', error)
    return NextResponse.json(
      { error: error.message || '记录计件工资失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/cost-accounting/piece-work - 批量审核计件工资
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, recordIds, reviewedBy, reviewNotes } = body

    if (!action || !recordIds || !Array.isArray(recordIds) || !reviewedBy) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'approve':
        await costEngine.batchApprovePieceWork(recordIds, reviewedBy, reviewNotes)
        result = { message: '批量审核通过成功' }
        break
        
      case 'reject':
        await prisma.pieceWorkRecord.updateMany({
          where: {
            id: { in: recordIds },
            status: 'PENDING'
          },
          data: {
            status: 'REJECTED',
            reviewedBy,
            reviewedAt: new Date(),
            reviewNotes
          }
        })
        result = { message: '批量拒绝成功' }
        break
        
      case 'pay':
        await prisma.pieceWorkRecord.updateMany({
          where: {
            id: { in: recordIds },
            status: 'APPROVED',
            paymentStatus: 'UNPAID'
          },
          data: {
            paymentStatus: 'PAID',
            paidBy: reviewedBy,
            paidAt: new Date()
          }
        })
        result = { message: '批量支付成功' }
        break
        
      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('批量操作计件工资失败:', error)
    return NextResponse.json(
      { error: error.message || '批量操作计件工资失败' },
      { status: 500 }
    )
  }
}
