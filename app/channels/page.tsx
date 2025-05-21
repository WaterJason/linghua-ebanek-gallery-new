"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChannelManagement } from "@/components/channel/channel-management"
import { ChannelPriceManagement } from "@/components/channel/channel-price-management"
import { ChannelInventoryManagement } from "@/components/channel/channel-inventory-management"
import { ChannelDepositManagement } from "@/components/channel/channel-deposit-management"
import { ChannelDistributionManagement } from "@/components/channel/channel-distribution-management"
import { ChannelSalesManagement } from "@/components/channel/channel-sales-management"
import { ChannelSettlementManagement } from "@/components/channel/channel-settlement-management"

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState("channels")

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">渠道管理</h1>
        <p className="text-muted-foreground">管理渠道商、渠道价格、库存、押金、配货、销售和结算</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="channels">渠道商管理</TabsTrigger>
          <TabsTrigger value="prices">渠道价格</TabsTrigger>
          <TabsTrigger value="inventory">渠道库存</TabsTrigger>
          <TabsTrigger value="deposits">押金管理</TabsTrigger>
          <TabsTrigger value="distribution">渠道配货</TabsTrigger>
          <TabsTrigger value="sales">渠道销售</TabsTrigger>
          <TabsTrigger value="settlements">结算管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="channels">
          <ChannelManagement />
        </TabsContent>
        
        <TabsContent value="prices">
          <ChannelPriceManagement />
        </TabsContent>
        
        <TabsContent value="inventory">
          <ChannelInventoryManagement />
        </TabsContent>
        
        <TabsContent value="deposits">
          <ChannelDepositManagement />
        </TabsContent>
        
        <TabsContent value="distribution">
          <ChannelDistributionManagement />
        </TabsContent>
        
        <TabsContent value="sales">
          <ChannelSalesManagement />
        </TabsContent>
        
        <TabsContent value="settlements">
          <ChannelSettlementManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
