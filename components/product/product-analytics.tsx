"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"
import { Product } from "@/types/product"
import {
  BarChart3Icon,
  PieChartIcon,
  LineChartIcon,
  PackageIcon,
  TagIcon,
  CircleDollarSignIcon,
  PercentIcon
} from "lucide-react"

interface ProductAnalyticsProps {
  products: Product[]
}

export function ProductAnalytics({ products }: ProductAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // 计算产品总数
  const totalProducts = products.length

  // 计算产品总价值
  const totalValue = useMemo(() => {
    return products.reduce((sum, product) => {
      const inventory = product.inventory || 0
      return sum + (product.price * inventory)
    }, 0)
  }, [products])

  // 计算平均价格
  const averagePrice = useMemo(() => {
    if (products.length === 0) return 0
    const total = products.reduce((sum, product) => sum + product.price, 0)
    return total / products.length
  }, [products])

  // 计算平均库存
  const averageInventory = useMemo(() => {
    if (products.length === 0) return 0
    const total = products.reduce((sum, product) => sum + (product.inventory || 0), 0)
    return total / products.length
  }, [products])

  // 按分类统计产品数量
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}

    products.forEach(product => {
      const category = product.category || "未分类"
      stats[category] = (stats[category] || 0) + 1
    })

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [products])

  // 按材质统计产品数量
  const materialStats = useMemo(() => {
    const stats: Record<string, number> = {}

    products.forEach(product => {
      const material = product.material || "未指定"
      stats[material] = (stats[material] || 0) + 1
    })

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [products])

  // 按价格区间统计产品数量
  const priceRangeStats = useMemo(() => {
    const ranges = [
      { name: "0-100", min: 0, max: 100 },
      { name: "100-500", min: 100, max: 500 },
      { name: "500-1000", min: 500, max: 1000 },
      { name: "1000-5000", min: 1000, max: 5000 },
      { name: "5000+", min: 5000, max: Infinity }
    ]

    const stats = ranges.map(range => {
      const count = products.filter(p =>
        p.price >= range.min && p.price < range.max
      ).length

      return {
        name: range.name,
        value: count
      }
    })

    return stats
  }, [products])

  // 按库存水平统计产品数量
  const inventoryLevelStats = useMemo(() => {
    const levels = [
      { name: "无库存", min: 0, max: 0 },
      { name: "低库存(1-5)", min: 1, max: 5 },
      { name: "中等(6-20)", min: 6, max: 20 },
      { name: "充足(21-50)", min: 21, max: 50 },
      { name: "高库存(50+)", min: 51, max: Infinity }
    ]

    const stats = levels.map(level => {
      const count = products.filter(p => {
        const inventory = p.inventory || 0
        return inventory >= level.min && inventory <= level.max
      }).length

      return {
        name: level.name,
        value: count
      }
    })

    return stats
  }, [products])

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57']

  // 格式化金额
  const formatCurrency = (value: number) => {
    return `¥${value.toFixed(2)}`
  }

  // 格式化百分比
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  // 计算产品数据完整性
  const dataCompleteness = useMemo(() => {
    if (products.length === 0) return 0

    let totalFields = 0
    let completedFields = 0

    products.forEach(product => {
      // 检查关键字段是否有值
      const fields = [
        'name', 'price', 'category', 'imageUrl',
        'description', 'dimensions', 'material', 'unit'
      ]

      totalFields += fields.length

      fields.forEach(field => {
        if (product[field as keyof Product]) {
          completedFields++
        }
      })
    })

    return completedFields / totalFields
  }, [products])

  // 计算热门产品（库存价值最高的前5个）
  const topValueProducts = useMemo(() => {
    return [...products]
      .map(product => ({
        ...product,
        totalValue: (product.inventory || 0) * product.price
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
  }, [products])

  // 计算库存周转率（假设数据）
  const inventoryTurnover = 4.2 // 这里使用假数据，实际应从销售数据计算

  // 计算产品价格分布
  const priceDistribution = useMemo(() => {
    const distribution = [
      { name: '低价产品', value: 0 },
      { name: '中价产品', value: 0 },
      { name: '高价产品', value: 0 }
    ]

    // 计算价格四分位数
    const prices = products.map(p => p.price).sort((a, b) => a - b)
    const q1 = prices[Math.floor(prices.length * 0.25)]
    const q3 = prices[Math.floor(prices.length * 0.75)]

    products.forEach(product => {
      if (product.price <= q1) {
        distribution[0].value++
      } else if (product.price <= q3) {
        distribution[1].value++
      } else {
        distribution[2].value++
      }
    })

    return distribution
  }, [products])

  // 计算产品生命周期分布（假设数据）
  const productLifecycleData = [
    { name: '引入期', value: Math.round(totalProducts * 0.15) },
    { name: '成长期', value: Math.round(totalProducts * 0.35) },
    { name: '成熟期', value: Math.round(totalProducts * 0.40) },
    { name: '衰退期', value: Math.round(totalProducts * 0.10) }
  ]

  // 计算产品销售趋势（假设数据）
  const salesTrendData = [
    { name: '1月', 销售额: 4000, 利润: 2400 },
    { name: '2月', 销售额: 3000, 利润: 1398 },
    { name: '3月', 销售额: 2000, 利润: 9800 },
    { name: '4月', 销售额: 2780, 利润: 3908 },
    { name: '5月', 销售额: 1890, 利润: 4800 },
    { name: '6月', 销售额: 2390, 利润: 3800 }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">产品总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalProducts}</div>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {products.filter(p => p.isActive !== false).length} 个活跃产品
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">库存总价值</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <CircleDollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              库存周转率: {inventoryTurnover.toFixed(1)} 次/年
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均价格</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(averagePrice)}</div>
              <PercentIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              价格范围: {formatCurrency(Math.min(...products.map(p => p.price)))} - {formatCurrency(Math.max(...products.map(p => p.price)))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">数据完整性</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{(dataCompleteness * 100).toFixed(1)}%</div>
              <TagIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${dataCompleteness * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">分类统计</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">材质分布</span>
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center gap-1">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">价格分析</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">库存分析</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">销售分析</span>
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="flex items-center gap-1">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">生命周期</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>产品分类分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} 个产品`, "数量"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                显示各分类的产品数量分布，帮助了解产品结构。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>产品材质分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={materialStats.slice(0, 10)} // 只显示前10种材质
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value} 个产品`, "数量"]} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="产品数量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                显示各材质的产品数量，只显示数量最多的前10种材质。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>产品价格区间分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priceRangeStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} 个产品`, "数量"]} />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" name="产品数量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                显示不同价格区间的产品数量分布，帮助了解产品价格结构。
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>产品库存水平分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryLevelStats}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {inventoryLevelStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} 个产品`, "数量"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  显示不同库存水平的产品数量分布，帮助识别库存问题。
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>库存价值最高的产品</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topValueProducts.map(p => ({
                        name: p.name,
                        value: p.totalValue
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => [formatCurrency(value), "库存价值"]} />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" name="库存价值" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  显示库存价值最高的前5个产品，帮助识别重要库存。
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>产品销售趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesTrendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="销售额" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="利润" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  显示产品销售额和利润的月度趋势（示例数据）。
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>产品价格分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} 个产品`, "数量"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  显示产品在不同价格区间的分布情况，基于价格四分位数划分。
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>产品生命周期分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productLifecycleData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productLifecycleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} 个产品`, "数量"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  显示产品在不同生命周期阶段的分布（示例数据）。
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>产品数据完整性分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">产品名称</span>
                      <span className="text-sm font-medium">
                        {(products.filter(p => p.name).length / products.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${products.filter(p => p.name).length / products.length * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">产品图片</span>
                      <span className="text-sm font-medium">
                        {(products.filter(p => p.imageUrl).length / products.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${products.filter(p => p.imageUrl).length / products.length * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">产品分类</span>
                      <span className="text-sm font-medium">
                        {(products.filter(p => p.category).length / products.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${products.filter(p => p.category).length / products.length * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">产品描述</span>
                      <span className="text-sm font-medium">
                        {(products.filter(p => p.description).length / products.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${products.filter(p => p.description).length / products.length * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">产品尺寸</span>
                      <span className="text-sm font-medium">
                        {(products.filter(p => p.dimensions).length / products.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${products.filter(p => p.dimensions).length / products.length * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  显示产品各项数据的完整度，帮助识别需要补充的信息。
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
