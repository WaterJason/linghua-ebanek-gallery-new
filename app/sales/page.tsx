import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerManagement } from "@/components/customer-management"
import { OrderManagement } from "@/components/order-management"
import { PosSystem } from "@/components/pos-system"
import { SalesReportDashboard } from "@/components/sales-report-dashboard"

export const metadata: Metadata = {
  title: "销售管理 | 聆花掐丝珐琅馆",
  description: "管理订单、客户、POS销售和销售报表",
}

export default function SalesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">销售管理</h1>
        <p className="text-muted-foreground">管理订单、客户、POS销售和销售报表</p>
      </div>

      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pos">POS销售</TabsTrigger>
          <TabsTrigger value="orders">订单管理</TabsTrigger>
          <TabsTrigger value="customers">客户管理</TabsTrigger>
          <TabsTrigger value="reports">销售报表</TabsTrigger>
        </TabsList>
        <TabsContent value="pos">
          <PosSystem />
        </TabsContent>
        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>
        <TabsContent value="customers">
          <CustomerManagement />
        </TabsContent>
        <TabsContent value="reports">
          <SalesReportDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
