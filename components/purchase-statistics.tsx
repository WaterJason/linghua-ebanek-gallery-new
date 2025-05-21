"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, TrendingUpIcon, PieChartIcon, BarChart2Icon, UsersIcon } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts"
import { getPurchaseOrders, getSuppliers } from "@/lib/actions/purchase-actions";

export function PurchaseStatistics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [monthFilter, setMonthFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])

  // 统计数据
  const [overviewData, setOverviewData] = useState([])
  const [supplierData, setSupplierData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [productData, setProductData] = useState([])

  // 颜色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57']

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [purchaseOrders, yearFilter, monthFilter, supplierFilter])

  useEffect(() => {
    if (filteredOrders.length > 0) {
      generateStatisticsData()
    }
  }, [filteredOrders])

  const loadData = async () => {
    setLoading(true)
    try {
      // 获取所有采购订单
      const ordersData = await getPurchaseOrders()
      setPurchaseOrders(ordersData.data || [])

      // 获取所有供应商
      const suppliersData = await getSuppliers()
      setSuppliers(suppliersData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "加载失败",
        description: "无法加载采购数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    if (!purchaseOrders.length) return

    let filtered = [...purchaseOrders]

    // 按年份筛选
    if (yearFilter !== "all") {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate)
        return orderDate.getFullYear().toString() === yearFilter
      })
    }

    // 按月份筛选
    if (monthFilter !== "all") {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate)
        return (orderDate.getMonth() + 1).toString() === monthFilter
      })
    }

    // 按供应商筛选
    if (supplierFilter !== "all") {
      filtered = filtered.filter(order => order.supplierId.toString() === supplierFilter)
    }

    setFilteredOrders(filtered)
  }

  const generateStatisticsData = () => {
    // 1. 总览数据
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalPaidAmount = filteredOrders.reduce((sum, order) => sum + order.paidAmount, 0)
    const totalUnpaidAmount = totalAmount - totalPaidAmount
    const avgOrderAmount = totalAmount / filteredOrders.length
    const totalOrders = filteredOrders.length
    const pendingOrders = filteredOrders.filter(order => order.status === "pending").length
    const confirmedOrders = filteredOrders.filter(order => order.status === "confirmed").length
    const receivedOrders = filteredOrders.filter(order => order.status === "received").length

    setOverviewData([
      { name: '总采购金额', value: totalAmount },
      { name: '已付金额', value: totalPaidAmount },
      { name: '未付金额', value: totalUnpaidAmount },
      { name: '平均订单金额', value: avgOrderAmount },
      { name: '订单总数', value: totalOrders },
      { name: '待处理订单', value: pendingOrders },
      { name: '已确认订单', value: confirmedOrders },
      { name: '已收货订单', value: receivedOrders },
    ])

    // 2. 供应商数据
    const supplierStats = {}
    filteredOrders.forEach(order => {
      const supplierId = order.supplierId
      const supplierName = order.supplier?.name || `供应商 ${supplierId}`

      if (!supplierStats[supplierId]) {
        supplierStats[supplierId] = {
          name: supplierName,
          value: 0,
          orderCount: 0,
        }
      }

      supplierStats[supplierId].value += order.totalAmount
      supplierStats[supplierId].orderCount += 1
    })

    setSupplierData(Object.values(supplierStats).sort((a, b) => b.value - a.value))

    // 3. 趋势数据
    const trendStats = {}
    filteredOrders.forEach(order => {
      const date = new Date(order.orderDate)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = monthFilter !== "all" ? `${year}-${month}-${date.getDate()}` : `${year}-${month}`

      if (!trendStats[key]) {
        trendStats[key] = {
          date: key,
          amount: 0,
          count: 0,
        }
      }

      trendStats[key].amount += order.totalAmount
      trendStats[key].count += 1
    })

    // 按日期排序
    setTrendData(Object.values(trendStats).sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    }))

    // 4. 产品数据
    const productStats = {}
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId
        const productName = item.product?.name || `产品 ${productId}`

        if (!productStats[productId]) {
          productStats[productId] = {
            name: productName,
            value: 0,
            quantity: 0,
          }
        }

        productStats[productId].value += item.price * item.quantity
        productStats[productId].quantity += item.quantity
      })
    })

    setProductData(Object.values(productStats).sort((a, b) => b.value - a.value).slice(0, 10))
  }

  // 导出统计数据
  const handleExportStatistics = () => {
    try {
      if (filteredOrders.length === 0) {
        toast({
          title: "无数据可导出",
          description: "请先添加采购订单",
          variant: "destructive",
        })
        return
      }

      // 这里应该调用导出函数，但目前还没有实现
      toast({
        title: "功能开发中",
        description: "采购统计导出功能正在开发中",
      })
    } catch (error) {
      console.error("Error exporting purchase statistics:", error)
      toast({
        title: "导出失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 格式化金额
  const formatCurrency = (value) => {
    return `¥${value.toFixed(2)}`
  }

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('金额') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>采购统计</CardTitle>
              <CardDescription>采购订单数据分析</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportStatistics}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出统计
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选条件 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="yearFilter">年份</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger id="yearFilter">
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年份</SelectItem>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="monthFilter">月份</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger id="monthFilter">
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部月份</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplierFilter">供应商</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger id="supplierFilter">
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部供应商</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 统计选项卡 */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart2Icon className="h-4 w-4 mr-2" />
                采购总览
              </TabsTrigger>
              <TabsTrigger value="suppliers">
                <UsersIcon className="h-4 w-4 mr-2" />
                供应商分析
              </TabsTrigger>
              <TabsTrigger value="trend">
                <TrendingUpIcon className="h-4 w-4 mr-2" />
                采购趋势
              </TabsTrigger>
              <TabsTrigger value="products">
                <PieChartIcon className="h-4 w-4 mr-2" />
                产品分析
              </TabsTrigger>
            </TabsList>

            {/* 采购总览 */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>采购总览</CardTitle>
                  <CardDescription>采购支出总览统计</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无采购数据
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={overviewData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" name="数值" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 供应商分析 */}
            <TabsContent value="suppliers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>供应商分析</CardTitle>
                  <CardDescription>各供应商采购金额占比</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无采购数据
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={supplierData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {supplierData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 采购趋势 */}
            <TabsContent value="trend" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>采购趋势分析</CardTitle>
                  <CardDescription>采购金额变化趋势</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无采购数据
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={trendData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area type="monotone" dataKey="amount" name="采购金额" stroke="#8884d8" fill="#8884d8" />
                          <Area type="monotone" dataKey="count" name="订单数量" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 产品分析 */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>产品采购分析</CardTitle>
                  <CardDescription>采购金额最高的前10种产品</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无采购数据
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={productData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={150} />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" name="采购金额" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
