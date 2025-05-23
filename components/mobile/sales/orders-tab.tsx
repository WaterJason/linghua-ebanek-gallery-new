"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export function OrdersTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">订单管理</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          新建订单
        </Button>
      </div>
      
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="搜索订单..." className="pl-9" />
      </div>
      
      <div className="flex space-x-2 overflow-x-auto py-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          全部状态
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          待付款
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          处理中
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          已完成
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          已取消
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">订单 #SO-2505</p>
              <p className="text-xs text-muted-foreground">张三 · 今天 11:15</p>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">已完成</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>3件商品</span>
            <span className="font-semibold">{formatCurrency(4850)}</span>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" className="mr-2">查看详情</Button>
            <Button size="sm">打印订单</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">订单 #SO-2504</p>
              <p className="text-xs text-muted-foreground">李四 · 昨天 15:20</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">处理中</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>5件商品</span>
            <span className="font-semibold">{formatCurrency(6300)}</span>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" className="mr-2">查看详情</Button>
            <Button size="sm">更新状态</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">订单 #SO-2503</p>
              <p className="text-xs text-muted-foreground">王五 · 5月22日</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">待付款</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>2件商品</span>
            <span className="font-semibold">{formatCurrency(3200)}</span>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" className="mr-2">查看详情</Button>
            <Button size="sm">提醒付款</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
