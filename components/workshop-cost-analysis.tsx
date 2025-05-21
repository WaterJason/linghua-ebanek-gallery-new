"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  PieChart, 
  Palette, 
  Home, 
  Building, 
  Tag, 
  Loader2,
  DollarSign
} from "lucide-react"
import { getWorkshopActivities } from "@/lib/actions/workshop-actions"

// 活动类型映射
const activityTypeMap = {
  "jewelry_enameling": { label: "饰品点蓝手作", icon: <Tag className="h-4 w-4 mr-1" /> },
  "cloisonne_enameling": { label: "掐丝珐琅手作", icon: <Palette className="h-4 w-4 mr-1" /> }
};

// 场地类型映射
const locationTypeMap = {
  "in_gallery": { label: "馆内", icon: <Home className="h-4 w-4 mr-1" /> },
  "outside": { label: "外出", icon: <Building className="h-4 w-4 mr-1" /> }
};

// 底胎类型映射
const baseTypeMap = {
  "jewelry": { label: "饰品", color: "bg-blue-100 text-blue-800" },
  "coaster_bookmark": { label: "杯垫/书签", color: "bg-green-100 text-green-800" },
  "painting": { label: "摆画", color: "bg-purple-100 text-purple-800" },
  "ornament": { label: "摆件", color: "bg-amber-100 text-amber-800" }
};

// 从描述中提取额外信息
function extractExtraInfo(description) {
  if (!description) return {};
  
  try {
    // 尝试从描述中提取JSON格式的额外信息
    const extraInfoMatch = description.match(/\{EXTRA_INFO:(.*?)\}/);
    if (extraInfoMatch && extraInfoMatch[1]) {
      return JSON.parse(extraInfoMatch[1]);
    }
  } catch (e) {
    console.error("解析额外信息失败:", e);
  }
  
  return {};
}

