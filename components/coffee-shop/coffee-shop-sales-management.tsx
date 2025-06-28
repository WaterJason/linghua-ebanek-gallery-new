"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  PlusIcon,
  SearchIcon,
  CoffeeIcon,
  DollarSignIcon,
  TrendingUpIcon,
  UsersIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"
import { CoffeeShopEntryForm } from "@/components/coffee-shop-entry-form"
import { getCoffeeShopSales } from "@/lib/actions/coffee-shop-actions"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function CoffeeShopSalesManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [salesData, setSalesData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEntryForm, setShowEntryForm] = useState(false)

  // 加载销售数据
  useEffect(() => {
    loadSalesData()
  }, [])

  const loadSalesData = async () => {
    try {
      setIsLoading(true)
      const data = await getCoffeeShopSales()
      setSalesData(data)
    } catch (error) {
      console.error("Error loading coffee shop sales:", error)
      toast({
        title: "加载失败",
        description: "无法加载咖啡店销售数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 计算统计数据
  const stats = {
    todaySales: salesData.filter(sale => {
      const today = new Date().toDateString()
      return new Date(sale.date).toDateString() === today
    }).reduce((sum, sale) => sum + sale.totalSales, 0),

    weekSales: salesData.filter(sale => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(sale.date) >= weekAgo
    }).reduce((sum, sale) => sum + sale.totalSales, 0),

    monthSales: salesData.filter(sale => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(sale.date) >= monthAgo
    }).reduce((sum, sale) => sum + sale.totalSales, 0),

    totalCustomers: salesData.reduce((sum, sale) => sum + sale.customerCount, 0)
  }

  // 过滤销售记录
  const filteredSales = salesData.filter(sale =>
    sale.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(sale.date).toLocaleDateString().includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日销售</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">今日营业额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周销售</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.weekSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">近7天营业额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月销售</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.monthSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">本月营业额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户总数</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">累计服务客户</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">销售概览</TabsTrigger>
            <TabsTrigger value="records">销售记录</TabsTrigger>
            <TabsTrigger value="entry">录入销售</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索销售记录..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={() => router.push("/coffee-shop/sales/new")}>
              <PlusIcon className="h-4 w-4 mr-2" />
              新增销售
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>销售趋势</CardTitle>
              <CardDescription>咖啡店销售数据概览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CoffeeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">销售趋势图表将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>销售记录</CardTitle>
              <CardDescription>查看和管理咖啡店销售记录</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>加载中...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>总销售额</TableHead>
                      <TableHead>客户数量</TableHead>
                      <TableHead>值班员工</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          暂无销售记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>¥{sale.totalSales.toFixed(2)}</TableCell>
                          <TableCell>{sale.customerCount}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {sale.staffOnDuty?.map((staff, index) => (
                                <Badge key={index} variant="secondary">
                                  {staff}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{sale.notes || "-"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>录入销售数据</CardTitle>
              <CardDescription>录入咖啡店日常销售数据</CardDescription>
            </CardHeader>
            <CardContent>
              <CoffeeShopEntryForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
