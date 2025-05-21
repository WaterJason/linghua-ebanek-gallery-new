"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentSales() {
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentSales() {
      try {
        const response = await fetch("/api/gallery-sales?limit=5")
        if (!response.ok) throw new Error("Failed to fetch recent sales")

        const sales = await response.json()
        setRecentSales(sales.slice(0, 5)) // 只取前5条
      } catch (error) {
        console.error("Error fetching recent sales:", error)
        setRecentSales([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [])

  if (loading) {
    return <div className="text-center py-4">加载最近销售数据中...</div>
  }

  if (recentSales.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">暂无销售数据</div>
  }

  return (
    <div className="space-y-8">
      {recentSales.map((sale) => {
        // 获取第一个销售项目作为展示
        const firstItem = sale.salesItems && sale.salesItems.length > 0 ? sale.salesItems[0] : null
        const productName = firstItem ? firstItem.product.name : "未知产品"

        return (
          <div key={sale.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Avatar" />
              <AvatarFallback>{sale.employee.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{sale.employee.name}</p>
              <p className="text-sm text-muted-foreground">{productName}</p>
            </div>
            <div className="ml-auto font-medium">+¥{sale.totalAmount.toFixed(2)}</div>
          </div>
        )
      })}
    </div>
  )
}
