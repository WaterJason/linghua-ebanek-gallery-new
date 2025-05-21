import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductionManagement } from "@/components/production-management"
import { ProductionReports } from "@/components/production-reports"

export const metadata: Metadata = {
  title: "制作管理 | 聆花掐丝珐琅馆",
  description: "管理制作工单和计件工资",
}

export default function ProductionPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">制作管理</h1>
        <p className="text-muted-foreground">管理制作工单和计件工资</p>
      </div>

      <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production">制作工单</TabsTrigger>
          <TabsTrigger value="reports">制作报表</TabsTrigger>
        </TabsList>
        <TabsContent value="production">
          <ProductionManagement />
        </TabsContent>
        <TabsContent value="reports">
          <ProductionReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
