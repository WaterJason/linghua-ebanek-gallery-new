"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export default function MobileSalesPage() {
  const [activeTab, setActiveTab] = useState("orders")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="orders" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">订单</TabsTrigger>
          <TabsTrigger value="customers">客户</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="stats">统计</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-4">
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
        </TabsContent>
        
        <TabsContent value="customers" className="mt-4">
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
        </TabsContent>
        
        <TabsContent value="pos" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">POS销售</h2>
              <Button size="sm">
                <Icons.plus className="h-4 w-4 mr-2" />
                新建销售
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">最近POS销售</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <p className="font-medium">饰品销售</p>
                      <p className="text-xs text-muted-foreground">今天 14:25</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(850)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <p className="font-medium">摆件销售</p>
                      <p className="text-xs text-muted-foreground">今天 11:30</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(1200)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">工艺品销售</p>
                      <p className="text-xs text-muted-foreground">昨天 16:45</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(2400)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button className="w-full" size="lg">
              <Icons.store className="h-5 w-5 mr-2" />
              进入POS模式
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">销售统计</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{formatCurrency(36450)}</div>
                  <div className="text-sm text-muted-foreground">本月销售额</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">42</div>
                  <div className="text-sm text-muted-foreground">本月订单数</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">销售趋势</h3>
                <div className="h-40 bg-muted/30 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">图表加载中...</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">热销产品</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                        <img src="https://via.placeholder.com/40" alt="产品C" className="w-8 h-8 object-cover rounded" />
                      </div>
                      <p className="font-medium">产品C</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">120件</p>
                      <p className="text-xs text-muted-foreground">占比32%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                        <img src="https://via.placeholder.com/40" alt="产品D" className="w-8 h-8 object-cover rounded" />
                      </div>
                      <p className="font-medium">产品D</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">85件</p>
                      <p className="text-xs text-muted-foreground">占比23%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                        <img src="https://via.placeholder.com/40" alt="产品E" className="w-8 h-8 object-cover rounded" />
                      </div>
                      <p className="font-medium">产品E</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">42件</p>
                      <p className="text-xs text-muted-foreground">占比11%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 悬浮按钮 - 仅在订单、客户和POS标签页显示 */}
      {(activeTab === "orders" || activeTab === "customers" || activeTab === "pos") && (
        <Button
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Icons.plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
