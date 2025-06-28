import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

interface SearchResult {
  id: string | number
  type: 'product' | 'order' | 'customer' | 'employee' | 'supplier'
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  link: string
  metadata?: Record<string, any>
}

/**
 * 简化的全局搜索API
 */
export async function GET(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = req.nextUrl
    const query = searchParams.get("q")

    // 验证查询参数
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim()
    const results: SearchResult[] = []

    // 并行搜索所有类型
    const [products, orders, customers, employees, suppliers] = await Promise.all([
      searchProducts(searchTerm),
      searchOrders(searchTerm),
      searchCustomers(searchTerm),
      searchEmployees(searchTerm),
      searchSuppliers(searchTerm),
    ])

    // 合并结果并限制数量
    results.push(...products.slice(0, 3))
    results.push(...orders.slice(0, 3))
    results.push(...customers.slice(0, 3))
    results.push(...employees.slice(0, 2))
    results.push(...suppliers.slice(0, 2))

    // 按相关性排序（简单的字符串匹配优先级）
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm.toLowerCase())
      const bExact = b.title.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      return a.title.localeCompare(b.title)
    })

    return NextResponse.json({ 
      results: results.slice(0, 15), // 最多返回15个结果
      total: results.length 
    })
  } catch (error) {
    console.error("简化搜索失败:", error)
    return NextResponse.json(
      { error: "搜索失败" },
      { status: 500 }
    )
  }
}

/**
 * 搜索产品
 */
async function searchProducts(query: string): Promise<SearchResult[]> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      productCategory: true,
    },
    take: 5,
  })

  return products.map(product => ({
    id: product.id,
    type: 'product' as const,
    title: product.name,
    subtitle: `¥${product.price} • ${product.productCategory?.name || '未分类'}`,
    description: product.description || `SKU: ${product.sku}`,
    imageUrl: product.imageUrl || product.imageUrls?.[0],
    link: `/products/${product.id}`,
    metadata: {
      price: product.price,
      inventory: product.inventory,
      category: product.productCategory?.name,
    },
  }))
}

/**
 * 搜索订单
 */
async function searchOrders(query: string): Promise<SearchResult[]> {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { customer: { name: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: {
      customer: true,
      employee: true,
    },
    take: 5,
  })

  return orders.map(order => ({
    id: order.id,
    type: 'order' as const,
    title: order.orderNumber,
    subtitle: `${order.customer.name} • ¥${order.totalAmount}`,
    description: `状态: ${getOrderStatusText(order.status)} • ${order.orderDate.toLocaleDateString()}`,
    link: `/sales/orders/${order.id}`,
    metadata: {
      status: order.status,
      totalAmount: order.totalAmount,
      customerName: order.customer.name,
    },
  }))
}

/**
 * 搜索客户
 */
async function searchCustomers(query: string): Promise<SearchResult[]> {
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  })

  return customers.map(customer => ({
    id: customer.id,
    type: 'customer' as const,
    title: customer.name,
    subtitle: customer.phone || customer.email || '',
    description: customer.address || `类型: ${getCustomerTypeText(customer.type)}`,
    link: `/customers/${customer.id}`,
    metadata: {
      type: customer.type,
      phone: customer.phone,
      email: customer.email,
    },
  }))
}

/**
 * 搜索员工
 */
async function searchEmployees(query: string): Promise<SearchResult[]> {
  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { position: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  })

  return employees.map(employee => ({
    id: employee.id,
    type: 'employee' as const,
    title: employee.name,
    subtitle: `${employee.position} • ${employee.phone || ''}`,
    description: `状态: ${getEmployeeStatusText(employee.status)}`,
    link: `/employees/${employee.id}`,
    metadata: {
      position: employee.position,
      status: employee.status,
      phone: employee.phone,
    },
  }))
}

/**
 * 搜索供应商
 */
async function searchSuppliers(query: string): Promise<SearchResult[]> {
  const suppliers = await prisma.supplier.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { contactPerson: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  })

  return suppliers.map(supplier => ({
    id: supplier.id,
    type: 'supplier' as const,
    title: supplier.name,
    subtitle: `${supplier.contactPerson || ''} • ${supplier.phone || ''}`,
    description: supplier.address || supplier.description || '',
    link: `/suppliers/${supplier.id}`,
    metadata: {
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      address: supplier.address,
    },
  }))
}

// 辅助函数
function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

function getCustomerTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    individual: '个人客户',
    corporate: '企业客户',
    vip: 'VIP客户',
  }
  return typeMap[type] || type
}

function getEmployeeStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: '在职',
    inactive: '离职',
    suspended: '停职',
  }
  return statusMap[status] || status
}
