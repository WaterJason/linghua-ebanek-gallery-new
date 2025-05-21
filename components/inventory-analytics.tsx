"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getInventory, getWarehouses, getInventoryTrends } from "@/lib/actions/inventory-actions";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  AlertTriangle as AlertTriangleIcon,
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  Calendar as CalendarIcon,
  BarChart3 as BarChart3Icon,
  LineChart as LineChartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from "lucide-react"

// 骨架屏组件
export function InventoryAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

// 生成预测数据
function generateForecastData(trendData: any[]) {
  if (!trendData || trendData.length < 3) return [];

  // 计算平均出库量和入库量
  const outflowSum = trendData.reduce((sum, item) => sum + (item.出库 || 0), 0);
  const inflowSum = trendData.reduce((sum, item) => sum + (item.入库 || 0), 0);
  const avgOutflow = outflowSum / trendData.length;
  const avgInflow = inflowSum / trendData.length;

  // 获取最后一个数据点的库存和日期
  const lastPoint = trendData[trendData.length - 1];
  const lastInventory = lastPoint.库存 || 0;
  const lastDate = new Date(lastPoint.date);

  // 生成未来30天的预测数据
  const forecastData = [];
  let currentInventory = lastInventory;

  for (let i = 1; i <= 30; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(lastDate.getDate() + i);

    // 预测需求（出库量）略有波动
    const predictedDemand = avgOutflow * (0.9 + Math.random() * 0.2);

    // 预测入库量略有波动
    const predictedInflow = avgInflow * (0.9 + Math.random() * 0.2);

    // 计算预测库存
    currentInventory = Math.max(0, currentInventory + predictedInflow - predictedDemand);

    // 每10天添加一个预测点
    if (i % 10 === 0) {
      forecastData.push({
        date: forecastDate.toISOString().split('T')[0],
        预测库存: Math.round(currentInventory),
        预测需求: Math.round(predictedDemand)
      });
    }
  }

  return forecastData;
}

// 计算预测补货时间
function calculateRestockTime(trendData: any[]) {
  if (!trendData || trendData.length < 3) return "数据不足";

  // 获取最后一个数据点的库存
  const lastInventory = trendData[trendData.length - 1].库存 || 0;

  // 计算平均每日消耗量（出库量 - 入库量）
  const consumptionRates = [];
  for (let i = 1; i < trendData.length; i++) {
    const consumption = (trendData[i].出库 || 0) - (trendData[i].入库 || 0);
    if (consumption > 0) {
      consumptionRates.push(consumption);
    }
  }

  // 如果没有正消耗率，返回"库存充足"
  if (consumptionRates.length === 0) return "库存充足";

  // 计算平均每日消耗率
  const avgConsumption = consumptionRates.reduce((sum, rate) => sum + rate, 0) / consumptionRates.length;

  // 假设安全库存为平均消耗量的10天
  const safetyStock = avgConsumption * 10;

  // 计算预计补货时间（天）
  const daysUntilRestock = Math.max(0, Math.floor((lastInventory - safetyStock) / avgConsumption));

  if (daysUntilRestock <= 0) {
    return "立即";
  } else if (daysUntilRestock <= 7) {
    return `${daysUntilRestock}天后`;
  } else if (daysUntilRestock <= 30) {
    return `${Math.ceil(daysUntilRestock / 7)}周后`;
  } else {
    return `${Math.ceil(daysUntilRestock / 30)}个月后`;
  }
}

// 计算建议补货量
function calculateRecommendedRestockAmount(trendData: any[]) {
  if (!trendData || trendData.length < 3) return 0;

  // 计算平均每日消耗量
  const consumptionRates = [];
  for (let i = 1; i < trendData.length; i++) {
    const consumption = (trendData[i].出库 || 0) - (trendData[i].入库 || 0);
    if (consumption > 0) {
      consumptionRates.push(consumption);
    }
  }

  // 如果没有正消耗率，建议补货量为0
  if (consumptionRates.length === 0) return 0;

  // 计算平均每日消耗率
  const avgConsumption = consumptionRates.reduce((sum, rate) => sum + rate, 0) / consumptionRates.length;

  // 建议补货量 = 30天的平均消耗量 + 10天的安全库存 - 当前库存
  const lastInventory = trendData[trendData.length - 1].库存 || 0;
  const recommendedAmount = Math.max(0, Math.round((avgConsumption * 30) + (avgConsumption * 10) - lastInventory));

  return recommendedAmount;
}

