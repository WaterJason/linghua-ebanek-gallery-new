"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinanceDashboardMobile } from "@/components/finance/finance-dashboard-mobile"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function MobileFinancePage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="accounts">账户</TabsTrigger>
          <TabsTrigger value="transactions">记账</TabsTrigger>
          <TabsTrigger value="reports">报表</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <FinanceDashboardMobile />
        </TabsContent>
        
        <TabsContent value="accounts" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">账户管理</h2>
              <Button size="sm">
                <Icons.plus className="h-4 w-4 mr-2" />
                添加账户
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600">🏦</span>
                    </div>
                    <div>
                      <p className="font-medium">工商银行</p>
                      <p className="text-sm text-muted-foreground">银行账户</p>
                    </div>
                  </div>
                  <p className="font-semibold">¥25,000.00</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <span className="text-green-600">💵</span>
                    </div>
                    <div>
                      <p className="font-medium">现金账户</p>
                      <p className="text-sm text-muted-foreground">现金账户</p>
                    </div>
                  </div>
                  <p className="font-semibold">¥5,000.00</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600">💰</span>
                    </div>
                    <div>
                      <p className="font-medium">支付宝</p>
                      <p className="text-sm text-muted-foreground">支付宝</p>
                    </div>
                  </div>
                  <p className="font-semibold">¥8,500.00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">交易记录</h2>
              <Button size="sm">
                <Icons.plus className="h-4 w-4 mr-2" />
                记一笔
              </Button>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <Button variant="outline" size="sm" className="flex-1">
                <Icons.arrowUp className="h-4 w-4 mr-2 text-green-500" />
                收入
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Icons.arrowDown className="h-4 w-4 mr-2 text-red-500" />
                支出
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Icons.transfer className="h-4 w-4 mr-2 text-blue-500" />
                转账
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">今天</div>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <Icons.shoppingBag className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">原材料采购</p>
                      <p className="text-xs text-muted-foreground">14:30 · 采购部门</p>
                    </div>
                  </div>
                  <p className="font-semibold text-red-600">-¥2,500.00</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-sm text-muted-foreground mb-2">昨天</div>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <Icons.store className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">产品销售</p>
                      <p className="text-xs text-muted-foreground">11:15 · 销售部门</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">+¥4,850.00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">财务报表</h2>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">收支趋势</h3>
                <div className="h-40 bg-muted/30 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">图表加载中...</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">支出分类</h3>
                <div className="h-40 bg-muted/30 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">图表加载中...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 悬浮按钮 - 仅在记账标签页显示 */}
      {activeTab === "transactions" && (
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
