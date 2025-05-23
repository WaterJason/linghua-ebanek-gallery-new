"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

export function CustomersTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">客户管理</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          添加客户
        </Button>
      </div>
      
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="搜索客户..." className="pl-9" />
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="张三" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">张三</p>
                <p className="text-sm">{formatCurrency(12450)}</p>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>共8笔订单</span>
                <span className="text-green-600">+15% ↑</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline">查看详情</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="李四" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">李四</p>
                <p className="text-sm">{formatCurrency(9680)}</p>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>共6笔订单</span>
                <span className="text-green-600">+8% ↑</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline">查看详情</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/men/67.jpg" alt="王五" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">王五</p>
                <p className="text-sm">{formatCurrency(5120)}</p>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>共4笔订单</span>
                <span className="text-red-600">-3% ↓</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline">查看详情</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
