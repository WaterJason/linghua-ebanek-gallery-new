"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DownloadIcon,
  RefreshCwIcon,
  CoffeeIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ShoppingCartIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DateRangePicker } from "@/components/date-range-picker"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

export function CoffeeShopReport() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      // 这里应该调用实际的API
      // const response = await fetch(`/api/reports/coffee-shop?from=${dateRange.from}&to=${dateRange.to}`)
      // const data = await response.json()
      // setReportData(data)

      // 演示数据
      setTimeout(() => {
        setReportData({
          summary: {
            totalSales: 285,
            totalRevenue: 45600,
            totalItems: 12,
            avgOrderValue: 160
          },
          dailySales: [
            { date: "06-01", sales: 8, revenue: 1280 },
            { date: "06-02", sales: 12, revenue: 1920 },
            { date: "06-03", sales: 15, revenue: 2400 },
            { date: "06-04", sales: 10, revenue: 1600 },
            { date: "06-05", sales: 18, revenue: 2880 },
            { date: "06-06", sales: 22, revenue: 3520 },
            { date: "06-07", sales: 20, revenue: 3200 }
          ],
          topProducts: [
            { name: "美式咖啡", quantity: 85, revenue: 12750, percentage: 28 },
            { name: "拿铁", quantity: 72, revenue: 14400, percentage: 32 },
            { name: "卡布奇诺", quantity: 45, revenue: 9000, percentage: 20 },
            { name: "摩卡", quantity: 38, revenue: 9500, percentage: 21 },
            { name: "其他", quantity: 45, revenue: 4950, percentage: 11 }
          ],
          hourlyDistribution: [
            { hour: "08:00", orders: 5 },
            { hour: "09:00", orders: 12 },
            { hour: "10:00", orders: 18 },
            { hour: "11:00", orders: 15 },
            { hour: "12:00", orders: 8 },
            { hour: "13:00", orders: 6 },
            { hour: "14:00", orders: 22 },
            { hour: "15:00", orders: 25 },
            { hour: "16:00", orders: 20 },
            { hour: "17:00", orders: 15 },
            { hour: "18:00", orders: 8 }
          ],
          recentOrders: [
            {
              id: "1",
              date: "2024-06-07",
              time: "15:30",
              items: "美式咖啡 x2, 拿铁 x1",
              amount: 45,
              paymentMethod: "现金"
            },
            {
              id: "2",
              date: "2024-06-07",
              time: "14:45",
              items: "卡布奇诺 x1, 摩卡 x1",
              amount: 50,
              paymentMethod: "微信支付"
            },
            {
              id: "3",
              date: "2024-06-07",
              time: "14:20",
              items: "拿铁 x3",
              amount: 60,
              paymentMethod: "支付宝"
            }
          ]
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error loading coffee shop report:", error)
      toast({
        title: "加载失败",
        description: "无法加载咖啡店报表数据",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    toast({
      title: "导出成功",
      description: "咖啡店报表已开始下载",
    })
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">咖啡店报表</h2>
          <p className="text-muted-foreground">查看咖啡店销售数据分析和统计报表</p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button variant="outline" onClick={exportReport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            导出报表
          </Button>
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : !reportData ? (
        <div className="text-center py-8 text-muted-foreground">暂无数据</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="sales">销售分析</TabsTrigger>
            <TabsTrigger value="products">产品分析</TabsTrigger>
            <TabsTrigger value="time">时间分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">总销售单数</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalSales}</p>
                    </div>
                    <ShoppingCartIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">总收入</p>
                      <p className="text-2xl font-bold">¥{reportData.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSignIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">商品种类</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalItems}</p>
                    </div>
                    <CoffeeIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">平均客单价</p>
                      <p className="text-2xl font-bold">¥{reportData.summary.avgOrderValue}</p>
                    </div>
                    <TrendingUpIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 最近订单 */}
            <Card>
              <CardHeader>
                <CardTitle>最近订单</CardTitle>
                <CardDescription>查看最近的咖啡店订单</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>支付方式</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>{order.time}</TableCell>
                        <TableCell className="font-medium">{order.items}</TableCell>
                        <TableCell>¥{order.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.paymentMethod}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>每日销售趋势</CardTitle>
                <CardDescription>查看每日销售单数和收入变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.dailySales}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="销售单数" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="收入" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>热门产品分析</CardTitle>
                <CardDescription>查看最受欢迎的咖啡产品</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={reportData.topProducts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {reportData.topProducts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品名称</TableHead>
                        <TableHead>销售数量</TableHead>
                        <TableHead>收入</TableHead>
                        <TableHead>占比</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>¥{product.revenue.toLocaleString()}</TableCell>
                          <TableCell>{product.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>时段分析</CardTitle>
                <CardDescription>查看不同时段的订单分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.hourlyDistribution}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8884d8" name="订单数" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
