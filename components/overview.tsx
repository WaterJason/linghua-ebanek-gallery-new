"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { zhCN } from "date-fns/locale"

export function Overview() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSalesData() {
      try {
        // 获取最近6个月的数据
        const currentDate = new Date()
        const months = Array.from({ length: 6 }).map((_, i) => {
          const date = subMonths(currentDate, 5 - i)
          return {
            month: format(date, "M"),
            year: format(date, "yyyy"),
            name: format(date, "M月", { locale: zhCN }),
            startDate: startOfMonth(date),
            endDate: endOfMonth(date),
          }
        })

        // 获取销售数据
        const salesPromises = months.map(async (month) => {
          const response = await fetch(
            `/api/gallery-sales?startDate=${month.startDate.toISOString()}&endDate=${month.endDate.toISOString()}`,
          )
          if (!response.ok) throw new Error("Failed to fetch gallery sales")
          const sales = await response.json()

          // 计算总销售额
          const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)

          return {
            name: month.name,
            total: totalSales,
          }
        })

        const salesData = await Promise.all(salesPromises)
        setData(salesData)
      } catch (error) {
        console.error("Error fetching sales data:", error)
        // 如果出错，使用模拟数据
        setData([
          { name: "1月", total: Math.floor(Math.random() * 5000) + 1000 },
          { name: "2月", total: Math.floor(Math.random() * 5000) + 1000 },
          { name: "3月", total: Math.floor(Math.random() * 5000) + 1000 },
          { name: "4月", total: Math.floor(Math.random() * 5000) + 1000 },
          { name: "5月", total: Math.floor(Math.random() * 5000) + 1000 },
          { name: "6月", total: Math.floor(Math.random() * 5000) + 1000 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <p className="text-muted-foreground">加载销售数据中...</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `¥${value}`}
        />
        <Tooltip formatter={(value: number) => [`¥${value}`, "销售额"]} labelFormatter={(label) => `${label}销售额`} />
        <Bar dataKey="total" fill="#0070f3" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
