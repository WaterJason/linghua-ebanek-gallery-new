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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DownloadIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PackageIcon,
  DollarSignIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DateRangePicker } from "@/components/date-range-picker"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

export function PurchaseReport() {
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
      // const response = await fetch(`/api/reports/purchase?from=${dateRange.from}&to=${dateRange.to}`)
      // const data = await response.json()
      // setReportData(data)

      // 演示数据
      setTimeout(() => {
        setReportData({
          summary: {
            totalPurchases: 156,
            totalAmount: 285600,
            totalSuppliers: 12,
            avgOrderValue: 1831
          },
          monthlyTrend: [
            { month: "1月", amount: 45000, orders: 25 },
            { month: "2月", amount: 52000, orders: 28 },
            { month: "3月", amount: 48000, orders: 26 },
            { month: "4月", amount: 58000, orders: 32 },
            { month: "5月", amount: 62000, orders: 35 },
            { month: "6月", amount: 55000, orders: 30 }
          ],
          supplierDistribution: [
            { name: "供应商A", value: 35, amount: 99960 },
            { name: "供应商B", value: 25, amount: 71400 },
            { name: "供应商C", value: 20, amount: 57120 },
            { name: "供应商D", value: 15, amount: 42840 },
            { name: "其他", value: 5, amount: 14280 }
          ],
          topProducts: [
            { name: "掐丝珐琅原料", quantity: 120, amount: 48000 },
            { name: "包装材料", quantity: 85, amount: 25500 },
            { name: "工具设备", quantity: 15, amount: 45000 },
            { name: "辅助材料", quantity: 200, amount: 20000 }
          ]
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error loading purchase report:", error)
      toast({
        title: "加载失败",
        description: "无法加载采购报表数据",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    toast({
      title: "导出成功",
      description: "采购报表已开始下载",
    })
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">采购报表</h2>
          <p className="text-muted-foreground">查看采购数据分析和统计报表</p>
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
            <TabsTrigger value="trend">趋势分析</TabsTrigger>
            <TabsTrigger value="suppliers">供应商分析</TabsTrigger>
            <TabsTrigger value="products">产品分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">采购订单总数</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalPurchases}</p>
                    </div>
                    <PackageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">采购总金额</p>
                      <p className="text-2xl font-bold">¥{reportData.summary.totalAmount.toLocaleString()}</p>
                    </div>
                    <DollarSignIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">供应商数量</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalSuppliers}</p>
                    </div>
                    <TrendingUpIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">平均订单价值</p>
                      <p className="text-2xl font-bold">¥{reportData.summary.avgOrderValue.toLocaleString()}</p>
                    </div>
                    <TrendingDownIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 月度趋势图 */}
            <Card>
              <CardHeader>
                <CardTitle>月度采购趋势</CardTitle>
                <CardDescription>查看每月采购金额和订单数量变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.monthlyTrend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="采购金额" />
                    <Bar dataKey="orders" fill="#82ca9d" name="订单数量" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>趋势分析</CardTitle>
                <CardDescription>采购趋势详细分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  趋势分析功能开发中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>供应商分析</CardTitle>
                <CardDescription>各供应商采购占比分析</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.supplierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.supplierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>热门采购产品</CardTitle>
                <CardDescription>采购量最高的产品统计</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>采购数量</TableHead>
                      <TableHead>采购金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>¥{product.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