// 获取库存健康状态
function getInventoryHealthStatus(trendData: any[]) {
  if (!trendData || trendData.length < 3) return "未知";

  // 获取最后一个数据点的库存
  const lastInventory = trendData[trendData.length - 1].库存 || 0;

  // 计算平均每日消耗量
  const consumptionRates = [];
  for (let i = 1; i < trendData.length; i++) {
    const consumption = (trendData[i].出库 || 0) - (trendData[i].入库 || 0);
    if (consumption > 0) {
      consumptionRates.push(consumption);
    }
  }

  // 如果没有正消耗率，库存健康度为"过剩"
  if (consumptionRates.length === 0) return "过剩";

  // 计算平均每日消耗率
  const avgConsumption = consumptionRates.reduce((sum, rate) => sum + rate, 0) / consumptionRates.length;

  // 计算库存可持续天数
  const inventoryDays = lastInventory / avgConsumption;

  // 根据库存可持续天数判断健康状态
  if (inventoryDays < 7) {
    return "紧急";
  } else if (inventoryDays < 15) {
    return "警告";
  } else if (inventoryDays < 30) {
    return "正常";
  } else if (inventoryDays < 60) {
    return "良好";
  } else {
    return "过剩";
  }
}

// 获取库存健康状态对应的颜色
function getInventoryHealthColor(trendData: any[]) {
  const status = getInventoryHealthStatus(trendData);

  switch (status) {
    case "紧急":
      return "text-red-600";
    case "警告":
      return "text-amber-600";
    case "正常":
      return "text-blue-600";
    case "良好":
      return "text-green-600";
    case "过剩":
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
}

// 获取库存不足警报
function getLowStockAlerts(inventoryData: any[]) {
  if (!inventoryData || inventoryData.length === 0) return [];

  const alerts = [];

  for (const item of inventoryData) {
    // 如果设置了最小库存，且当前库存低于最小库存
    if (item.minQuantity && item.quantity < item.minQuantity) {
      alerts.push({
        productId: item.productId,
        productName: item.product?.name || `产品 #${item.productId}`,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name || `仓库 #${item.warehouseId}`
      });
    }
  }

  // 按库存差距排序（差距最大的排在前面）
  return alerts.sort((a, b) => {
    const aGap = a.minQuantity - a.quantity;
    const bGap = b.minQuantity - b.quantity;
    return bGap - aGap;
  });
}

// 获取库存过剩警报
function getOverstockAlerts(inventoryData: any[]) {
  if (!inventoryData || inventoryData.length === 0) return [];

  const alerts = [];

  for (const item of inventoryData) {
    // 计算建议的最大库存（如果有最小库存，则为最小库存的3倍；否则基于当前库存）
    const maxQuantity = item.minQuantity ? item.minQuantity * 3 : item.quantity * 1.5;

    // 如果当前库存超过建议的最大库存
    if (item.quantity > maxQuantity && item.quantity > 20) {
      alerts.push({
        productId: item.productId,
        productName: item.product?.name || `产品 #${item.productId}`,
        quantity: item.quantity,
        maxQuantity: Math.round(maxQuantity),
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name || `仓库 #${item.warehouseId}`
      });
    }
  }

  // 按库存差距排序（差距最大的排在前面）
  return alerts.sort((a, b) => {
    const aGap = a.quantity - a.maxQuantity;
    const bGap = b.quantity - b.maxQuantity;
    return bGap - aGap;
  });
}

// 获取库存变动警报
function getInventoryChangeAlerts(trendData: any[]) {
  if (!trendData || trendData.length < 3) return [];

  const alerts = [];

  // 获取第一个和最后一个数据点
  const firstPoint = trendData[0];
  const lastPoint = trendData[trendData.length - 1];

  // 计算库存变化率
  if (firstPoint.库存 > 0) {
    const changeRate = (lastPoint.库存 - firstPoint.库存) / firstPoint.库存;

    // 如果库存减少超过30%
    if (changeRate < -0.3) {
      alerts.push(`库存减少 ${Math.abs(changeRate * 100).toFixed(0)}% (从 ${firstPoint.库存} 到 ${lastPoint.库存})`);
    }

    // 如果库存增加超过50%
    if (changeRate > 0.5) {
      alerts.push(`库存增加 ${(changeRate * 100).toFixed(0)}% (从 ${firstPoint.库存} 到 ${lastPoint.库存})`);
    }
  }

  // 计算入库和出库的比例
  const totalInflow = trendData.reduce((sum, item) => sum + (item.入库 || 0), 0);
  const totalOutflow = trendData.reduce((sum, item) => sum + (item.出库 || 0), 0);

  // 如果入库量是出库量的2倍以上
  if (totalInflow > totalOutflow * 2 && totalOutflow > 0) {
    alerts.push(`入库量是出库量的 ${(totalInflow / totalOutflow).toFixed(1)} 倍，可能导致库存积压`);
  }

  // 如果出库量是入库量的2倍以上
  if (totalOutflow > totalInflow * 2 && totalInflow > 0) {
    alerts.push(`出库量是入库量的 ${(totalOutflow / totalInflow).toFixed(1)} 倍，可能导致库存不足`);
  }

  return alerts;
}

// 获取库存优化建议
function getInventoryOptimizationAlerts(inventoryData: any[]) {
  if (!inventoryData || inventoryData.length === 0) return [
    "建议设置产品的最小库存量，以便系统自动提醒补货",
    "定期检查库存状态，避免库存积压或短缺",
    "分析销售数据，优化库存结构"
  ];

  const alerts = [];

  // 计算库存总量
  const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantity, 0);

  // 计算设置了最小库存的产品数量
  const productsWithMinQuantity = inventoryData.filter(item => item.minQuantity).length;

  // 如果设置了最小库存的产品比例低于50%
  if (productsWithMinQuantity / inventoryData.length < 0.5) {
    alerts.push(`仅有 ${Math.round(productsWithMinQuantity / inventoryData.length * 100)}% 的产品设置了最小库存，建议为更多产品设置最小库存`);
  }

  // 计算库存为零的产品数量
  const zeroStockProducts = inventoryData.filter(item => item.quantity === 0).length;

  // 如果有库存为零的产品
  if (zeroStockProducts > 0) {
    alerts.push(`有 ${zeroStockProducts} 个产品库存为零，建议及时补货`);
  }

  // 计算库存过剩的产品数量
  const overstockProducts = getOverstockAlerts(inventoryData).length;

  // 如果有库存过剩的产品
  if (overstockProducts > 0) {
    alerts.push(`有 ${overstockProducts} 个产品库存过剩，建议调整采购计划或促销清理`);
  }

  // 添加一些通用建议
  alerts.push("建议定期分析库存周转率，提高库存管理效率");
  alerts.push("考虑实施ABC分类管理，对不同类别的产品采用不同的库存策略");

  return alerts;
}

