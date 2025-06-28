import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('type') || 'overview'
    const format = searchParams.get('format') || 'excel'

    // 构建日期过滤条件
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const whereClause = Object.keys(dateFilter).length > 0 
      ? { orderDate: dateFilter }
      : {}

    // 获取生产订单数据
    const orders = await prisma.productionOrder.findMany({
      where: whereClause,
      include: {
        product: true,
        employee: true,
        productionBase: true,
        stageHistories: true,
        statusUpdates: true,
        costRecords: true,
        qualityRecords: true
      },
      orderBy: { orderDate: 'desc' }
    })

    if (format === 'excel') {
      return generateExcelReport(orders, reportType)
    } else if (format === 'pdf') {
      return generatePDFReport(orders, reportType)
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error exporting production report:', error)
    return NextResponse.json(
      { error: 'Failed to export production report' },
      { status: 500 }
    )
  }
}

function generateExcelReport(orders: any[], reportType: string) {
  // 生成CSV格式的数据（简化版Excel）
  const headers = [
    '订单编号',
    '产品名称',
    '数量',
    '当前阶段',
    '状态',
    '优先级',
    '负责人',
    '生产基地',
    '订单日期',
    '预计完成日期',
    '进度百分比',
    '总金额',
    '地点',
    '备注'
  ]

  const rows = orders.map(order => [
    order.orderNumber || '',
    order.product?.name || '',
    order.quantity || 0,
    getStageDisplayName(order.currentStage),
    getStatusDisplayName(order.status),
    getPriorityDisplayName(order.priority),
    order.employee?.name || '',
    order.productionBase?.name || '',
    order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
    order.estimatedCompletionDate ? new Date(order.estimatedCompletionDate).toLocaleDateString() : '',
    order.progressPercentage || 0,
    order.totalAmount || 0,
    order.location || '',
    order.notes || ''
  ])

  // 生成CSV内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // 添加BOM以支持中文
  const bom = '\uFEFF'
  const csvWithBom = bom + csvContent

  return new NextResponse(csvWithBom, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="production-report-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

function generatePDFReport(orders: any[], reportType: string) {
  // 生成简化的HTML报表（可以后续集成PDF生成库）
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>生产报表</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>生产报表</h1>
      <div class="summary">
        <h3>汇总信息</h3>
        <p>总订单数: ${orders.length}</p>
        <p>已完成: ${orders.filter(o => o.status === 'COMPLETED').length}</p>
        <p>进行中: ${orders.filter(o => o.status === 'IN_PROGRESS').length}</p>
        <p>生成时间: ${new Date().toLocaleString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>订单编号</th>
            <th>产品名称</th>
            <th>数量</th>
            <th>当前阶段</th>
            <th>状态</th>
            <th>负责人</th>
            <th>进度</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>${order.orderNumber || ''}</td>
              <td>${order.product?.name || ''}</td>
              <td>${order.quantity || 0}</td>
              <td>${getStageDisplayName(order.currentStage)}</td>
              <td>${getStatusDisplayName(order.status)}</td>
              <td>${order.employee?.name || ''}</td>
              <td>${order.progressPercentage || 0}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="production-report-${new Date().toISOString().split('T')[0]}.html"`
    }
  })
}

function getStageDisplayName(stage: string): string {
  const stageNames: { [key: string]: string } = {
    'DESIGN': '设计',
    'MATERIAL_PROCUREMENT': '采购',
    'SHIPPING_TO_PRODUCTION': '发送',
    'IN_PRODUCTION': '制作',
    'QUALITY_CHECK': '质检',
    'SHIPPING_BACK': '返回',
    'PACKAGING': '包装',
    'SALES_READY': '销售'
  }
  return stageNames[stage] || stage
}

function getStatusDisplayName(status: string): string {
  const statusNames: { [key: string]: string } = {
    'PENDING': '待处理',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'DELAYED': '延期',
    'CANCELLED': '已取消'
  }
  return statusNames[status] || status
}

function getPriorityDisplayName(priority: string): string {
  const priorityNames: { [key: string]: string } = {
    'LOW': '低',
    'NORMAL': '普通',
    'HIGH': '高',
    'URGENT': '紧急'
  }
  return priorityNames[priority] || priority
}
