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
  PackageIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  WarehouseIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

export function InventoryReport() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [selectedWarehouse])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      // 这里应该调用实际的API
      // const response = await fetch(`/api/reports/inventory?warehouse=${selectedWarehouse}`)
      // const data = await response.json()
      // setReportData(data)
      
      // 演示数据
      setTimeout(() => {
        setReportData({
          summary: {
            totalProducts: 245,
            totalValue: 1256800,
            lowStockItems: 18,
            warehouseCount: 3
          },
          warehouses: [
            { id: "1", name: "主仓库", totalValue: 856000, itemCount: 180 },
            { id: "2", name: "展示仓库", totalValue: 245600, itemCount: 45 },
            { id: "3", name: "原料仓库", totalValue: 155200, itemCount: 20 }
          ],
          categoryDistribution: [
            { name: "成品", value: 45, amount: 565000 },
            { name: "半成品", value: 30, amount: 377000 },
            { name: "原材料", value: 20, amount: 251000 },
            { name: "包装材料", value: 5, amount: 63800 }
          ],
          lowStockItems: [
            { name: "掐丝珐琅手镯-蓝色", currentStock: 2, minStock: 5, warehouse: "主仓库" },
            { name: "珐琅原料-红色", currentStock: 1, minStock: 10, warehouse: "原料仓库" },
            { name: "包装盒-小号", currentStock: 8, minStock: 20, warehouse: "主仓库" },
            { name: "掐丝珐琅吊坠", currentStock: 3, minStock: 8, warehouse: "展示仓库" }
          ],
          monthlyMovement: [
            { month: "1月", inbound: 45, outbound: 38 },
            { month: "2月", inbound: 52, outbound: 42 },
            { month: "3月", inbound: 48, outbound: 45 },
            { month: "4月", inbound: 58, outbound: 52 },
            { month: "5月", inbound: 62, outbound: 48 },
            { month: "6月", inbound: 55, outbound: 51 }
          ]
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error loading inventory report:", error)
      toast({
        title: "加载失败",
        description: "无法加载库存报表数据",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    toast({
      title: "导出成功",
      description: "库存报表已开始下载",
    })
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">库存报表</h2>
          <p className="text-muted-foreground">查看库存数据分析和统计报表</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择仓库" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部仓库</SelectItem>
              <SelectItem value="1">主仓库</SelectItem>
              <SelectItem value="2">展示仓库</SelectItem>
              <SelectItem value="3">原料仓库</SelectItem>
            </SelectContent>
          </Select>
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
            <TabsTrigger value="warehouses">仓库分析</TabsTrigger>
            <TabsTrigger value="categories">分类分析</TabsTrigger>
            <TabsTrigger value="alerts">库存预警</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">产品总数</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalProducts}</p>
                    </div>
                    <PackageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">库存总价值</p>
                      <p className="text-2xl font-bold">¥{reportData.summary.totalValue.toLocaleString()}</p>
                    </div>
                    <TrendingUpIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">低库存商品</p>
                      <p className="text-2xl font-bold text-destructive">{reportData.summary.lowStockItems}</p>
                    </div>
                    <AlertTriangleIcon className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">仓库数量</p>
                      <p className="text-2xl font-bold">{reportData.summary.warehouseCount}</p>
                    </div>
                    <WarehouseIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 月度出入库趋势 */}
            <Card>
              <CardHeader>
                <CardTitle>月度出入库趋势</CardTitle>
                <CardDescription>查看每月库存出入库变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.monthlyMovement}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inbound" fill="#8884d8" name="入库" />
                    <Bar dataKey="outbound" fill="#82ca9d" name="出库" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warehouses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>仓库库存分布</CardTitle>
                <CardDescription>各仓库库存价值和商品数量</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>仓库名称</TableHead>
                      <TableHead>商品数量</TableHead>
                      <TableHead>库存价值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.itemCount}</TableCell>
                        <TableCell>¥{warehouse.totalValue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>库存分类分析</CardTitle>
                <CardDescription>按产品分类查看库存分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>库存预警</CardTitle>
                <CardDescription>低于最小库存的商品列表</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名称</TableHead>
                      <TableHead>当前库存</TableHead>
                      <TableHead>最小库存</TableHead>
                      <TableHead>所在仓库</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.lowStockItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.minStock}</TableCell>
                        <TableCell>{item.warehouse}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">库存不足</Badge>
                        </TableCell>
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