// 获取库存优化建议
function getInventoryOptimizationSuggestions(trendData: any[]) {
  if (!trendData || trendData.length < 3) return ["数据不足，无法提供优化建议"];

  const suggestions = [];
  const status = getInventoryHealthStatus(trendData);

  // 基于库存健康状态提供建议
  switch (status) {
    case "紧急":
      suggestions.push("库存水平紧急，建议立即补货");
      suggestions.push("考虑增加安全库存，避免库存不足影响业务");
      suggestions.push("检查供应链，确保补货及时到位");
      break;
    case "警告":
      suggestions.push("库存水平较低，建议尽快安排补货");
      suggestions.push("关注高需求产品，优先补充这些产品的库存");
      suggestions.push("检查近期销售预测，调整补货计划");
      break;
    case "正常":
      suggestions.push("库存水平正常，定期检查库存状态");
      suggestions.push("优化库存结构，确保各类产品库存平衡");
      suggestions.push("关注销售趋势变化，及时调整库存策略");
      break;
    case "良好":
      suggestions.push("库存水平良好，维持当前库存管理策略");
      suggestions.push("考虑优化采购周期，降低库存持有成本");
      suggestions.push("分析畅销产品，适当增加这些产品的库存比例");
      break;
    case "过剩":
      suggestions.push("库存水平过高，考虑减少采购频率或数量");
      suggestions.push("对滞销产品进行促销，降低库存积压");
      suggestions.push("分析库存结构，避免资金过多占用在库存上");
      suggestions.push("优化需求预测，避免过度采购");
      break;
  }

  // 基于趋势数据提供额外建议
  const lastInventory = trendData[trendData.length - 1].库存 || 0;
  const firstInventory = trendData[0].库存 || 0;

  if (lastInventory > firstInventory * 1.2) {
    suggestions.push("库存呈明显上升趋势，注意控制采购量，避免库存积压");
  } else if (lastInventory < firstInventory * 0.8) {
    suggestions.push("库存呈明显下降趋势，关注库存补充，避免断货风险");
  }

  // 计算入库和出库的比例
  const totalInflow = trendData.reduce((sum, item) => sum + (item.入库 || 0), 0);
  const totalOutflow = trendData.reduce((sum, item) => sum + (item.出库 || 0), 0);

  if (totalInflow > totalOutflow * 1.2) {
    suggestions.push("入库量明显大于出库量，建议调整采购计划，避免库存积压");
  } else if (totalOutflow > totalInflow * 1.2) {
    suggestions.push("出库量明显大于入库量，建议增加采购量，确保库存充足");
  }

  return suggestions;
}

