"use client"

import { useState, useEffect } from "react"
import { MobileDashboardCard } from "@/components/mobile-dashboard-card"
import { EnhancedChart } from "@/components/enhanced-chart"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { 
  BarChart3Icon, TrendingUpIcon, ShoppingCartIcon, 
  UsersIcon, PackageIcon, CoffeeIcon, CalendarIcon 
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"

export function MobileDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [inventoryData, setInventoryData] = useState([])
  const [productionData, setProductionData] = useState([])
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
    activeEmployees: 0
  })
  
  // 加载仪表盘数据
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        // 这里应该从API获取数据
        // 为了演示，我们使用模拟数据
        
        // 模拟销售数据
        const mockSalesData = generateMockSalesData()
        setSalesData(mockSalesData)
        
        // 模拟库存数据
        const mockInventoryData = generateMockInventoryData()
        setInventoryData(mockInventoryData)
        
        // 模拟生产数据
        const mockProductionData = generateMockProductionData()
        setProductionData(mockProductionData)
        
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
          activeEmployees: 20
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
  }, [])
  
  // 生成模拟销售数据
  const generateMockSalesData = () => {
    const data = []
    const now = new Date()
    
    for (let i = 30; i >= 0; i--) {
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
  const generateMockProductionData = () => {
    const data = []
    const now = new Date()
    
    for (let i = 14; i >= 0; i--) {
      const date = subDays(now, i)
      data.push({
        date: format(date, "MM-dd"),
        count: Math.floor(Math.random() * 50) + 20,
        amount: Math.floor(Math.random() * 5000) + 2000
      })
    }
    
    return data
  }
  
  // 渲染迷你图表
  const renderMiniChart = (data: any[], dataKey: string) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0070f3" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0070f3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip content={<></>} />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke="#0070f3" 
            fillOpacity={1} 
            fill="url(#colorSales)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">销售</TabsTrigger>
          <TabsTrigger value="inventory">库存</TabsTrigger>
          <TabsTrigger value="production">生产</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <MobileDashboardCard
              title="总销售额"
              icon={<BarChart3Icon className="h-4 w-4" />}
              iconColor="bg-blue-100 text-blue-700"
              value={`¥${summaryData.totalSales.toLocaleString()}`}
              trend={{
                value: summaryData.salesGrowth,
                label: "同比",
                isPositive: summaryData.salesGrowth > 0
              }}
              chart={renderMiniChart(salesData, "total")}
              collapsible
              defaultCollapsed={false}
            />
            
            <MobileDashboardCard
              title="订单数"
              icon={<ShoppingCartIcon className="h-4 w-4" />}
              iconColor="bg-green-100 text-green-700"
              value={summaryData.totalOrders}
              trend={{
                value: summaryData.ordersGrowth,
                label: "同比",
                isPositive: summaryData.ordersGrowth > 0
              }}
              collapsible
            />
          </div>
          
          <EnhancedChart
            title="销售趋势"
            data={salesData}
            type="area"
            xAxisKey="date"
            yAxisKeys={["gallery", "coffee", "total"]}
            height={250}
            options={{
              showGrid: false,
              areaType: "monotone",
              stacked: true
            }}
            loading={isLoading}
          />
          
          <Button variant="outline" className="w-full" size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            查看详细销售报表
          </Button>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <MobileDashboardCard
              title="库存总量"
              icon={<PackageIcon className="h-4 w-4" />}
              iconColor="bg-purple-100 text-purple-700"
              value={summaryData.totalInventory}
              collapsible
              defaultCollapsed={false}
            />
            
            <MobileDashboardCard
              title="低库存警告"
              icon={<PackageIcon className="h-4 w-4" />}
              iconColor="bg-amber-100 text-amber-700"
              value={summaryData.lowStockCount}
              collapsible
            />
          </div>
          
          <EnhancedChart
            title="库存分布"
            data={inventoryData}
            type="pie"
            xAxisKey="name"
            yAxisKeys={["value"]}
            height={250}
            options={{
              showGrid: false,
              pieInnerRadius: 30,
              pieOuterRadius: 80
            }}
            loading={isLoading}
          />
          
          <Button variant="outline" className="w-full" size="sm">
            <PackageIcon className="mr-2 h-4 w-4" />
            查看详细库存报表
          </Button>
        </TabsContent>
        
        <TabsContent value="production" className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <MobileDashboardCard
              title="生产总量"
              icon={<TrendingUpIcon className="h-4 w-4" />}
              iconColor="bg-cyan-100 text-cyan-700"
              value={summaryData.totalProduction}
              trend={{
                value: summaryData.productionGrowth,
                label: "同比",
                isPositive: summaryData.productionGrowth > 0
              }}
              chart={renderMiniChart(productionData, "count")}
              collapsible
              defaultCollapsed={false}
            />
            
            <MobileDashboardCard
              title="员工数量"
              icon={<UsersIcon className="h-4 w-4" />}
              iconColor="bg-indigo-100 text-indigo-700"
              value={`${summaryData.activeEmployees}/${summaryData.totalEmployees}`}
              collapsible
            />
          </div>
          
          <EnhancedChart
            title="生产趋势"
            data={productionData}
            type="bar"
            xAxisKey="date"
            yAxisKeys={["count"]}
            height={250}
            options={{
              showGrid: false,
              barSize: 16
            }}
            loading={isLoading}
          />
          
          <Button variant="outline" className="w-full" size="sm">
            <TrendingUpIcon className="mr-2 h-4 w-4" />
            查看详细生产报表
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
