"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardPage from "@/src/features/finance/pages/DashboardPage"
import AccountsPage from "@/src/features/finance/pages/AccountsPage"
import TransactionsPage from "@/src/features/finance/pages/TransactionsPage"
import CategoriesPage from "@/src/features/finance/pages/CategoriesPage"

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">财务管理</h1>
        <p className="text-muted-foreground">管理企业财务，包括资金账户、收支记录和财务报表</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">财务总览</TabsTrigger>
          <TabsTrigger value="accounts">资金账户</TabsTrigger>
          <TabsTrigger value="transactions">交易记录</TabsTrigger>
          <TabsTrigger value="categories">收支分类</TabsTrigger>
          <TabsTrigger value="reports">财务报表</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardPage />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsPage />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsPage />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesPage />
        </TabsContent>

        <TabsContent value="reports">
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-2">财务报表</h2>
            <p className="text-muted-foreground">此功能正在开发中...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}