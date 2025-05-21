"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupplierManagement } from "@/components/supplier-management"
import { PurchaseOrderManagement } from "@/components/purchase-order-management"
import { PurchaseStatistics } from "@/components/purchase-statistics"

export default function PurchasePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">采购管理</h1>
        <p className="text-muted-foreground">管理供应商、采购订单和采购统计</p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">采购订单</TabsTrigger>
          <TabsTrigger value="suppliers">供应商管理</TabsTrigger>
          <TabsTrigger value="statistics">采购统计</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <PurchaseOrderManagement />
        </TabsContent>
        <TabsContent value="suppliers">
          <SupplierManagement />
        </TabsContent>
        <TabsContent value="statistics">
          <PurchaseStatistics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
