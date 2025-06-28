"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon, CoffeeIcon, PackageIcon, BarChart2Icon } from "lucide-react"
import Link from "next/link"
import { CoffeeShopSales } from "@/components/coffee-shop/coffee-shop-sales"
import { CoffeeShopInventory } from "@/components/coffee-shop/coffee-shop-inventory"
import { getCoffeeShopSales, getCoffeeShopSalesStats } from "@/lib/actions/coffee-shop-actions"
import { toast } from "@/components/ui/use-toast"

export function CoffeeShopPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [salesData, setSalesData] = useState<any>(null)
  const [inventoryData, setInventoryData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // 获取今日统计
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayStats = await getCoffeeShopSalesStats({
          startDate: today,
          endDate: tomorrow
        })

        // 获取本周统计
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekStats = await getCoffeeShopSalesStats({
          startDate: weekStart,
          endDate: tomorrow
        })

        // 获取本月统计
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthStats = await getCoffeeShopSalesStats({
          startDate: monthStart,
          endDate: tomorrow
        })

        // 获取最近销售记录
        const recentSales = await getCoffeeShopSales({ limit: 10 })

        setSalesData({
          todaySales: todayStats.totalSales,
          weekSales: weekStats.totalSales,
          monthSales: monthStats.totalSales,
          todayCustomers: todayStats.totalCustomers,
          recentSales: recentSales
        })

        // 获取库存数据
        // TODO: 实现咖啡店库存数据获取
        setInventoryData({
          totalItems: 0,
          lowStock: 0,
          totalValue: 0,
          categories: []
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching coffee shop data:", error)
        toast({
          title: "加载失败",
          description: "无法加载咖啡店数据",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">咖啡店管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/coffee-shop/purchase/new">
              <PackageIcon className="h-4 w-4 mr-2" />
              采购入库
            </Link>
          </Button>
          <Button asChild>
            <Link href="/coffee-shop/sales/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              新增销售
            </Link>
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">今日销售</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">¥{salesData?.todaySales?.toLocaleString() || 0}</div>
              <CoffeeIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">库存状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{inventoryData?.totalItems || 0}种</div>
              <PackageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            {inventoryData?.lowStock > 0 && (
              <p className="text-sm text-red-500 mt-2">
                {inventoryData.lowStock}种物品库存不足
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">本月销售</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">¥{salesData?.monthSales?.toLocaleString() || 0}</div>
              <BarChart2Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">销售记录</TabsTrigger>
          <TabsTrigger value="inventory">库存管理</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <CoffeeShopSales isLoading={isLoading} salesData={salesData} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <CoffeeShopInventory isLoading={isLoading} inventoryData={inventoryData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