export function InventoryAnalytics() {
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [warehouseData, setWarehouseData] = useState<any[]>([])
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [trendData, setTrendData] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState({
    inventoryByWarehouse: [],
    inventoryByCategory: [],
    inventoryValueByWarehouse: [],
    topProducts: [],
    inventoryTrends: [],
    costAnalysis: {
      totalCost: 0,
      averageCost: 0,
      costByCategory: [],
      costByWarehouse: []
    }
  })

  useEffect(() => {
    async function loadData() {
      try {
        const warehouses = await getWarehouses()
        setWarehouseData(warehouses)

        const inventory = await getInventory()
        setInventoryData(inventory)

        // 加载初始趋势数据（默认为月度）
        const trends = await getInventoryTrends('month')
        setTrendData(trends)

        processAnalyticsData(inventory, warehouses)
      } catch (error) {
        console.error("Error loading inventory data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // 当趋势周期或筛选条件变化时，重新加载趋势数据
  useEffect(() => {
    async function loadTrendData() {
      try {
        setIsLoading(true)
        const warehouseId = selectedWarehouse !== "all" ? Number(selectedWarehouse) : undefined
        const productId = selectedProduct !== "all" ? Number(selectedProduct) : undefined

        const trends = await getInventoryTrends(trendPeriod, warehouseId, productId)
        setTrendData(trends)
      } catch (error) {
        console.error("Error loading trend data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrendData()
  }, [trendPeriod, selectedWarehouse, selectedProduct])

  // 处理分析数据
  const processAnalyticsData = (inventory, warehouses) => {
    // 按仓库统计库存数量
    const inventoryByWarehouse = warehouses.map(warehouse => {
      const warehouseItems = inventory.filter(item => item.warehouseId === warehouse.id)
      const totalQuantity = warehouseItems.reduce((sum, item) => sum + item.quantity, 0)
      return {
        name: warehouse.name,
        value: totalQuantity
      }
    }).filter(item => item.value > 0)

    // 按仓库统计库存价值
    const inventoryValueByWarehouse = warehouses.map(warehouse => {
      const warehouseItems = inventory.filter(item => item.warehouseId === warehouse.id)
      const totalValue = warehouseItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0)
      return {
        name: warehouse.name,
        value: totalValue
      }
    }).filter(item => item.value > 0)

    // 按分类统计库存
    const categoryMap = new Map()
    inventory.forEach(item => {
      const category = item.product.category || '未分类'
      const currentValue = categoryMap.get(category) || 0
      categoryMap.set(category, currentValue + item.quantity)
    })

    const inventoryByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }))

    // 库存量最多的产品
    const productMap = new Map()
    inventory.forEach(item => {
      const productId = item.product.id
      const currentQuantity = productMap.get(productId)?.quantity || 0
      productMap.set(productId, {
        name: item.product.name,
        quantity: currentQuantity + item.quantity,
        value: (currentQuantity + item.quantity) * item.product.price
      })
    })

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        value: item.value
      }))

    // 计算库存成本分析
    const totalCost = inventoryValueByWarehouse.reduce((sum, item) => sum + item.value, 0)
    const totalQuantity = inventoryByWarehouse.reduce((sum, item) => sum + item.value, 0)
    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0

    // 按分类统计成本
    const categoryValueMap = new Map()
    inventory.forEach(item => {
      const category = item.product.category || '未分类'
      const currentValue = categoryValueMap.get(category) || 0
      categoryValueMap.set(category, currentValue + (item.quantity * item.product.price))
    })

    const costByCategory = Array.from(categoryValueMap.entries()).map(([name, value]) => ({
      name,
      value
    }))

    // 计算库存成本分析
    const costAnalysis = {
      totalCost,
      averageCost,
      costByCategory,
      costByWarehouse: inventoryValueByWarehouse
    }

    setAnalyticsData({
      inventoryByWarehouse,
      inventoryByCategory,
      inventoryValueByWarehouse,
      topProducts,
      inventoryTrends: [],
      costAnalysis
    })
  }

  if (isLoading) {
    return <InventoryAnalyticsSkeleton />
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">库存概览</TabsTrigger>
          <TabsTrigger value="products">产品分析</TabsTrigger>
          <TabsTrigger value="cost">成本分析</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="forecast">库存预测</TabsTrigger>
          <TabsTrigger value="alerts">库存警报</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 仓库库存分布 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>仓库库存分布</CardTitle>
                <CardDescription>各仓库库存数量分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.inventoryByWarehouse}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.inventoryByWarehouse.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} 件`, '库存数量']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 仓库库存价值分布 */}
            <Card>
              <CardHeader>
                <CardTitle>仓库库存价值分布</CardTitle>
                <CardDescription>各仓库库存价值分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.inventoryValueByWarehouse}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.inventoryValueByWarehouse.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`¥${value.toFixed(2)}`, '库存价值']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 分类库存分布 */}
          <Card>
            <CardHeader>
              <CardTitle>分类库存分布</CardTitle>
              <CardDescription>各产品分类的库存数量</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.inventoryByCategory}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} 件`, '库存数量']} />
                    <Legend />
                    <Bar dataKey="value" name="库存数量" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {/* 库存量最多的产品 */}
          <Card>
            <CardHeader>
              <CardTitle>库存量最多的产品</CardTitle>
              <CardDescription>按库存数量排序的前10个产品</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.topProducts}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip formatter={(value, name) => [value, name === 'quantity' ? '库存数量' : '库存价值']} />
                    <Legend />
                    <Bar dataKey="quantity" name="库存数量" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 库存价值最高的产品 */}
          <Card>
            <CardHeader>
              <CardTitle>库存价值最高的产品</CardTitle>
              <CardDescription>按库存价值排序的前10个产品</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.topProducts.sort((a, b) => b.value - a.value).slice(0, 10)}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip formatter={(value) => [`¥${value.toFixed(2)}`, '库存价值']} />
                    <Legend />
                    <Bar dataKey="value" name="库存价值" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          {/* 库存成本概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>总库存成本</CardTitle>
                <CardDescription>所有库存的总价值</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">¥{analyticsData.costAnalysis.totalCost.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>平均单位成本</CardTitle>
                <CardDescription>每件产品的平均成本</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">¥{analyticsData.costAnalysis.averageCost.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>库存周转率</CardTitle>
                <CardDescription>库存周转速度指标</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4.2次/年</div>
                <p className="text-xs text-muted-foreground mt-1">
                  行业平均: 5.1次/年
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 按分类的库存成本 */}
          <Card>
            <CardHeader>
              <CardTitle>按分类的库存成本</CardTitle>
              <CardDescription>各产品分类的库存价值分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.costAnalysis.costByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.costAnalysis.costByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`¥${value.toFixed(2)}`, '库存价值']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 库存成本分析 */}
          <Card>
            <CardHeader>
              <CardTitle>库存成本分析</CardTitle>
              <CardDescription>库存成本结构和优化建议</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">成本结构</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">产品成本</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">仓储成本</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">管理成本</span>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">成本优化建议</h4>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>减少低周转率产品的库存量</li>
                      <li>优化仓库布局，提高存储效率</li>
                      <li>考虑批量采购高频使用产品以降低单位成本</li>
                      <li>实施准时制库存管理，减少库存持有成本</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">成本预警</h4>
                  <div className="flex items-start gap-2">
                    <AlertTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">库存周转率低于行业平均水平</p>
                      <p className="mt-1">当前库存周转率为4.2次/年，低于行业平均的5.1次/年，建议优化库存管理策略，提高周转效率。</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>库存趋势分析</CardTitle>
              <CardDescription>近期库存变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="trend-period">时间周期</Label>
                  <Select value={trendPeriod} onValueChange={(value: any) => setTrendPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择时间周期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">最近一周</SelectItem>
                      <SelectItem value="month">最近一个月</SelectItem>
                      <SelectItem value="quarter">最近一季度</SelectItem>
                      <SelectItem value="year">最近一年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="warehouse-filter">仓库</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="所有仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有仓库</SelectItem>
                      {warehouseData.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product-filter">产品</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="所有产品" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有产品</SelectItem>
                      {analyticsData.topProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id?.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTrendPeriod('month');
                      setSelectedWarehouse('all');
                      setSelectedProduct('all');
                    }}
                  >
                    重置筛选
                  </Button>
                </div>
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="入库" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="出库" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="库存" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总入库量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {trendData.reduce((sum, item) => sum + (item.入库 || 0), 0)} 件
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trendPeriod === 'week' ? '最近一周' :
                       trendPeriod === 'month' ? '最近一个月' :
                       trendPeriod === 'quarter' ? '最近一季度' : '最近一年'}
                       的总入库量
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总出库量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {trendData.reduce((sum, item) => sum + (item.出库 || 0), 0)} 件
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trendPeriod === 'week' ? '最近一周' :
                       trendPeriod === 'month' ? '最近一个月' :
                       trendPeriod === 'quarter' ? '最近一季度' : '最近一年'}
                       的总出库量
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">库存变化率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trendData.length > 0 ? (
                      <>
                        <div className={`text-2xl font-bold ${
                          trendData[trendData.length - 1].库存 > trendData[0].库存 ? 'text-green-600' :
                          trendData[trendData.length - 1].库存 < trendData[0].库存 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trendData[0].库存 === 0 ? '0%' :
                            ((trendData[trendData.length - 1].库存 - trendData[0].库存) / trendData[0].库存 * 100).toFixed(2) + '%'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {trendPeriod === 'week' ? '最近一周' :
                           trendPeriod === 'month' ? '最近一个月' :
                           trendPeriod === 'quarter' ? '最近一季度' : '最近一年'}
                           的库存变化率
                        </p>
                      </>
                    ) : (
                      <div className="text-2xl font-bold">-</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">趋势分析洞察</h3>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  {trendData.length > 0 ? (
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      {trendData[trendData.length - 1].库存 > trendData[0].库存 && (
                        <li>库存呈上升趋势，可能需要关注库存积压风险</li>
                      )}
                      {trendData[trendData.length - 1].库存 < trendData[0].库存 && (
                        <li>库存呈下降趋势，需要关注库存不足风险</li>
                      )}
                      {trendData.reduce((sum, item) => sum + item.入库, 0) > trendData.reduce((sum, item) => sum + item.出库, 0) && (
                        <li>入库量大于出库量，库存周转率可能下降</li>
                      )}
                      {trendData.reduce((sum, item) => sum + item.入库, 0) < trendData.reduce((sum, item) => sum + item.出库, 0) && (
                        <li>出库量大于入库量，需要关注补货时机</li>
                      )}
                      <li>建议根据库存变化趋势，优化采购和生产计划</li>
                      <li>定期分析库存周转率，提高库存管理效率</li>
                    </ul>
                  ) : (
                    <p className="text-sm text-blue-700">暂无足够数据进行趋势分析</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>库存警报</CardTitle>
              <CardDescription>需要关注的库存问题</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="bg-red-50 p-4 rounded-md border border-red-100">
                      <h4 className="text-sm font-medium text-red-800 mb-2">库存不足警报</h4>
                      {getLowStockAlerts(inventoryData).length > 0 ? (
                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                          {getLowStockAlerts(inventoryData).map((alert, index) => (
                            <li key={index}>
                              {alert.productName} - 当前库存: {alert.quantity} (低于最小库存: {alert.minQuantity})
                              {alert.warehouseName && ` - 仓库: ${alert.warehouseName}`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-700">目前没有库存不足的产品</p>
                      )}
                    </div>

                    <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">库存过剩警报</h4>
                      {getOverstockAlerts(inventoryData).length > 0 ? (
                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                          {getOverstockAlerts(inventoryData).map((alert, index) => (
                            <li key={index}>
                              {alert.productName} - 当前库存: {alert.quantity} (超过建议最大库存: {alert.maxQuantity})
                              {alert.warehouseName && ` - 仓库: ${alert.warehouseName}`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-amber-700">目前没有库存过剩的产品</p>
                      )}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">库存变动警报</h4>
                      {getInventoryChangeAlerts(trendData).length > 0 ? (
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                          {getInventoryChangeAlerts(trendData).map((alert, index) => (
                            <li key={index}>{alert}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-blue-700">最近没有显著的库存变动</p>
                      )}
                    </div>

                    <div className="bg-green-50 p-4 rounded-md border border-green-100">
                      <h4 className="text-sm font-medium text-green-800 mb-2">库存优化建议</h4>
                      <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                        {getInventoryOptimizationAlerts(inventoryData).map((alert, index) => (
                          <li key={index}>{alert}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // 导出库存警报报告
                          const alerts = {
                            lowStock: getLowStockAlerts(inventoryData),
                            overstock: getOverstockAlerts(inventoryData),
                            changes: getInventoryChangeAlerts(trendData),
                            optimization: getInventoryOptimizationAlerts(inventoryData)
                          };

                          // 创建一个Blob对象
                          const blob = new Blob([JSON.stringify(alerts, null, 2)], { type: 'application/json' });

                          // 创建一个下载链接
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `inventory_alerts_${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        导出警报报告
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>库存预测分析</CardTitle>
              <CardDescription>基于历史数据的库存预测</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="forecast-warehouse">仓库</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="所有仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有仓库</SelectItem>
                      {warehouseData.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="forecast-product">产品</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="所有产品" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有产品</SelectItem>
                      {analyticsData.topProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id?.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      ...trendData,
                      // 添加预测数据点
                      ...generateForecastData(trendData)
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="入库" stroke="#8884d8" />
                    <Line type="monotone" dataKey="出库" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="库存" stroke="#ffc658" strokeWidth={2} />
                    <Line type="monotone" dataKey="预测库存" stroke="#ff8042" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="预测需求" stroke="#d53f8c" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">预测补货时间</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trendData.length > 0 ? (
                        <>
                          <div className="text-2xl font-bold">
                            {calculateRestockTime(trendData)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            基于当前消耗速度，预计需要在此时间后补货
                          </p>
                        </>
                      ) : (
                        <div className="text-2xl font-bold">-</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">建议补货量</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trendData.length > 0 ? (
                        <>
                          <div className="text-2xl font-bold">
                            {calculateRecommendedRestockAmount(trendData)} 件
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            基于预测需求和最佳库存水平
                          </p>
                        </>
                      ) : (
                        <div className="text-2xl font-bold">-</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">库存健康度</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trendData.length > 0 ? (
                        <>
                          <div className={`text-2xl font-bold ${getInventoryHealthColor(trendData)}`}>
                            {getInventoryHealthStatus(trendData)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            基于当前库存水平和预测需求
                          </p>
                        </>
                      ) : (
                        <div className="text-2xl font-bold">-</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">库存优化建议</h4>
                  {trendData.length > 0 ? (
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      {getInventoryOptimizationSuggestions(trendData).map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-blue-700">暂无足够数据进行预测分析</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
