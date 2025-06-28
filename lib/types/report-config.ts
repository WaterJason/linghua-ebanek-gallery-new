// 个性化报表配置类型定义

export interface ReportField {
  id: string
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency'
  sortable: boolean
  filterable: boolean
  aggregatable?: boolean
  format?: string
}

export interface ReportFilter {
  fieldId: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in'
  value: any
  label?: string
}

export interface ReportSort {
  fieldId: string
  direction: 'asc' | 'desc'
  priority: number
}

export interface ReportGrouping {
  fieldId: string
  aggregations: {
    fieldId: string
    function: 'sum' | 'avg' | 'count' | 'min' | 'max'
  }[]
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'table'
  xAxis?: string
  yAxis?: string[]
  groupBy?: string
  colors?: string[]
  options?: Record<string, any>
}

export interface ReportConfig {
  id: string
  name: string
  description?: string
  reportType: 'sales' | 'inventory' | 'finance' | 'employee' | 'customer' | 'production'
  fields: string[] // 选中的字段ID
  filters: ReportFilter[]
  sorts: ReportSort[]
  grouping?: ReportGrouping
  chartConfig: ChartConfig
  isDefault: boolean
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  reportType: string
  config: Partial<ReportConfig>
  isSystem: boolean
}

// 预定义的报表字段配置
export const REPORT_FIELDS: Record<string, ReportField[]> = {
  sales: [
    { id: 'date', name: 'date', label: '日期', type: 'date', sortable: true, filterable: true },
    { id: 'orderId', name: 'orderId', label: '订单号', type: 'string', sortable: true, filterable: true },
    { id: 'customerName', name: 'customerName', label: '客户姓名', type: 'string', sortable: true, filterable: true },
    { id: 'productName', name: 'productName', label: '产品名称', type: 'string', sortable: true, filterable: true },
    { id: 'category', name: 'category', label: '产品类别', type: 'string', sortable: true, filterable: true },
    { id: 'quantity', name: 'quantity', label: '数量', type: 'number', sortable: true, filterable: true, aggregatable: true },
    { id: 'unitPrice', name: 'unitPrice', label: '单价', type: 'currency', sortable: true, filterable: true },
    { id: 'totalAmount', name: 'totalAmount', label: '总金额', type: 'currency', sortable: true, filterable: true, aggregatable: true },
    { id: 'discount', name: 'discount', label: '折扣', type: 'currency', sortable: true, filterable: true },
    { id: 'paymentMethod', name: 'paymentMethod', label: '支付方式', type: 'string', sortable: true, filterable: true },
    { id: 'employeeName', name: 'employeeName', label: '销售员', type: 'string', sortable: true, filterable: true },
    { id: 'channel', name: 'channel', label: '销售渠道', type: 'string', sortable: true, filterable: true },
    { id: 'status', name: 'status', label: '状态', type: 'string', sortable: true, filterable: true }
  ],
  inventory: [
    { id: 'productId', name: 'productId', label: '产品ID', type: 'string', sortable: true, filterable: true },
    { id: 'productName', name: 'productName', label: '产品名称', type: 'string', sortable: true, filterable: true },
    { id: 'category', name: 'category', label: '产品类别', type: 'string', sortable: true, filterable: true },
    { id: 'sku', name: 'sku', label: 'SKU', type: 'string', sortable: true, filterable: true },
    { id: 'warehouseName', name: 'warehouseName', label: '仓库', type: 'string', sortable: true, filterable: true },
    { id: 'quantity', name: 'quantity', label: '当前库存', type: 'number', sortable: true, filterable: true, aggregatable: true },
    { id: 'minQuantity', name: 'minQuantity', label: '最小库存', type: 'number', sortable: true, filterable: true },
    { id: 'maxQuantity', name: 'maxQuantity', label: '最大库存', type: 'number', sortable: true, filterable: true },
    { id: 'unitCost', name: 'unitCost', label: '单位成本', type: 'currency', sortable: true, filterable: true },
    { id: 'totalValue', name: 'totalValue', label: '库存价值', type: 'currency', sortable: true, filterable: true, aggregatable: true },
    { id: 'lastUpdated', name: 'lastUpdated', label: '最后更新', type: 'date', sortable: true, filterable: true },
    { id: 'status', name: 'status', label: '状态', type: 'string', sortable: true, filterable: true }
  ],
  finance: [
    { id: 'date', name: 'date', label: '日期', type: 'date', sortable: true, filterable: true },
    { id: 'type', name: 'type', label: '类型', type: 'string', sortable: true, filterable: true },
    { id: 'category', name: 'category', label: '分类', type: 'string', sortable: true, filterable: true },
    { id: 'description', name: 'description', label: '描述', type: 'string', sortable: true, filterable: true },
    { id: 'amount', name: 'amount', label: '金额', type: 'currency', sortable: true, filterable: true, aggregatable: true },
    { id: 'revenue', name: 'revenue', label: '收入', type: 'currency', sortable: true, filterable: true, aggregatable: true },
    { id: 'expense', name: 'expense', label: '支出', type: 'currency', sortable: true, filterable: true, aggregatable: true },
    { id: 'profit', name: 'profit', label: '利润', type: 'currency', sortable: true, filterable: true, aggregatable: true },
    { id: 'account', name: 'account', label: '账户', type: 'string', sortable: true, filterable: true },
    { id: 'reference', name: 'reference', label: '参考号', type: 'string', sortable: true, filterable: true },
    { id: 'employeeName', name: 'employeeName', label: '经手人', type: 'string', sortable: true, filterable: true }
  ]
}