export function WorkshopCostAnalysis() {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [costData, setCostData] = useState({
    byActivityType: {},
    byLocationType: {},
    byBaseType: {},
    totalCost: 0,
    totalRevenue: 0,
    totalProfit: 0,
    costBreakdown: {
      materialFee: 0,
      toolsFee: 0,
      teacherFee: 0,
      assistantFee: 0
    }
  })

  // 加载团建活动数据
  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true)
      try {
        const data = await getWorkshopActivities()
        setActivities(data.filter(a => a.isActive))
        analyzeData(data.filter(a => a.isActive))
      } catch (error) {
        console.error("Error loading workshop activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [])

  // 分析数据
  function analyzeData(activities) {
    const result = {
      byActivityType: {},
      byLocationType: {},
      byBaseType: {},
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0,
      costBreakdown: {
        materialFee: 0,
        toolsFee: 0,
        teacherFee: 0,
        assistantFee: 0
      }
    }

    // 初始化分类数据
    Object.keys(activityTypeMap).forEach(type => {
      result.byActivityType[type] = { count: 0, cost: 0, revenue: 0, profit: 0 }
    })
    
    Object.keys(locationTypeMap).forEach(type => {
      result.byLocationType[type] = { count: 0, cost: 0, revenue: 0, profit: 0 }
    })
    
    Object.keys(baseTypeMap).forEach(type => {
      result.byBaseType[type] = { count: 0, cost: 0, revenue: 0, profit: 0 }
    })

    // 分析每个活动
    activities.forEach(activity => {
      // 提取额外信息
      const extraInfo = extractExtraInfo(activity.description)
      const activityType = extraInfo.activityType || "jewelry_enameling"
      const locationType = extraInfo.locationType || "in_gallery"
      const baseType = extraInfo.baseType || "jewelry"
      const toolsFee = parseFloat(extraInfo.toolsFee || 0)
      
      // 计算成本
      const materialFee = parseFloat(activity.materialFee || 0)
      const teacherFee = parseFloat(activity.teacherFee || 0)
      const assistantFee = parseFloat(activity.assistantFee || 0)
      const totalCost = materialFee + toolsFee + teacherFee + assistantFee
      
      // 计算收入和利润
      const revenue = parseFloat(activity.price || 0)
      const profit = revenue - totalCost
      
      // 更新总计
      result.totalCost += totalCost
      result.totalRevenue += revenue
      result.totalProfit += profit
      
      // 更新成本明细
      result.costBreakdown.materialFee += materialFee
      result.costBreakdown.toolsFee += toolsFee
      result.costBreakdown.teacherFee += teacherFee
      result.costBreakdown.assistantFee += assistantFee
      
      // 更新分类数据
      result.byActivityType[activityType].count++
      result.byActivityType[activityType].cost += totalCost
      result.byActivityType[activityType].revenue += revenue
      result.byActivityType[activityType].profit += profit
      
      result.byLocationType[locationType].count++
      result.byLocationType[locationType].cost += totalCost
      result.byLocationType[locationType].revenue += revenue
      result.byLocationType[locationType].profit += profit
      
      result.byBaseType[baseType].count++
      result.byBaseType[baseType].cost += totalCost
      result.byBaseType[baseType].revenue += revenue
      result.byBaseType[baseType].profit += profit
    })

    setCostData(result)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>加载成本分析数据中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 总体成本概览 */}
      <Card>
        <CardHeader>
          <CardTitle>成本结构分析</CardTitle>
          <CardDescription>
            分析非遗掐丝珐琅手作沙龙/团建活动的成本结构和盈利情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总收入</p>
                    <h3 className="text-2xl font-bold">¥{costData.totalRevenue.toFixed(2)}</h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总成本</p>
                    <h3 className="text-2xl font-bold">¥{costData.totalCost.toFixed(2)}</h3>
                  </div>
                  <BarChart className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总利润</p>
                    <h3 className={`text-2xl font-bold ${costData.totalProfit < 0 ? "text-red-500" : "text-green-500"}`}>
                      ¥{costData.totalProfit.toFixed(2)}
                    </h3>
                  </div>
                  <PieChart className={`h-8 w-8 ${costData.totalProfit < 0 ? "text-red-500" : "text-green-500"}`} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 成本构成 */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">成本构成</h3>
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">场地</p>
                  <h3 className="text-xl font-bold">¥0.00</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    场地成本已包含在讲师费中
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">师资</p>
                  <h3 className="text-xl font-bold">
                    ¥{(costData.costBreakdown.teacherFee + costData.costBreakdown.assistantFee).toFixed(2)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    讲师费: ¥{costData.costBreakdown.teacherFee.toFixed(2)}<br />
                    助教费: ¥{costData.costBreakdown.assistantFee.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">底胎</p>
                  <h3 className="text-xl font-bold">¥{costData.costBreakdown.materialFee.toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    包括底胎和珐琅材料成本
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">工具</p>
                  <h3 className="text-xl font-bold">¥{costData.costBreakdown.toolsFee.toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    工具使用和损耗成本
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 分类分析 */}
      <Card>
        <CardHeader>
          <CardTitle>分类成本分析</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activityType">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activityType">按活动类型</TabsTrigger>
              <TabsTrigger value="locationType">按场地类型</TabsTrigger>
              <TabsTrigger value="baseType">按底胎类型</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activityType" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>活动类型</TableHead>
                    <TableHead>活动数量</TableHead>
                    <TableHead>总成本</TableHead>
                    <TableHead>总收入</TableHead>
                    <TableHead>总利润</TableHead>
                    <TableHead>平均利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costData.byActivityType).map(([type, data]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <div className="flex items-center">
                          {activityTypeMap[type]?.icon}
                          <span>{activityTypeMap[type]?.label || "未知类型"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>¥{data.cost.toFixed(2)}</TableCell>
                      <TableCell>¥{data.revenue.toFixed(2)}</TableCell>
                      <TableCell className={data.profit < 0 ? "text-red-500" : "text-green-500"}>
                        ¥{data.profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {data.revenue > 0 ? 
                          `${((data.profit / data.revenue) * 100).toFixed(2)}%` : 
                          "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="locationType" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>场地类型</TableHead>
                    <TableHead>活动数量</TableHead>
                    <TableHead>总成本</TableHead>
                    <TableHead>总收入</TableHead>
                    <TableHead>总利润</TableHead>
                    <TableHead>平均利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costData.byLocationType).map(([type, data]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <div className="flex items-center">
                          {locationTypeMap[type]?.icon}
                          <span>{locationTypeMap[type]?.label || "未知场地"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>¥{data.cost.toFixed(2)}</TableCell>
                      <TableCell>¥{data.revenue.toFixed(2)}</TableCell>
                      <TableCell className={data.profit < 0 ? "text-red-500" : "text-green-500"}>
                        ¥{data.profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {data.revenue > 0 ? 
                          `${((data.profit / data.revenue) * 100).toFixed(2)}%` : 
                          "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="baseType" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>底胎类型</TableHead>
                    <TableHead>活动数量</TableHead>
                    <TableHead>总成本</TableHead>
                    <TableHead>总收入</TableHead>
                    <TableHead>总利润</TableHead>
                    <TableHead>平均利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costData.byBaseType).map(([type, data]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <Badge className={baseTypeMap[type]?.color || "bg-gray-100 text-gray-800"}>
                          {baseTypeMap[type]?.label || "未知底胎"}
                        </Badge>
                      </TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>¥{data.cost.toFixed(2)}</TableCell>
                      <TableCell>¥{data.revenue.toFixed(2)}</TableCell>
                      <TableCell className={data.profit < 0 ? "text-red-500" : "text-green-500"}>
                        ¥{data.profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {data.revenue > 0 ? 
                          `${((data.profit / data.revenue) * 100).toFixed(2)}%` : 
                          "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
