"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchIcon, FilterIcon, PlusIcon } from "lucide-react"
import { getSales } from "@/lib/actions/sales-actions"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function MobileSales() {
  const [sales, setSales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pos")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const salesData = await getSales()
        setSales(salesData)
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const posSales = sales.filter(sale => sale.type === "POS")
  const orderSales = sales.filter(sale => sale.type === "ORDER")

  const filteredPosSales = posSales.filter(sale => 
    sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.salesItems?.some((item: any) => 
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const filteredOrderSales = orderSales.filter(sale => 
    sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.salesItems?.some((item: any) => 
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索销售记录..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <FilterIcon className="h-4 w-4" />
        </Button>
        <Button size="icon" asChild>
          <Link href={`/m/sales/${activeTab === "pos" ? "pos" : "orders"}/new`}>
            <PlusIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="pos" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pos">POS销售</TabsTrigger>
          <TabsTrigger value="orders">订单销售</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pos" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredPosSales.length > 0 ? (
              filteredPosSales.map((sale) => (
                <Link key={sale.id} href={`/m/sales/pos/${sale.id}`}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">
                          {sale.salesItems?.[0]?.product?.name || "多件商品"}
                          {sale.salesItems?.length > 1 && ` +${sale.salesItems.length - 1}件`}
                        </h3>
                        <span className="text-primary font-bold">¥{sale.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{sale.employee?.name || "未知员工"}</span>
                        <span>{format(new Date(sale.date), 'MM-dd HH:mm', { locale: zhCN })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? '没有找到匹配的POS销售记录' : '暂无POS销售数据'}
              </p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="orders" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrderSales.length > 0 ? (
              filteredOrderSales.map((sale) => (
                <Link key={sale.id} href={`/m/sales/orders/${sale.id}`}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">订单 #{sale.orderNumber || sale.id}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {sale.customer?.name || "未知客户"}
                          </p>
                        </div>
                        <span className="text-primary font-bold">¥{sale.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{sale.status || "处理中"}</span>
                        <span>{format(new Date(sale.date), 'yyyy-MM-dd', { locale: zhCN })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? '没有找到匹配的订单销售记录' : '暂无订单销售数据'}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
