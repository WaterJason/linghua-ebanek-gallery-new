"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, DownloadIcon, BarChart2Icon } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { getCoffeeShopSales, getGallerySales } from "@/lib/actions/sales-actions";
import { getPosSales } from "@/lib/actions/pos-actions";

export function SalesReportDashboard() {
  const [selectedTab, setSelectedTab] = useState("gallery")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [isLoading, setIsLoading] = useState(true)
  const [gallerySalesData, setGallerySalesData] = useState([])
  const [coffeeSalesData, setCoffeeSalesData] = useState([])
  const [posSalesData, setPosSalesData] = useState([])
  const [productSalesData, setProductSalesData] = useState([])
  const [categorySalesData, setCategorySalesData] = useState([])
  const [paymentMethodData, setPaymentMethodData] = useState([])
  const [summaryData, setSummaryData] = useState({
    totalGallerySales: 0,
    totalCoffeeSales: 0,
    totalPosSales: 0,
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0
  })

  // 加载销售数据
  useEffect(() => {
    loadSalesData()
  }, [dateRange, selectedTab])

  const loadSalesData = async () => {
    setIsLoading(true)
    try {
      if (selectedTab === "gallery" || selectedTab === "all") {
        await loadGallerySalesData()
      }

      if (selectedTab === "coffee" || selectedTab === "all") {
        await loadCoffeeSalesData()
      }

      if (selectedTab === "pos" || selectedTab === "all") {
        await loadPosSalesData()
      }

      // 计算汇总数据
      calculateSummaryData()
    } catch (error) {
      console.error("Error loading sales data:", error)
      toast({
        title: "加载失败",
        description: "无法加载销售数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPosSalesData = async () => {
    // 使用服务器端操作获取POS销售数据
    const startDate = dateRange.from.toISOString()
    const endDate = dateRange.to.toISOString()

    try {
      const result = await getPosSales(startDate, endDate)

      // 确保数据有效
      if (result && Array.isArray(result.data)) {
        setPosSalesData(result.data)

        // 处理产品销售数据 - 合并到现有产品销售数据中
        processPosSalesData(result.data)
      } else {
        console.error("Invalid POS sales data:", result)
        setPosSalesData([])
      }
    } catch (error) {
      console.error("Error loading POS sales:", error)
      setPosSalesData([])

      toast({
        title: "加载失败",
        description: "无法加载POS销售数据",
        variant: "destructive",
      })
    }
  }

  const loadGallerySalesData = async () => {
    // 使用服务器端操作获取珐琅馆销售数据
    const startDate = dateRange.from.toISOString()
    const endDate = dateRange.to.toISOString()

    try {
      const data = await getGallerySales(startDate, endDate)

      // 确保数据有效
      if (Array.isArray(data)) {
        setGallerySalesData(data)

        // 处理产品销售数据
        processProductSalesData(data)

        // 处理类别销售数据
        processCategorySalesData(data)
      } else {
        console.error("Invalid gallery sales data:", data)
        setGallerySalesData([])
        setProductSalesData([])
        setCategorySalesData([])
      }
    } catch (error) {
      console.error("Error loading gallery sales:", error)
      setGallerySalesData([])
      setProductSalesData([])
      setCategorySalesData([])

      toast({
        title: "加载失败",
        description: "无法加载珐琅馆销售数据",
        variant: "destructive",
      })
    }
  }

  const loadCoffeeSalesData = async () => {
    // 使用服务器端操作获取咖啡店销售数据
    const startDate = dateRange.from.toISOString()
    const endDate = dateRange.to.toISOString()

    try {
      const data = await getCoffeeShopSales(startDate, endDate)

      // 确保数据有效
      if (Array.isArray(data)) {
        setCoffeeSalesData(data)

        // 处理支付方式数据
        processPaymentMethodData(data)
      } else {
        console.error("Invalid coffee shop sales data:", data)
        setCoffeeSalesData([])
        setPaymentMethodData([])
      }
    } catch (error) {
      console.error("Error loading coffee shop sales:", error)
      setCoffeeSalesData([])
      setPaymentMethodData([])

      toast({
        title: "加载失败",
        description: "无法加载咖啡店销售数据",
        variant: "destructive",
      })
    }
  }

  const processProductSalesData = (data) => {
    // 按产品分组统计销售数据
    const productMap = new Map()

    data.forEach(sale => {
      sale.salesItems.forEach(item => {
        const productId = item.product.id
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            name: item.product.name,
            quantity: 0,
            sales: 0
          })
        }

        const productStats = productMap.get(productId)
        productStats.quantity += item.quantity
        productStats.sales += item.price * item.quantity
      })
    })

    // 转换为数组并按销售额排序
    const productStats = Array.from(productMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10) // 只取前10名

    setProductSalesData(productStats)
  }

  const processCategorySalesData = (data) => {
    // 按类别分组统计销售数据
    const categoryMap = new Map()

    data.forEach(sale => {
      sale.salesItems.forEach(item => {
        const category = item.product.category || "未分类"
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            value: 0
          })
        }

        const categoryStats = categoryMap.get(category)
        categoryStats.value += item.price * item.quantity
      })
    })

    // 转换为数组
    const categoryStats = Array.from(categoryMap.values())

    setCategorySalesData(categoryStats)
  }

  const processPaymentMethodData = (data) => {
    // 统计支付方式数据
    const paymentData = [
      { name: "现金", value: 0 },
      { name: "刷卡", value: 0 },
      { name: "微信", value: 0 },
      { name: "支付宝", value: 0 },
      { name: "其他", value: 0 }
    ]

    data.forEach(sale => {
      paymentData[0].value += sale.cashAmount || 0
      paymentData[1].value += sale.cardAmount || 0
      paymentData[2].value += sale.wechatAmount || 0
      paymentData[3].value += sale.alipayAmount || 0
      paymentData[4].value += sale.otherAmount || 0
    })

    setPaymentMethodData(paymentData)
  }

  const calculateSummaryData = () => {
    // 确保数据是数组
    const galleryData = Array.isArray(gallerySalesData) ? gallerySalesData : []
    const coffeeData = Array.isArray(coffeeSalesData) ? coffeeSalesData : []
    const posData = Array.isArray(posSalesData) ? posSalesData : []

    // 计算珐琅馆销售总额
    const totalGallerySales = galleryData.reduce((sum, sale) => {
      // 确保 totalAmount 是数字
      const amount = typeof sale.totalAmount === 'number' ? sale.totalAmount : 0
      return sum + amount
    }, 0)

    // 计算咖啡店销售总额
    const totalCoffeeSales = coffeeData.reduce((sum, sale) => {
      // 确保 totalSales 是数字
      const amount = typeof sale.totalSales === 'number' ? sale.totalSales : 0
      return sum + amount
    }, 0)

    // 计算POS销售总额
    const totalPosSales = posData.reduce((sum, sale) => {
      // 确保 totalAmount 是数字
      const amount = typeof sale.totalAmount === 'number' ? sale.totalAmount : 0
      return sum + amount
    }, 0)

    const totalSales = totalGallerySales + totalCoffeeSales + totalPosSales
    const totalOrders = galleryData.length + coffeeData.length + posData.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    setSummaryData({
      totalGallerySales,
      totalCoffeeSales,
      totalPosSales,
      totalSales,
      totalOrders,
      averageOrderValue
    })
  }

  const handleExportReport = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        format: 'excel',
        type: selectedTab
      })

      // 下载报表
      window.location.href = `/api/export/sales-report?${params}`

      toast({
        title: "导出成功",
        description: "销售报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出销售报表",
        variant: "destructive",
      })
    }
  }

  // 处理POS销售数据
  const processPosSalesData = (data) => {
    // 按产品分组统计销售数据
    const productMap = new Map()

    data.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.id
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            name: item.product.name,
            quantity: 0,
            sales: 0
          })
        }

        const productStats = productMap.get(productId)
        productStats.quantity += item.quantity
        productStats.sales += item.price * item.quantity
      })
    })

    // 转换为数组并按销售额排序
    const productStats = Array.from(productMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10) // 只取前10名

    // 合并到现有产品销售数据中
    setProductSalesData(prevData => {
      const combinedMap = new Map()

      // 添加现有数据
      prevData.forEach(item => {
        combinedMap.set(item.name, item)
      })

      // 添加POS销售数据
      productStats.forEach(item => {
        if (combinedMap.has(item.name)) {
          const existing = combinedMap.get(item.name)
          existing.quantity += item.quantity
          existing.sales += item.sales
        } else {
          combinedMap.set(item.name, item)
        }
      })

      // 转换回数组并排序
      return Array.from(combinedMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
    })
  }

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C']

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>销售报表</CardTitle>
          <CardDescription>查看和分析销售数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">全部销售</TabsTrigger>
                <TabsTrigger value="gallery">珐琅馆销售</TabsTrigger>
                <TabsTrigger value="coffee">咖啡店销售</TabsTrigger>
                <TabsTrigger value="pos">POS销售</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy-MM-dd")} 至{" "}
                          {format(dateRange.to, "yyyy-MM-dd")}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy-MM-dd")
                      )
                    ) : (
                      <span>选择日期范围</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" onClick={handleExportReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 销售汇总 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.from, "yyyy-MM-dd")} 至 {format(dateRange.to, "yyyy-MM-dd")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">珐琅馆销售额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalGallerySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              占比 {summaryData.totalSales > 0 ? ((summaryData.totalGallerySales / summaryData.totalSales) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">POS销售额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalPosSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              占比 {summaryData.totalSales > 0 ? ((summaryData.totalPosSales / summaryData.totalSales) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">咖啡店销售额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalCoffeeSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              占比 {summaryData.totalSales > 0 ? ((summaryData.totalCoffeeSales / summaryData.totalSales) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均订单金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              共 {summaryData.totalOrders} 笔订单
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 热销产品 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>热销产品 TOP 10</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : productSalesData.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  layout="vertical"
                  data={productSalesData}
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <XAxis type="number" tickFormatter={(value) => `¥${value}`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => `¥${value}`} />
                  <Bar dataKey="sales" fill="#0070f3" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 类别销售占比 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>类别销售占比</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : categorySalesData.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 支付方式分析 */}
      {(selectedTab === "coffee" || selectedTab === "all") && (
        <Card>
          <CardHeader>
            <CardTitle>支付方式分析</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : paymentMethodData.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={paymentMethodData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `¥${value}`} />
                  <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
