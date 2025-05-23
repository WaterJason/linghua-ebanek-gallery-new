"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinanceDashboard } from "@/components/finance/finance-dashboard"
import { AccountManagement } from "@/components/finance/account-management"
import { TransactionManagement } from "@/components/finance/transaction-management"
import { CategoryManagement } from "@/components/finance/category-management"
import { FinanceReport } from "@/components/finance/finance-report"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function FinancePage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [sheetOpen, setSheetOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 从URL参数中获取初始标签
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["overview", "accounts", "transactions", "categories", "reports"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 处理标签变化
  const handleTabChange = (value) => {
    setActiveTab(value)

    // 更新URL参数，但不刷新页面
    const url = new URL(window.location.href)
    url.searchParams.set("tab", value)
    window.history.pushState({}, "", url)

    // 在移动端选择标签后关闭抽屉
    if (isMobile) {
      setSheetOpen(false)
    }
  }

  // 标签配置
  const tabs = [
    { id: "overview", label: "财务总览", icon: "📊" },
    { id: "accounts", label: "资金账户", icon: "💰" },
    { id: "transactions", label: "交易记录", icon: "📝" },
    { id: "categories", label: "收支分类", icon: "🏷️" },
    { id: "reports", label: "财务报表", icon: "📈" }
  ]

  // 获取当前标签信息
  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0]

  // 获取前一个和后一个标签
  const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
  const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null
  const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null

  return (
    <div className="container mx-auto py-4 px-4 md:px-6 md:py-6">
      {/* 移动端标题栏 */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h1 className="text-2xl font-bold">{currentTab.icon} {currentTab.label}</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] sm:w-[350px]">
            <div className="py-4">
              <h2 className="text-xl font-semibold mb-4">财务管理</h2>
              <div className="flex flex-col space-y-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={tab.id === activeTab ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 桌面端标题 */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold">财务管理</h1>
        <p className="text-muted-foreground">管理企业财务，包括资金账户、收支记录和财务报表</p>
      </div>

      {/* 移动端底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-10 p-2 flex justify-between items-center md:hidden">
        {prevTab && (
          <Button variant="ghost" size="sm" onClick={() => handleTabChange(prevTab.id)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {prevTab.label}
          </Button>
        )}
        {!prevTab && <div></div>}

        {nextTab && (
          <Button variant="ghost" size="sm" onClick={() => handleTabChange(nextTab.id)}>
            {nextTab.label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {!nextTab && <div></div>}
      </div>

      {/* 桌面端标签导航 */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <FinanceDashboard />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountManagement />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="reports">
            <FinanceReport />
          </TabsContent>
        </Tabs>
      </div>

      {/* 移动端内容区域 */}
      <div className="md:hidden pb-16">
        {activeTab === "overview" && <FinanceDashboard />}
        {activeTab === "accounts" && <AccountManagement />}
        {activeTab === "transactions" && <TransactionManagement />}
        {activeTab === "categories" && <CategoryManagement />}
        {activeTab === "reports" && <FinanceReport />}
      </div>
    </div>
  )
}
