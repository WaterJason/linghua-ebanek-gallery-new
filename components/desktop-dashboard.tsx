"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { EnhancedChart } from "@/components/enhanced-chart"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import {
  BarChart3Icon, TrendingUpIcon, ShoppingCartIcon,
  UsersIcon, PackageIcon, CoffeeIcon, CalendarIcon,
  ArrowUpIcon, ArrowDownIcon, AlertTriangleIcon,
  RefreshCwIcon, DollarSignIcon, PercentIcon, ClipboardListIcon,
  DatabaseIcon, LayoutDashboardIcon, ActivityIcon, PieChartIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { DataImportExport } from "@/components/data-import-export"
import Link from "next/link"

export function DesktopDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [salesData, setSalesData] = useState([])
  const [inventoryData, setInventoryData] = useState([])
  const [productionData, setProductionData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [employeePerformance, setEmployeePerformance] = useState([])
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    salesGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalInventory: 0,
    lowStockCount: 0,
    totalProduction: 0,
    productionGrowth: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    averageOrderValue: 0,
    averageOrderGrowth: 0
  })

  // 加载仪表盘数据
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        // 这里应该从API获取数据
        // 为了演示，我们使用模拟数据

        // 根据时间范围生成数据
        let days = 30
        switch (timeRange) {
          case "7d":
            days = 7
            break
          case "30d":
            days = 30
            break
          case "90d":
            days = 90
            break
          case "1y":
            days = 365
            break
        }

        // 模拟销售数据
        const mockSalesData = generateMockSalesData(days)
        setSalesData(mockSalesData)

        // 模拟库存数据
        const mockInventoryData = generateMockInventoryData()
        setInventoryData(mockInventoryData)

        // 模拟生产数据
        const mockProductionData = generateMockProductionData(days)
        setProductionData(mockProductionData)

        // 模拟热销产品
        const mockTopProducts = generateMockTopProducts()
        setTopProducts(mockTopProducts)

        // 模拟低库存商品
        const mockLowStockItems = generateMockLowStockItems()
        setLowStockItems(mockLowStockItems)

        // 模拟员工绩效
        const mockEmployeePerformance = generateMockEmployeePerformance()
        setEmployeePerformance(mockEmployeePerformance)

        // 模拟汇总数据
        setSummaryData({
          totalSales: 125680,
          salesGrowth: 12.5,
          totalOrders: 256,
          ordersGrowth: 8.3,
          totalInventory: 1250,
          lowStockCount: 15,
          totalProduction: 850,
          productionGrowth: 5.2,
          totalEmployees: 24,
          activeEmployees: 20,
          averageOrderValue: 491,
          averageOrderGrowth: 3.8
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        toast({
          title: "加载失败",
          description: "无法加载仪表盘数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [timeRange])

  // 生成模拟销售数据
  const generateMockSalesData = (days: number) => {
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      data.push({
        date: format(date, "MM-dd"),
        gallery: Math.floor(Math.random() * 5000) + 2000,
        coffee: Math.floor(Math.random() * 2000) + 1000,
        total: Math.floor(Math.random() * 7000) + 3000
      })
    }

    return data
  }

  // 生成模拟库存数据
  const generateMockInventoryData = () => {
    return [
      { name: "珐琅制品", value: 450 },
      { name: "咖啡用品", value: 300 },
      { name: "工艺品", value: 200 },
      { name: "原材料", value: 180 },
      { name: "其他", value: 120 }
    ]
  }

  // 生成模拟生产数据
  const generateMockProductionData = (days: number) => {
    const data = []
    const now = new Date()
    const step = Math.max(1, Math.floor(days / 15))

    for (let i = days - 1; i >= 0; i -= step) {
      const date = subDays(now, i)
      data.push({
        date: format(date, "MM-dd"),
        count: Math.floor(Math.random() * 50) + 20,
        amount: Math.floor(Math.random() * 5000) + 2000
      })
    }

    return data
  }

  // 生成模拟热销产品
  const generateMockTopProducts = () => {
    return [
      { name: "珐琅花瓶", sales: 12500 },
      { name: "珐琅茶具", sales: 9800 },
      { name: "珐琅首饰", sales: 8500 },
      { name: "特色咖啡", sales: 7200 },
      { name: "珐琅摆件", sales: 6500 },
      { name: "手工艺品", sales: 5800 },
      { name: "咖啡杯具", sales: 4900 },
      { name: "珐琅画", sales: 4200 },
    ]
  }

  // 生成模拟低库存商品
  const generateMockLowStockItems = () => {
    return [
      { name: "珐琅原料A", current: 5, min: 10, category: "原材料" },
      { name: "特种咖啡豆", current: 3, min: 8, category: "咖啡用品" },
      { name: "珐琅颜料", current: 2, min: 5, category: "原材料" },
      { name: "包装材料", current: 10, min: 15, category: "其他" },
      { name: "咖啡杯", current: 12, min: 20, category: "咖啡用品" },
    ]
  }

  // 生成模拟员工绩效
  const generateMockEmployeePerformance = () => {
    return [
      { name: "张三", sales: 28500, production: 120 },
      { name: "李四", sales: 25600, production: 110 },
      { name: "王五", sales: 22800, production: 95 },
      { name: "赵六", sales: 19500, production: 85 },
      { name: "钱七", sales: 17200, production: 75 },
    ]
  }

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
              <SelectItem value="1y">最近1年</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataImportExport
          exportEnabled={true}
          importEnabled={false}
          exportFormats={["excel", "pdf"]}
          exportEndpoint="/api/export/dashboard"
          exportParams={{ timeRange }}
          buttonVariant="outline"
          showLabels={true}
        />
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.totalSales.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              {summaryData.salesGrowth > 0 ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${summaryData.salesGrowth > 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(summaryData.salesGrowth)}% 同比
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单数</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalOrders}</div>
            <div className="flex items-center pt-1">
              {summaryData.ordersGrowth > 0 ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${summaryData.ordersGrowth > 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(summaryData.ordersGrowth)}% 同比
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客单价</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summaryData.averageOrderValue}</div>
            <div className="flex items-center pt-1">
              {summaryData.averageOrderGrowth > 0 ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${summaryData.averageOrderGrowth > 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(summaryData.averageOrderGrowth)}% 同比
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低库存警告</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.lowStockCount}</div>
            <p className="text-xs text-muted-foreground pt-1">
              需要补货的产品数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedChart
          title="销售趋势"
          description="珐琅馆和咖啡店销售额趋势"
          data={salesData}
          type="area"
          xAxisKey="date"
          yAxisKeys={["gallery", "coffee", "total"]}
          height={350}
          options={{
            showGrid: true,
            areaType: "monotone",
            stacked: false
          }}
          loading={isLoading}
          allowTypeChange={true}
        />

        <EnhancedChart
          title="热销产品"
          description="按销售额排名的热销产品"
          data={topProducts}
          type="bar"
          xAxisKey="name"
          yAxisKeys={["sales"]}
          height={350}
          options={{
            showGrid: true,
            orientation: "horizontal",
            barSize: 20
          }}
          loading={isLoading}
        />

        <EnhancedChart
          title="库存分布"
          description="按类别统计的库存分布"
          data={inventoryData}
          type="pie"
          xAxisKey="name"
          yAxisKeys={["value"]}
          height={350}
          options={{
            showGrid: false,
            pieInnerRadius: 60,
            pieOuterRadius: 140,
            pieLabel: true
          }}
          loading={isLoading}
        />

        <EnhancedChart
          title="员工绩效"
          description="员工销售和生产绩效"
          data={employeePerformance}
          type="composed"
          xAxisKey="name"
          yAxisKeys={["sales", "production"]}
          height={350}
          options={{
            showGrid: true
          }}
          loading={isLoading}
        />
      </div>

      {/* 低库存警告 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
            低库存警告
          </CardTitle>
          <CardDescription>库存低于最小库存量的产品</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">加载中...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无低库存产品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item, index) => (
                <Card key={index} className="bg-amber-50/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">当前: <span className="text-red-500">{item.current}</span></p>
                        <p className="text-sm text-muted-foreground">最小: {item.min}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(item.current / item.min) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
