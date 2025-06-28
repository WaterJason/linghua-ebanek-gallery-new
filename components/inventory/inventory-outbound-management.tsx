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
  ClockIcon,
  ArrowRightIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// 模拟出库数据
const mockOutboundData = [
  {
    id: 1,
    date: "2024-05-20",
    type: "销售出库",
    customer: "张女士",
    items: [
      { productName: "掐丝珐琅手镯", quantity: 2, unit: "个", unitPrice: 280, total: 560 },
      { productName: "珐琅耳环", quantity: 1, unit: "对", unitPrice: 180, total: 180 }
    ],
    totalAmount: 740,
    status: "已发货",
    operator: "王五",
    notes: "顺丰快递，已发货"
  },
  {
    id: 2,
    date: "2024-05-19",
    type: "渠道配货",
    customer: "ABC珠宝店",
    items: [
      { productName: "掐丝珐琅项链", quantity: 5, unit: "条", unitPrice: 350, total: 1750 },
      { productName: "珐琅胸针", quantity: 3, unit: "个", unitPrice: 120, total: 360 }
    ],
    totalAmount: 2110,
    status: "待发货",
    operator: "赵六",
    notes: "渠道商订货，需要包装"
  }
]

export function InventoryOutboundManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [outboundData, setOutboundData] = useState(mockOutboundData)
  const [isLoading, setIsLoading] = useState(false)

  // 计算统计数据
  const stats = {
    todayOutbound: outboundData.filter(outbound => {
      const today = new Date().toDateString()
      return new Date(outbound.date).toDateString() === today
    }).reduce((sum, outbound) => sum + outbound.totalAmount, 0),
    
    weekOutbound: outboundData.filter(outbound => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(outbound.date) >= weekAgo
    }).reduce((sum, outbound) => sum + outbound.totalAmount, 0),
    
    pendingCount: outboundData.filter(outbound => outbound.status === "待发货").length,
    shippedCount: outboundData.filter(outbound => outbound.status === "已发货").length
  }

  // 过滤出库记录
  const filteredOutbound = outboundData.filter(outbound => 
    outbound.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outbound.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outbound.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outbound.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(outbound.date).toLocaleDateString().includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日出库</CardTitle>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todayOutbound.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">今日出库金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周出库</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.weekOutbound.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">近7天出库金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待发货</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">待发货出库单</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发货</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shippedCount}</div>
            <p className="text-xs text-muted-foreground">已发货出库单</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">出库概览</TabsTrigger>
            <TabsTrigger value="records">出库记录</TabsTrigger>
            <TabsTrigger value="pending">待发货</TabsTrigger>
            <TabsTrigger value="entry">新建出库</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索出库记录..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              新建出库
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>出库趋势</CardTitle>
              <CardDescription>库存出库数据概览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ArrowRightIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">出库趋势图表将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>出库记录</CardTitle>
              <CardDescription>查看和管理库存出库记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>出库类型</TableHead>
                    <TableHead>客户/渠道</TableHead>
                    <TableHead>出库金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOutbound.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        暂无出库记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOutbound.map((outbound) => (
                      <TableRow key={outbound.id}>
                        <TableCell>
                          {new Date(outbound.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{outbound.type}</Badge>
                        </TableCell>
                        <TableCell>{outbound.customer}</TableCell>
                        <TableCell>¥{outbound.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={outbound.status === "已发货" ? "default" : "secondary"}>
                            {outbound.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{outbound.operator}</TableCell>
                        <TableCell>{outbound.notes || "-"}</TableCell>
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
              <CardTitle>待发货出库单</CardTitle>
              <CardDescription>需要发货的出库单据</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>客户/渠道</TableHead>
                    <TableHead>出库金额</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outboundData.filter(outbound => outbound.status === "待发货").map((outbound) => (
                    <TableRow key={outbound.id}>
                      <TableCell>
                        {new Date(outbound.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{outbound.customer}</TableCell>
                      <TableCell>¥{outbound.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{outbound.operator}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="default">
                            发货
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
              <CardTitle>新建出库单</CardTitle>
              <CardDescription>创建新的库存出库记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ArrowRightIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">出库单创建表单将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
