"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, FilterIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function CoffeeShopSales({ isLoading, salesData }: { isLoading: boolean, salesData: any }) {
  const [searchQuery, setSearchQuery] = useState("")
  const sales = salesData?.recentSales || []

  // 过滤销售记录
  const filteredSales = Array.isArray(sales) ? sales.filter(sale => {
    // 安全检查：确保sale对象存在必要的属性
    if (!sale) return false

    // 如果没有搜索查询，返回所有记录
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()

    // 检查员工名称
    const employeeMatch = sale.employee?.name &&
      sale.employee.name.toLowerCase().includes(query)

    // 检查备注
    const notesMatch = sale.notes &&
      sale.notes.toLowerCase().includes(query)

    // 检查支付方式
    let paymentMatch = false
    if (sale.paymentMethods) {
      try {
        const methods = typeof sale.paymentMethods === 'string' ?
          JSON.parse(sale.paymentMethods) : sale.paymentMethods
        paymentMatch = query.includes('现金') && methods.cash > 0 ||
                     query.includes('微信') && methods.wechat > 0 ||
                     query.includes('支付宝') && methods.alipay > 0 ||
                     query.includes('银行卡') && methods.card > 0
      } catch {
        // 忽略JSON解析错误
      }
    }

    return employeeMatch || notesMatch || paymentMatch
  }) : []

  // 表格列定义
  const columns = [
    {
      accessorKey: "date",
      header: "日期时间",
      cell: ({ row }: any) => format(new Date(row.original.date), "yyyy-MM-dd HH:mm", { locale: zhCN }),
    },
    {
      accessorKey: "totalSales",
      header: "销售额",
      cell: ({ row }: any) => `¥${row.original.totalSales?.toFixed(2) || '0.00'}`,
    },
    {
      accessorKey: "customerCount",
      header: "客户数量",
      cell: ({ row }: any) => `${row.original.customerCount || 0}人`,
    },
    {
      accessorKey: "paymentMethods",
      header: "支付方式",
      cell: ({ row }: any) => {
        const paymentMethods = row.original.paymentMethods
        if (!paymentMethods) return '-'

        try {
          const methods = typeof paymentMethods === 'string' ? JSON.parse(paymentMethods) : paymentMethods
          const methodsList = []
          if (methods.cash > 0) methodsList.push(`现金¥${methods.cash}`)
          if (methods.wechat > 0) methodsList.push(`微信¥${methods.wechat}`)
          if (methods.alipay > 0) methodsList.push(`支付宝¥${methods.alipay}`)
          if (methods.card > 0) methodsList.push(`银行卡¥${methods.card}`)
          return methodsList.length > 0 ? methodsList.join(', ') : '-'
        } catch {
          return '-'
        }
      },
    },
    {
      accessorKey: "employee",
      header: "操作员",
      cell: ({ row }: any) => row.original.employee?.name || '-',
    },
    {
      accessorKey: "notes",
      header: "备注",
      cell: ({ row }: any) => row.original.notes || '-',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索员工、备注或支付方式..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <FilterIcon className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>销售记录</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSales}
            isLoading={isLoading}
            noResultsMessage="没有找到匹配的销售记录"
          />
        </CardContent>
      </Card>

      {salesData?.popularItems && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>热销商品</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salesData.popularItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">销量: {item.count}件</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">¥{item.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
