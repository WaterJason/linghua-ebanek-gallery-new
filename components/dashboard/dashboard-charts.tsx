"use client"

import { EnhancedChart } from "@/components/enhanced-chart"
import { cn } from "@/lib/utils"

interface DashboardChartsProps {
  data: {
    gallerySales: {
      data: any[]
    }
    coffeeSales: {
      data: any[]
    }
    topArtworks: any[]
    inventory?: {
      distribution: any[]
    }
    employeePerformance?: any[]
  }
  className?: string
}

export function DashboardCharts({
  data,
  className
}: DashboardChartsProps) {
  // 合并销售数据
  const salesTrendData = data.gallerySales.data.map((item, index) => {
    const coffeeItem = data.coffeeSales.data[index] || { value: 0 }
    return {
      date: item.date,
      gallery: item.value,
      coffee: coffeeItem.value,
      total: item.value + coffeeItem.value
    }
  })

  // 准备库存分布数据
  const inventoryData = data.inventory?.distribution || [
    { name: "珐琅制品", value: 450 },
    { name: "咖啡用品", value: 300 },
    { name: "工艺品", value: 200 },
    { name: "原材料", value: 180 },
    { name: "其他", value: 120 }
  ]

  // 准备员工绩效数据
  const employeePerformance = data.employeePerformance || [
    { name: "张三", sales: 28500, production: 120 },
    { name: "李四", sales: 25600, production: 110 },
    { name: "王五", sales: 22800, production: 95 },
    { name: "赵六", sales: 19500, production: 85 },
    { name: "钱七", sales: 17200, production: 75 }
  ]

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      <EnhancedChart
        title="销售趋势"
        description="珐琅馆和咖啡店销售额趋势"
        data={salesTrendData}
        type="area"
        xAxisKey="date"
        yAxisKeys={["gallery", "coffee", "total"]}
        height={350}
        options={{
          showGrid: true,
          areaType: "monotone",
          stacked: false
        }}
        allowTypeChange={true}
      />

      <EnhancedChart
        title="热销作品"
        description="按销售额排名的热销作品"
        data={data.topArtworks}
        type="bar"
        xAxisKey="name"
        yAxisKeys={["sales"]}
        height={350}
        options={{
          showGrid: true,
          orientation: "horizontal",
          barSize: 20
        }}
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
      />
    </div>
  )
}
