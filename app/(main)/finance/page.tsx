"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModernPageContainer } from "@/components/modern-page-container"
import { FinanceDashboard } from "@/components/finance/finance-dashboard"
import { AccountManagement } from "@/components/finance/account-management"
import { TransactionManagement } from "@/components/finance/transaction-management"
import { CategoryManagement } from "@/components/finance/category-management"
import { FinanceReport } from "@/components/finance/finance-report"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, BarChart3Icon, WalletIcon, FileTextIcon, TagIcon, TrendingUpIcon } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function FinancePageContent() {
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
    { id: "overview", label: "财务概览", icon: BarChart3Icon },
    { id: "accounts", label: "资金账户", icon: WalletIcon },
    { id: "transactions", label: "交易记录", icon: FileTextIcon },
    { id: "categories", label: "收支分类", icon: TagIcon },
    { id: "reports", label: "财务报表", icon: TrendingUpIcon },
  ]

  // 获取当前标签信息
  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0]

  if (isMobile) {
    return (
      <div className="container mx-auto py-4 px-4">
        {/* 移动端标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <currentTab.icon className="h-6 w-6" />
            {currentTab.label}
          </h1>
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
                      <tab.icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* 移动端底部导航 */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-10">
          <div className="flex justify-between px-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex-1 flex flex-col items-center py-2 ${tab.id === activeTab ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 移动端内容区域 */}
        <div className="pb-16">
          {activeTab === "overview" && <FinanceDashboard />}
          {activeTab === "accounts" && <AccountManagement />}
          {activeTab === "transactions" && <TransactionManagement />}
          {activeTab === "categories" && <CategoryManagement />}
          {activeTab === "reports" && <FinanceReport />}
        </div>
      </div>
    )
  }

  // 桌面端使用ModernPageContainer
  return (
    <ModernPageContainer
      title="财务管理"
      description="管理资金账户、交易记录和财务报表"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "财务管理" }
      ]}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <AccountManagement />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionManagement />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinanceReport />
        </TabsContent>
      </Tabs>
    </ModernPageContainer>
  )
}

export default function FinancePage() {
  return (
    <Suspense fallback={
      <ModernPageContainer
        title="财务管理"
        description="管理资金账户、交易记录和财务报表"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "财务管理" }
        ]}
      >
        <Card>
          <CardHeader>
            <CardTitle>财务管理</CardTitle>
            <CardDescription>加载中...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </ModernPageContainer>
    }>
      <FinancePageContent />
    </Suspense>
  )
}
