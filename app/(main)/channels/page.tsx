"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModernPageContainer } from "@/components/modern-page-container"
import { ChannelManagement } from "@/components/channel/channel-management"
import { ChannelPriceManagement } from "@/components/channel/channel-price-management"
import { ChannelInventoryManagement } from "@/components/channel/channel-inventory-management"
import { ChannelDepositManagement } from "@/components/channel/channel-deposit-management"
import { ChannelDistributionManagement } from "@/components/channel/channel-distribution-management"
import { ChannelSalesManagement } from "@/components/channel/channel-sales-management"
import { ChannelSettlementManagement } from "@/components/channel/channel-settlement-management"
import {
  UsersIcon,
  TagIcon,
  PackageIcon,
  CreditCardIcon,
  TruckIcon,
  ShoppingCartIcon,
  CalculatorIcon
} from "lucide-react"

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState("channels")

  return (
    <ModernPageContainer
      title="渠道管理"
      description="管理渠道商、渠道价格、库存、押金、配货、销售和结算"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "渠道管理" }
      ]}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="channels" className="flex items-center gap-1">
            <UsersIcon className="h-3 w-3" />
            渠道商管理
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center gap-1">
            <TagIcon className="h-3 w-3" />
            渠道价格
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <PackageIcon className="h-3 w-3" />
            渠道库存
          </TabsTrigger>
          <TabsTrigger value="deposits" className="flex items-center gap-1">
            <CreditCardIcon className="h-3 w-3" />
            押金管理
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-1">
            <TruckIcon className="h-3 w-3" />
            渠道配货
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1">
            <ShoppingCartIcon className="h-3 w-3" />
            渠道销售
          </TabsTrigger>
          <TabsTrigger value="settlements" className="flex items-center gap-1">
            <CalculatorIcon className="h-3 w-3" />
            结算管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          <ChannelManagement />
        </TabsContent>

        <TabsContent value="prices" className="space-y-6">
          <ChannelPriceManagement />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <ChannelInventoryManagement />
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <ChannelDepositManagement />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <ChannelDistributionManagement />
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <ChannelSalesManagement />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <ChannelSettlementManagement />
        </TabsContent>
      </Tabs>
    </ModernPageContainer>
  )
}