// 预定义的报表模板
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'sales-summary',
    name: '销售汇总报表',
    description: '按产品类别和时间汇总的销售数据',
    reportType: 'sales',
    isSystem: true,
    config: {
      fields: ['date', 'category', 'quantity', 'totalAmount'],
      sorts: [{ fieldId: 'date', direction: 'desc', priority: 1 }],
      chartConfig: { type: 'bar', xAxis: 'category', yAxis: ['totalAmount'] }
    }
  },
  {
    id: 'sales-detail',
    name: '销售明细报表',
    description: '详细的销售记录',
    reportType: 'sales',
    isSystem: true,
    config: {
      fields: ['date', 'orderId', 'customerName', 'productName', 'quantity', 'unitPrice', 'totalAmount', 'employeeName'],
      sorts: [{ fieldId: 'date', direction: 'desc', priority: 1 }],
      chartConfig: { type: 'table' }
    }
  },
  {
    id: 'inventory-status',
    name: '库存状态报表',
    description: '当前库存状况和预警',
    reportType: 'inventory',
    isSystem: true,
    config: {
      fields: ['productName', 'category', 'warehouseName', 'quantity', 'minQuantity', 'status'],
      sorts: [{ fieldId: 'quantity', direction: 'asc', priority: 1 }],
      chartConfig: { type: 'table' }
    }
  },
  {
    id: 'finance-overview',
    name: '财务概览报表',
    description: '收支情况和利润分析',
    reportType: 'finance',
    isSystem: true,
    config: {
      fields: ['date', 'type', 'category', 'revenue', 'expense', 'profit'],
      sorts: [{ fieldId: 'date', direction: 'desc', priority: 1 }],
      chartConfig: { type: 'line', xAxis: 'date', yAxis: ['revenue', 'expense', 'profit'] }
    }
  }
]

// 图表类型配置
export const CHART_TYPES = [
  { value: 'table', label: '表格', icon: '📊' },
  { value: 'bar', label: '柱状图', icon: '📊' },
  { value: 'line', label: '折线图', icon: '📈' },
  { value: 'pie', label: '饼图', icon: '🥧' },
  { value: 'area', label: '面积图', icon: '📊' },
  { value: 'scatter', label: '散点图', icon: '⚪' }
]

// 过滤器操作符配置
export const FILTER_OPERATORS = [
  { value: 'equals', label: '等于', types: ['string', 'number', 'date', 'boolean'] },
  { value: 'contains', label: '包含', types: ['string'] },
  { value: 'startsWith', label: '开始于', types: ['string'] },
  { value: 'endsWith', label: '结束于', types: ['string'] },
  { value: 'greaterThan', label: '大于', types: ['number', 'date', 'currency'] },
  { value: 'lessThan', label: '小于', types: ['number', 'date', 'currency'] },
  { value: 'between', label: '介于', types: ['number', 'date', 'currency'] },
  { value: 'in', label: '在列表中', types: ['string', 'number'] }
]

// 聚合函数配置
export const AGGREGATION_FUNCTIONS = [
  { value: 'sum', label: '求和', types: ['number', 'currency'] },
  { value: 'avg', label: '平均值', types: ['number', 'currency'] },
  { value: 'count', label: '计数', types: ['string', 'number', 'date', 'boolean', 'currency'] },
  { value: 'min', label: '最小值', types: ['number', 'date', 'currency'] },
  { value: 'max', label: '最大值', types: ['number', 'date', 'currency'] }
]
