"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkshopEntryForm } from "@/components/workshop-entry-form"
import { PieceWorkEntryForm } from "@/components/piece-work-entry-form"
import { EnhancedCoffeeShopEntryForm } from "@/components/enhanced-coffee-shop-entry-form"
import { PosSystem } from "@/components/pos-system"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function DailyLogContent() {
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">数据录入</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>日常数据录入</CardTitle>
          <CardDescription>记录每日销售、手作活动、计件工作等数据</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sales">POS销售</TabsTrigger>
              <TabsTrigger value="workshop">手作团建</TabsTrigger>
              <TabsTrigger value="piecework">计件工作</TabsTrigger>
              <TabsTrigger value="coffee">咖啡店销售</TabsTrigger>
            </TabsList>
            <TabsContent value="sales" className="pt-6">
              <PosSystem />
            </TabsContent>
            <TabsContent value="workshop" className="pt-6">
              <WorkshopEntryForm />
            </TabsContent>
            <TabsContent value="piecework" className="pt-6">
              <PieceWorkEntryForm />
            </TabsContent>
            <TabsContent value="coffee" className="pt-6">
              <EnhancedCoffeeShopEntryForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DailyLogPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight">数据录入</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>日常数据录入</CardTitle>
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
      <DailyLogContent />
    </Suspense>
  )
}
