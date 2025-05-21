import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkshopOrders } from "@/components/workshop-orders"
import { WorkshopReport } from "@/components/workshop-report"
import { WorkshopCostAnalysis } from "@/components/workshop-cost-analysis"

export const metadata: Metadata = {
  title: "非遗掐丝珐琅手作团建管理 | 聆花掐丝珐琅馆",
  description: "管理非遗掐丝珐琅手作沙龙/团建活动，包括饰品点蓝手作、掐丝珐琅手作等特色业务",
}

export default function WorkshopPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">非遗掐丝珐琅手作团建管理</h1>
        <p className="text-muted-foreground">
          管理非遗掐丝珐琅手作沙龙/团建活动，包括饰品点蓝手作、掐丝珐琅手作等特色业务
        </p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">团建订单</TabsTrigger>
          <TabsTrigger value="cost-analysis">成本分析</TabsTrigger>
          <TabsTrigger value="reports">团建报表</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <WorkshopOrders />
        </TabsContent>
        <TabsContent value="cost-analysis">
          <WorkshopCostAnalysis />
        </TabsContent>
        <TabsContent value="reports">
          <WorkshopReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
