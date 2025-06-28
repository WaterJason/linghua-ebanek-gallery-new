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
  TruckIcon,
  DollarSignIcon,
  PackageIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon,
  AlertTriangleIcon
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

// 模拟采购数据
const mockPurchaseData = [
  {
    id: 1,
    date: "2024-05-20",
    supplier: "优质咖啡豆供应商",
    items: [
      { name: "蓝山咖啡豆", quantity: 5, unit: "kg", unitPrice: 280, total: 1400 },
      { name: "哥伦比亚咖啡豆", quantity: 10, unit: "kg", unitPrice: 120, total: 1200 }
    ],
    totalAmount: 2600,
    status: "已完成",
    notes: "优质咖啡豆采购"
  },
  {
    id: 2,
    date: "2024-05-18",
    supplier: "茶叶批发商",
    items: [
      { name: "龙井茶", quantity: 2, unit: "kg", unitPrice: 150, total: 300 },
      { name: "铁观音", quantity: 3, unit: "kg", unitPrice: 180, total: 540 }
    ],
    totalAmount: 840,
    status: "已完成",
    notes: "茶叶补货"
  }
]

export function CoffeeShopPurchaseManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [purchaseData, setPurchaseData] = useState(mockPurchaseData)
  const [isLoading, setIsLoading] = useState(false)

  // 计算统计数据
  const stats = {
    todayPurchase: purchaseData.filter(purchase => {
      const today = new Date().toDateString()
      return new Date(purchase.date).toDateString() === today
    }).reduce((sum, purchase) => sum + purchase.totalAmount, 0),

    weekPurchase: purchaseData.filter(purchase => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(purchase.date) >= weekAgo
    }).reduce((sum, purchase) => sum + purchase.totalAmount, 0),

    monthPurchase: purchaseData.filter(purchase => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(purchase.date) >= monthAgo
    }).reduce((sum, purchase) => sum + purchase.totalAmount, 0),

    totalSuppliers: [...new Set(purchaseData.map(p => p.supplier))].length
  }

  // 过滤采购记录
  const filteredPurchases = purchaseData.filter(purchase =>
    purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(purchase.date).toLocaleDateString().includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日采购</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todayPurchase.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">今日采购金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周采购</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.weekPurchase.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">近7天采购金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月采购</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.monthPurchase.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">本月采购金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">供应商数量</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">合作供应商</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">采购概览</TabsTrigger>
            <TabsTrigger value="records">采购记录</TabsTrigger>
            <TabsTrigger value="suppliers">供应商管理</TabsTrigger>
            <TabsTrigger value="entry">录入采购</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索采购记录..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={() => router.push("/coffee-shop/purchase/new")}>
              <PlusIcon className="h-4 w-4 mr-2" />
              新增采购
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>采购趋势</CardTitle>
              <CardDescription>咖啡店采购数据概览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TruckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">采购趋势图表将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>采购记录</CardTitle>
              <CardDescription>查看和管理咖啡店采购记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead>采购金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        暂无采购记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {new Date(purchase.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>¥{purchase.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={purchase.status === "已完成" ? "default" : "secondary"}>
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{purchase.notes || "-"}</TableCell>
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

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>供应商管理</CardTitle>
              <CardDescription>管理咖啡店供应商信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">供应商管理功能将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>录入采购数据</CardTitle>
              <CardDescription>录入咖啡店采购记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">采购录入表单将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
