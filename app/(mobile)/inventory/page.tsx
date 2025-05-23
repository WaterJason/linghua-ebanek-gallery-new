"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function MobileInventoryPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="products">产品</TabsTrigger>
          <TabsTrigger value="materials">原材料</TabsTrigger>
          <TabsTrigger value="alerts">预警</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">256</div>
                  <div className="text-sm text-muted-foreground">总库存数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">¥124,580</div>
                  <div className="text-sm text-muted-foreground">库存总值</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">预警数量</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-sm text-muted-foreground">库存健康度</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">库存分布</h3>
                <div className="h-40 bg-muted/30 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">图表加载中...</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between items-center">
              <h3 className="font-medium">库存预警</h3>
              <Button variant="ghost" size="sm">查看全部</Button>
            </div>
            
            <Card className="bg-red-50 border-red-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/40" alt="产品A" className="w-8 h-8 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">产品A</p>
                      <p className="text-xs text-muted-foreground">SKU: PA001</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">库存不足</Badge>
                    <p className="font-semibold mt-1">5件</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50 border-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/40" alt="原材料B" className="w-8 h-8 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">原材料B</p>
                      <p className="text-xs text-muted-foreground">SKU: MB002</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">即将不足</Badge>
                    <p className="font-semibold mt-1">15件</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">产品库存</h2>
              <Button size="sm">
                <Icons.plus className="h-4 w-4 mr-2" />
                添加产品
              </Button>
            </div>
            
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="搜索产品..." className="pl-9" />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto py-1">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                全部分类
              </Button>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                饰品类
              </Button>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                摆件类
              </Button>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                工艺品
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/48" alt="产品C" className="w-10 h-10 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">产品C</p>
                      <p className="text-xs text-muted-foreground">SKU: PC003 · 饰品类</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">充足</Badge>
                    <p className="font-semibold mt-1">120件</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/48" alt="产品D" className="w-10 h-10 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">产品D</p>
                      <p className="text-xs text-muted-foreground">SKU: PD004 · 摆件类</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">充足</Badge>
                    <p className="font-semibold mt-1">85件</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="materials" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">原材料库存</h2>
              <Button size="sm">
                <Icons.plus className="h-4 w-4 mr-2" />
                添加原材料
              </Button>
            </div>
            
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="搜索原材料..." className="pl-9" />
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/48" alt="铜丝" className="w-10 h-10 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">铜丝</p>
                      <p className="text-xs text-muted-foreground">SKU: M001 · 金属材料</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">充足</Badge>
                    <p className="font-semibold mt-1">200米</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/48" alt="珐琅釉" className="w-10 h-10 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">珐琅釉</p>
                      <p className="text-xs text-muted-foreground">SKU: M002 · 釉料</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">即将不足</Badge>
                    <p className="font-semibold mt-1">15kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">库存预警</h2>
            
            <Card className="bg-red-50 border-red-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/40" alt="产品A" className="w-8 h-8 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">产品A</p>
                      <p className="text-xs text-muted-foreground">SKU: PA001 · 饰品类</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">库存不足</Badge>
                    <p className="font-semibold mt-1">5件</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline" className="mr-2">查看详情</Button>
                  <Button size="sm">补充库存</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50 border-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mr-3">
                      <img src="https://via.placeholder.com/40" alt="原材料B" className="w-8 h-8 object-cover rounded" />
                    </div>
                    <div>
                      <p className="font-medium">原材料B</p>
                      <p className="text-xs text-muted-foreground">SKU: MB002 · 釉料</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">即将不足</Badge>
                    <p className="font-semibold mt-1">15件</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline" className="mr-2">查看详情</Button>
                  <Button size="sm">补充库存</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 悬浮按钮 - 仅在产品和原材料标签页显示 */}
      {(activeTab === "products" || activeTab === "materials") && (
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
