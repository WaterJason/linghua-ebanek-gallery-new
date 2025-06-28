"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  PlusIcon, 
  SearchIcon, 
  PackageIcon, 
  TruckIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// 模拟入库数据
const mockInboundData = [
  {
    id: 1,
    date: "2024-05-20",
    supplier: "优质珐琅材料供应商",
    items: [
      { productName: "掐丝珐琅底胎", quantity: 50, unit: "个", unitPrice: 25, total: 1250 },
      { productName: "珐琅釉料", quantity: 10, unit: "瓶", unitPrice: 80, total: 800 }
    ],
    totalAmount: 2050,
    status: "已完成",
    operator: "张三",
    notes: "质量良好，已验收入库"
  },
  {
    id: 2,
    date: "2024-05-18",
    supplier: "工艺品配件供应商",
    items: [
      { productName: "金属丝", quantity: 20, unit: "卷", unitPrice: 15, total: 300 },
      { productName: "包装盒", quantity: 100, unit: "个", unitPrice: 3, total: 300 }
    ],
    totalAmount: 600,
    status: "待验收",
    operator: "李四",
    notes: "部分商品待质检"
  }
]

export function InventoryInboundManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [inboundData, setInboundData] = useState(mockInboundData)
  const [isLoading, setIsLoading] = useState(false)

  // 计算统计数据
  const stats = {
    todayInbound: inboundData.filter(inbound => {
      const today = new Date().toDateString()
      return new Date(inbound.date).toDateString() === today
    }).reduce((sum, inbound) => sum + inbound.totalAmount, 0),
    
    weekInbound: inboundData.filter(inbound => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(inbound.date) >= weekAgo
    }).reduce((sum, inbound) => sum + inbound.totalAmount, 0),
    
    pendingCount: inboundData.filter(inbound => inbound.status === "待验收").length,
    completedCount: inboundData.filter(inbound => inbound.status === "已完成").length
  }

  // 过滤入库记录
  const filteredInbound = inboundData.filter(inbound => 
    inbound.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inbound.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inbound.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(inbound.date).toLocaleDateString().includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日入库</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todayInbound.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">今日入库金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周入库</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.weekInbound.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">近7天入库金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待验收</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">待验收入库单</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCount}</div>
            <p className="text-xs text-muted-foreground">已完成入库单</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">入库概览</TabsTrigger>
            <TabsTrigger value="records">入库记录</TabsTrigger>
            <TabsTrigger value="pending">待验收</TabsTrigger>
            <TabsTrigger value="entry">新建入库</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索入库记录..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              新建入库
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>入库趋势</CardTitle>
              <CardDescription>库存入库数据概览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">入库趋势图表将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>入库记录</CardTitle>
              <CardDescription>查看和管理库存入库记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead>入库金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInbound.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        暂无入库记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInbound.map((inbound) => (
                      <TableRow key={inbound.id}>
                        <TableCell>
                          {new Date(inbound.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{inbound.supplier}</TableCell>
                        <TableCell>¥{inbound.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={inbound.status === "已完成" ? "default" : "secondary"}>
                            {inbound.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{inbound.operator}</TableCell>
                        <TableCell>{inbound.notes || "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>待验收入库单</CardTitle>
              <CardDescription>需要验收的入库单据</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead>入库金额</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inboundData.filter(inbound => inbound.status === "待验收").map((inbound) => (
                    <TableRow key={inbound.id}>
                      <TableCell>
                        {new Date(inbound.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{inbound.supplier}</TableCell>
                      <TableCell>¥{inbound.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{inbound.operator}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="default">
                            验收
                          </Button>
                          <Button size="sm" variant="outline">
                            查看详情
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>新建入库单</CardTitle>
              <CardDescription>创建新的库存入库记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">入库单创建表单将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
