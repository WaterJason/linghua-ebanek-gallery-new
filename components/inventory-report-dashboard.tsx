"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DownloadIcon, AlertTriangleIcon, PackageIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

export function InventoryReportDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [warehouses, setWarehouses] = useState([])
  const [inventoryData, setInventoryData] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [categorySummary, setCategorySummary] = useState([])
  const [warehouseSummary, setWarehouseSummary] = useState([])
  const [summaryData, setSummaryData] = useState({
    totalItems: 0,
    totalProducts: 0,
    lowStockCount: 0,
    warehouseCount: 0
  })

  // 加载仓库和库存数据
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // 加载仓库数据
        const warehousesResponse = await fetch('/api/warehouses')
        if (!warehousesResponse.ok) throw new Error("Failed to fetch warehouses")
        const warehousesData = await warehousesResponse.json()
        setWarehouses(warehousesData)
        
        // 加载库存数据
        await loadInventoryData(selectedWarehouse)
      } catch (error) {
        console.error("Error loading inventory data:", error)
        toast({
          title: "加载失败",
          description: "无法加载库存数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [selectedWarehouse])

  const loadInventoryData = async (warehouseId) => {
    try {
      // 构建查询参数
      const params = new URLSearchParams()
      if (warehouseId && warehouseId !== "all") {
        params.append('warehouseId', warehouseId)
      }
      
      const response = await fetch(`/api/inventory?${params}`)
      if (!response.ok) throw new Error("Failed to fetch inventory")
      
      const data = await response.json()
      setInventoryData(data)
      
      // 处理库存数据
      processInventoryData(data)
    } catch (error) {
      console.error("Error loading inventory data:", error)
      throw error
    }
  }

  const processInventoryData = (data) => {
    // 计算低库存商品
    const lowStock = data.filter(item => 
      item.minQuantity !== null && item.quantity <= item.minQuantity
    )
    setLowStockItems(lowStock)
    
    // 按类别分组统计
    const categoryMap = new Map()
    data.forEach(item => {
      const category = item.product.category || "未分类"
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          value: 0,
          itemCount: 0
        })
      }
      
      const categoryStats = categoryMap.get(category)
      categoryStats.value += item.quantity
      categoryStats.itemCount += 1
    })
    
    setCategorySummary(Array.from(categoryMap.values()))
    
    // 按仓库分组统计
    const warehouseMap = new Map()
    data.forEach(item => {
      const warehouseId = item.warehouse.id
      if (!warehouseMap.has(warehouseId)) {
        warehouseMap.set(warehouseId, {
          name: item.warehouse.name,
          value: 0,
          itemCount: 0
        })
      }
      
      const warehouseStats = warehouseMap.get(warehouseId)
      warehouseStats.value += item.quantity
      warehouseStats.itemCount += 1
    })
    
    setWarehouseSummary(Array.from(warehouseMap.values()))
    
    // 计算汇总数据
    const uniqueProducts = new Set(data.map(item => item.product.id))
    
    setSummaryData({
      totalItems: data.reduce((sum, item) => sum + item.quantity, 0),
      totalProducts: uniqueProducts.size,
      lowStockCount: lowStock.length,
      warehouseCount: warehouses.length
    })
  }

  const handleExportReport = async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        format: 'excel'
      })
      
      if (selectedWarehouse !== "all") {
        params.append('warehouseId', selectedWarehouse)
      }
      
      // 下载报表
      window.location.href = `/api/export/inventory-report?${params}`
      
      toast({
        title: "导出成功",
        description: "库存报表已开始下载",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "导出失败",
        description: "无法导出库存报表",
        variant: "destructive",
      })
    }
  }

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C']

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>库存报表</CardTitle>
          <CardDescription>查看和分析库存数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择仓库" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部仓库</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={handleExportReport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              导出报表
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 库存汇总 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总库存数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {summaryData.totalProducts} 种产品
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">仓库数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.warehouseCount}</div>
            <p className="text-xs text-muted-foreground">
              活跃仓库数量
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">低库存警告</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              需要补货的产品数量
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均每仓库产品数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData.warehouseCount > 0 
                ? Math.round(summaryData.totalProducts / summaryData.warehouseCount) 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              每个仓库的平均产品种类
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 类别库存分布 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>类别库存分布</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : categorySummary.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categorySummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {categorySummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} 件`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* 仓库库存分布 */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>仓库库存分布</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">加载数据中...</p>
              </div>
            ) : warehouseSummary.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={warehouseSummary}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} 件`} />
                  <Bar dataKey="value" name="库存数量" fill="#0070f3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
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
            <div className="text-center py-4">加载数据中...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无低库存产品</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>产品名称</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead className="text-right">当前库存</TableHead>
                  <TableHead className="text-right">最小库存</TableHead>
                  <TableHead className="text-right">缺口</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.product.category || "未分类"}</TableCell>
                    <TableCell>{item.warehouse.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.minQuantity}</TableCell>
                    <TableCell className="text-right text-red-500">
                      {item.minQuantity - item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
