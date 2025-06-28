"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkshopEntryForm } from "@/components/workshop-entry-form"
import { PieceWorkEntryForm } from "@/components/piece-work-entry-form"
import { EnhancedCoffeeShopEntryForm } from "@/components/enhanced-coffee-shop-entry-form"
import { PosSystem } from "@/components/pos-system"

function MobileDailyLogContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("sales")

  // 从URL参数中获取tab值
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["sales", "workshop", "piecework", "coffee"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-2xl font-bold">数据录入</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">日常数据录入</CardTitle>
          <CardDescription>记录每日销售、手作活动、计件工作等数据</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="sales" className="text-xs">POS销售</TabsTrigger>
              <TabsTrigger value="workshop" className="text-xs">手作团建</TabsTrigger>
              <TabsTrigger value="piecework" className="text-xs">计件工作</TabsTrigger>
              <TabsTrigger value="coffee" className="text-xs">咖啡店销售</TabsTrigger>
            </TabsList>
            <div className="p-4">
              <TabsContent value="sales" className="mt-0">
                <PosSystem />
              </TabsContent>
              <TabsContent value="workshop" className="mt-0">
                <WorkshopEntryForm />
              </TabsContent>
              <TabsContent value="piecework" className="mt-0">
                <PieceWorkEntryForm />
              </TabsContent>
              <TabsContent value="coffee" className="mt-0">
                <EnhancedCoffeeShopEntryForm />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MobileDailyLogPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 pb-16">
        <h1 className="text-2xl font-bold">数据录入</h1>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">日常数据录入</CardTitle>
            <CardDescription>加载中...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <MobileDailyLogContent />
    </Suspense>
  )
}
