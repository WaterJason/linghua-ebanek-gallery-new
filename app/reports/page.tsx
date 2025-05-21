import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesReportDashboard } from "@/components/sales-report-dashboard"
import { InventoryReportDashboard } from "@/components/inventory-report-dashboard"
import { ProductionReportDashboard } from "@/components/production-report-dashboard"
import { FinanceReportDashboard } from "@/components/finance-report-dashboard"

export const metadata: Metadata = {
  title: "综合报表 | 聆花掐丝珐琅馆",
  description: "查看各类业务数据的综合报表和分析",
}

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">综合报表</h1>
        <p className="text-muted-foreground">查看和分析各类业务数据</p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">销售报表</TabsTrigger>
          <TabsTrigger value="inventory">库存报表</TabsTrigger>
          <TabsTrigger value="production">生产报表</TabsTrigger>
          <TabsTrigger value="finance">财务报表</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <SalesReportDashboard />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryReportDashboard />
        </TabsContent>
        <TabsContent value="production">
          <ProductionReportDashboard />
        </TabsContent>
        <TabsContent value="finance">
          <FinanceReportDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
